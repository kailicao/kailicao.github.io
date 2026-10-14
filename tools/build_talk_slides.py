#!/usr/bin/env python3
"""Build the public copies of Kaili Cao's talk slides and posters for this website.

    python tools/build_talk_slides.py [output folder]

Originals: ~/website-materials/slides/ (private, never in a repo; restored from Kaili Cao's own
archive when a deck needs rebuilding), with the deck data in talk_slides_data.py there: which decks
to build and their public names, which images to blur and how to describe them, page selections
and text edits. This script holds only the method; the open fonts it draws text in are in
tools/fonts/ (SIL Open Font License). Public
copies go to about/presentations/ in this repository. Images with commercial or
unclear rights (artworks, films, stock photos)
are blurred, and each gets a text box (real PDF text, not drawn onto the image) describing it,
placed over the blurred image, which is clear of the slide's own text. Research figures and
explanatory research diagrams (credited on the slide), NASA/ESA/ESO/NOIRLab images, openly
licensed images and logos stay as they are. Links
into private team spaces (Slack) are removed. The defense slides have their own script,
build_defense_slides.py. Needs PyMuPDF (pip install pymupdf).
"""
import importlib.util
import io
import sys
from pathlib import Path

import pymupdf
from PIL import Image, ImageFilter

HOME = Path.home()
SRC = HOME / "website-materials" / "slides"
OUT = Path(__file__).resolve().parents[1] / "about" / "presentations"
FONTS = Path(__file__).resolve().parent / "fonts"   # Regular instances of the open fonts (OFL), made with fontTools
DATA = SRC   # the private deck data sits with the originals


def load_data(path=DATA / "talk_slides_data.py"):
    """The private deck data (see the docstring), as module globals."""
    spec = importlib.util.spec_from_file_location("talk_slides_data", path)
    data = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(data)
    globals().update({k: getattr(data, k) for k in ("D", "DECKS", "BEAMER", "GDECKS", "EDITS", "TITLES", "VPOS", "EXTRA")})


def blur(doc, xref):
    pix = pymupdf.Pixmap(doc, xref)
    if pix.alpha or pix.n > 3:
        pix = pymupdf.Pixmap(pymupdf.csRGB, pix)
    img = Image.frombytes("RGB", (pix.width, pix.height), pix.samples)
    r = max(img.size) / 18
    img = img.filter(ImageFilter.GaussianBlur(r)).filter(ImageFilter.GaussianBlur(r))
    buf = io.BytesIO()
    img.save(buf, "JPEG", quality=75)
    return buf.getvalue()


def find_span(page, text):
    for b in page.get_text("dict")["blocks"]:
        for line in b.get("lines", []):
            for sp in line["spans"]:
                if sp["text"] == text:
                    return sp
    sys.exit(f"page {page.number + 1}: text not found: {text!r}")


def remove_text(page, sp):
    r = pymupdf.Rect(sp["bbox"])
    r.y0 += r.height * 0.3   # only this line, not its neighbors
    r.y1 -= r.height * 0.3
    page.add_redact_annot(r, fill=False)
    page.apply_redactions(images=pymupdf.PDF_REDACT_IMAGE_NONE, graphics=pymupdf.PDF_REDACT_LINE_ART_NONE)


