import cv2
import numpy as np

# Convert RGB to HSV
rgb_color = np.uint8([[[77, 76, 156]]])  # RGB color to convert
hsv_color = cv2.cvtColor(rgb_color, cv2.COLOR_RGB2HSV)

# Extract HSV components
h = hsv_color[0][0][0]
s = hsv_color[0][0][1]
v = hsv_color[0][0][2]

print(f"Hue: {h}")
print(f"Saturation: {s}")
print(f"Value: {v}")