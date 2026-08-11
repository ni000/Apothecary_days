with open(r"c:\Users\ADMIN\OneDrive\Desktop\pharma game\Apothecary_days\main.js", "r", encoding="utf-8") as f:
    code = f.read()

import re

# Find all document.getElementById and document.querySelector calls in main.js
ids_in_js = set(re.findall(r"document\.getElementById\(['\"]([^'\"]+)['\"]\)", code))
print("IDs referenced in main.js:", ids_in_js)

with open(r"c:\Users\ADMIN\OneDrive\Desktop\pharma game\Apothecary_days\index.html", "r", encoding="utf-8") as f:
    html = f.read()

ids_in_html = set(re.findall(r'id=["\']([^"\']+)["\']', html))

missing_ids = ids_in_js - ids_in_html
print("Missing IDs in index.html:", missing_ids)
