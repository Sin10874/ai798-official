#!/usr/bin/env python3
"""
使用 Pillow 直接创建简单的 favicon PNG 文件
"""

from PIL import Image, ImageDraw, ImageFont
import os

def create_favicon_png(size, filename):
    """创建指定尺寸的 favicon PNG"""
    # 创建图像
    img = Image.new('RGB', (size, size), color='#0B0B0E')
    draw = ImageDraw.Draw(img)
    
    # 绘制红色方块（居中）
    square_size = int(size * 0.5)  # 方块大小为图片的50%
    margin = (size - square_size) // 2
    draw.rectangle([margin, margin, margin + square_size, margin + square_size], 
                   fill='#EB1000')
    
    # 尝试添加文字 "798"
    try:
        # 尝试使用系统字体
        font_size = int(size * 0.35)
        # macOS 系统字体路径
        font_paths = [
            '/System/Library/Fonts/Supplemental/Arial Bold.ttf',
            '/System/Library/Fonts/Helvetica.ttc',
            '/Library/Fonts/Arial.ttf',
        ]
        
        font = None
        for font_path in font_paths:
            if os.path.exists(font_path):
                try:
                    font = ImageFont.truetype(font_path, font_size)
                    break
                except:
                    continue
        
        if font:
            text = "798"
            # 获取文字尺寸
            bbox = draw.textbbox((0, 0), text, font=font)
            text_width = bbox[2] - bbox[0]
            text_height = bbox[3] - bbox[1]
            
            # 居中绘制文字
            x = (size - text_width) // 2
            y = (size - text_height) // 2 - bbox[1]
            draw.text((x, y), text, fill='white', font=font)
    except Exception as e:
        print(f"  警告: 无法添加文字 ({e})，只显示红色方块")
    
    # 保存
    img.save(filename, 'PNG')
    print(f"✓ 已创建 {filename} ({size}x{size})")
    return True

def create_ico(png_files, ico_path):
    """从多个 PNG 创建 ICO 文件"""
    try:
        images = []
        for png_path in png_files:
            if os.path.exists(png_path):
                img = Image.open(png_path)
                images.append((img.size[0], img.size[1], img))
        
        if images:
            # 保存为 ICO（包含多个尺寸）
            images[0][2].save(ico_path, format='ICO', sizes=[(img[0], img[1]) for img in images])
            print(f"✓ 已创建 {ico_path}")
            return True
        else:
            print(f"✗ 没有找到 PNG 文件来创建 ICO")
            return False
    except Exception as e:
        print(f"✗ 创建 {ico_path} 失败: {e}")
        return False

def main():
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
        create_favicon_png(size, filename)
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
            file_size = os.path.getsize(filename)
            print(f"  - {filename} ({file_size} bytes)")

if __name__ == "__main__":
    main()

