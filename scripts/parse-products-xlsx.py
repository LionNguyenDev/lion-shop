"""
Parse products-list.xlsx -> scripts/products-import.json

Chỉ trích những cột map được sang schema Product (models/Product.ts):
  name          <- B  "Tên sản phẩm"
  sellingPrice  <- K  "Giá bán"
  originalPrice <- M  "Giá vốn"
  brand         <- H  "Danh mục" (thực chất là tên hãng; trống -> "")
  type          <- ""  (file không có cột tương ứng)
  image         <- V  "Ảnh sản phẩm" (trống -> placeholder)
  stockHN       <- 0
  stockQB       <- T  "Tồn kho" (dồn toàn bộ tồn kho vào kho Quảng Bình)
  stockSG       <- 0

Dùng thư viện chuẩn (zipfile + ElementTree) nên không cần openpyxl/pandas.
Chạy:  python scripts/parse-products-xlsx.py
"""

import json
import re
import zipfile
from pathlib import Path
from xml.etree import ElementTree as ET

NS = "{http://schemas.openxmlformats.org/spreadsheetml/2006/main}"
ROOT = Path(__file__).resolve().parent.parent
XLSX = ROOT / "products-list.xlsx"
OUT = ROOT / "scripts" / "products-import.json"
PLACEHOLDER = "/placeholder-product.svg"


def col_letter(ref: str) -> str:
    return re.match(r"([A-Z]+)", ref).group(1)


def load_shared_strings(z: zipfile.ZipFile) -> list[str]:
    if "xl/sharedStrings.xml" not in z.namelist():
        return []
    root = ET.fromstring(z.read("xl/sharedStrings.xml"))
    return ["".join(t.text or "" for t in si.iter(f"{NS}t")) for si in root.findall(f"{NS}si")]


def parse_row(row, shared) -> dict:
    cells = {}
    for c in row.findall(f"{NS}c"):
        col = col_letter(c.get("r"))
        t = c.get("t")
        v = c.find(f"{NS}v")
        inline = c.find(f"{NS}is")
        if t == "s" and v is not None:
            val = shared[int(v.text)]
        elif inline is not None:
            val = "".join(x.text or "" for x in inline.iter(f"{NS}t"))
        elif v is not None:
            val = v.text
        else:
            val = ""
        cells[col] = val
    return cells


def to_number(s: str) -> float | int:
    s = (s or "").strip()
    if not s:
        return 0
    try:
        f = float(s)
        return int(f) if f.is_integer() else f
    except ValueError:
        return 0


def main() -> None:
    z = zipfile.ZipFile(XLSX)
    shared = load_shared_strings(z)
    sheet = ET.fromstring(z.read("xl/worksheets/sheet1.xml"))
    rows = sheet.find(f"{NS}sheetData").findall(f"{NS}row")

    records = []
    skipped_no_name = 0
    placeholder_count = 0
    brand_count = 0

    for row in rows[1:]:  # bỏ header
        c = parse_row(row, shared)
        name = (c.get("B", "") or "").strip()
        if not name:
            skipped_no_name += 1
            continue

        image = (c.get("V", "") or "").strip()
        if not image:
            image = PLACEHOLDER
            placeholder_count += 1

        brand = (c.get("H", "") or "").strip()
        if brand:
            brand_count += 1

        records.append({
            "name": name,
            "brand": brand,
            "type": "",
            "sellingPrice": to_number(c.get("K", "")),
            "originalPrice": to_number(c.get("M", "")),
            "image": image,
            "stockHN": 0,
            "stockQB": to_number(c.get("T", "")),
            "stockSG": 0,
        })

    OUT.write_text(json.dumps(records, ensure_ascii=False, indent=2), encoding="utf-8")

    print(f"Đã ghi {len(records)} sản phẩm -> {OUT}")
    print(f"  - Bỏ qua (không có tên): {skipped_no_name}")
    print(f"  - Có brand (từ cột Danh mục): {brand_count}")
    print(f"  - Dùng ảnh placeholder: {placeholder_count}")


if __name__ == "__main__":
    main()
