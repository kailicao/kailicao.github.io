#!/usr/bin/env python3
"""Build the public copy of Kaili Cao's dissertation defense slides for this website.

    python tools/build_defense_slides.py [original.pdf] [public.pdf]

Defaults: the original at ~/website-materials/slides/RAINGAS.pdf (private, never in a
repo; handed over only when the slides need rebuilding) and the public copy in
about/presentations/ of this repository. Which images to blur, their descriptions and
where the boxes go are in ~/website-materials/slides/defense_slides_data.py, restored
with the originals from Kaili Cao's archive (private);
this script holds only the method.
Images with commercial or unclear rights (films, toys, a book cover, AI-generated
pictures, a campus photo) are blurred; each gets a text box (real PDF text, not
drawn onto the image) describing it, placed in a free area of the slide, and the
script reports how close each box comes to the slide's own text. Research
figures, NASA/ESA images and logos stay as they are.
"""
import importlib.util
import os
import sys
import textwrap
from pathlib import Path

import pypdf
from PIL import Image, ImageFilter
from pypdf.generic import NameObject, DictionaryObject, FloatObject, DecodedStreamObject
HOME = Path.home()
SRC = sys.argv[1] if len(sys.argv) > 1 else str(HOME / "website-materials" / "slides" / "RAINGAS.pdf")
OUT = sys.argv[2] if len(sys.argv) > 2 else str(Path(__file__).resolve().parents[1] / "about" / "presentations" / "2026-06-25_dissertation-defense.pdf")
_spec = importlib.util.spec_from_file_location("defense_slides_data", HOME / "website-materials" / "slides" / "defense_slides_data.py")
_data = importlib.util.module_from_spec(_spec); _spec.loader.exec_module(_data)
BLUR, D, BOX, FADE, TITLE = _data.BLUR, _data.D, _data.BOX, _data.FADE, _data.TITLE
r = pypdf.PdfReader(SRC); w = pypdf.PdfWriter(clone_from=r); done = set()
for pg in w.pages:
    for im in pg.images:
        if im.name in BLUR and im.name not in done:
            img = im.image.convert("RGB"); rad = max(img.size) / 18
            img = img.filter(ImageFilter.GaussianBlur(rad)).filter(ImageFilter.GaussianBlur(rad))
            if im.name in FADE:   # fade toward white so what is drawn over it reads clearly
                img = Image.blend(img, Image.new("RGB", img.size, "white"), 0.6)
            im.replace(img, quality=75); done.add(im.name)
esc = lambda t: t.replace("\\", "\\\\").replace("(", "\\(").replace(")", "\\)")
placed = {}
for s, (key, x0, ytop, bw, fs) in BOX.items():
    lines = textwrap.wrap(D[key], int((bw - 2 * fs) / (fs * 0.5)))
    lh = fs * 1.25; pad = fs * 0.7; bh = len(lines) * lh + 2 * pad - (lh - fs); y0 = ytop - bh; placed[s] = (x0, y0, x0 + bw, ytop)
    ops = [f"q /GScap gs 0.08 0.08 0.1 rg {x0} {y0:.1f} {bw} {bh:.1f} re f Q", "BT /Fcap %d Tf 1 1 1 rg" % fs]
    ops += [f"1 0 0 1 {x0 + pad:.1f} {ytop - pad - fs * 0.8 - k * lh:.1f} Tm ({esc(ln)}) Tj" for k, ln in enumerate(lines)] + ["ET"]
    ov = pypdf.PdfWriter().add_blank_page(960, 540)
    ov[NameObject("/Resources")] = DictionaryObject({
        NameObject("/Font"): DictionaryObject({NameObject("/Fcap"): DictionaryObject({NameObject("/Type"): NameObject("/Font"), NameObject("/Subtype"): NameObject("/Type1"), NameObject("/BaseFont"): NameObject("/Helvetica"), NameObject("/Encoding"): NameObject("/WinAnsiEncoding")})}),
        NameObject("/ExtGState"): DictionaryObject({NameObject("/GScap"): DictionaryObject({NameObject("/Type"): NameObject("/ExtGState"), NameObject("/ca"): FloatObject(0.72)})})})
    cs = DecodedStreamObject(); cs.set_data("\n".join(ops).encode("latin-1")); ov[NameObject("/Contents")] = cs
    w.pages[s - 1].merge_page(ov)
w.add_metadata({"/Title": TITLE, "/Author": "Kaili Cao"})
w.compress_identical_objects(remove_duplicates=True, remove_unreferenced=True)
with open(OUT, "wb") as f: w.write(f)
def mul(a, b): return [a[0]*b[0]+a[1]*b[2], a[0]*b[1]+a[1]*b[3], a[2]*b[0]+a[3]*b[2], a[2]*b[1]+a[3]*b[3], a[4]*b[0]+a[5]*b[2]+b[4], a[4]*b[1]+a[5]*b[3]+b[5]]
worst = []
for s, (x0, y0, x1, y1) in placed.items():
    def v(t, cm, tm, fd, f):
        if t.strip():
            m = mul(tm, cm); size = f * (abs(m[3]) or 1)
            it = (m[4], m[5] - size * 0.25, m[4] + len(t.strip()) * size * 0.52, m[5] + size * 0.85)
            worst.append((max(it[0] - x1, x0 - it[2], it[1] - y1, y0 - it[3]), s, t.strip()[:30]))
    r.pages[s-1].extract_text(visitor_text=v)
worst.sort()
print("boxes:", len(placed), "| closest estimated gaps:", [(round(g), s, t) for g, s, t in worst[:4]], "|", os.path.getsize(OUT) // 1024, "KB")
