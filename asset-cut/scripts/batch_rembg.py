"""
批量去白底脚本

用途：对 GPT-image-1 输出的"伪透明底"图（实际是白雾/部分透明）
       做真正的透明底处理。

用法：
  python batch_rembg.py --src "源目录" --dst "输出目录"
  python batch_rembg.py --src "源目录" --dst "输出目录" --model isnet-general-use

模型选择：
  u2net              通用，默认，对真实照片最强
  u2netp             轻量版
  isnet-general-use  对插画/2D图标更友好  ← 推荐
  silueta            人物剪影专用
"""
import os
import sys
import argparse
from pathlib import Path
from PIL import Image


def process_folder(src_dir: Path, dst_dir: Path, model: str = "isnet-general-use"):
    from rembg import remove, new_session

    session = new_session(model)
    dst_dir.mkdir(parents=True, exist_ok=True)

    pngs = sorted(src_dir.glob("*.png"))
    if not pngs:
        print(f"⚠️ 源目录无PNG: {src_dir}")
        return

    print(f"\n📁 {src_dir.name}/  ({len(pngs)}张, 模型: {model})")

    for png in pngs:
        try:
            img = Image.open(png).convert("RGBA")
            result = remove(img, session=session)
            out_path = dst_dir / png.name
            result.save(out_path)
            print(f"  ✓ {png.name}")
        except Exception as e:
            print(f"  ✗ {png.name}  ({e})")

    print(f"  → 输出: {dst_dir}")


def main():
    parser = argparse.ArgumentParser(description="批量去白底")
    parser.add_argument("--src", required=True, help="源目录")
    parser.add_argument("--dst", required=True, help="输出目录")
    parser.add_argument("--model", default="isnet-general-use",
                        help="rembg 模型: u2net / u2netp / isnet-general-use / silueta")
    parser.add_argument("--recursive", action="store_true",
                        help="递归处理子目录")
    args = parser.parse_args()

    src = Path(args.src)
    dst = Path(args.dst)

    if not src.exists():
        print(f"❌ 源目录不存在: {src}")
        sys.exit(1)

    if args.recursive:
        for sub_src in [src] + [d for d in src.rglob("*") if d.is_dir()]:
            rel = sub_src.relative_to(src)
            sub_dst = dst / rel
            process_folder(sub_src, sub_dst, args.model)
    else:
        process_folder(src, dst, args.model)


if __name__ == "__main__":
    main()
