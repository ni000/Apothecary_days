from PIL import Image

img_path = r"C:\Users\ADMIN\.gemini\antigravity-ide\brain\fc43da67-87e5-42bc-bce3-d4a2c827b7dc\apothecary_booth_base_1786171910292.png"
img = Image.open(img_path).convert('RGB')
w, h = img.size

left_x_sum = 0
left_y_sum = 0
left_count = 0

right_x_sum = 0
right_y_sum = 0
right_count = 0

mid_x = w // 2

# Check pixels
for y in range(h):
    for x in range(w):
        r, g, b = img.getpixel((x, y))
        # Warm, bright pixels: high Red and Green, low Blue
        if r > 220 and g > 180 and b < 160:
            if x < mid_x:
                left_x_sum += x
                left_y_sum += y
                left_count += 1
            else:
                right_x_sum += x
                right_y_sum += y
                right_count += 1

print(f"Total left pixels: {left_count}")
print(f"Total right pixels: {right_count}")

if left_count > 0:
    print(f"Left light center: x={left_x_sum // left_count}, y={left_y_sum // left_count}")
if right_count > 0:
    print(f"Right light center: x={right_x_sum // right_count}, y={right_y_sum // right_count}")
