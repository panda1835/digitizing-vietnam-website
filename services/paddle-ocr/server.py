"""
Minimal Flask server wrapping PaddleOCR for the digitizing-vietnam-website OCR editor.

Usage:
  set PADDLE_PDX_DISABLE_MODEL_SOURCE_CHECK=True
  python services/paddle-ocr/server.py

Listens on http://localhost:5555/ocr
"""

import os, io, sys, tempfile, traceback
os.environ["PADDLE_PDX_DISABLE_MODEL_SOURCE_CHECK"] = "True"

# Fix Windows console encoding for CJK output
if sys.platform == "win32":
    sys.stdout.reconfigure(encoding="utf-8", errors="replace")
    sys.stderr.reconfigure(encoding="utf-8", errors="replace")

from flask import Flask, request, jsonify
from PIL import Image

app = Flask(__name__)

_paddle_cache = {}

def get_paddle_ocr(lang="chinese_cht"):
    """Get or create a PaddleOCR v2 instance."""
    if lang not in _paddle_cache:
        from paddleocr import PaddleOCR
        _paddle_cache[lang] = PaddleOCR(
            lang=lang,
            use_angle_cls=False,
            use_gpu=False,
            show_log=False,
        )
    return _paddle_cache[lang]


def is_cjk(char):
    cp = ord(char)
    return (
        (0x2E80 <= cp <= 0x9FFF) or
        (0x3400 <= cp <= 0x4DBF) or
        (0xF900 <= cp <= 0xFAFF) or
        (0x20000 <= cp <= 0x2FA1F)
    )


def build_spatial_data(result, page_width, page_height):
    """Convert PaddleOCR v2 result to spatial data matching SpatialCharacter format.

    PaddleOCR v2 ocr() returns: [[bbox_points, (text, confidence)], ...]
    where bbox_points is [[x1,y1],[x2,y2],[x3,y3],[x4,y4]]
    """
    spatial_data = []

    if not result or not result[0]:
        return spatial_data

    items = result[0]

    for item in items:
        if item is None:
            continue

        bbox_raw = item[0]
        text = item[1][0]
        confidence = float(item[1][1])

        xs = [p[0] for p in bbox_raw]
        ys = [p[1] for p in bbox_raw]
        min_x, max_x = min(xs), max(xs)
        min_y, max_y = min(ys), max(ys)

        cjk_chars = [c for c in text if is_cjk(c)]
        if not cjk_chars:
            continue

        word_w = max_x - min_x
        word_h = max_y - min_y
        is_vertical = word_h > word_w * 1.5
        n = len(cjk_chars)

        for i, char in enumerate(cjk_chars):
            if is_vertical:
                char_h = word_h / n
                cy_start = min_y + i * char_h
                cy_end = cy_start + char_h
                bbox = [
                    {"x": min_x / page_width, "y": cy_start / page_height},
                    {"x": max_x / page_width, "y": cy_start / page_height},
                    {"x": max_x / page_width, "y": cy_end / page_height},
                    {"x": min_x / page_width, "y": cy_end / page_height},
                ]
            else:
                char_w = word_w / n
                cx_start = min_x + i * char_w
                cx_end = cx_start + char_w
                bbox = [
                    {"x": cx_start / page_width, "y": min_y / page_height},
                    {"x": cx_end / page_width, "y": min_y / page_height},
                    {"x": cx_end / page_width, "y": max_y / page_height},
                    {"x": cx_start / page_width, "y": max_y / page_height},
                ]

            spatial_data.append({
                "text": char,
                "bbox": bbox,
                "confidence": confidence,
                "offset": 0,
            })

    # Deduplicate nearby chars
    deduped = []
    for c in spatial_data:
        cx = (c["bbox"][0]["x"] + c["bbox"][2]["x"]) / 2
        cy = (c["bbox"][0]["y"] + c["bbox"][2]["y"]) / 2
        is_dupe = any(
            abs(cx - (p["bbox"][0]["x"] + p["bbox"][2]["x"]) / 2) < 0.01
            and abs(cy - (p["bbox"][0]["y"] + p["bbox"][2]["y"]) / 2) < 0.01
            for p in deduped if p.get("bbox")
        )
        if not is_dupe:
            deduped.append(c)

    off = 0
    for c in deduped:
        c["offset"] = off
        off += len(c["text"])

    return deduped


@app.route("/ocr", methods=["POST"])
def ocr():
    lang = request.form.get("lang", "chinese_cht")

    if "image" not in request.files:
        return jsonify({"error": "No image file provided"}), 400

    file = request.files["image"]
    img_bytes = file.read()

    img = Image.open(io.BytesIO(img_bytes))
    page_width, page_height = img.size

    with tempfile.NamedTemporaryFile(suffix=".jpg", delete=False) as tmp:
        tmp.write(img_bytes)
        tmp_path = tmp.name

    try:
        ocr_engine = get_paddle_ocr(lang)
        result = ocr_engine.ocr(tmp_path, cls=False)
        spatial_data = build_spatial_data(result, page_width, page_height)
        raw_text = "".join(c["text"] for c in spatial_data)

        print(f"OCR complete: {len(spatial_data)} characters detected")

        return jsonify({
            "spatialData": spatial_data,
            "rawText": raw_text,
            "pageWidth": page_width,
            "pageHeight": page_height,
        })
    except Exception as e:
        traceback.print_exc()
        return jsonify({"error": str(e)}), 500
    finally:
        os.unlink(tmp_path)


@app.route("/health", methods=["GET"])
def health():
    return jsonify({"status": "ok"})


if __name__ == "__main__":
    print("Starting PaddleOCR server on http://localhost:5555")
    print("Using PaddleOCR v2 API")
    app.run(host="0.0.0.0", port=5555, debug=False)
