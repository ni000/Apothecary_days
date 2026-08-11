import os
from PIL import Image

# Input and output paths
base_image_path = r"C:\Users\ADMIN\.gemini\antigravity-ide\brain\fc43da67-87e5-42bc-bce3-d4a2c827b7dc\apothecary_booth_base_1786171910292.png"
workspace_gif_path = r"c:\Users\ADMIN\OneDrive\Desktop\pharma game\Apothecary_days\apothecary_booth.gif"
artifact_gif_path = r"C:\Users\ADMIN\.gemini\antigravity-ide\brain\fc43da67-87e5-42bc-bce3-d4a2c827b7dc\apothecary_booth.gif"

# Load base image and scale to 512x512 using nearest neighbor for retro pixel art feel
img = Image.open(base_image_path).convert('RGB')
img_resized = img.resize((512, 512), Image.NEAREST)
w, h = img_resized.size

# Light source centers in 512x512 space
left_light = (119, 143)   # Lamppost
right_light = (347, 280)  # Booth/sign

# 8-frame flicker intensities
left_intensities = [1.00, 0.94, 1.06, 0.97, 1.03, 0.90, 1.05, 0.98]
right_intensities = [0.96, 1.05, 0.92, 1.08, 0.95, 1.03, 0.90, 1.02]

# Firefly starting coordinates and velocities (x, y, dx, dy)
# They hover in dark foliage/sky areas
fireflies = [
    {"x": 60,  "y": 100, "dx": 2.5, "dy": -1.2, "color": (190, 255, 80)},
    {"x": 250, "y": 70,  "dx": -1.8, "dy": 1.5,  "color": (210, 255, 90)},
    {"x": 420, "y": 120, "dx": -2.2, "dy": -2.0, "color": (180, 255, 70)},
    {"x": 160, "y": 50,  "dx": 1.5,  "dy": 2.2,  "color": (200, 255, 80)},
    {"x": 310, "y": 140, "dx": 2.0,  "dy": -1.5, "color": (190, 255, 90)},
    {"x": 90,  "y": 200, "dx": -1.5, "dy": 1.2,  "color": (220, 255, 100)},
]

frames = []

for frame_idx in range(8):
    # Copy the resized base image for this frame
    frame_img = img_resized.copy()
    pixels = frame_img.load()
    
    l_intensity = left_intensities[frame_idx]
    r_intensity = right_intensities[frame_idx]
    
    # 1. Apply lighting flicker
    for y in range(h):
        for x in range(w):
            r, g, b = pixels[x, y]
            
            # Distance to left lamppost
            d_left = ((x - left_light[0])**2 + (y - left_light[1])**2)**0.5
            w_left = max(0.0, 1.0 - d_left / 90.0)
            
            # Distance to right booth light
            d_right = ((x - right_light[0])**2 + (y - right_light[1])**2)**0.5
            w_right = max(0.0, 1.0 - d_right / 120.0)
            
            # Combined flicker impact
            # We scale the light fluctuation based on the distance weight
            factor = 1.0 + w_left * (l_intensity - 1.0) + w_right * (r_intensity - 1.0)
            
            # Apply factor to warm pixel colors (R > G > B)
            if factor != 1.0:
                new_r = int(min(255, max(0, r * factor)))
                new_g = int(min(255, max(0, g * factor)))
                new_b = int(min(255, max(0, b * factor)))
                pixels[x, y] = (new_r, new_g, new_b)
                
    # 2. Draw moving fireflies
    for ff in fireflies:
        # Update firefly position for this frame
        curr_x = int(ff["x"] + frame_idx * ff["dx"]) % w
        curr_y = int(ff["y"] + frame_idx * ff["dy"]) % h
        
        # Firefly glow center
        # We check bounds to ensure we don't draw outside the image
        if 0 < curr_x < w - 1 and 0 < curr_y < h - 1:
            glow_c = ff["color"]
            # Soft surrounding glow (alpha blending with existing pixels)
            surrounding = [
                (curr_x - 1, curr_y), (curr_x + 1, curr_y),
                (curr_x, curr_y - 1), (curr_x, curr_y + 1)
            ]
            for sx, sy in surrounding:
                bg_r, bg_g, bg_b = pixels[sx, sy]
                # Check if it's in a relatively dark area (so we don't glow on bright lights)
                if bg_r < 180 or bg_g < 180:
                    blend_r = int(bg_r * 0.5 + glow_c[0] * 0.5 * 0.6)
                    blend_g = int(bg_g * 0.5 + glow_c[1] * 0.5 * 0.6)
                    blend_b = int(bg_b * 0.5 + glow_c[2] * 0.5 * 0.6)
                    pixels[sx, sy] = (blend_r, blend_g, blend_b)
            
            # Bright core
            bg_r, bg_g, bg_b = pixels[curr_x, curr_y]
            blend_r = int(bg_r * 0.3 + glow_c[0] * 0.7)
            blend_g = int(bg_g * 0.3 + glow_c[1] * 0.7)
            blend_b = int(bg_b * 0.3 + glow_c[2] * 0.7)
            pixels[curr_x, curr_y] = (blend_r, blend_g, blend_b)

    frames.append(frame_img)

# Save as animated GIF
frames[0].save(
    workspace_gif_path,
    save_all=True,
    append_images=frames[1:],
    duration=150,  # 150ms per frame
    loop=0
)

# Also save to artifacts directory
frames[0].save(
    artifact_gif_path,
    save_all=True,
    append_images=frames[1:],
    duration=150,
    loop=0
)

print("GIF generated successfully at:")
print("Workspace path:", workspace_gif_path)
print("Artifact path:", artifact_gif_path)
