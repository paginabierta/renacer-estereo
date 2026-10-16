#!/usr/bin/env python3
"""
Renacer Estéreo — recoge titulares de medios por RSS y los guarda en datos/noticias-auto.json.
Solo guarda titular, un resumen corto, la foto que el medio comparte, la fecha y el enlace
a la nota original, siempre con el nombre del medio. Lo ejecuta GitHub cada hora.
Usa solo Python estándar (no hay que instalar nada).
"""
import json, re, html, hashlib, sys, os
import urllib.request
import xml.etree.ElementTree as ET
from datetime import datetime, timezone, timedelta
from email.utils import parsedate_to_datetime

RAIZ = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
FUENTES = os.path.join(RAIZ, "datos", "fuentes.json")
SALIDA = os.path.join(RAIZ, "datos", "noticias-auto.json")
NS = {
    "media": "http://search.yahoo.com/mrss/",
    "content": "http://purl.org/rss/1.0/modules/content/",
    "atom": "http://www.w3.org/2005/Atom",
    "dc": "http://purl.org/dc/elements/1.1/",
}
UA = "Mozilla/5.0 (compatible; RenacerEstereoBot/1.0; +https://paginabierta.github.io/renacer-estereo/)"


def descargar(url):
    req = urllib.request.Request(url, headers={"User-Agent": UA, "Accept": "application/rss+xml, application/xml, text/xml, */*"})
    with urllib.request.urlopen(req, timeout=25) as r:
        return r.read()


def limpiar(texto, maximo=None):
    t = re.sub(r"<[^>]+>", " ", texto or "")
    t = html.unescape(t)
    t = re.sub(r"\s+", " ", t).strip()
    if maximo and len(t) > maximo:
        t = t[:maximo].rsplit(" ", 1)[0].rstrip(",.;:") + "…"
    return t


def fecha(texto):
    if not texto:
        return None
    texto = texto.strip()
    try:
        d = parsedate_to_datetime(texto)
    except Exception:
        try:
            d = datetime.fromisoformat(texto.replace("Z", "+00:00"))
        except Exception:
            return None
    if d.tzinfo is None:
        d = d.replace(tzinfo=timezone.utc)
    return d.astimezone(timezone.utc)


def imagen_de(item, crudo):
    for tag in ("media:content", "media:thumbnail"):
        for el in item.findall(tag, NS):
            u = el.get("url", "")
            tipo = el.get("type", "") or el.get("medium", "")
            if u.startswith("http") and ("image" in tipo or tag == "media:thumbnail" or re.search(r"\.(jpe?g|png|webp)", u, re.I)):
                return u
    for el in item.findall("enclosure"):
        if "image" in (el.get("type") or "") and (el.get("url") or "").startswith("http"):
            return el.get("url")
    m = re.search(r'<img[^>]+src=["\'](https?://[^"\']+)', crudo or "", re.I)
    return m.group(1) if m else ""


def texto_de(el, *tags):
    for t in tags:
        x = el.find(t, NS)
        if x is not None and (x.text or "").strip():
            return x.text
    return ""


