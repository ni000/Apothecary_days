import os
from PIL import Image

brain_dir = r'C:\Users\ADMIN\.gemini\antigravity-ide\brain\8a1fb18a-e2a6-48b7-85d6-935e93e6c74f'
new_files = [
    'media__1786121741219.png', # left
    'media__1786121758039.png', # up (back)
    'media__1786121776643.png', # right
    'media__1786121803159.png'  # down (front)
]

for filename in new_files:
    p = os.path.join(brain_dir, filename)
    if not os.path.exists(p):
        print(f"File not found: {filename}")
        continue
    
    img = Image.open(p).convert('RGBA')
    w, h = img.size
    
    # Get top-left color as candidate background
    bg_color = img.getpixel((0, 0))
    print(f"\n{filename} (size {w}x{h}):")
    print(f"  Top-left background color: {bg_color}")
    
    # Let's count how many pixels have colors close to the background color
    close_colors = {}
    for y in range(h):
        for x in range(w):
            color = img.getpixel((x, y))
            # measure distance in RGB space from bg_color
            dist = sum(abs(c1 - c2) for c1, c2 in zip(color[:3], bg_color[:3]))
            if dist <= 15:
                close_colors[color] = close_colors.get(color, 0) + 1
                
    print("  Colors close to background (RGB distance <= 15):")
    for col, count in sorted(close_colors.items(), key=lambda x: x[1], reverse=True)[:10]:
        print(f"    Color {col}: {count} pixels")
