#!/usr/bin/env python3
"""Import Ottimo products from Google Drive manifest + price list."""
from __future__ import annotations

import json
import re
import shutil
import sys
import time
import unicodedata
import urllib.parse
import urllib.request
import zipfile
from collections import defaultdict
from pathlib import Path
from xml.etree import ElementTree as ET

ROOT = Path(__file__).resolve().parents[1]
TOOLS = ROOT / "tools"
MANIFEST = TOOLS / "drive-folder-list.json"
DOWNLOAD_DIR = TOOLS / "drive-download"
PRODUCTS_DIR = ROOT / "assets" / "images" / "products"
PRODUCTS_JSON = ROOT / "install" / "products.json"
XLSX_ID = "1eAa6CP1tBxP3kw5Pe0-qYkaGhramAsvq"

NS = {"m": "http://schemas.openxmlformats.org/spreadsheetml/2006/main"}
VALID_CATEGORIES = {"jackets", "coats", "shirts", "bottoms", "accessories"}


def log(msg: str) -> None:
    print(msg, file=sys.stderr)


def slugify_id(text: str) -> str:
    text = unicodedata.normalize("NFKD", text)
    text = re.sub(r"[^\w\-]+", "_", text, flags=re.UNICODE)
    text = re.sub(r"_+", "_", text).strip("_")
    return text[:64] or "product"


def load_manifest() -> list[dict]:
    raw = MANIFEST.read_text(encoding="utf-8", errors="replace")
    match = re.search(r"\[\s*\{", raw, re.S)
    if not match:
        raise RuntimeError("Invalid manifest JSON")
    start = match.start()
    end = raw.rfind("]")
    return json.loads(raw[start : end + 1])


def download_file(url: str, dest: Path, retries: int = 5) -> bool:
    dest.parent.mkdir(parents=True, exist_ok=True)
    if dest.exists() and dest.stat().st_size > 0:
        return True

    for attempt in range(retries):
        try:
            req = urllib.request.Request(url, headers={"User-Agent": "Mozilla/5.0"})
            with urllib.request.urlopen(req, timeout=120) as resp:
                data = resp.read()
            if b"<!DOCTYPE html" in data[:200] or b"<html" in data[:200].lower():
                # Google Drive confirmation page
                token_match = re.search(rb"confirm=([0-9A-Za-z_]+)", data)
                if token_match:
                    confirm = token_match.group(1).decode()
                    parsed = urllib.parse.urlparse(url)
                    qs = urllib.parse.parse_qs(parsed.query)
                    file_id = qs.get("id", [""])[0]
                    confirm_url = f"https://drive.google.com/uc?export=download&confirm={confirm}&id={file_id}"
                    req2 = urllib.request.Request(confirm_url, headers={"User-Agent": "Mozilla/5.0"})
                    with urllib.request.urlopen(req2, timeout=120) as resp2:
                        data = resp2.read()
                else:
                    raise RuntimeError("HTML response without confirm token")
            dest.write_bytes(data)
            return True
        except Exception as exc:
            wait = 2 ** attempt
            log(f"  download failed ({dest.name}): {exc}; retry in {wait}s")
            time.sleep(wait)
    return False


def col_letters(cell_ref: str) -> str:
    return re.sub(r"[0-9]", "", cell_ref)


def parse_xlsx(path: Path) -> list[dict[str, str]]:
    rows: list[dict[str, str]] = []
    with zipfile.ZipFile(path) as zf:
        shared: list[str] = []
        if "xl/sharedStrings.xml" in zf.namelist():
            ss_root = ET.fromstring(zf.read("xl/sharedStrings.xml"))
            for si in ss_root.findall("m:si", NS):
                parts = [t.text or "" for t in si.findall(".//m:t", NS)]
                shared.append("".join(parts))

        sheet_name = next(n for n in zf.namelist() if n.startswith("xl/worksheets/sheet") and n.endswith(".xml"))
        sheet = ET.fromstring(zf.read(sheet_name))
        sheet_rows = sheet.findall(".//m:sheetData/m:row", NS)
        headers: list[str] = []

        for row in sheet_rows:
            cells = {}
            for c in row.findall("m:c", NS):
                ref = c.attrib.get("r", "")
                col = col_letters(ref)
                cell_type = c.attrib.get("t")
                v = c.find("m:v", NS)
                if v is None or v.text is None:
                    val = ""
                elif cell_type == "s":
                    val = shared[int(v.text)]
                else:
                    val = v.text
                cells[col] = str(val).strip()

            if not headers:
                ordered = [cells.get(ch, "") for ch in sorted(cells, key=lambda x: (len(x), x))]
                if any(ordered):
                    headers = ordered
                continue

            # Map by column letter order A,B,C...
            ordered_cols = sorted(cells, key=lambda x: (len(x), x))
            values = [cells.get(ch, "") for ch in ordered_cols]
            if not any(values):
                continue
            record = {}
            for i, h in enumerate(headers):
                if i < len(values):
                    record[h] = values[i]
            rows.append(record)
    return rows


