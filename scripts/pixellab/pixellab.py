#!/usr/bin/env python3
"""CLI mínima para la API REST v2 de PixelLab («El Coso del Rey»).

Lee assets-src/pixellab/manifest.json, envía cada entrada, sondea los trabajos
asíncronos (GET /background-jobs/{id}) y descarga las imágenes resultantes a
assets-src/pixellab/<id>/.

El token SOLO se lee de la variable de entorno PIXELLAB_API_TOKEN. Nunca se
escribe en disco: los JSON guardados se sanean (sin cabeceras, sin base64).

Formato de una entrada del manifiesto:
  {
    "id": "ingeniera_sur_a",            # carpeta de salida
    "endpoint": "/rotate",              # ruta POST relativa a la base v2
    "params": { ... },                  # cuerpo JSON tal cual
    "references": {                     # opcional: rutas de imagen -> Base64Image
      "from_image": "assets-src/pixellab/refs/ingeniera_este_64.png",
      "directions.south": "assets-src/pixellab/ingeniera_sur_a/000.png"
    },
    "follow": "character" | "object" | "isometric-tile"   # opcional, se infiere
  }
Las claves de `references` admiten puntos para anidar (directions.south).

Uso:
  python3 scripts/pixellab/pixellab.py balance
  python3 scripts/pixellab/pixellab.py list
  python3 scripts/pixellab/pixellab.py run ID [ID ...] [--force]
  python3 scripts/pixellab/pixellab.py get /characters/<id>     # GET saneado
"""
from __future__ import annotations

import base64
import io
import json
import os
import sys
import time
from pathlib import Path

import requests

BASE = os.environ.get("PIXELLAB_API_BASE", "https://api.pixellab.ai/v2")
ROOT = Path(__file__).resolve().parents[2]
SRC = ROOT / "assets-src" / "pixellab"
MANIFEST = SRC / "manifest.json"
POLL_S = 5
TIMEOUT_S = 900


def token() -> str:
    t = os.environ.get("PIXELLAB_API_TOKEN")
    if not t:
        sys.exit("Falta PIXELLAB_API_TOKEN en el entorno (nunca en el repo).")
    return t


def headers() -> dict:
    return {"Authorization": f"Bearer {token()}", "Content-Type": "application/json"}


def api(method: str, path: str, body: dict | None = None) -> dict:
    url = path if path.startswith("http") else BASE + path
    for intento in range(5):
        try:
            r = requests.request(method, url, headers=headers(), json=body, timeout=180)
        except (requests.ConnectionError, requests.Timeout) as err:
            # El proxy corta conexiones largas de vez en cuando. Un POST repetido
            # puede cobrar dos veces, pero perder el resultado es peor.
            print(f"   ! {method} {path}: {err.__class__.__name__}, reintento", flush=True)
            time.sleep(5 * (intento + 1))
            continue
        if r.status_code in (429, 529, 502, 503):
            time.sleep(10 * (intento + 1))
            continue
        if r.status_code >= 400:
            raise RuntimeError(f"{method} {path} -> {r.status_code}: {r.text[:800]}")
        return r.json() if r.content else {}
    raise RuntimeError(f"{method} {path}: demasiados reintentos")


def b64_of(path: str) -> dict:
    data = (ROOT / path).read_bytes()
    return {"type": "base64", "base64": base64.b64encode(data).decode(), "format": "png"}


def set_path(d: dict, dotted: str, value) -> None:
    keys = dotted.split(".")
    for k in keys[:-1]:
        d = d.setdefault(k, {})
    d[keys[-1]] = value


def sanitize(obj):
    """Copia sin base64 (para guardar JSON pequeños y legibles)."""
    if isinstance(obj, dict):
        out = {}
        for k, v in obj.items():
            if k == "base64" and isinstance(v, str):
                out[k] = f"<{len(v)} chars>"
            else:
                out[k] = sanitize(v)
        return out
    if isinstance(obj, list):
        return [sanitize(v) for v in obj]
    return obj


def decode_image(node: dict) -> bytes:
    """Convierte un nodo imagen de la API a bytes PNG."""
    raw = node["base64"]
    if raw.startswith("data:"):
        raw = raw.split(",", 1)[1]
    data = base64.b64decode(raw)
    kind = node.get("type", "base64")
    if kind == "rgba_bytes" or (data[:4] != b"\x89PNG" and "width" in node):
        from PIL import Image

        im = Image.frombytes("RGBA", (node["width"], node["height"]), data)
        buf = io.BytesIO()
        im.save(buf, "PNG")
        return buf.getvalue()
    return data


def collect_images(obj, prefix="", out=None):
    """Recorre la respuesta y devuelve [(nombre, bytes|url)]."""
    if out is None:
        out = []
    if isinstance(obj, dict):
        if isinstance(obj.get("base64"), str):
            out.append((prefix or "img", decode_image(obj)))
            return out
        for k, v in obj.items():
            collect_images(v, f"{prefix}_{k}" if prefix else str(k), out)
    elif isinstance(obj, list):
        for i, v in enumerate(obj):
            collect_images(v, f"{prefix}_{i:03d}" if prefix else f"{i:03d}", out)
    elif isinstance(obj, str) and obj.startswith("http") and obj.split("?")[0].endswith((".png", ".gif", ".webp")):
        out.append((prefix or "url", obj))
    return out


