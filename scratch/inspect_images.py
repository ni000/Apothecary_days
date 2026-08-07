import os
from PIL import Image

files = os.listdir(r"c:\Users\ADMIN\OneDrive\Desktop\pharma game\Apothecary_days")
for f in files:
    if f.endswith('.png'):
        path = os.path.join(r"c:\Users\ADMIN\OneDrive\Desktop\pharma game\Apothecary_days", f)
        img = Image.open(path)
        print(f"{f}: size={img.size}, format={img.format}, mode={img.mode}")
