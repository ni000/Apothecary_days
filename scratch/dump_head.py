with open(r"c:\Users\ADMIN\OneDrive\Desktop\pharma game\Apothecary_days\main.js", "r", encoding="utf-8") as f:
    lines = f.readlines()

for i, line in enumerate(lines[:300]):
    print(f"{i+1}: {line.rstrip()}")
