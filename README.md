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
to test the model with our examples run:
```
./predict.py ../examples/*
eog output/*
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

