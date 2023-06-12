# import the necessary packages
import numpy as np
import cv2
import math
import configparser
import screeninfo

def euclidean_diff(p1, p2):
    return math.sqrt((p2[0] - p1[0]) ** 2 + (p2[1] - p1[1]) ** 2)

def find_closest_pairs(existing_contours, coords2):
    num_existing = len(existing_contours)
    num_new = len(coords2)
    
    if num_existing == 0 or num_new == 0:
        return ([], [i for i in range(num_existing)], [j for j in range(num_new)])
    
    dist_matrix = np.zeros((num_existing, num_new)) + np.inf
    
    for i in range(num_existing):
        for j in range(num_new):
            dist_matrix[i,j] = euclidean_diff(existing_contours[i][1], coords2[j])
    
    pairs = []
    while np.min(dist_matrix) != np.inf:
        idx = np.argmin(dist_matrix)
        i, j = np.unravel_index(idx, dist_matrix.shape)
        if i < num_existing and j < num_new:
            pairs.append((existing_contours[i][0], j))
        dist_matrix[i,:] = np.inf
        dist_matrix[:,j] = np.inf
    
    unmatched_existing = [i for i in range(num_existing) if i not in [pair[0] for pair in pairs]]
    unmatched_new = [j for j in range(num_new) if j not in [pair[1] for pair in pairs]]
    return pairs, unmatched_existing, unmatched_new


def draw_grid(screen_width, screen_height, grid_size):
    # Determine the number of grid cells based on the screen resolution and grid size
    num_columns = int(screen_width / grid_size)
    num_rows = int(screen_height / grid_size)

    # Calculate the actual width and height of the grid image
    width = num_columns * grid_size
    height = num_rows * grid_size

    # Create a blank image with white background
    image = np.ones((height, width, 3), dtype=np.uint8) * 255

    # Draw vertical lines
    for x in range(0, width, grid_size):
        cv2.line(image, (x, 0), (x, height), (0, 0, 0), 1)

    # Draw horizontal lines
    for y in range(0, height, grid_size):
        cv2.line(image, (0, y), (width, y), (0, 0, 0), 1)

    return image

def draw_chessboard(screen_width, screen_height, grid_size):
    # Determine the number of grid cells based on the screen resolution and grid size
    num_columns = int(screen_width / grid_size)
    num_rows = int(screen_height / grid_size)

    # Calculate the actual width and height of the grid image
    width = num_columns * grid_size
    height = num_rows * grid_size

    # Create a blank image with white background
    image = np.ones((height, width, 3), dtype=np.uint8) * 255

    # Draw alternating black and white squares
    for i in range(num_rows):
        for j in range(num_columns):
            if (i + j) % 2 == 0:
                color = (0, 0, 0)  # Black square
            else:
                color = (255, 255, 255)  # White square

            x1 = j * grid_size
            y1 = i * grid_size
            x2 = x1 + grid_size
            y2 = y1 + grid_size

            cv2.rectangle(image, (x1, y1), (x2, y2), color, -1)

    return image


def draw_circle(screen_width, screen_height, radius):
    # Create a blank image with white background
    image = np.ones((screen_height, screen_width, 3), dtype=np.uint8) * 255

    # Calculate the center coordinates
    center_x = int(screen_width / 2)
    center_y = int(screen_height / 2)

    # Draw a circle on the image
    cv2.circle(image, (center_x, center_y), radius, (0, 0, 255), -1)

    return image

def combine_close_contours(contours, distance_threshold):
    combined_contours = []
    centers = []
    
    for contour in contours:
        # Find the minimum enclosing circle for the contour
        ((center_x, center_y), radius) = cv2.minEnclosingCircle(contour)
        
        # Check the distance between the current center and existing centers
        should_combine = False
        for existing_center in centers:
            distance = np.sqrt((center_x - existing_center[0])**2 + (center_y - existing_center[1])**2)
            if distance < distance_threshold:
                should_combine = True
                break
        
        # Combine contours if needed
        if should_combine:
            combined_contours[-1] = np.concatenate((combined_contours[-1], contour))
        else:
            combined_contours.append(contour)
            centers.append((center_x, center_y))
    
    return combined_contours

