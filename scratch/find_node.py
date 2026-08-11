import os

search_paths = [
    r"C:\Program Files\nodejs",
    r"C:\Program Files (x86)\nodejs",
    os.path.expanduser(r"~\AppData\Local\Programs"),
    os.path.expanduser(r"~\AppData\Roaming\npm"),
    os.path.expanduser(r"~\AppData\Local\nvm"),
]

for p in search_paths:
    if os.path.exists(p):
        print("Found dir:", p)
        for root, dirs, files in os.walk(p):
            if "node.exe" in files:
                print("Found node.exe at:", os.path.join(root, "node.exe"))
