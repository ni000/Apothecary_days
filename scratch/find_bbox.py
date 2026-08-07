import os
from PIL import Image

workspace_dir = r'c:\Users\ADMIN\OneDrive\Desktop\pharma game\Apothecary_days'
brain_dir = r'C:\Users\ADMIN\.gemini\antigravity-ide\brain\8a1fb18a-e2a6-48b7-85d6-935e93e6c74f'

old_files = ['apothecary_left.png', 'apothecary_up.png', 'apothecary_right.png', 'apothecary_down.png']
new_files = [
    'media__1786121741219.png', # left
    'media__1786121758039.png', # up (back)
    'media__1786121776643.png', # right
    'media__1786121803159.png'  # down (front)
]

def get_old_bbox(img_path):
    img = Image.open(img_path).convert('RGBA')
    w, h = img.size
    min_x, min_y = w, h
    max_x, max_y = -1, -1
    for y in range(h):
        for x in range(w):
            r, g, b, a = img.getpixel((x, y))
            if a > 0: # Non-transparent
                if x < min_x: min_x = x
                if y < min_y: min_y = y
                if x > max_x: max_x = x
                if y > max_y: max_y = y
    if max_x == -1:
        return None
    return (min_x, min_y, max_x, max_y, max_x - min_x + 1, max_y - min_y + 1)

def get_new_bbox(img_path, bg_color=(38, 38, 38), tolerance=15):
    img = Image.open(img_path).convert('RGBA')
    w, h = img.size
    min_x, min_y = w, h
    max_x, max_y = -1, -1
    for y in range(h):
        for x in range(w):
            color = img.getpixel((x, y))
            dist = sum(abs(c1 - c2) for c1, c2 in zip(color[:3], bg_color[:3]))
            if dist > tolerance: # Character pixel
                if x < min_x: min_x = x
                if y < min_y: min_y = y
                if x > max_x: max_x = x
                if y > max_y: max_y = y
    if max_x == -1:
        return None
    return (min_x, min_y, max_x, max_y, max_x - min_x + 1, max_y - min_y + 1)

print("--- OLD IMAGES ---")
for f in old_files:
    p = os.path.join(workspace_dir, f)
    bbox = get_old_bbox(p)
    if bbox:
        print(f"{f}: bbox={bbox[:4]} (width={bbox[4]}, height={bbox[5]})")

print("\n--- NEW IMAGES ---")
for f in new_files:
    p = os.path.join(brain_dir, f)
    bbox = get_new_bbox(p)
    if bbox:
        print(f"{f}: bbox={bbox[:4]} (width={bbox[4]}, height={bbox[5]})")