def save_images(items, dest: Path) -> list[str]:
    saved = []
    for name, payload in items:
        safe = "".join(c if c.isalnum() or c in "-_" else "_" for c in name)[:80]
        if isinstance(payload, str):  # URL
            r = requests.get(payload, timeout=120)
            r.raise_for_status()
            ext = Path(payload.split("?")[0]).suffix or ".png"
            data = r.content
        else:
            ext, data = ".png", payload
        p = dest / f"{safe}{ext}"
        p.write_bytes(data)
        saved.append(p.name)
    return saved


def poll(job_id: str) -> dict:
    t0 = time.time()
    while True:
        job = api("GET", f"/background-jobs/{job_id}")
        st = job.get("status")
        if st == "completed":
            return job
        if st == "failed":
            raise RuntimeError(f"trabajo {job_id} falló: {json.dumps(sanitize(job))[:800]}")
        if time.time() - t0 > TIMEOUT_S:
            raise RuntimeError(f"trabajo {job_id}: timeout")
        print(f"   … {st} ({int(time.time() - t0)} s)", flush=True)
        time.sleep(POLL_S)


def follow(kind: str, rid: str) -> dict:
    path = {"character": f"/characters/{rid}", "object": f"/objects/{rid}",
            "isometric-tile": f"/isometric-tiles/{rid}"}[kind]
    t0 = time.time()
    while True:
        det = api("GET", path)
        if det.get("status") in (None, "completed", "review") or time.time() - t0 > TIMEOUT_S:
            return det
        time.sleep(POLL_S)


def run_entry(entry: dict, force=False) -> None:
    eid = entry["id"]
    dest = SRC / eid
    result_path = dest / "result.json"
    if result_path.exists() and not force:
        print(f"= {eid}: ya generado (usa --force para repetir)")
        return
    dest.mkdir(parents=True, exist_ok=True)
    body = json.loads(json.dumps(entry.get("params", {})))
    for key, ref in (entry.get("references") or {}).items():
        set_path(body, key, b64_of(ref))
    endpoint = entry["endpoint"].replace("{object_id}", entry.get("object_id", ""))
    t0 = time.time()
    pending = dest / "pending.json"
    if pending.exists() and not force:
        # Reanuda un trabajo ya enviado (evita pagar dos veces tras un corte).
        resp = json.loads(pending.read_text())
        print(f"> {eid}: reanudando trabajo {resp.get('background_job_id')}", flush=True)
    else:
        print(f"> {eid}: POST {endpoint}", flush=True)
        resp = api("POST", endpoint, body)
        pending.write_text(json.dumps(sanitize(resp), indent=2) + "\n")
    job = None
    job_id = resp.get("background_job_id") or (resp.get("background_job_ids") or [None])[0]
    if job_id:
        job = poll(job_id)
    payload = job.get("last_response") if job else resp
    detail = None
    kind = entry.get("follow")
    rid = None
    for k, name in (("character_id", "character"), ("object_id", "object"), ("tile_id", "isometric-tile")):
        rid = rid or (payload or {}).get(k) or resp.get(k)
        if rid and not kind:
            kind = name
        if rid:
            break
    images = collect_images({k: v for k, v in (payload or {}).items() if k != "usage"})
    if any(not isinstance(b, str) for _, b in images):
        # Si ya vienen en base64, las URL de almacenamiento son duplicados.
        images = [(n, b) for n, b in images if not isinstance(b, str)]
    if kind and rid and not images:
        detail = follow(kind, rid)
        images = collect_images({k: v for k, v in detail.items() if k not in ("usage",)})
    saved = save_images(images, dest)
    record = {
        "id": eid,
        "endpoint": endpoint,
        "params": entry.get("params", {}),
        "references": entry.get("references", {}),
        "seconds": round(time.time() - t0, 1),
        "submit_usage": resp.get("usage"),
        "job_usage": (job or {}).get("usage"),
        "job_id": job_id,
        "resource": {"kind": kind, "id": rid} if rid else None,
        "files": saved,
    }
    result_path.write_text(json.dumps(record, indent=2, ensure_ascii=False) + "\n")
    # Respuesta cruda saneada (ignorada por git: raw-*.json)
    (dest / "raw-response.json").write_text(
        json.dumps(sanitize({"submit": resp, "job": job, "detail": detail}), indent=2) + "\n")
    pending.unlink(missing_ok=True)
    print(f"< {eid}: {len(saved)} archivo(s) en {dest.relative_to(ROOT)} ({record['seconds']} s)")


def main(argv):
    if not argv or argv[0] in ("-h", "--help"):
        print(__doc__)
        return
    cmd, rest = argv[0], argv[1:]
    if cmd == "balance":
        print(json.dumps(api("GET", "/balance"), indent=2))
    elif cmd == "get":
        print(json.dumps(sanitize(api("GET", rest[0])), indent=2)[:6000])
    elif cmd == "list":
        for e in json.loads(MANIFEST.read_text())["entries"]:
            done = (SRC / e["id"] / "result.json").exists()
            print(f"{'x' if done else ' '} {e['id']:32s} {e['endpoint']}")
    elif cmd == "run":
        force = "--force" in rest
        ids = [a for a in rest if not a.startswith("--")]
        entries = {e["id"]: e for e in json.loads(MANIFEST.read_text())["entries"]}
        for i in ids:
            if i not in entries:
                sys.exit(f"id desconocido: {i}")
            run_entry(entries[i], force)
    else:
        sys.exit(f"comando desconocido: {cmd}")


if __name__ == "__main__":
    main(sys.argv[1:])
