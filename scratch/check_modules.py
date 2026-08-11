with open(r"c:\Users\ADMIN\OneDrive\Desktop\pharma game\Apothecary_days\main.js", "r", encoding="utf-8") as f:
    code = f.read()

import_lines = [line for line in code.splitlines() if line.strip().startswith("import ") or line.strip().startswith("export ")]
print(f"Import/Export lines count: {len(import_lines)}")
for line in import_lines[:10]:
    print(line)
