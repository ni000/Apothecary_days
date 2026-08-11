with open(r"c:\Users\ADMIN\OneDrive\Desktop\pharma game\Apothecary_days\main.js", "r", encoding="utf-8") as f:
    lines = f.readlines()

for i, line in enumerate(lines):
    if "player" in line and ("const " in line or "let " in line or "var " in line):
        print(f"Line {i+1}: {line.strip()}")
