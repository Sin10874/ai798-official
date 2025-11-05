#!/usr/bin/env python3
"""
生成 favicon 文件（PNG 和 ICO）
需要安装: pip3 install cairosvg pillow
"""

import os
import sys

try:
    import cairosvg
    from PIL import Image
    import io
except ImportError as e:
    print(f"错误: 缺少必要的库 - {e}")
    print("请运行: pip3 install cairosvg pillow")
    sys.exit(1)

def svg_to_png(svg_path, png_path, size):
    """将 SVG 转换为 PNG"""
    try:
        cairosvg.svg2png(url=svg_path, write_to=png_path, output_width=size, output_height=size)
        print(f"✓ 已创建 {png_path} ({size}x{size})")
        return True
    except Exception as e:
        print(f"✗ 创建 {png_path} 失败: {e}")
        return False

def create_ico(png_files, ico_path):
    """从多个 PNG 创建 ICO 文件"""
    try:
        images = []
        for png_path in png_files:
            if os.path.exists(png_path):
                img = Image.open(png_path)
                images.append(img)
        
        if images:
            # 保存为 ICO（包含多个尺寸）
            images[0].save(ico_path, format='ICO', sizes=[(img.size[0], img.size[1]) for img in images])
            print(f"✓ 已创建 {ico_path}")
            return True
        else:
            print(f"✗ 没有找到 PNG 文件来创建 ICO")
            return False
    except Exception as e:
        print(f"✗ 创建 {ico_path} 失败: {e}")
        return False

def main():
    svg_path = "favicon.svg"
    
    if not os.path.exists(svg_path):
        print(f"错误: 找不到 {svg_path}")
        sys.exit(1)
    
    print("开始生成 favicon 文件...")
    print()
    
    # 生成不同尺寸的 PNG
    sizes = [
        (16, "favicon-16x16.png"),
        (32, "favicon-32x32.png"),
        (180, "apple-touch-icon.png")
    ]
    
    png_files = []
    for size, filename in sizes:
        if svg_to_png(svg_path, filename, size):
            png_files.append(filename)
    
    print()
    
    # 创建 ICO 文件（使用 16x16 和 32x32）
    ico_files = [f for f in ["favicon-16x16.png", "favicon-32x32.png"] if os.path.exists(f)]
    if ico_files:
        create_ico(ico_files, "favicon.ico")
    
    print()
    print("完成！生成的文件：")
    for filename in ["favicon-16x16.png", "favicon-32x32.png", "apple-touch-icon.png", "favicon.ico"]:
        if os.path.exists(filename):
            print(f"  - {filename}")

if __name__ == "__main__":
    main()