def normalize_key(key: str) -> str:
    key = unicodedata.normalize("NFKD", key).encode("ascii", "ignore").decode("ascii")
    return re.sub(r"[^a-z0-9]+", "_", key.lower()).strip("_")


def find_field(record: dict[str, str], *candidates: str) -> str:
    norm_map = {normalize_key(k): v for k, v in record.items()}
    for cand in candidates:
        nc = normalize_key(cand)
        if nc in norm_map and norm_map[nc]:
            return norm_map[nc]
    for k, v in record.items():
        nk = normalize_key(k)
        for cand in candidates:
            if normalize_key(cand) in nk and v:
                return v
    return ""


def parse_price(value: str) -> float | None:
    if not value:
        return None
    cleaned = re.sub(r"[^\d.,]", "", value.replace(",", "."))
    if not cleaned:
        return None
    try:
        return round(float(cleaned), 2)
    except ValueError:
        return None


def map_category_from_row(row: dict[str, str]) -> str:
    cinsi = f"{row.get('Cinsi', '')} {row.get('AltTipi', '')}"
    text = normalize_key(cinsi)
    if any(x in text for x in ("brs", "tkt", "bag", "belt", "hat", "aksesuar")):
        return "accessories"
    if any(x in text for x in ("mont", "coat", "parka", "trench", "kurk")):
        return "coats"
    if any(x in text for x in ("sft", "gomlek", "shirt", "bluz", "blouse", "sirtlan")):
        return "shirts"
    if any(x in text for x in ("pant", "trouser", "jean", "short", "skirt", "bottom")):
        return "bottoms"
    return "jackets"


def map_gender_from_row(row: dict[str, str]) -> str:
    g = normalize_key(row.get("cinsiyet", ""))
    if "bayan" in g or "kadin" in g:
        return "womens"
    return "mens"


def norm_token(value: str) -> str:
    value = unicodedata.normalize("NFKD", value).encode("ascii", "ignore").decode("ascii")
    return re.sub(r"[^A-Z0-9]+", "", value.upper())


def norm_pair(model: str, color: str) -> str:
    model_key = norm_token(model)
    color_key = norm_token(color)
    return f"{model_key}_{color_key}" if color_key else model_key


def build_price_index(rows: list[dict[str, str]]) -> tuple[dict[str, dict], dict[str, dict]]:
    exact: dict[str, dict] = {}
    by_model: dict[str, dict] = {}

    for row in rows:
        model = row.get("ModelAdi", "").strip()
        color = row.get("Rengi", "").strip()
        price = parse_price(row.get("gfiyat", ""))
        if not model or not price or price > 10000:
            continue

        entry = {
            "model": model,
            "color": color,
            "price": price,
            "cinsi": row.get("Cinsi", "").strip(),
            "alt_tipi": row.get("AltTipi", "").strip(),
            "gender": map_gender_from_row(row),
            "category": map_category_from_row(row),
        }

        for model_variant in {model, model.replace(" ", ""), re.sub(r"\s+", " ", model)}:
            exact[norm_pair(model_variant, color)] = entry

        model_key = norm_token(model)
        if model_key not in by_model:
            by_model[model_key] = entry

    return exact, by_model


