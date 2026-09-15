#!/usr/bin/env python3
"""OpenRecruitOS — generate the full favicon set from the uploaded logo.

Input : upload/fevicon.png (1287x1222 RGBA, mark on black)
Output: public/favicon.ico (16/32/48), public/favicon-16x16.png,
        public/favicon-32x32.png, public/apple-touch-icon.png (180),
        public/icon-192.png, public/icon-512.png

The mark is tight-cropped (with breathing room), centered on a square black
canvas (the black tile is part of the design) and downscaled with LANCZOS.
"""
from PIL import Image
import os

SRC = "/home/z/my-project/upload/fevicon.png"
OUT = "/home/z/my-project/public"

img = Image.open(SRC).convert("RGBA")

# ---- 1. Find the mark's bounding box (non-black pixels) --------------------
gray = img.convert("L")
mask = gray.point(lambda p: 255 if p > 24 else 0)
bbox = mask.getbbox()
print("mark bbox:", bbox)

# Add ~6% padding around the mark so it doesn't touch the tile edges
x0, y0, x1, y1 = bbox
pw = int((x1 - x0) * 0.06)
ph = int((y1 - y0) * 0.06)
x0, y0 = max(0, x0 - pw), max(0, y0 - ph)
x1, y1 = min(img.width, x1 + pw), min(img.height, y1 + ph)
mark = img.crop((x0, y0, x1, y1))

# ---- 2. Center the mark on a square black canvas ---------------------------
side = max(mark.size)
canvas = Image.new("RGBA", (side, side), (0, 0, 0, 255))
canvas.paste(mark, ((side - mark.width) // 2, (side - mark.height) // 2), mark)

# ---- 3. Export sizes --------------------------------------------------------
def save_png(size: int, name: str) -> None:
    canvas.resize((size, size), Image.LANCZOS).save(
        os.path.join(OUT, name), format="PNG", optimize=True
    )
    print(f"✓ {name} ({size}x{size})")

save_png(512, "icon-512.png")
save_png(192, "icon-192.png")
save_png(180, "apple-touch-icon.png")
save_png(32, "favicon-32x32.png")
save_png(16, "favicon-16x16.png")

# Multi-resolution .ico
canvas.resize((48, 48), Image.LANCZOS).save(
    os.path.join(OUT, "favicon.ico"),
    format="ICO",
    sizes=[(16, 16), (32, 32), (48, 48)],
)
print("✓ favicon.ico (16/32/48)")

print("\nDone — favicon set written to", OUT)
