with open(r"c:\Users\ADMIN\OneDrive\Desktop\pharma game\Apothecary_days\main.js", "r", encoding="utf-8") as f:
    lines = f.readlines()

print("Top-level document.getElementById calls:")
for i, line in enumerate(lines):
    if "document.getElementById" in line or "document.querySelector" in line:
        # Check if inside a function or top level
        # Rough check: line indentation
        indent = len(line) - len(line.lstrip())
        if indent == 0:
            print(f"Line {i+1}: {line.strip()}")
