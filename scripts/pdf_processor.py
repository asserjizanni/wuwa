#!/usr/bin/env python3
"""
PDF to Image Processor
Uses PyMuPDF (fitz) to render PDF pages to high-quality WebP images.
Outputs JSON result to stdout.
"""

import sys
import json
import os
import traceback

def process_pdf(pdf_path: str, output_dir: str, thumbnail_dir: str, dpi: int, quality: int):
    try:
        import pymupdf as fitz
    except ImportError:
        try:
            import fitz
        except ImportError:
            return {"error": "PyMuPDF not installed. Run: pip install PyMuPDF"}

    if not os.path.exists(pdf_path):
        return {"error": f"PDF file not found: {pdf_path}"}

    os.makedirs(output_dir, exist_ok=True)
    os.makedirs(thumbnail_dir, exist_ok=True)

    try:
        doc = fitz.open(pdf_path)
    except Exception as e:
        return {"error": f"Cannot open PDF: {str(e)}"}

    if doc.page_count == 0:
        return {"error": "PDF has no pages"}

    pages = []
    mat = fitz.Matrix(dpi / 72, dpi / 72)  # 72 DPI is the PDF default

    for page_num in range(doc.page_count):
        try:
            page = doc[page_num]
            # Render with high quality
            pix = page.get_pixmap(matrix=mat, alpha=False)

            page_filename = f"page-{page_num + 1:03d}.webp"
            thumb_filename = f"page-{page_num + 1:03d}.webp"

            page_path = os.path.join(output_dir, page_filename)
            thumb_path = os.path.join(thumbnail_dir, thumb_filename)

            # Save full-size image as WebP
            pix.save(page_path, output="webp", jpg_quality=quality)

            width = pix.width
            height = pix.height

            # Generate thumbnail (max 400px wide)
            thumb_width = min(400, width)
            thumb_height = int(height * thumb_width / width)

            if thumb_width < width:
                thumb_pix = page.get_pixmap(
                    matrix=fitz.Matrix(thumb_width / (width * 72 / dpi), thumb_height / (height * 72 / dpi)),
                    alpha=False
                )
                # Use sharp ratio
                scale = thumb_width / width
                thumb_mat = fitz.Matrix(scale * dpi / 72, scale * dpi / 72)
                thumb_pix = page.get_pixmap(matrix=thumb_mat, alpha=False)
                thumb_pix.save(thumb_path, output="webp", jpg_quality=80)
            else:
                pix.save(thumb_path, output="webp", jpg_quality=80)

            pages.append({
                "page": page_num + 1,
                "path": os.path.abspath(page_path),
                "thumbPath": os.path.abspath(thumb_path),
                "width": width,
                "height": height
            })

        except Exception as e:
            return {"error": f"Failed to process page {page_num + 1}: {str(e)}"}

    doc.close()
    return {"pages": pages, "total": len(pages)}


if __name__ == "__main__":
    if len(sys.argv) < 6:
        print(json.dumps({"error": "Usage: pdf_processor.py <pdf_path> <output_dir> <thumbnail_dir> <dpi> <quality>"}))
        sys.exit(1)

    pdf_path = sys.argv[1]
    output_dir = sys.argv[2]
    thumbnail_dir = sys.argv[3]
    dpi = int(sys.argv[4])
    quality = int(sys.argv[5])

    try:
        result = process_pdf(pdf_path, output_dir, thumbnail_dir, dpi, quality)
        print(json.dumps(result))
        if "error" in result:
            sys.exit(1)
    except Exception as e:
        print(json.dumps({"error": f"Unexpected error: {str(e)}", "traceback": traceback.format_exc()}))
        sys.exit(1)