def get_displacement(data):
     # Convert the image to HSV color space
    hsv = cv2.cvtColor(data, cv2.COLOR_BGR2HSV)

    # Define the lower and upper range for red color in HSV
    lower_red = np.array([120, 130, 100])
    upper_red = np.array([180, 150, 180])

    # Threshold the image to get a binary mask of red regions
    mask = cv2.inRange(hsv, lower_red, upper_red)
    cv2.imshow(mask)
    # Perform morphological operations to clean up the mask
    kernel = cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (5, 5))
    mask = cv2.morphologyEx(mask, cv2.MORPH_OPEN, kernel)
    # Find contours in the binary mask
    contours, _ = cv2.findContours(mask, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
    data_render = data.astype(np.uint8)
    # Iterate over the contours and find enclosing circles
    distance_threshold = 50 # Adjust this value based on your requirements
    combined_contours = combine_close_contours(contours, distance_threshold)
    for contour in combined_contours:
        # Find the minimum enclosing circle for the contour
        ((center_x, center_y), radius) = cv2.minEnclosingCircle(contour)
        
        # Filter circles based on size or other criteria
        if radius > 5: 
            horizontal_displacement = 320 - int(center_x)
            vertical_displacement = 240 - int(center_y) + 10 
            return horizontal_displacement, vertical_displacement
    return None, None

def get_transformation(data):
        img = data.astype(np.uint8)
        ### calculate where the centre of the circle is
        ### calculate the edges of the area
        gray = cv2.cvtColor(data, cv2.COLOR_BGR2GRAY)
        gray = cv2.GaussianBlur(gray, (5, 5), 0)
        (minVal, maxVal, minLoc, maxLoc) = cv2.minMaxLoc(gray)
        ret,thresh = cv2.threshold(gray,maxVal-70,255,0)
        contours,hierarchy = cv2.findContours(thresh, 1, 2)

        # Find the largest contour
        largest_area = 0
        largest_contour = None
        for contour in contours:
            area = cv2.contourArea(contour)
            if area > largest_area:
                largest_area = area
                largest_contour = contour
        # Approximate the largest contour as a rectangle
        if largest_contour is not None:
            rect = cv2.minAreaRect(largest_contour)
            box = cv2.boxPoints(rect)
            box = np.int0(box)
            # Draw the rectangle
            cv2.drawContours(img, [box], 0, (0, 255, 0), 3)
            # cv2.putText(img, 'Rectangle', (box[0][0], box[0][1]), cv2.FONT_HERSHEY_SIMPLEX, 0.6, (0, 255, 0), 2)
            cv2.imshow('Detected Area', img)
            # Extracting the x and y coordinates of the top-left corner
            top_left_corner = box[1]  
            bottom_right_corner = box[3]  # Assuming the bottom-right corner is the third element in the 'box' array

            # Calculating the width and height
            width = abs(bottom_right_corner[0] - top_left_corner[0])
            height = abs(bottom_right_corner[1] - top_left_corner[1])
            target_x = (0, 640)
            target_y = (0, 400)
            min_x = min(box, key=lambda c: c[0])[0]
            max_x = max(box, key=lambda c: c[0])[0]
            min_y = min(box, key=lambda c: c[1])[1]
            max_y = max(box, key=lambda c: c[1])[1]
            
            width = max_x - min_x
            height = max_y - min_y
            
            scale_factor_x = (target_x[1] - target_x[0]) / width
            scale_factor_y = (target_y[1] - target_y[0]) / height
            
            displacement_x = -min_x * scale_factor_x + target_x[0]
            displacement_y = -min_y * scale_factor_y + target_y[0] + 40
            return displacement_x, displacement_y, scale_factor_x, scale_factor_y, width, height, min_x, min_y

def show_working_area(colorFrame, size):
    # shows a plain image of the background
    data = colorFrame.data()
    colorWidth = colorFrame.width()
    colorHeight = colorFrame.height()
    if size != 0:
        data.resize((colorHeight, colorWidth, 3))
        data = cv2.cvtColor(data, cv2.COLOR_BGR2RGB) 
        # mirror image
        data = np.flip(data, 1)
        data = np.flip(data, 0)
        cv2.imshow('Working Area', data)

def project_calib(window_name):
    screen = screeninfo.get_monitors()[1]
    screen_width, screen_height = screen.width, screen.height
    radius = 50
    # Generate a circle to be shown in the centre of the projection
    grid = draw_circle(screen_width, screen_height, radius)
    # Resize the grid image to the full screen
    grid = cv2.resize(grid, (screen_width, screen_height))
    cv2.imshow(window_name, grid)
    cv2.moveWindow(window_name, screen.x, screen.y)
    
    cv2.imshow(window_name, grid)


    # This function works less well compared to automatically finding the boundary
def select_valid_area(event, x, y, filteredData, flags, param):
    if event == cv2.EVENT_LBUTTONDOWN:
        # Get the pixel depth value at the clicked point
        pixel_value = filteredData[y, x]
        # Create a binary mask with the same shape as the input image
        mask = np.zeros(filteredData.shape[:2], dtype=np.uint8)
        # Create a queue for BFS
        queue = [(y, x)]

        # Define 4-connectivity neighbors
        neighbors = [(0, -1), (0, 1), (-1, 0), (1, 0)]

        # Perform BFS
        while len(queue) > 0:
            # Get the next pixel from the queue
            current_pixel = queue.pop(0)
            row, col = current_pixel

            # Mark the pixel in the mask
            mask[row, col] = 255

            # Check neighbors
            for neighbor in neighbors:
                row_n = row + neighbor[0]
                col_n = col + neighbor[1]

                # Check if neighbor is within the image boundaries
                if 0 <= row_n < filteredData.shape[0] and 0 <= col_n < filteredData.shape[1]:
                    # Check if neighbor has the same value as the clicked pixel
                    if np.array_equal(filteredData[row_n, col_n], pixel_value) and mask[row_n, col_n] == 0:
                        # Add neighbor to the queue
                        queue.append((row_n, col_n))

        # Draw a boundary around the selected area
        contours, _ = cv2.findContours(mask, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
        cv2.drawContours(filteredData, contours, -1, (0, 255, 0), 2)
        cv2.imshow('Selected Area', filteredData)

################################################################
########## Overwriting config details with new info ############
################################################################
def write_circle_to_config(config_path, depth, radius):
    config = configparser.ConfigParser()
    config.read(config_path)
    try: 
        config.set('CIRCLE_DETAILS', 'OBJECT_DEPTH', str(depth))
    except configparser.NoSectionError:       
        config.add_section("CIRCLE_DETAILS")
    config.set('CIRCLE_DETAILS', 'OBJECT_DEPTH', str(20))
    config.set('CIRCLE_DETAILS', 'MAX_RADIUS', str(int(radius+3)))
    config.set('CIRCLE_DETAILS', 'MIN_RADIUS', str(int(radius-7)))
    with open(config_path, 'w') as config_file:
        config.write(config_file)

def write_transformation_to_config(config_path, disp_x, disp_y, sf_x, sf_y, w, h, x, y ):
    config = configparser.ConfigParser()
    config.read(config_path)
    try: 
        config.set('GENERAL', 'DISP_X', str(disp_x))
    except configparser.NoSectionError:       
        config.add_section("GENERAL")
    config.set('GENERAL', 'DISP_X', str(disp_x))
    config.set('GENERAL', 'DISP_Y', str(disp_y+10)) # we add a bit due to the header of the window 
    config.set('GENERAL', 'SF_X', str(sf_x))
    config.set('GENERAL', 'SF_Y', str(sf_y)) 
    config.set('GENERAL', 'WIDTH', str(w))
    config.set('GENERAL', 'HEIGHT', str(h)) 
    config.set('GENERAL', 'X', str(x))
    config.set('GENERAL', 'Y', str(y)) 
    with open(config_path, 'w') as config_file:
        config.write(config_file)