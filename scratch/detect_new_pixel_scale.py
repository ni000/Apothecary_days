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
        continue
    img = Image.open(p).convert('RGBA')
    w, h = img.size
    
    # Run lengths of identical colors
    run_lengths = []
    for y in range(h):
        current_color = None
        run_len = 0
        for x in range(w):
            color = img.getpixel((x, y))
            if color[3] == 0:
                color = (0,0,0,0)
            if color == current_color:
                run_len += 1
            else:
                if current_color is not None and run_len > 0:
                    run_lengths.append(run_len)
                current_color = color
                run_len = 1
        if run_len > 0:
            run_lengths.append(run_len)
            
    unique_runs = sorted(list(set(run_lengths)))
    print(f"{filename}: unique horizontal run lengths: {unique_runs[:15]}")
