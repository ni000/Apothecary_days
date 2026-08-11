import urllib.request
import os

urls = [
    "https://raw.githubusercontent.com/Regarrzo/roguegame/master/alagard.ttf",
    "https://raw.githubusercontent.com/df-lib/df-lib/master/fonts/alagard.ttf",
    "https://raw.githubusercontent.com/Atsuhiro/Unicorn-Quest/master/assets/Font/alagard.ttf",
    "https://raw.githubusercontent.com/QuebleGameDev/Godot---2D-Interaction/main/alagard.ttf",
]

dest = r"c:\Users\ADMIN\OneDrive\Desktop\pharma game\Apothecary_days\alagard.ttf"

downloaded = False
for url in urls:
    try:
        print(f"Trying url: {url}")
        req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0'})
        with urllib.request.urlopen(req) as response:
            if response.status == 200:
                data = response.read()
                # Check that it's a valid TTF (usually starts with \x00\x01\x00\x00 or OTTO)
                if len(data) > 1000 and (data.startswith(b'\x00\x01\x00\x00') or data.startswith(b'OTTO')):
                    with open(dest, "wb") as f:
                        f.write(data)
                    print(f"Successfully downloaded to {dest} ({len(data)} bytes)!")
                    downloaded = True
                    break
                else:
                    print("Invalid file header or too small.")
    except Exception as e:
        print(f"Failed: {e}")

if not downloaded:
    print("Could not download from any of the github repos.")
