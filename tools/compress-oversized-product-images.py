"""Downscale camera-original product JPEGs to web catalog size."""
from __future__ import annotations

import io
import os
import sys

from PIL import Image, ImageCms

ROOT = os.path.join(os.path.dirname(__file__), "..", "assets", "images", "products")
MAX_SIDE = 1800
QUALITY = 84
MIN_BYTES = 3_200_000
MIN_PIXELS = 14_000_000
MIN_SIDE = 3600


def to_srgb(im: Image.Image) -> Image.Image:
    icc = im.info.get("icc_profile")
    if not icc:
        return im.convert("RGB")
    try:
        src = ImageCms.ImageCmsProfile(io.BytesIO(icc))
        dst = ImageCms.createProfile("sRGB")
        return ImageCms.profileToProfile(im, src, dst, outputMode="RGB")
    except Exception:
        return im.convert("RGB")


def should_compress(path: str, im: Image.Image) -> bool:
    size = os.path.getsize(path)
    w, h = im.size
    return size >= MIN_BYTES or (w * h) >= MIN_PIXELS or max(w, h) >= MIN_SIDE


def main() -> int:
    root = os.path.abspath(ROOT)
    changed = 0
    skipped = 0
    for name in sorted(os.listdir(root)):
        if not name.lower().endswith((".jpg", ".jpeg")):
            continue
        path = os.path.join(root, name)
        try:
            im = Image.open(path)
            im.load()
        except Exception as exc:
            print(f"SKIP read {name}: {exc}")
            skipped += 1
            continue
        if not should_compress(path, im):
            continue
        before = os.path.getsize(path)
        src_size = im.size
        im = to_srgb(im)
        w, h = im.size
        scale = MAX_SIDE / max(w, h)
        if scale < 1:
            im = im.resize((max(1, int(w * scale)), max(1, int(h * scale))), Image.Resampling.LANCZOS)
        buf = io.BytesIO()
        im.save(buf, "JPEG", quality=QUALITY, optimize=True, progressive=True)
        jpeg_bytes = buf.getvalue()
        last_err = None
        for attempt in range(10):
            try:
                with open(path, "wb") as handle:
                    handle.write(jpeg_bytes)
                last_err = None
                break
            except OSError as exc:
                last_err = exc
                import time
                time.sleep(0.5 * (attempt + 1))
        if last_err is not None:
            print(f"FAIL {name}: {last_err}")
            skipped += 1
            continue
        after = os.path.getsize(path)
        print(f"{name}: {before/1e6:.2f}MB {src_size[0]}x{src_size[1]} -> {after/1e6:.2f}MB {im.size[0]}x{im.size[1]}")
        changed += 1
    print(f"done changed={changed} skipped={skipped}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
