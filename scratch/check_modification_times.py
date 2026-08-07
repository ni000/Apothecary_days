import os
import time

files = os.listdir(r"c:\Users\ADMIN\OneDrive\Desktop\pharma game\Apothecary_days")
for f in files:
    if f.endswith('.png'):
        path = os.path.join(r"c:\Users\ADMIN\OneDrive\Desktop\pharma game\Apothecary_days", f)
        mtime = os.path.getmtime(path)
        size = os.path.getsize(path)
        print(f"{f}: size={size}, mtime={time.ctime(mtime)}")
