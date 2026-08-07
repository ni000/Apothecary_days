import os
from PIL import Image

files = ['apothecary_down.png', 'apothecary_left.png', 'apothecary_right.png', 'apothecary_up.png']
for f in files:
    path = os.path.join(r"c:\Users\ADMIN\OneDrive\Desktop\pharma game\Apothecary_days", f)
    if not os.path.exists(path):
        continue
    img = Image.open(path).convert('RGBA')
    w, h = img.size
    
    # Let's find the greatest common divisor of the run-lengths of identical colors along rows/columns
    # to estimate the pixel scale of the image itself.
    run_lengths = []
    for y in range(h):
        current_color = None
        run_len = 0
        for x in range(w):
            color = img.getpixel((x, y))
            # if alpha is 0, let's treat it as transparent color
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
            
    # Find unique run lengths
    unique_runs = sorted(list(set(run_lengths)))
    print(f"{f}: unique horizontal run lengths: {unique_runs[:15]}")
