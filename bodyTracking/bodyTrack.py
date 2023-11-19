import cv2
import numpy as np
capture = cv2.VideoCapture(0)

while True:
    ret, image = capture.read()
    #cv2.imshow('Camera stream', image)
    if cv2.waitKey(1) & 0xFF == ord('q'):
        break
    imShape = image.shape
    print(imShape)
    scale = 640.0 / imShape[1]
    image = cv2.resize(image, (0,0), fx=scale, fy=scale)
    t = 100 # threshold for Canny Edge Detection algorithm
    grey = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)
    blured = cv2.medianBlur(grey, 15)

    # Create 2x2 grid for all previews
    grid = np.zeros([2*imShape[0], 2*imShape[1], 3], np.uint8)

    grid[0:imShape[0], 0:imShape[1]] = image
    # We need to convert each of them to RGB from greyscaled 8 bit format
    grid[imShape[0]:2*imShape[0], 0:imShape[1]] = np.dstack([cv2.Canny(grey, t / 2, t)] * 3)
    grid[0:imShape[0], imShape[1]:2*imShape[1]] = np.dstack([blured] * 3)
    grid[imShape[0]:2*imShape[0], imShape[1]:2*imShape[1]] = np.dstack([cv2.Canny(blured, t / 2, t)] * 3)
    sc = 1 # Scale for the algorithm
    md = 30 # Minimum required distance between two circles
    # Accumulator threshold for circle detection. Smaller numbers are more
    # sensitive to false detections but make the detection more tolerant.
    at = 40
    circles = cv2.HoughCircles(blured, cv2.HOUGH_GRADIENT, sc, md, t, at)
    print(circles)
    if circles is not None:
    # We care only about the first circle found.
        circle = circles[0][0]
        x, y, radius = int(circle[0]), int(circle[1]), int(circle[2])
        print(x, y, radius)

        # Highlight the circle
        cv2.circle(image, [x, y], radius, (0, 0, 255), 1)
        # Draw a dot in the center
        cv2.circle(image, [x, y], 1, (0, 0, 255), 1)
    cv2.imshow('Camera stream', image)