def folder_model_color_candidates(folder: str) -> list[tuple[str, str]]:
    parts = folder.split("_")
    candidates: list[tuple[str, str]] = []

    a15 = re.match(r"^A15_(\d+)_(\w+)$", folder, re.I)
    if a15:
        candidates.append((f"A15{a15.group(1)}", a15.group(2)))

    if folder.upper().startswith("DRK_CMRB_1996"):
        candidates.append(("FABCMRB1996", parts[-1]))

    if folder.startswith("72428"):
        candidates.append(("72428 YENI", parts[-1]))

    if folder.startswith("DEM_16_19"):
        tail = folder[len("DEM_16_19_") :]
        color = tail.split("_")[0]
        candidates.extend([("DEM 16 19", color), ("DEM16 19", color)])

    if "YIKAMALI" in folder.upper():
        candidates.append(("DEW16 17", parts[-1]))

    if folder.startswith("DEW16_"):
        dew = re.match(r"^DEW16_(\d+)_(\w+)_(\w+)$", folder, re.I)
        if dew:
            candidates.append((f"DEW16 {dew.group(1)}", dew.group(3)))
        dew2 = re.match(r"^DEW16_(\d+)_(\w+)$", folder, re.I)
        if dew2:
            candidates.append((f"DEW16 {dew2.group(1)}", dew2.group(2)))

    if folder.startswith("DEM16_"):
        dem = re.match(r"^DEM16_(\d+)_(\w+)_(\w+)$", folder, re.I)
        if dem:
            candidates.append((f"DEM16 {dem.group(1)}", dem.group(3)))

    if folder.startswith("NTW_E_14_K003"):
        candidates.append(("NTW E 14 K003", parts[-1]))

    if folder.startswith("NILIA_"):
        candidates.extend([("NILIA 3003", "004"), ("NILIA 2000", parts[-1])])

    if folder.startswith("DEW16_ELB78"):
        elb = re.match(r"^DEW16_ELB78_(\d+)", folder, re.I)
        if elb:
            candidates.append(("DEW16 ELB78", elb.group(1)))

    if folder.startswith("DEW_16_02"):
        dew02 = re.match(r"^DEW_16_02_(\d+)", folder, re.I)
        if dew02:
            candidates.append(("DEW16 02", dew02.group(1)))

    if folder.startswith("3397_"):
        tone = parts[-1]
        tone_map = {"004": "KIRMIZI", "100": "YESIL", "300": "SIYAH"}
        if tone in tone_map:
            candidates.append(("3397", tone_map[tone]))

    if parts and parts[0].isdigit() and len(parts) >= 2:
        candidates.append((parts[0], " ".join(parts[1:])))

    if parts and re.match(r"^[A-Z]?\d", parts[0], re.I) and len(parts) >= 3 and not folder.startswith("DEW16_"):
        candidates.append((f"{parts[0]} {parts[1]}", " ".join(parts[2:])))

    if len(parts) >= 2:
        candidates.append((" ".join(parts[:-1]), parts[-1]))
        candidates.append(("".join(parts[:-1]), parts[-1]))

    candidates.append((folder.replace("_", " "), ""))
    return candidates


def match_price(folder: str, exact: dict[str, dict], by_model: dict[str, dict]) -> dict | None:
    seen: set[str] = set()
    for model, color in folder_model_color_candidates(folder):
        for key in {norm_pair(model, color), norm_pair(model.replace(" ", ""), color)}:
            if key in seen:
                continue
            seen.add(key)
            if key in exact:
                return exact[key]

    folder_key = norm_token(folder)
    if folder_key in by_model:
        return by_model[folder_key]

    for model, color in folder_model_color_candidates(folder):
        model_key = norm_token(model)
        if model_key in by_model:
            return by_model[model_key]

    return None


def make_label(folder: str, meta: dict | None) -> str:
    if not meta:
        return folder.replace("_", " ").title()

    model = meta.get("model") or folder.replace("_", " ")
    color = meta.get("color", "")
    cinsi = meta.get("cinsi", "")
    title = f"{model} {color}".strip().title()

    cinsi_upper = cinsi.upper()
    if "SFT" in cinsi_upper or "SHIRT" in cinsi_upper:
        suffix = "Shirt"
    elif "PLJ" in cinsi_upper or "VJT" in cinsi_upper or "JMB" in cinsi_upper:
        suffix = "Jacket"
    elif "SUET" in cinsi_upper or "SUED" in cinsi_upper:
        suffix = "Suede Jacket"
    elif meta.get("alt_tipi", "").upper() == "DERİ" or meta.get("alt_tipi", "").upper() == "DERI":
        suffix = "Leather Jacket"
    else:
        suffix = "Jacket"

    if suffix.lower() not in title.lower():
        return f"{title} {suffix}"
    return title


def sort_image(name: str) -> tuple:
    base = Path(name).stem.lower()
    m = re.search(r"(\d+)", base)
    if m:
        return (0, int(m.group(1)), base)
    if "on" in base or "front" in base:
        return (1, 0, base)
    if "arka" in base or "back" in base:
        return (2, 0, base)
    return (3, 0, base)


def is_image_file(name: str) -> bool:
    return Path(name).suffix.lower() in {".jpg", ".jpeg", ".png", ".webp"}


