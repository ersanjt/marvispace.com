"""Render MARVISPACE brand assets from the same M geometry as favicon.svg."""
from pathlib import Path
from PIL import Image, ImageDraw, ImageFont

ROOT = Path(r'C:\Users\ersan\Desktop\Ersan-Workspace\00-GitHub\marvispace.com')
BRAND = ROOT / 'assets' / 'images' / 'brand'

BG = (10, 10, 10)          # #0a0a0a
FG = (244, 242, 238)       # #f4f2ee
FRAME = (244, 242, 238, 46)  # ~0.18 opacity

# Exact path from favicon.svg / mark.svg (viewBox 0..64)
# M16 48 V16 h5.2 L32 38.4 42.8 16 H48 v32 h-5.2 V27.6 L32 48 21.2 27.6 V48 H16 z
MARK_POINTS = [
    (16, 48), (16, 16), (21.2, 16), (32, 38.4), (42.8, 16), (48, 16),
    (48, 48), (42.8, 48), (42.8, 27.6), (32, 48), (21.2, 27.6), (21.2, 48),
]


def scale_points(size: int):
    s = size / 64
    return [(x * s, y * s) for x, y in MARK_POINTS]


def draw_mark(size: int, with_frame: bool = True) -> Image.Image:
    img = Image.new('RGB', (size, size), BG)
    draw = ImageDraw.Draw(img)
    draw.polygon(scale_points(size), fill=FG)
    if with_frame:
        pad = max(1, round(size * 4 / 64))
        stroke = max(1, round(size / 64))
        # approximate translucent stroke on RGB
        frame_rgb = (54, 53, 52)  # blend of FG@0.18 over BG
        draw.rectangle(
            [pad, pad, size - pad - 1, size - pad - 1],
            outline=frame_rgb,
            width=stroke,
        )
    return img


def load_font(size: int):
    candidates = [
        r'C:\Windows\Fonts\arial.ttf',
        r'C:\Windows\Fonts\segoeui.ttf',
        r'C:\Windows\Fonts\helvetica.ttf',
    ]
    for path in candidates:
        p = Path(path)
        if p.exists():
            return ImageFont.truetype(str(p), size=size)
    return ImageFont.load_default()


def spaced_text(draw, xy, text, font, fill, tracking=0.42):
    """Draw uppercase text with letter-spacing (em fraction)."""
    x, y = xy
    for i, ch in enumerate(text):
        draw.text((x, y), ch, font=font, fill=fill)
        bbox = draw.textbbox((0, 0), ch, font=font)
        w = bbox[2] - bbox[0]
        # approximate advance + tracking
        advance = w + int(font.size * tracking) if hasattr(font, 'size') else w + 8
        # better: use font size from truetype
        try:
            advance = w + int(font.size * tracking)
        except Exception:
            advance = w + 10
        x += advance
    return x


def make_og() -> Image.Image:
    w, h = 1200, 630
    img = Image.new('RGB', (w, h), BG)
    draw = ImageDraw.Draw(img)

    mark_size = 168
    mark = draw_mark(mark_size, with_frame=True)
    mark_x = 120
    mark_y = (h - mark_size) // 2
    img.paste(mark, (mark_x, mark_y))

    text_x = mark_x + mark_size + 48
    name_font = load_font(42)
    tag_font = load_font(16)

    # Vertically center wordmark block relative to mark
    name = 'MARVISPACE'
    # measure spaced width roughly
    sample = draw.textbbox((0, 0), 'M', font=name_font)
    char_w = sample[2] - sample[0]
    name_w = len(name) * (char_w + int(42 * 0.42))
    name_h = sample[3] - sample[1]

    block_h = name_h + 28 + 18
    text_y = mark_y + (mark_size - block_h) // 2

    spaced_text(draw, (text_x, text_y), name, name_font, FG, tracking=0.36)

    line_y = text_y + name_h + 18
    draw.line([(text_x, line_y), (text_x + min(320, name_w), line_y)], fill=FG, width=1)

    tag = 'PREMIUM LEATHER APPAREL'
    spaced_text(draw, (text_x, line_y + 14), tag, tag_font, (180, 178, 174), tracking=0.28)

    return img


def main():
    BRAND.mkdir(parents=True, exist_ok=True)

    mark_512 = draw_mark(512, with_frame=True)
    mark_512.save(BRAND / 'mark.png', 'PNG', optimize=True)

    icon_180 = draw_mark(180, with_frame=True)
    icon_180.save(BRAND / 'icon-180.png', 'PNG', optimize=True)
    icon_180.save(ROOT / 'apple-touch-icon.png', 'PNG', optimize=True)

    # also keep a crisp 32/48 for browsers if needed later
    draw_mark(512, with_frame=True).save(BRAND / 'mark-512.png', 'PNG', optimize=True)

    og = make_og()
    og.save(BRAND / 'og.jpg', 'JPEG', quality=92, optimize=True, progressive=True)

    for p in [
        BRAND / 'mark.png',
        BRAND / 'icon-180.png',
        BRAND / 'og.jpg',
        ROOT / 'apple-touch-icon.png',
        ROOT / 'favicon.svg',
        BRAND / 'mark.svg',
    ]:
        print(f'{p.name:24} {p.stat().st_size if p.exists() else 0}')


if __name__ == '__main__':
    main()
