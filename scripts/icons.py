"""Genera le icone PNG della PWA (omino con valigia, come nella timeline)."""
from PIL import Image, ImageDraw
import os

OUT = os.path.join(os.path.dirname(__file__), '..', 'public')
BG, YEL, TEAL = (7, 9, 13), (255, 205, 60), (46, 211, 192)

def make(size, radius_ratio=0.22, pad_ratio=0.16):
    S = size * 4  # supersampling
    im = Image.new('RGBA', (S, S), (0, 0, 0, 0))
    d = ImageDraw.Draw(im)
    r = int(S * radius_ratio)
    d.rounded_rectangle([0, 0, S - 1, S - 1], radius=r, fill=BG + (255,))
    # bagliore teal in basso a destra
    glow = Image.new('RGBA', (S, S), (0, 0, 0, 0))
    gd = ImageDraw.Draw(glow)
    gd.ellipse([S * 0.45, S * 0.45, S * 1.25, S * 1.25], fill=TEAL + (70,))
    from PIL import ImageFilter
    glow = glow.filter(ImageFilter.GaussianBlur(S * 0.12))
    mask = Image.new('L', (S, S), 0)
    ImageDraw.Draw(mask).rounded_rectangle([0, 0, S - 1, S - 1], radius=r, fill=255)
    im = Image.composite(Image.alpha_composite(im, glow), im, mask)
    d = ImageDraw.Draw(im)
    # figura: coordinate del viewBox 34x44 dell'omino, scalate e centrate
    pad = S * pad_ratio
    box = S - 2 * pad
    sc = box / 44
    ox = (S - 34 * sc) / 2 + sc * 1.5
    oy = pad
    X = lambda x: ox + x * sc
    Y = lambda y: oy + y * sc
    d.ellipse([X(13 - 5.6), Y(7.5 - 5.6), X(13 + 5.6), Y(7.5 + 5.6)], fill=YEL)
    body = [(7.6, 15.5), (17.8, 15.5), (20.2, 26.9), (16.9, 26.9), (15.7, 41), (12.6, 41), (11.5, 31.4), (10.4, 41), (7.3, 41), (8.4, 26.9), (5.2, 26.9)]
    d.polygon([(X(x), Y(y)) for x, y in body], fill=YEL)
    d.rounded_rectangle([X(22.5), Y(24), X(32), Y(36.5)], radius=sc * 2, fill=TEAL)
    w = int(sc * 2)
    d.line([(X(27.2), Y(24)), (X(27.2), Y(19.5)), (X(23.2), Y(17))], fill=TEAL, width=w)
    d.line([(X(17.8), Y(18.2)), (X(22.7), Y(20.8))], fill=YEL, width=int(sc * 2.6))
    return im.resize((size, size), Image.LANCZOS)

os.makedirs(OUT, exist_ok=True)
make(512).save(os.path.join(OUT, 'icon-512.png'))
make(192).save(os.path.join(OUT, 'icon-192.png'))
# apple-touch-icon: iOS arrotonda da sé, quindi angoli pieni
make(180, radius_ratio=0.0).convert('RGB').save(os.path.join(OUT, 'apple-touch-icon.png'))
print('icone generate in', os.path.abspath(OUT))
