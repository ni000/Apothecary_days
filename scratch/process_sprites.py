import os
from PIL import Image

brain_dir = r'C:\Users\ADMIN\.gemini\antigravity-ide\brain\8a1fb18a-e2a6-48b7-85d6-935e93e6c74f'
temp_out_dir = os.path.join(brain_dir, 'scratch', 'temp_sprites')
os.makedirs(temp_out_dir, exist_ok=True)

# Map our files to the respective direction
files_map = {
    'left': 'media__1786121741219.png',
    'up': 'media__1786121758039.png',
    'right': 'media__1786121776643.png',
    'down': 'media__1786121803159.png'
}

def flood_fill_bg(img, bg_color=(38, 38, 38), tolerance=20):
    img = img.convert('RGBA')
    w, h = img.size
    data = img.load()
    
    visited = set()
    queue = []
    
    # Add border pixels
    for x in range(w):
        queue.append((x, 0))
        queue.append((x, h-1))
    for y in range(1, h-1):
        queue.append((0, y))
        queue.append((w-1, y))
        
    for p in queue:
        visited.add(p)
        
    # Queue processing
    idx = 0
    while idx < len(queue):
        cx, cy = queue[idx]
        idx += 1
        
        r, g, b, a = data[cx, cy]
        dist = abs(r - bg_color[0]) + abs(g - bg_color[1]) + abs(b - bg_color[2])
        
        if dist <= tolerance:
            data[cx, cy] = (0, 0, 0, 0)
            
            for dx, dy in [(-1, 0), (1, 0), (0, -1), (0, 1)]:
                nx, ny = cx + dx, cy + dy
                if 0 <= nx < w and 0 <= ny < h:
                    if (nx, ny) not in visited:
                        visited.add((nx, ny))
                        queue.append((nx, ny))
                        
    return img

def get_bbox(img):
    w, h = img.size
    min_x, min_y = w, h
    max_x, max_y = -1, -1
    for y in range(h):
        for x in range(w):
            _, _, _, a = img.getpixel((x, y))
            if a > 0: # Non-transparent
                if x < min_x: min_x = x
                if y < min_y: min_y = y
                if x > max_x: max_x = x
                if y > max_y: max_y = y
    if max_x == -1:
        return None
    return (min_x, min_y, max_x, max_y)

for direction, filename in files_map.items():
    p = os.path.join(brain_dir, filename)
    if not os.path.exists(p):
        print(f"File not found for {direction}: {filename}")
        continue
    
    img = Image.open(p)
    # 1. Clear background
    img_transparent = flood_fill_bg(img)
    # 2. Get bbox
    bbox = get_bbox(img_transparent)
    if bbox:
        # 3. Crop
        img_cropped = img_transparent.crop(bbox)
        # 4. Save
        out_p = os.path.join(temp_out_dir, f'apothecary_{direction}.png')
        img_cropped.save(out_p, 'PNG')
        print(f"Processed {direction}: cropped from {img.size} to {img_cropped.size}, saved to {out_p}")
    else:
        print(f"Failed to find bbox for {direction}")