def download_manifest_files(manifest: list[dict], limit: int | None = None) -> None:
    items = [x for x in manifest if not x["path"].endswith(".xlsx") and is_image_file(x["path"]) and "/.DS_Store" not in x["path"]]
    if limit:
        items = items[:limit]
    total = len(items)
    for i, item in enumerate(items, 1):
        dest = DOWNLOAD_DIR / item["path"]
        if dest.exists() and dest.stat().st_size > 0:
            continue
        log(f"[{i}/{total}] {item['path']}")
        ok = download_file(item["url"], dest)
        if not ok:
            log(f"  FAILED: {item['path']}")
        time.sleep(0.35)


def build_products(manifest: list[dict], price_rows: list[dict[str, str]]) -> list[dict]:
    exact, by_model = build_price_index(price_rows)
    by_folder: dict[str, list[str]] = defaultdict(list)
    for item in manifest:
        path = item["path"]
        if path.endswith(".xlsx") or "/.DS_Store" in path or path.endswith("/Icon") or not is_image_file(path):
            continue
        folder, filename = path.split("/", 1)
        by_folder[folder].append(filename)

    products: list[dict] = []
    missing_prices: list[str] = []

    for folder in sorted(by_folder):
        files = sorted(by_folder[folder], key=sort_image)
        if not files:
            continue

        sku = slugify_id(folder)
        meta = match_price(folder, exact, by_model)
        label = make_label(folder, meta)
        price = meta["price"] if meta and meta.get("price") is not None else 0
        category = meta["category"] if meta else "jackets"
        gender = meta["gender"] if meta else "mens"

        if price <= 0:
            missing_prices.append(folder)

        image_paths: list[str] = []
        for idx, fname in enumerate(files, start=1):
            src = DOWNLOAD_DIR / folder / fname
            ext = Path(fname).suffix.lower() or ".jpg"
            dest_name = f"{sku}_{idx:02d}{ext}"
            dest = PRODUCTS_DIR / dest_name
            if src.exists():
                dest.parent.mkdir(parents=True, exist_ok=True)
                if not dest.exists():
                    shutil.copy2(src, dest)
            web_path = f"/assets/images/products/{dest_name}"
            image_paths.append(web_path)

        if not image_paths:
            continue

        products.append(
            {
                "id": f"ottimo_{sku}",
                "label": label,
                "image": image_paths[0],
                "images": image_paths,
                "galleryCount": len(image_paths),
                "price": price,
                "category": category if category in VALID_CATEGORIES else "jackets",
                "gender": gender if gender in {"mens", "womens"} else "mens",
                "inStock": True,
                "stock": 12,
            }
        )

    log(f"Built {len(products)} products; missing prices: {len(missing_prices)}")
    if missing_prices[:20]:
        log("Missing price examples: " + ", ".join(missing_prices[:20]))
    return products


def main() -> int:
    import argparse

    parser = argparse.ArgumentParser()
    parser.add_argument("--download-only", action="store_true")
    parser.add_argument("--build-only", action="store_true")
    parser.add_argument("--limit", type=int, default=0)
    args = parser.parse_args()

    manifest = load_manifest()
    xlsx_path = DOWNLOAD_DIR / "ezar-stok-guncel.xlsx"

    if not args.build_only:
        log("Downloading price list...")
        download_file(f"https://drive.google.com/uc?export=download&id={XLSX_ID}", xlsx_path)
        log("Downloading product images...")
        download_manifest_files(manifest, limit=args.limit or None)

    if args.download_only:
        return 0

    if not xlsx_path.exists():
        log("ERROR: price list xlsx missing")
        return 1

    rows = parse_xlsx(xlsx_path)
    log(f"Parsed {len(rows)} price rows")
    if rows:
        log(f"Price columns: {list(rows[0].keys())}")

    products = build_products(manifest, rows)

    # Merge with existing products by id (keep old if not in new set)
    existing: dict[str, dict] = {}
    if PRODUCTS_JSON.exists():
        for p in json.loads(PRODUCTS_JSON.read_text(encoding="utf-8")):
            existing[p["id"]] = p

    new_ids = {p["id"] for p in products}
    merged = [p for pid, p in existing.items() if pid not in new_ids]
    merged.extend(products)
    merged.sort(key=lambda p: p["label"].lower())

    PRODUCTS_JSON.write_text(json.dumps(merged, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")
    log(f"Wrote {len(merged)} products to {PRODUCTS_JSON}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
