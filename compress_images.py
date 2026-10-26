"""Shrinks big photos so the site loads fast. Run once:  python compress_images.py <folder>"""
import sys, shutil
from pathlib import Path
from PIL import Image, ImageOps

folder = Path(sys.argv[1] if len(sys.argv) > 1 else ".")
MAX_WIDTH, QUALITY, ONLY_IF_BIGGER_THAN = 1600, 78, 250 * 1024
backup = folder / "_original_backup"
backup.mkdir(exist_ok=True)
saved = 0
for p in sorted(folder.glob("*")):
    if p.suffix.lower() not in (".jpg", ".jpeg") or p.stat().st_size <= ONLY_IF_BIGGER_THAN:
        continue
    before = p.stat().st_size
    shutil.copy2(p, backup / p.name)
    img = ImageOps.exif_transpose(Image.open(p)).convert("RGB")
    if img.width > MAX_WIDTH:
        img = img.resize((MAX_WIDTH, round(img.height * MAX_WIDTH / img.width)), Image.LANCZOS)
    img.save(p, "JPEG", quality=QUALITY, optimize=True, progressive=True)
    after = p.stat().st_size
    saved += before - after
    print(f"{p.name}: {before//1024} KB -> {after//1024} KB")
print(f"Done. Saved {saved/1024/1024:.1f} MB. Originals are in {backup}")