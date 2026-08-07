import os
from PIL import Image

files = ['apothecary_down.png', 'apothecary_left.png', 'apothecary_right.png', 'apothecary_up.png']
for f in files:
    path = os.path.join(r"c:\Users\ADMIN\OneDrive\Desktop\pharma game\Apothecary_days", f)
    if not os.path.exists(path):
        continue
    img = Image.open(path)
    # Check if transparent or has white background
    # Let's count colors or look at corner pixels
    pixels = img.load()
    w, h = img.size
    corners = [pixels[0,0], pixels[w-1,0], pixels[0,h-1], pixels[w-1,h-1]]
    print(f"\n{f}: corners: {corners}")
    
    # Bounding box of non-transparent (alpha > 0) and non-white (if RGB)
    bbox_alpha = img.getbbox()
    print(f"  bbox (alpha): {bbox_alpha}")
    
    # Check if there is any transparency (mode RGBA and has alpha < 255)
    has_alpha = False
    if img.mode == 'RGBA':
        for x in range(w):
            for y in range(h):
                if pixels[x,y][3] < 255:
                    has_alpha = True
                    break
            if has_alpha:
                break
    print(f"  has_alpha: {has_alpha}")
