"""Shrink photos for the website (keeps quality, cuts size ~85-90%).

Usage (from the project root, with the backend venv active so Pillow is available):

    python tools/optimize_images.py "D:\\gallery-originals"
    python tools/optimize_images.py "D:\\gallery-originals" "frontend/src/assets/gallery"

- 1st argument: folder with your ORIGINAL big photos (keep this folder OUTSIDE the project).
  Sub-folders are kept, e.g. paramotor/ and parasailing/ become gallery category buttons.
- 2nd argument (optional): where to put the optimized copies. Default: frontend/src/assets/gallery
"""
import sys
from pathlib import Path
from PIL import Image, ImageOps

MAX_SIDE = 1600      # longest side in pixels - plenty for a full-screen gallery
QUALITY = 80         # JPEG quality 80 looks the same to the eye, much smaller file
EXTS = {".jpg", ".jpeg", ".png", ".webp", ".avif"}


def main():
    if len(sys.argv) < 2:
        print(__doc__)
        return 1
    src = Path(sys.argv[1])
    dst = Path(sys.argv[2]) if len(sys.argv) > 2 else Path("frontend/src/assets/gallery")
    if not src.is_dir():
        print(f"Folder not found: {src}")
        return 1

    done = before = after = 0
    for f in sorted(src.rglob("*")):
        if not f.is_file() or f.suffix.lower() not in EXTS:
            continue
        out = dst / f.relative_to(src).with_suffix(".jpg")
        out.parent.mkdir(parents=True, exist_ok=True)
        try:
            img = ImageOps.exif_transpose(Image.open(f))   # fixes phone photos that look sideways
            img = img.convert("RGB")
            img.thumbnail((MAX_SIDE, MAX_SIDE), Image.LANCZOS)
            img.save(out, "JPEG", quality=QUALITY, optimize=True, progressive=True)
        except Exception as e:  # one bad file should not stop the rest
            print(f"  skipped {f.name}: {e}")
            continue
        done += 1
        before += f.stat().st_size
        after += out.stat().st_size
        print(f"  {f.name}: {f.stat().st_size/1e6:.2f} MB -> {out.stat().st_size/1e6:.2f} MB")

    if done:
        print(f"\nDone: {done} photos, {before/1e6:.1f} MB -> {after/1e6:.1f} MB (saved {100*(1-after/before):.0f}%)")
        print(f"Optimized photos are in: {dst}")
    else:
        print("No photos found.")
    return 0


if __name__ == "__main__":
    sys.exit(main())