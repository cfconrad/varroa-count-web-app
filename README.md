# varroa-count-web-app

Created in [SUSE Hackweek 25](https://hackweek.opensuse.org/25/projects/varoa-mites-counter)

# Train the YOLO model
```
cd training
python3.11 -m venv venv
. venv/bin/activate
pip install ultralytics
./train_model.py
```
test the model with our examples run:
```
./predict.py ../examples/*
eog output/*
```
convert model for tensorflow-js
```
MODEL="runs/detect/yolov8_custom_training/weights/best.pt"

yolo export model="$MODEL" format=tfjs opset=12
```

# Web Development
```
yarn add -D vite # only needed the first time
npx vite
```

# Web Deploy
```
npx vite build
```

