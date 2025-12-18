#!/usr/bin/env python3
import os
from ultralytics import YOLO
import argparse

DEFAULT_MODEL = "runs/detect/yolov8_custom_training/weights/best.pt"


def detect(model: str, output: str, input: str, conf: float,
           imgsz: int = 6016):
    model = YOLO(model, verbose=False)

    results = model(
        input,
        imgsz=(imgsz),
        max_det=2000,
        conf=conf,
        iou=0.5,
        save=True,
        show_labels=False,
        line_width=2,
        save_txt=True,
        save_conf=True,
        project=os.path.dirname(output),
        name=os.path.basename(output),
        verbose=False, batch=1, exist_ok=True
    )

    for result in results:
        print(f"Total varroas in file {input}: {len(result.boxes)}")


def find_files_recursive(path: str, file_list: list[str]):
    if os.path.isfile(path):
        file_list.append(os.path.abspath(path))
    elif os.path.isdir(path):
        for root, _, files in os.walk(path):
            for file_name in files:
                full_path = os.path.join(root, file_name)
                file_list.append(os.path.abspath(full_path))
    else:
        raise Exception(f"Path {path} doesn't exists!")


def parse_arguments():
    """
    Parses command-line arguments using the argparse module.
    """
    parser = argparse.ArgumentParser(
        description="Test script to detect varoa mibles on a picture",
    )

    parser.add_argument(
        'input_paths',
        metavar='<files or path>',
        type=str,
        nargs='+',
        help='One or more file paths or a directory path to process.'
    )

    parser.add_argument(
        '--model',
        metavar='<path>',
        type=str,
        default=DEFAULT_MODEL,
        help='Path to the machine learning model file.'
    )

    parser.add_argument(
        '-c',
        '--confidence-threshold',
        '--conf',
        type=float,
        default=0.1,
        help='Confidence Threshold. Detections with a confidence score lower then the given value will be discarded.'
    )

    parser.add_argument(
        '-s',
        '--imgsz',
        type=int,
        default=6016,
        help='Input image size given to model() function'
    )

    parser.add_argument(
        '--output',
        metavar='<outputdir>',
        type=str,
        default='output',
        help='Directory where the output files will be saved'
    )

    args = parser.parse_args()

    if not os.path.exists(args.model):
        parser.error(f"The specified model path does not exist: {args.model}")

    try:
        args.output = os.path.abspath(args.output)
        os.makedirs(args.output, exist_ok=True)
    except OSError as e:
        parser.error(f"Could not create output directory '{args.output}': {e}")

    args.files = []
    try:
        for f in args.input_paths:
            find_files_recursive(f, args.files)
    except Exception as e:
        parser.error(e)

    return args


def main():
    args = parse_arguments()

    print(f"Model Path: **{args.model}**")
    print(f"Output Directory: **{args.output}**")
    print("Input Paths (Files/Dirs):")
    for path in args.files:
        print(f"  - {path}")

    for f in args.files:
        print(f"Process {f}")
        detect(args.model, args.output, f,
               args.confidence_threshold, args.imgsz)


if __name__ == '__main__':
    main()