def edit(page, op):
    kind = op[0]
    if kind == "drop":
        remove_text(page, find_span(page, op[1]))
    elif kind == "set":
        old, new, fontfile, align = op[1:]
        sp = find_span(page, old)
        font = pymupdf.Font(fontfile=str(FONTS / fontfile))
        c = sp["color"]
        rgb = ((c >> 16) & 255) / 255, ((c >> 8) & 255) / 255, (c & 255) / 255
        x0, y = sp["origin"]
        if align == "right":
            x0 = sp["bbox"][2] - font.text_length(new, sp["size"])
        remove_text(page, sp)
        page.insert_font(fontname=fontfile[:-4], fontfile=str(FONTS / fontfile))
        page.insert_text((x0, y), new, fontname=fontfile[:-4], fontsize=sp["size"], color=rgb)
    elif kind == "text":
        rect, runs = op[1:]
        page.add_redact_annot(pymupdf.Rect(rect), fill=False)
        page.apply_redactions(images=pymupdf.PDF_REDACT_IMAGE_NONE, graphics=pymupdf.PDF_REDACT_LINE_ART_NONE)
        fp = str(FONTS / "Merriweather-Regular.ttf")
        font = pymupdf.Font(fontfile=fp)
        page.insert_font(fontname="Merriweather", fontfile=fp)
        x = 0
        for rx, y, text, size, c in runs:
            x = rx if rx is not None else x
            page.insert_text((x, y), text, fontname="Merriweather", fontsize=size, color=((c >> 16) / 255, ((c >> 8) & 255) / 255, (c & 255) / 255))
            x += font.text_length(text, size)
    elif kind == "line":
        key, new, fontpath = op[1:]
        spans = [sp for b in page.get_text("dict")["blocks"] for l in b.get("lines", []) for sp in l["spans"]
                 if any(key in s["text"] for s in l["spans"])]
        x0 = min(sp["bbox"][0] for sp in spans); x1 = max(sp["bbox"][2] for sp in spans)
        y0 = min(sp["bbox"][1] for sp in spans); y1 = max(sp["bbox"][3] for sp in spans)
        size, y = spans[0]["size"], spans[0]["origin"][1]
        # cover the old line with the white slide background (removing text would disturb Beamer's shaded boxes)
        page.draw_rect(pymupdf.Rect(x0 - 1, y0 + 1, x1 + 1, y1 - 1), color=None, fill=(1, 1, 1), overlay=True)
        font = pymupdf.Font(fontfile=fontpath)
        w = font.text_length(new, size)
        page.insert_font(fontname="F-line", fontfile=fontpath)
        page.insert_text(((x0 + x1 - w) / 2, y), new, fontname="F-line", fontsize=size, color=(0, 0, 0))
    elif kind == "move":
        text, after = op[1:]
        sp = find_span(page, text)
        prev = [s for b in page.get_text("dict")["blocks"] for l in b.get("lines", []) for s in l["spans"] if s["text"] == after][0]
        dx = prev["bbox"][2] - sp["bbox"][0]
        old = pymupdf.Rect(sp["bbox"])
        # the link underline: a thin colored bar under the text; cover it with the background and redraw it moved
        for d in page.get_drawings():
            r = d["rect"]
            if d.get("fill") and d["fill"] != (0.0, 0.0, 0.0) and r.height < 4 and old.x0 - 1 <= r.x0 and r.x1 <= old.x1 + 1 and old.y0 < r.y0 < old.y1 + 4:
                bg = page.get_pixmap(clip=pymupdf.Rect(r.x0, r.y1 + 3, r.x0 + 2, r.y1 + 5)).pixel(0, 0)
                page.draw_rect(r + (-1, -0.5, 1, 0.5), color=None, fill=[v / 255 for v in bg[:3]], overlay=True)
                page.draw_rect(r + (dx, 0, dx, 0), color=None, fill=d["fill"], overlay=True)
        for link in page.get_links():
            if pymupdf.Rect(link["from"]).intersects(old):
                link["from"] = pymupdf.Rect(link["from"]) + (dx, 0, dx, 0)
                page.update_link(link)
        font = pymupdf.Font(fontfile=str(FONTS / "Montserrat-Regular.ttf"))
        c = sp["color"]
        rgb = ((c >> 16) & 255) / 255, ((c >> 8) & 255) / 255, (c & 255) / 255
        remove_text(page, sp)
        page.insert_font(fontname="Montserrat-Regular", fontfile=str(FONTS / "Montserrat-Regular.ttf"))
        page.insert_text((sp["origin"][0] + dx, sp["origin"][1]), text, fontname="Montserrat-Regular", fontsize=sp["size"], color=rgb)


def build_google(src, name, targets, pages):
    doc = pymupdf.open(SRC / "google" / src)
    for op in EDITS.get(src, []):
        edit(doc[op[0] - 1], op[1:])
    build(src, name, targets, doc=doc, pages=pages)


def build(src, name, targets, doc=None, pages=None):
    """Blur the target images (xref -> description key) and save the public copy; for a Google
    Slides deck, doc already holds the edited export, and pages selects the presented slides."""
    doc = doc or pymupdf.open(SRC / src)
    targets = dict(targets, **{x: k for (f, x), k in EXTRA.items() if f == src})
    done = {}
    for page in doc:
        for info in page.get_image_info(xrefs=True):
            x = info["xref"]
            if x not in targets:
                continue
            if x not in done:
                done[x] = blur(doc, x)
                page.replace_image(x, stream=done[x])
            b = pymupdf.Rect(info["bbox"]) & page.rect
            w = min(b.width - 16, 330)
            box = pymupdf.Rect(b.x0 + (b.width - w) / 2, 0, b.x0 + (b.width + w) / 2, 0)
            text = D[targets[x]]
            fs = 11 if w > 200 else 9
            lines = max(1, int(len(text) * fs * 0.5 / (w - 2 * fs)) + 1)
            h = lines * fs * 1.3 + 2 * fs * 0.7
            box.y0 = b.y0 + (b.height - h) * VPOS.get(targets[x], 0.5)
            box.y1 = box.y0 + h
            page.draw_rect(box, color=None, fill=(0.08, 0.08, 0.1), fill_opacity=0.85, overlay=True)
            rc = page.insert_textbox(box + (fs * 0.7, fs * 0.6, -fs * 0.7, 0), text, fontsize=fs, fontname="helv", color=(1, 1, 1))
            if rc < 0:
                sys.exit(f"{name}, page {page.number + 1}: text box too small ({rc:.1f})")
    missing = set(targets) - set(done)
    if missing:
        sys.exit(f"{name}: images not found: {sorted(missing)}")
    # links into private team spaces (Slack) are removed; the slide text stays
    for page in doc:
        for link in page.get_links():
            if "slack.com" in link.get("uri", ""):
                page.delete_link(link)
    if pages:
        doc.select([p - 1 for p in pages])
    meta = {k: v for k, v in doc.metadata.items() if k in ("title", "creator", "producer", "format")} | {"author": "Kaili Cao"}
    if name in TITLES:
        meta["title"] = TITLES[name]
    doc.set_metadata(meta)
    doc.del_xml_metadata()
    doc.save(OUT / name, garbage=4, deflate=True)
    print(f"{name}: {len(done)} image(s) blurred")


if __name__ == "__main__":
    OUT = Path(sys.argv[1]) if len(sys.argv) > 1 else OUT
    load_data()
    for src, (name, targets) in DECKS.items():
        build(src, name, targets)
    for src, (name, targets, pages) in BEAMER.items():
        doc = pymupdf.open(SRC / src)
        for op in EDITS.get(src, []):
            edit(doc[op[0] - 1], op[1:])
        build(src, name, targets, doc=doc, pages=pages)
    for src, (name, targets, pages) in GDECKS.items():
        build_google(src, name, targets, pages)
