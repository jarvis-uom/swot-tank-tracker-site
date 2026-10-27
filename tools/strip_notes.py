"""Copy a PowerPoint file without its speaker notes, for the website.

    python tools/strip_notes.py "<deck with notes>.pptx" site/assets/docs/swot-tank-tracker-proposal-talk.pptx

Only the Python standard library is used. The notes pages (ppt/notesSlides/) and the links to them are
removed; every other part of the file, including each slide, is copied unchanged. The deck with notes
is not touched.
"""
import re
import sys
import zipfile
from pathlib import Path

NOTES = "ppt/notesSlides/"


def strip(src, dst):
    removed = 0
    with zipfile.ZipFile(src) as zin, zipfile.ZipFile(dst, "w") as zout:
        for item in zin.infolist():
            name = item.filename
            if name.startswith(NOTES):
                removed += bool(re.fullmatch(r"ppt/notesSlides/notesSlide\d+\.xml", name))
                continue
            data = zin.read(name)
            if name.startswith("ppt/slides/_rels/"):
                data = re.sub(rb'<Relationship [^>]*/notesSlide"[^>]*/>', b"", data)
            elif name == "[Content_Types].xml":
                data = re.sub(rb'<Override [^>]*PartName="/ppt/notesSlides/[^"]*"[^>]*/>', b"", data)
            elif name == "docProps/app.xml":
                data = re.sub(rb"<Notes>\d+</Notes>", b"<Notes>0</Notes>", data)
            zout.writestr(item, data)
    with zipfile.ZipFile(dst) as z:  # nothing may still point to a notes page
        left = [n for n in z.namelist() if b"notesSlide" in z.read(n)]
    if left:
        raise RuntimeError(f"notes are still linked from {left}")
    return removed


def main():
    if len(sys.argv) != 3:
        sys.exit(__doc__)
    src, dst = Path(sys.argv[1]), Path(sys.argv[2])
    if src.resolve() == dst.resolve():
        sys.exit("Write to a different file: the deck with notes must stay as it is.")
    removed = strip(src, dst)
    print(f"{dst}: {removed} notes pages removed, {dst.stat().st_size / 1e6:.1f} MB")


if __name__ == "__main__":
    main()
