import re

with open(r"c:\Users\ADMIN\OneDrive\Desktop\pharma game\Apothecary_days\main.js", "r") as f:
    lines = f.readlines()

for i, line in enumerate(lines):
    if "npc" in line.lower() or "customer" in line.lower():
        print(f"{i+1}: {line.strip()}")
