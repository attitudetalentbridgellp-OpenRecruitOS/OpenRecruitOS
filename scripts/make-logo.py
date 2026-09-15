#!/usr/bin/env python3
"""OpenRecruitOS — generate in-app logo assets from the uploaded app icon.

Input : upload/app icon.png (1254x1254 RGBA, glowing tile on black)
Output: public/logo.png     (512x512, rounded corners with alpha)
        public/logo-192.png (192x192, same treatment)

The tile (including its glow) is detected via a luminance threshold, cropped
with a small margin, then given rounded transparent corners so it sits cleanly
on the app's light backgrounds.
"""
from PIL import Image, ImageDraw, ImageFilter
import os

SRC = "/home/z/my-project/upload/app icon.png"
OUT = "/home/z/my-project/public"

img = Image.open(SRC).convert("RGBA")

# ---- 1. Crop the exact tile body (measured via brightness profiles) ---------
# Tile: x 58..1196, y 76..1234. White artifact strip starts at y>=1236.
# Outer glow fades noisily into black, so we crop the tile body exactly and
# let a rounded alpha mask define clean edges.
tile = img.crop((58, 76, 1196, 1234))
print("tile crop:", tile.size)

# ---- 2. Center on a transparent square canvas --------------------------------
side = max(tile.size)
canvas = Image.new("RGBA", (side, side), (0, 0, 0, 0))
canvas.paste(tile, ((side - tile.width) // 2, (side - tile.height) // 2), tile)

# ---- 3. Rounded transparent corners ------------------------------------------
RADIUS_RATIO = 0.21  # Apple-style app-icon corner ratio
radius = int(side * RADIUS_RATIO)
mask = Image.new("L", (side, side), 0)
draw = ImageDraw.Draw(mask)
draw.rounded_rectangle([0, 0, side - 1, side - 1], radius=radius, fill=255)
mask = mask.filter(ImageFilter.GaussianBlur(1.0))
# Multiply with existing alpha so already-transparent pixels stay transparent
from PIL import ImageChops
alpha = ImageChops.multiply(canvas.split()[3], mask)
canvas.putalpha(alpha)

# ---- 4. Export ---------------------------------------------------------------
canvas.resize((512, 512), Image.LANCZOS).save(
    os.path.join(OUT, "logo.png"), format="PNG", optimize=True
)
print("✓ logo.png (512x512)")

canvas.resize((192, 192), Image.LANCZOS).save(
    os.path.join(OUT, "logo-192.png"), format="PNG", optimize=True
)
print("✓ logo-192.png (192x192)")

print("\nDone — logo assets written to", OUT)
