with open(r"c:\Users\ADMIN\OneDrive\Desktop\pharma game\Apothecary_days\main.js", "r", encoding="utf-8") as f:
    lines = f.readlines()

targets = ['lets-make-btn', 'unacquire-link', 'manuscript-unacquire-link']

for i, line in enumerate(lines):
    for target in targets:
        if target in line:
            print(f"Line {i+1}: {line.strip()}")
