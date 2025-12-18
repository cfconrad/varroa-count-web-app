export class Box {
  public x1: number;
  public x2: number;
  public y1: number;
  public y2: number;
  public score: number;

  constructor(x1: number, x2: number, y1: number, y2:number, score: number) {
    this.x1 = x1;
    this.x2 = x2;
    this.y1 = y1;
    this.y2 = y2;
    this.score = score;
  }

  public normalize (offset_x:number, 
    offset_y:number, 
    model_imgsz:number, 
    dest_img_height:number, 
    dest_img_width:number) {
    this.y1 = (this.y1 * model_imgsz + offset_y) / dest_img_height;
    this.y2 = (this.y2 * model_imgsz + offset_y) / dest_img_height;
    this.x1 = (this.x1 * model_imgsz + offset_x) / dest_img_width;
    this.x2 = (this.x2 * model_imgsz + offset_x) / dest_img_width;
  }

  public absolute(width: number, height: number): Box {
    return new Box(this.x1 * width, this.x2 * width, this.y1 * height, this.y2 * height, this.score);
  }

  public width() {
    return this.x2 - this.x1;
  }
  public height() {
    return this.y2 - this.y1;
  }
}


/**
 * Class handling the Image state, coordinate math, and rendering.
 */
export class ZoomImage {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private boxes: Array<Box>;
  private scale: number;
  private scale_min: number;
  private scale_max: number;
  private panX: number;
  private panY: number;
  private image: HTMLImageElement;

  constructor(canvas: HTMLCanvasElement , boxes: Array<Box>, image: HTMLImageElement) {
    this.canvas = canvas;

    let ctx = canvas.getContext('2d');
    if (!ctx)
      throw new MediaError();

    this.boxes = boxes;
    this.ctx = ctx;
    this.image = image;

    this.scale = 1.0;
    this.panX = 0.0;
    this.panY = 0.0;
    this.scale_max = 2.0;
    this.scale_min = 0.1;
  }

  /**
     * Centers the image on the canvas when loaded.
     */
  initPosition() {
    this.scale = Math.min(this.canvas.width / this.image.width, this.canvas.height / this.image.height);
    this.scale_min = this.scale;
    this.panX = (this.canvas.width - this.image.width * this.scale) / 2;
    this.panY = (this.canvas.height - this.image.height * this.scale) / 2;
    this.draw();
  }

  /**
     * Updates the Pan X and Y by adding the deltas.
     */
  updatePan(deltaX:number, deltaY:number) {
    this.panX += deltaX;
    this.panY += deltaY;
    this.draw();
  }

  /**
     * Updates the scale relative to a specific center point (pivot).
     * @param {number} factor - The multiplier for the zoom (e.g., 1.1 or 0.9)
     * @param {number} centerX - The X coordinate of the pivot (screen pixels)
     * @param {number} centerY - The Y coordinate of the pivot (screen pixels)
     */
  updateScale(factor:number, centerX:number, centerY:number) {
    // 1. Calculate World Coordinates before zoom
    const worldX = (centerX - this.panX) / this.scale;
    const worldY = (centerY - this.panY) / this.scale;

    // 2. Apply new scale
    let newScale = this.scale * factor;

    // Limits
    if (newScale < this.scale_min) {
      newScale = this.scale_min;
    } else if (newScale > this.scale_max) {
      newScale = this.scale_max;
    } 

    if (this.scale == newScale) return;

    // 3. Recalculate Pan to keep World Point fixed
    this.panX = centerX - worldX * newScale;
    this.panY = centerY - worldY * newScale;
    this.scale = newScale;

    this.draw();
  }

  updateBoxes(boxes: Array<Box>) {
    this.boxes = boxes;
    this.draw();
  }

  /**
     * The Main Render Loop
     */
  draw() {
    // Clear
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

    this.ctx.save();

    // Transform
    this.ctx.translate(this.panX, this.panY);
    this.ctx.scale(this.scale, this.scale);

    // Draw Image
    if (this.image.complete) {
      this.ctx.drawImage(this.image, 0, 0);
    }

    // Draw Sticky Boxes
    this.ctx.strokeStyle = 'red';
    this.ctx.lineWidth = 3 / this.scale; // Maintain 3px visual width

    this.boxes.forEach(box => {
      this.ctx.beginPath();
      this.ctx.rect(box.x1, box.y1, box.width(), box.height());
      this.ctx.stroke();
    });

    this.ctx.restore();
  }
}