def leer_feed(datos, fuente):
    raiz = ET.fromstring(datos)
    items = raiz.findall(".//item")
    atom = False
    if not items:
        items = raiz.findall(".//atom:entry", NS)
        atom = True
    salida = []
    for it in items:
        if atom:
            titulo = texto_de(it, "atom:title")
            enlace_el = it.find("atom:link", NS)
            enlace = enlace_el.get("href", "") if enlace_el is not None else ""
            crudo = texto_de(it, "atom:summary", "atom:content")
            f = fecha(texto_de(it, "atom:published", "atom:updated"))
        else:
            titulo = texto_de(it, "title")
            enlace = texto_de(it, "link").strip()
            crudo = texto_de(it, "description") or texto_de(it, "content:encoded")
            f = fecha(texto_de(it, "pubDate", "dc:date"))
        titulo = limpiar(titulo)
        if not titulo or not enlace.startswith("http"):
            continue

        medio = fuente["nombre"]
        es_google = "news.google.com" in enlace
        if es_google:
            src = it.find("source")
            if src is not None and (src.text or "").strip():
                medio_real = src.text.strip()
                # Google pone " - Medio" al final del titular: se quita
                if titulo.endswith(" - " + medio_real):
                    titulo = titulo[: -len(" - " + medio_real)].strip()
                if fuente.get("usarNombreDelMedio"):
                    medio = medio_real
            resumen = ""  # el resumen de Google es solo una lista de enlaces
        else:
            resumen = limpiar(crudo, 220)
            if resumen.lower().startswith(titulo.lower()[:40]):
                resumen = ""

        salida.append({
            "titulo": titulo,
            "resumen": resumen,
            "imagen": imagen_de(it, crudo) if not es_google else "",
            "enlace": enlace,
            "medio": medio,
            "fuente": fuente["id"],
            "region": fuente.get("region", ""),
            "fecha": f.strftime("%Y-%m-%dT%H:%M:%SZ") if f else None,
        })
    return salida


def clave(titulo):
    t = re.sub(r"[^a-z0-9áéíóúñü ]", "", titulo.lower())
    return hashlib.md5(" ".join(t.split()[:10]).encode()).hexdigest()


def main():
    cfg = json.load(open(FUENTES, encoding="utf-8"))
    try:
        anterior = json.load(open(SALIDA, encoding="utf-8"))
    except Exception:
        anterior = {"noticias": []}

    ahora = datetime.now(timezone.utc)
    limite = ahora - timedelta(days=cfg.get("maxDias", 3))
    excluir = [p.lower() for p in cfg.get("palabrasExcluidas", [])]
    todas, estado = [], []

    for fuente in cfg["fuentes"]:
        if not fuente.get("activa", True):
            continue
        items, usada, error = [], "", ""
        for url in fuente["urls"]:
            try:
                items = leer_feed(descargar(url), fuente)
                if items:
                    usada = url
                    break
            except Exception as e:
                error = f"{type(e).__name__}: {e}"[:160]
        if not items:
            # si la fuente falló, se conservan sus noticias anteriores
            items = [n for n in anterior.get("noticias", []) if n.get("fuente") == fuente["id"]]
        filtradas = []
        for n in items:
            d = fecha(n["fecha"]) if n.get("fecha") else None
            if d and d < limite:
                continue
            texto = (n["titulo"] + " " + n.get("resumen", "")).lower()
            if any(p in texto for p in excluir):
                continue
            filtradas.append(n)
        filtradas = filtradas[: fuente.get("max", 10)]
        todas.extend(filtradas)
        estado.append({"id": fuente["id"], "nombre": fuente["nombre"], "ok": bool(usada), "cantidad": len(filtradas),
                       "enlace": usada, "error": "" if usada else error})
        print(f"{fuente['nombre']:<28} {'OK ' if usada else 'FALLÓ'} {len(filtradas):>3}  {usada or error}")

    vistas, unicas = set(), []
    for n in sorted(todas, key=lambda x: x.get("fecha") or "", reverse=True):
        k = clave(n["titulo"])
        if k in vistas:
            continue
        vistas.add(k)
        n["id"] = k[:12]
        unicas.append(n)
    unicas = unicas[: cfg.get("maxTotal", 60)]

    nuevo = {"actualizado": ahora.strftime("%Y-%m-%dT%H:%M:%SZ"), "fuentes": estado, "noticias": unicas}
    # Si las noticias no cambiaron, no se reescribe el archivo (evita guardados vacíos cada hora)
    if [n["id"] for n in anterior.get("noticias", [])] == [n["id"] for n in unicas] and os.path.exists(SALIDA):
        print("Sin cambios.")
        return 0
    os.makedirs(os.path.dirname(SALIDA), exist_ok=True)
    with open(SALIDA, "w", encoding="utf-8") as f:
        json.dump(nuevo, f, ensure_ascii=False, indent=1)
    print(f"Guardadas {len(unicas)} noticias.")
    return 0


if __name__ == "__main__":
    sys.exit(main())
