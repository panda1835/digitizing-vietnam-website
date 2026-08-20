#!/usr/bin/env python
"""scripts/corpus/11-render-all.py

Renders page images for every ingested source, reading each book's PDF path out
of its manifest.

Python rather than a shell loop because the manifests store native Windows paths
(C:\\Users\\...\\file.pdf); a bash `-f` test cannot see those, which silently
skips every book.

Already-rendered books are skipped unless --force, so this is safe to re-run.

Usage:
  python scripts/corpus/11-render-all.py [--dpi 150] [--force] [--slug <slug>]
"""

import argparse
import json
import os
import subprocess
import sys

OCR_ROOT = os.path.join("data", "corpus", "ocr")
PAGES_ROOT = os.path.join("data", "corpus", "pages")
RENDER = os.path.join("scripts", "corpus", "10-render-pages.py")


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--dpi", type=int, default=150)
    parser.add_argument("--force", action="store_true")
    parser.add_argument("--slug", action="append", default=[])
    args = parser.parse_args()

    if not os.path.isdir(OCR_ROOT):
        sys.exit(f"No ingested sources at {OCR_ROOT}")

    slugs = args.slug or sorted(
        name for name in os.listdir(OCR_ROOT)
        if os.path.exists(os.path.join(OCR_ROOT, name, "manifest.json"))
    )

    rendered = skipped = missing = 0
    for slug in slugs:
        manifest_path = os.path.join(OCR_ROOT, slug, "manifest.json")
        manifest = json.load(open(manifest_path, encoding="utf-8"))
        pdf = (manifest.get("origin") or {}).get("pdfPath") or ""
        expected = manifest.get("pageCount", 0)

        if not pdf or not os.path.exists(pdf):
            print(f"  MISSING PDF  {slug}\n               {pdf or '(none recorded)'}")
            missing += 1
            continue

        book_dir = os.path.join(PAGES_ROOT, slug)
        have = len([n for n in os.listdir(book_dir) if n.endswith(".webp")]) if os.path.isdir(book_dir) else 0
        if have >= expected and not args.force:
            print(f"  done already  {slug}  ({have} images)")
            skipped += 1
            continue

        print(f"\n=== {slug} ({expected} pages) ===")
        result = subprocess.run(
            [sys.executable, RENDER, "--pdf", pdf, "--slug", slug, "--dpi", str(args.dpi)]
            + (["--force"] if args.force else []),
            env={**os.environ, "PYTHONIOENCODING": "utf-8"},
        )
        if result.returncode != 0:
            print(f"  FAILED {slug}")
        else:
            rendered += 1

    print(f"\n{rendered} rendered, {skipped} already done, {missing} missing a PDF")


if __name__ == "__main__":
    main()
