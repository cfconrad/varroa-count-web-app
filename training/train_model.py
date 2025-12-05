#!/usr/bin/env python3

from ultralytics import YOLO

# sz = 1024  # Image size
sz = 640  # Image size
# 1. Load a pre-trained model (YOLOv8n is 'nano', smallest/fastest)
# Replace 'yolov8n.pt' with 'yolov8m.pt' for a more accurate but slower model.
# model = YOLO('yolo11n.pt')
model = YOLO('yolov8n.pt')
# model = YOLO('yolov8x.pt')

# 2. Train the model
# 'data': The path to your data.yaml file from Step 2
# 'epochs': How many passes over the dataset (start with 10-50)
# 'imgsz': The image size for training (e.g., 640x640)
# 'batch': The number of images processed at once (adjust based on GPU memory)

results = model.train(
    data='data.yaml',
    epochs=100,
    imgsz=sz,
    batch=1,
    name='yolov8_custom_training',  # Name for your training run
    workers=20,
    #    device=0,
    patience=10,
)

print("Training completed! Check the 'runs/detect/' folder for results.")


# 2. Run the validation function with plotting enabled
results = model.val(
    data='data.yaml',
    split='val',        # Or 'train' to check your training data
    imgsz=sz,
    plots=True,         # Ensures the visualization images are generated
    save_hybrid=True    # Ensures the ground truth boxes are saved as images
)

print("\n--- Verification Images Generated ---")


# 2. Run the validation function with plotting enabled
results = model.val(
    data='data.yaml',
    split='train',        # Or 'train' to check your training data
    imgsz=sz,
    plots=True,         # Ensures the visualization images are generated
    save_hybrid=True    # Ensures the ground truth boxes are saved as images
)

# model.export(format="tfjs")
# model.export(format="onnx")
