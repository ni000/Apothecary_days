with open(r"c:\Users\ADMIN\OneDrive\Desktop\pharma game\Apothecary_days\main.js", "r", encoding="utf-8") as f:
    lines = f.readlines()

print("Searching for start button, event listeners, or click handlers:")
for i, line in enumerate(lines):
    l = line.lower()
    if "start" in l or "click" in l or "addeventlistener" in l or "state" in l:
        if "start" in l or "click" in l:
            print(f"Line {i+1}: {line.strip()}")
