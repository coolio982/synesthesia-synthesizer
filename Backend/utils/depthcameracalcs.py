import cv2
import numpy as np
import datetime
import numpy as np
import cv2
import math


def calibrate_background(data, height, width):
    # Resize frame data to (height,width,2)
    data.resize((height, width, 2))
    # mirror image
    # data = np.flip(data, 1)
    data = np.flip(data, 0)
    # Convert frame for processing
    newData = data[:, :, 0]+data[:, :, 1]*256
    maxDepth = np.max(newData)
    # save this as the initialised background depth
    current_date = datetime.datetime.now().strftime("%Y-%m-%d")
    filename = f"bg_{current_date}.npy"
    np.save(filename, newData)
    return newData, maxDepth

def process_matched_pairs(pairs, centres, pts, maskDataRGB, objectDetails):
    for pair in pairs:
        id = pair[0]
        centre = centres[pair[1]]
        label = "Circle {}".format(id)
        pts_dict = next(item for item in pts if item['id'] == id)
        pts_list = pts_dict['pts']
        # if the distance is sufficiently different, it has moved
        if len(pts_list) and (abs(pts_list[-1][0]-centre[0]) > 3 or abs(pts_list[-1][1]-centre[1]) > 3):
            objectDetails.append({"id": str(id), "obj": "circle"+str(id),
                                "action": "move", "pos_x": centre[0], "pos_y": centre[1]})
        elif len(pts_list):
            objectDetails.append({"id": str(id), "obj": "circle"+str(
                id), "action": "stationary", "pos_x": pts_list[-1][0], "pos_y": pts_list[-1][1]})
        pts_list.appendleft(centre)
        cv2.putText(maskDataRGB, label, centre,
            cv2.FONT_HERSHEY_SIMPLEX, 0.6, (0, 0, 255), 2)
        return objectDetails

def assign_action(contourO, pts, objectDetails, action ="touch"):
    # get the id of the object
    (radius, (x, y)) = contourO
    for i in range(len(pts)):
        subdict = pts[i]
        if (subdict["pts"]):
            if (abs(subdict["pts"][0][0]-x)<3) and (abs(subdict["pts"][0][1]-y)<3):
                for item in objectDetails:
                    if (item["id"] == str(subdict["id"])):
                        item["action"] = action
                        break
    return objectDetails

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


def find_closest_pairs_LK(existing_contours, coords2, prev_frame, current_frame):
    num_existing = len(existing_contours)
    num_new = len(coords2)
    
    if num_existing == 0 or num_new == 0:
        return ([], [i for i in range(num_existing)], [j for j in range(num_new)])
    
    prev_gray = prev_frame
    curr_gray = current_frame
    
    # Calculate optical flow using Lucas-Kanade method
    prev_pts = np.array([contour[1] for contour in existing_contours], dtype=np.float32)
    next_pts, status, _ = cv2.calcOpticalFlowPyrLK(prev_gray, curr_gray, prev_pts, None)
    
    pairs = []
    for i in range(num_existing):
        if status[i] == 1:
            closest_idx = np.argmin(np.linalg.norm(next_pts[i] - coords2, axis=1))
            pairs.append((existing_contours[i][0], closest_idx))
    
    unmatched_existing = [i for i in range(num_existing) if i not in [pair[0] for pair in pairs]]
    unmatched_new = [j for j in range(num_new) if j not in [pair[1] for pair in pairs]]
    return pairs, unmatched_existing, unmatched_new


def find_closest_pairs_F(existing_contours, coords2, prev_frame, current_frame):
    num_existing = len(existing_contours)
    num_new = len(coords2)
    
    if num_existing == 0 or num_new == 0:
        return ([], [i for i in range(num_existing)], [j for j in range(num_new)])
    
    prev_gray = prev_frame
    curr_gray = current_frame
    
    # Calculate optical flow using Farneback method
    flow = cv2.calcOpticalFlowFarneback(prev_gray, curr_gray, None, 0.5, 3, 15, 3, 5, 1.2, 0)
    
    pairs = []
    for i in range(num_existing):
        x, y = existing_contours[i][1]
        dx, dy = flow[int(y), int(x)]
        new_point = (x + dx, y + dy)
        distances = np.linalg.norm(np.array(coords2) - new_point, axis=1)
        closest_idx = np.argmin(distances)
        pairs.append((existing_contours[i][0], closest_idx))
    
    unmatched_existing = [i for i in range(num_existing) if i not in [pair[0] for pair in pairs]]
    unmatched_new = [j for j in range(num_new) if j not in [pair[1] for pair in pairs]]
    return pairs, unmatched_existing, unmatched_new