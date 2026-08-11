with open(r"c:\Users\ADMIN\OneDrive\Desktop\pharma game\Apothecary_days\main.js", "r", encoding="utf-8") as f:
    lines = f.readlines()

for i, line in enumerate(lines):
    if "startBtn" in line or "exteriorBg" in line or "interiorBg" in line or "start-btn" in line:
        print(f"Line {i+1}: {line.strip()}")
