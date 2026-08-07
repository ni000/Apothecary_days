from PIL import Image
import os

def find_best_grid(path):
    img = Image.open(path).convert('RGBA')
    w, h = img.size
    
    best_size = None
    min_variance = float('inf')
    
    # We test cell size from 3 to 12
    for cell_size in range(3, 12):
        gw = w // cell_size
        gh = h // cell_size
        if gw == 0 or gh == 0:
            continue
            
        cell_variance_sum = 0
        active_cells = 0
        
        for r in range(gh):
            for col in range(gw):
                # Collect colors in this cell
                rgb_vals = []
                for cy in range(cell_size):
                    for cx in range(cell_size):
                        x = col * cell_size + cx
                        y = r * cell_size + cy
                        pixel = img.getpixel((x, y))
                        if pixel[3] > 0: # Alpha > 0
                            rgb_vals.append(pixel[:3])
                
                if len(rgb_vals) > 0:
                    # Calculate mean for R, G, B
                    mean_r = sum(p[0] for p in rgb_vals) / len(rgb_vals)
                    mean_g = sum(p[1] for p in rgb_vals) / len(rgb_vals)
                    mean_b = sum(p[2] for p in rgb_vals) / len(rgb_vals)
                    
                    # Calculate variance for R, G, B
                    var_r = sum((p[0] - mean_r)**2 for p in rgb_vals) / len(rgb_vals)
                    var_g = sum((p[1] - mean_g)**2 for p in rgb_vals) / len(rgb_vals)
                    var_b = sum((p[2] - mean_b)**2 for p in rgb_vals) / len(rgb_vals)
                    
                    cell_variance_sum += (var_r + var_g + var_b) / 3
                    active_cells += 1
                    
        avg_variance = cell_variance_sum / active_cells if active_cells > 0 else float('inf')
        print(f"Cell size {cell_size}x{cell_size}: avg variance = {avg_variance:.2f}, native size = {gw}x{gh}")
        if avg_variance < min_variance:
            min_variance = avg_variance
            best_size = cell_size
            
    print(f"--> Best cell size for {os.path.basename(path)}: {best_size}x{best_size}")
    return best_size

dest_dir = 'c:/Users/ADMIN/OneDrive/Desktop/pharma game/Apothecary_days'
for f in ['apothecary_down.png', 'apothecary_left.png', 'apothecary_up.png', 'apothecary_right.png']:
    find_best_grid(os.path.join(dest_dir, f))
