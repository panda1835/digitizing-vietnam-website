#!/usr/bin/env python
"""scripts/corpus/10-render-pages.py

Rasterizes a source PDF into per-page images for the corpus reader, so a
citation can be checked against the page it came from.

Python rather than .mjs — unlike the rest of scripts/corpus, this step needs a
PDF rasterizer, and PyMuPDF is already installed here while poppler's pdftoppm,
ImageMagick and Ghostscript are not. Everything downstream stays in Node.

Output matches the logical keys corpus.pages.image_key stores:

    <dest>/<slug>/<page:04d>.webp        full page, --dpi (default 150)
    <dest>/<slug>/thumbs/<page:04d>.webp thumbnail, --thumb-width (default 320)
    <dest>/<slug>/images.json            per-page dimensions + byte sizes

Pages are 1-based, matching corpus.pages.page_number and the OCR export.

Resumable and idempotent: a page whose image already exists is skipped unless
--force is passed, so an interrupted run just continues.

Usage:
  python scripts/corpus/10-render-pages.py --pdf "<file.pdf>" --slug <slug>
  python scripts/corpus/10-render-pages.py --pdf ... --slug ... --first 1 --last 5
"""

import argparse
import json
import os
import sys
import time

try:
    import fitz  # PyMuPDF
except ImportError:
    sys.exit("PyMuPDF is required: python -m pip install pymupdf")


def parse_args():
    p = argparse.ArgumentParser(description=__doc__,
                                formatter_class=argparse.RawDescriptionHelpFormatter)
    p.add_argument("--pdf", required=True, help="path to the source PDF")
    p.add_argument("--slug", required=True, help="corpus source slug")
    p.add_argument("--dest", default=os.path.join("data", "corpus", "pages"))
    p.add_argument("--dpi", type=int, default=150,
                   help="render resolution; 150 is legible for scanned type (default)")
    p.add_argument("--thumb-width", type=int, default=320)
    p.add_argument("--format", default="webp", choices=["webp", "jpg", "png"])
    p.add_argument("--quality", type=int, default=80)
    p.add_argument("--first", type=int, default=1, help="first page, 1-based inclusive")
    p.add_argument("--last", type=int, default=0, help="last page, 1-based inclusive; 0 = all")
    p.add_argument("--gray", action="store_true",
                   help="render greyscale; these are B&W book scans, so this roughly halves size")
    p.add_argument("--force", action="store_true", help="re-render pages that already exist")
    p.add_argument("--dry-run", action="store_true")
    return p.parse_args()


def human(n):
    for unit in ("B", "KB", "MB", "GB"):
        if n < 1024:
            return f"{n:.0f}{unit}" if unit == "B" else f"{n:.1f}{unit}"
        n /= 1024
    return f"{n:.1f}TB"


def save(pixmap, path, fmt, quality, gray=False):
    """PyMuPDF writes png natively; webp/jpg go through Pillow."""
    if fmt == "png":
        pixmap.save(path)
        return
    from PIL import Image
    mode = "L" if pixmap.n == 1 else "RGB"
    image = Image.frombytes(mode, (pixmap.width, pixmap.height), pixmap.samples)
    if gray and image.mode != "L":
        image = image.convert("L")
    image.save(path, "WEBP" if fmt == "webp" else "JPEG", quality=quality, method=4)


def main():
    args = parse_args()

    if not os.path.exists(args.pdf):
        sys.exit(f"PDF not found: {args.pdf}")

    doc = fitz.open(args.pdf)
    total = doc.page_count
    last = total if args.last in (0, None) else min(args.last, total)
    first = max(1, args.first)

    book_dir = os.path.join(args.dest, args.slug)
    thumb_dir = os.path.join(book_dir, "thumbs")
    if not args.dry_run:
        os.makedirs(thumb_dir, exist_ok=True)

    print(f"{os.path.basename(args.pdf)}")
    print(f"  {total} pages in PDF | rendering {first}..{last} at {args.dpi} DPI "
          f"-> {book_dir}{' (dry run)' if args.dry_run else ''}")

    zoom = args.dpi / 72.0
    matrix = fitz.Matrix(zoom, zoom)

    index_path = os.path.join(book_dir, "images.json")
    index = {}
    if os.path.exists(index_path):
        try:
            index = json.load(open(index_path, encoding="utf-8"))
        except (ValueError, OSError):
            index = {}

    rendered = skipped = written_bytes = 0
    started = time.time()

    for page_number in range(first, last + 1):
        name = f"{page_number:04d}.{args.format}"
        full_path = os.path.join(book_dir, name)
        thumb_path = os.path.join(thumb_dir, name)

        if not args.force and os.path.exists(full_path) and os.path.exists(thumb_path):
            skipped += 1
            continue
        if args.dry_run:
            rendered += 1
            continue

        page = doc.load_page(page_number - 1)
        colorspace = fitz.csGRAY if args.gray else fitz.csRGB
        pixmap = page.get_pixmap(matrix=matrix, alpha=False, colorspace=colorspace)
        save(pixmap, full_path, args.format, args.quality, args.gray)

        thumb_zoom = args.thumb_width / pixmap.width if pixmap.width else 1
        thumb_pixmap = page.get_pixmap(
            matrix=fitz.Matrix(zoom * thumb_zoom, zoom * thumb_zoom), alpha=False,
            colorspace=colorspace)
        save(thumb_pixmap, thumb_path, args.format, args.quality, args.gray)

        size = os.path.getsize(full_path)
        written_bytes += size
        index[str(page_number)] = {
            "key": f"{args.slug}/{name}",
            "width": pixmap.width,
            "height": pixmap.height,
            "bytes": size,
        }
        rendered += 1

        if rendered % 25 == 0:
            elapsed = time.time() - started
            rate = rendered / elapsed if elapsed else 0
            print(f"    {page_number}/{last}  {rate:.1f} pages/s  {human(written_bytes)} written")

    if not args.dry_run:
        with open(index_path, "w", encoding="utf-8") as handle:
            json.dump(index, handle, indent=1, sort_keys=True)

    elapsed = time.time() - started
    print(f"  done — {rendered} rendered, {skipped} skipped, {human(written_bytes)} "
          f"in {elapsed:.1f}s")
    if rendered and not args.dry_run:
        per_page = written_bytes / rendered
        print(f"  average {human(per_page)}/page -> ~{human(per_page * total)} for all {total}")


if __name__ == "__main__":
    main()
