#!/usr/bin/env python3
"""Extract dominant colors from the OpenRecruitOS logo to build the app theme palette."""
from PIL import Image
import colorsys
from collections import Counter

img = Image.open("/home/z/my-project/upload/app icon.png").convert("RGB")
img = img.resize((256, 256), Image.LANCZOS)
w, h = img.size
px = img.load()

def info(r, g, b):
    hdeg, l, s = colorsys.rgb_to_hls(r / 255, g / 255, b / 255)
    return f"rgb({r:3d},{g:3d},{b:3d}) #{r:02x}{g:02x}{b:02x}  H={hdeg*360:.0f} L={l:.2f} S={s:.2f}"

counter = Counter()
for y in range(h):
    for x in range(w):
        r, g, b = px[x, y]
        if r + g + b < 60:  # skip near-black tile background
            continue
        counter[(r // 10 * 10, g // 10 * 10, b // 10 * 10)] += 1

print("=== Top 20 bright colors (gradient strokes) ===")
for (r, g, b), cnt in counter.most_common(20):
    print(f"{info(r, g, b)}  count={cnt}")

def region(name, x0, x1, y0, y1, pred):
    vals = []
    for y in range(y0, y1):
        for x in range(x0, x1):
            r, g, b = px[x, y]
            if pred(r, g, b):
                vals.append((r, g, b))
    if not vals:
        print(f"{name}: none")
        return
    n = len(vals)
    r = sum(v[0] for v in vals) // n
    g = sum(v[1] for v in vals) // n
    b = sum(v[2] for v in vals) // n
    mx = max(vals, key=lambda v: sum(v))
    print(f"{name}: avg {info(r,g,b)} | brightest {info(*mx)} | n={n}")

is_blue = lambda r, g, b: b > 140 and b > r + 30 and b >= g
is_green = lambda r, g, b: g > 130 and g > b + 20 and g >= r
is_tile = lambda r, g, b: r + g + b > 24 and r + g + b < 120 and b >= r and b >= g

print("\n=== Regional averages ===")
region("BLUE swoosh  ", 120, 230, 40, 160, is_blue)
region("GREEN swoosh ", 60, 170, 130, 230, is_green)
region("DARK tile bg ", 20, 80, 20, 60, is_tile)

# Tile background average (including dark pixels)
vals = []
for y in range(30, 90):
    for x in range(30, 90):
        r, g, b = px[x, y]
        if 20 < r + g + b < 150:
            vals.append((r, g, b))
n = len(vals)
r = sum(v[0] for v in vals) // n; g = sum(v[1] for v in vals) // n; b = sum(v[2] for v in vals) // n
print(f"TILE bg avg  : {info(r,g,b)}  n={n}")
