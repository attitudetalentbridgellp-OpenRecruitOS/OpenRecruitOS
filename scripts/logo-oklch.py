#!/usr/bin/env python3
"""Convert logo colors to OKLCH and validate button-contrast candidates."""
import math

def srgb_to_linear(c):
    c /= 255.0
    return c / 12.92 if c <= 0.04045 else ((c + 0.055) / 1.055) ** 2.4

def hex_to_oklch(hx):
    hx = hx.lstrip("#")
    r, g, b = int(hx[0:2], 16), int(hx[2:4], 16), int(hx[4:6], 16)
    r, g, b = srgb_to_linear(r), srgb_to_linear(g), srgb_to_linear(b)
    l = 0.4122214708*r + 0.5363325363*g + 0.0514459929*b
    m = 0.2119034982*r + 0.6806995451*g + 0.1073969566*b
    s = 0.0883024619*r + 0.2817188376*g + 0.6299787005*b
    l_, m_, s_ = l ** (1/3), m ** (1/3), s ** (1/3)
    L = 0.2104542553*l_ + 0.7936177850*m_ - 0.0040720468*s_
    A = 1.9779984951*l_ - 2.4285922050*m_ + 0.4505937099*s_
    B = 0.0259040371*l_ + 0.7827717662*m_ - 0.8086757660*s_
    C = math.sqrt(A*A + B*B)
    H = math.degrees(math.atan2(B, A)) % 360
    return f"oklch({L:.3f} {C:.3f} {H:.1f})"

def oklch_to_hex(L, C, H):
    h = math.radians(H)
    A, B = C*math.cos(h), C*math.sin(h)
    l_ = L + 0.3963377774*A + 0.2158037573*B
    m_ = L - 0.1055613458*A - 0.0638541728*B
    s_ = L - 0.0894841775*A - 1.2914855480*B
    l, m, s = l_**3, m_**3, s_**3
    r =  4.0767416621*l - 3.3077115913*m + 0.2309699292*s
    g = -1.2684380046*l + 2.6097574011*m - 0.3413193965*s
    b = -0.0041960863*l - 0.7034186147*m + 1.7076147010*s
    def gam(u):
        u = max(0.0, min(1.0, u))
        return round(255 * (12.92*u if u <= 0.0031308 else 1.055*u**(1/2.4) - 0.055))
    return f"#{gam(r):02x}{gam(g):02x}{gam(b):02x}"

def lum(hx):
    hx = hx.lstrip("#")
    def f(c):
        c = c / 255.0
        return c / 12.92 if c <= 0.04045 else ((c + 0.055) / 1.055) ** 2.4
    vals = [f(int(hx[i:i+2], 16)) for i in (0, 2, 4)]
    return 0.2126*vals[0] + 0.7152*vals[1] + 0.0722*vals[2]

def contrast(a, b):
    la, lb = lum(a), lum(b)
    hi, lo = max(la, lb), min(la, lb)
    return (hi + 0.05) / (lo + 0.05)

print("=== Logo anchor colors → OKLCH ===")
for name, hx in [
    ("logo azure  #06A2F5", "06a2f5"),
    ("logo teal   #0FE4A5", "0fe4a5"),
    ("tile navy   #001F5B", "001f5b"),
    ("deep navy   #00143C", "00143c"),
    ("cyan-bright #A6F5F8", "a6f5f8"),
    ("old primary emerald", None),
]:
    if hx:
        print(f"{name}: {hex_to_oklch(hx)}")

print("\n=== Primary candidates (white text contrast) ===")
for hx in ["0284c7", "0480d0", "0479d1", "0369a1", "0575cd"]:
    print(f"#{hx}: {hex_to_oklch(hx)}  contrast_vs_white={contrast(hx, 'ffffff'):.2f}:1")

print("\n=== Chosen theme vars → sanity hex ===")
vars = {
    "--primary (light)":      (0.555, 0.150, 244),
    "--ring / chart-1":       (0.665, 0.170, 240),
    "--chart-2 cyan":         (0.760, 0.115, 210),
    "--chart-3 teal":         (0.800, 0.150, 166),
    "--chart-4 navy":         (0.430, 0.110, 262),
    "--sidebar navy":         (0.255, 0.070, 262),
    "--sidebar-accent":       (0.320, 0.060, 258),
    "--sidebar-border":       (0.340, 0.055, 256),
    "--background":           (0.985, 0.004, 235),
    "--foreground":           (0.190, 0.028, 258),
    "--muted-foreground":     (0.510, 0.022, 255),
    "--border":               (0.912, 0.012, 245),
    "--primary-foreground":   (0.985, 0.005, 235),
    "--secondary":            (0.952, 0.016, 235),
    "--accent":               (0.945, 0.020, 235),
    "sidebar-fg":             (0.925, 0.018, 245),
    "sidebar muted":          (0.700, 0.030, 250),
    "dark --background":      (0.165, 0.022, 258),
    "dark --card":            (0.205, 0.028, 256),
    "dark --primary":         (0.680, 0.150, 240),
}
for name, (L, C, H) in vars.items():
    print(f"{name:24s} oklch({L} {C} {H})  -> {oklch_to_hex(L, C, H)}")

print("\n=== dark primary vs dark bg contrast ===")
darkbg = oklch_to_hex(0.17, 0.03, 260)
darkprim = oklch_to_hex(0.684, 0.163, 243)
print(f"dark bg {darkbg}, primary {darkprim}: {contrast(darkprim, darkbg):.2f}:1")
darkfg = oklch_to_hex(0.17, 0.04, 260)
print(f"dark primary-fg {darkfg} on primary: {contrast(darkprim, darkfg):.2f}:1")
print("=== light: white fg vs primary bg ===")
prim = oklch_to_hex(0.555, 0.15, 244)
print(f"primary {prim}: {contrast('ffffff', prim):.2f}:1")
print("=== sidebar: fg vs navy ===")
sbg = oklch_to_hex(0.26, 0.095, 261)
sfg = oklch_to_hex(0.93, 0.02, 245)
smut = oklch_to_hex(0.72, 0.04, 248)
print(f"sidebar-fg on sidebar: {contrast(sfg, sbg):.2f}:1")
print(f"sidebar-muted on sidebar: {contrast(smut, sbg):.2f}:1")
print(f"white on sidebar-primary(azure, nav active): {contrast('#ffffff', oklch_to_hex(0.555,0.15,244)):.2f}:1")
