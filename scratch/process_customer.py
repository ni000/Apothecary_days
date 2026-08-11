from PIL import Image
import os

def process_sprite():
    img_path = r"C:\Users\ADMIN\.gemini\antigravity-ide\brain\225b13d2-de7c-4b61-b92a-5cee46451c69\media__1786271954303.jpg"
    img = Image.open(img_path).convert("RGBA")
    
    # Define transparent background
    bg_color = img.getpixel((0, 0))
    data = img.getdata()
    new_data = []
    for item in data:
        dist = sum(abs(item[i] - bg_color[i]) for i in range(3))
        if dist < 40:
            new_data.append((255, 255, 255, 0))
        else:
            new_data.append(item)
    img.putdata(new_data)
    
    width, height = img.size
    sprite_w = width // 4
    
    sprites = []
    max_h = 0
    
    for i in range(4):
        box = (i * sprite_w, 0, (i + 1) * sprite_w, height)
        sprite = img.crop(box)
        bbox = sprite.getbbox()
        if bbox:
            cropped = sprite.crop(bbox)
            sprites.append(cropped)
            max_h = max(max_h, cropped.size[1])
            print(f"Sprite {i} size: {cropped.size}")
        else:
            sprites.append(sprite)
            print(f"Sprite {i} empty bbox")
            
    target_h = 232
    scale = target_h / max_h
    
    max_w = max([s.size[0] for s in sprites])
    if max_w * scale > 134:
        scale = 134 / max_w
        
    print(f"Scale factor: {scale}")
        
    names = ["customer_front.png", "customer_left.png", "customer_back.png", "customer_right.png"]
    out_dir = r"C:\Users\ADMIN\OneDrive\Desktop\pharma game\Apothecary_days\public"
    
    for i, sprite in enumerate(sprites):
        new_w = int(sprite.size[0] * scale)
        new_h = int(sprite.size[1] * scale)
        resized = sprite.resize((new_w, new_h), Image.Resampling.NEAREST)
        
        canvas = Image.new("RGBA", (134, 232), (0, 0, 0, 0))
        
        x = (134 - new_w) // 2
        y = 232 - new_h
        
        canvas.paste(resized, (x, y), resized)
        canvas.save(os.path.join(out_dir, names[i]))
        print(f"Saved {names[i]}")

if __name__ == "__main__":
    process_sprite()
