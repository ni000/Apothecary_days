import urllib.request
try:
    with urllib.request.urlopen("http://localhost:8000/index.html") as response:
        html = response.read().decode('utf-8')
        print(f"Status: {response.status}")
        print(f"Length: {len(html)}")
        print(html[:200])
except Exception as e:
    print(f"Error: {e}")
