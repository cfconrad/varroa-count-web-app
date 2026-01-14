import './style.css'
import * as tf from '@tensorflow/tfjs';
import { Box, ZoomImage } from './zoom_image.ts';

document.querySelector<HTMLDivElement>('#app')!.innerHTML = `
<!-- Navbar -->
<nav class="border-b border-yellow-700 bg-yellow-800/50 backdrop-blur-md sticky top-0 z-50">
  <div class="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
    <div class="flex items-center gap-3">
      <div class="w-8 h-8 bg-gradient-to-br from-yellow-500 to-orange-500 rounded-lg flex justify-center" >
        <img src="/images/varroa-count.svg" class="invert brightness-200" />
      </div>
      <h1 class="text-xl font-bold tracking-tight">Varroa<span class="text-red-500">Counter</span></h1>
    </div>
    <div id="model-status" class="flex items-center gap-2 text-xs font-medium text-yellow-400 bg-yellow-400/10 px-3 py-1 rounded-full animate-pulse border-yellow-700">
      <span class="w-2 h-2 rounded-full bg-yellow-400"></span>
      Loading Model...
    </div>
    <div id="model-status" class="flex items-center gap-2 font-medium text-black">
      <a href="https://github.com/cfconrad/varroa-count-web-app" target="_blank" rel="noopener" title="See the Github Repo" class="md-social__link">
        <img src="/images/github.svg"/>
      </a>
    </div>
  </div>
</nav>

<div>
  <!-- Main Content -->
  <main class="max-w-6xl mx-auto px-4 py-8 grid lg:grid-cols-3 gap-8">

    <!-- Left Column: Media Feed (Spans 2 cols) -->
    <div class="lg:col-span-2 space-y-4">
      <!-- Controls -->
      <div class="flex flex-col sm:flex-row gap-4 mb-4 bg-yellow-800/50 p-4 rounded-xl border border-yellow-700">
        <div class="flex gap-2 flex-1">
          <label class="flex-1 bg-yellow-700 hover:bg-yellow-600 text-white font-medium py-2 px-4 rounded-lg transition-colors flex items-center justify-center gap-2 cursor-pointer">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path fill-rule="evenodd" d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z" clip-rule="evenodd" />
            </svg>
            Upload
            <input type="file" id="upload-input" accept="image/*" class="hidden">
          </label>
        </div>

        <!-- Confidence Slider -->
        <div class="flex-1 flex flex-col justify-center px-2">
          <label for="confidence-slider" class="block mb-2.5 text-sm font-medium text-heading">Sensitivity<span style="padding-left: 5px" id="threshold-value"></span></label>
          <input type="range" id="confidence-slider" min="1" max="100" value="15" style="background-color: #ebc634"  class="w-full bg-yellow-600 h-2 bg-neutral-quaternary rounded-full appearance-none cursor-pointer">
        </div>
      </div>

      <!-- Viewport -->
      <div class="relative group rounded-2xl overflow-hidden bg-black border-2 border-yellow-700 shadow-2xl aspect-video" id="media-container">
        <div class="absolute top-1/2 left-1/2" id="loading-spinner">
        <div role="status">
    <svg aria-hidden="true" class="inline w-8 h-8 text-neutral-tertiary animate-spin fill-yellow-600" viewBox="0 0 100 110" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M100 50.5908C100 78.2051 77.6142 100.591 50 100.591C22.3858 100.591 0 78.2051 0 50.5908C0 22.9766 22.3858 0.59082 50 0.59082C77.6142 0.59082 100 22.9766 100 50.5908ZM9.08144 50.5908C9.08144 73.1895 27.4013 91.5094 50 91.5094C72.5987 91.5094 90.9186 73.1895 90.9186 50.5908C90.9186 27.9921 72.5987 9.67226 50 9.67226C27.4013 9.67226 9.08144 27.9921 9.08144 50.5908Z" fill="currentColor"/>
        <path d="M93.9676 39.0409C96.393 38.4038 97.8624 35.9116 97.0079 33.5539C95.2932 28.8227 92.871 24.3692 89.8167 20.348C85.8452 15.1192 80.8826 10.7238 75.2124 7.41289C69.5422 4.10194 63.2754 1.94025 56.7698 1.05124C51.7666 0.367541 46.6976 0.446843 41.7345 1.27873C39.2613 1.69328 37.813 4.19778 38.4501 6.62326C39.0873 9.04874 41.5694 10.4717 44.0505 10.1071C47.8511 9.54855 51.7191 9.52689 55.5402 10.0491C60.8642 10.7766 65.9928 12.5457 70.6331 15.2552C75.2735 17.9648 79.3347 21.5619 82.5849 25.841C84.9175 28.9121 86.7997 32.2913 88.1811 35.8758C89.083 38.2158 91.5421 39.6781 93.9676 39.0409Z" fill="currentFill"/>
    </svg>
    <span class="sr-only">Loading...</span>
</div>
          </div>
        <img id="uploaded-image" class="absolute inset-0 w-full h-full object-contain hidden" />
        <canvas id="overlay" ></canvas>
        <div class="absolute top-2 right-2 flex gap-2">
          <button id="zoom-in-button" class="flex items-center justify-center p-2 rounded-lg bg-yellow-700 hover:bg-yellow-600 text-white shadow-md transition-colors">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="size-6">
              <path stroke-linecap="round" stroke-linejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607ZM10.5 7.5v6m3-3h-6" />
            </svg>
          </button>
          <button id="zoom-out-button" class="flex items-center justify-center p-2 rounded-lg bg-yellow-700 hover:bg-yellow-600 text-white shadow-md transition-colors">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="size-6">
              <path stroke-linecap="round" stroke-linejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607ZM13.5 10.5h-6" />
            </svg>
          </button>
        </div>
      </div>

    </div>

    <!-- Right Column: Results & Info -->
    <div class="flex flex-col h-full space-y-4">
      <!-- Detection Count -->
      <div class="bg-yellow-800 rounded-2xl border border-yellow-700 p-6 shadow-lg">
        <h2 class="text-lg font-semibold text-yellow-200 mb-2">Detections</h2>
        <div class="flex items-baseline gap-2">
          <span id="detection-count" class="text-4xl font-bold text-red-500">0</span>
          <span class="text-yellow-400">Varroa found</span>
        </div>
      </div>

      <!-- Debug / Log Console -->
      <div class="bg-yellow-900 rounded-xl border border-yellow-800 p-4 flex-1 overflow-hidden flex flex-col">
        <h3 class="text-xs font-bold text-yellow-500 uppercase tracking-wider mb-2">System Log</h3>
        <div id="logs" class="font-mono text-xs text-green-400 overflow-y-auto flex-1 space-y-1 p-2 bg-black/20 rounded">
          <div>> System initialized...</div>
        </div>
      </div>

   </main>
</div>
<div id="loading-modal" class="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center hidden">
  <div class="bg-yellow-900 border border-yellow-700 rounded-xl p-8 shadow-2xl w-full max-w-sm text-center">
    <h3 class="text-xl font-bold text-yellow-200 mb-4">Loading Model</h3>
    <p class="text-yellow-400 mb-6">Please wait while the detection model is being downloaded and prepared.</p>
    <div class="w-full bg-black/20 rounded-full h-2.5 border border-yellow-800">
      <div id="loading-progress-bar" class="bg-yellow-500 h-2 rounded-full" style="width: 0%"></div>
    </div>
    <div class="mt-2 text-xs font-mono text-yellow-500" id="loading-progress-text">0%</div>
  </div>
</div>
`;

// --- Configuration ---
const MODELS = [
  { 
    url: 'models/0/model.json',
    name: "Default Model",
    imgsz: 1024,
  },
  { 
    url: 'models/1/model.json',
    name: "mAP50: 0.87",
    imgsz: 1024
  }
];

let scoreThreshold = 0.15; // Default 15%
let MODEL_INPUT_SIZE = 1024; // Used for coordinate normalization if model outputs pixels

// --- State ---
let model: tf.GraphModel | null = null;
let zoom_image: ZoomImage | null = null;
let globalMyBoxes: Array<Box> = [];

// --- DOM Elements ---
const image = document.getElementById('uploaded-image') as HTMLImageElement;
const mediaContainer = document.getElementById('media-container'); // Need container for alignment
const canvas = document.getElementById('overlay') as HTMLCanvasElement;
const ctx = canvas.getContext('2d') as CanvasRenderingContext2D;
const uploadInput = document.getElementById('upload-input');
const statusBadge = document.getElementById('model-status');
const logContainer = document.getElementById('logs');
const countDisplay = document.getElementById('detection-count');
const slider = document.getElementById('confidence-slider');
const thresholdDisplay = document.getElementById('threshold-value');
const zoomInButton = document.getElementById('zoom-in-button');
const zoomOutButton = document.getElementById('zoom-out-button');
const loading_spinner = document.getElementById('loading-spinner');
const loadingModal = document.getElementById('loading-modal');
const loadingProgressBar = document.getElementById('loading-progress-bar');
const loadingProgressText = document.getElementById('loading-progress-text');

// --- Logging Helper ---
function log(msg: string, type = 'info') {
  if (!logContainer)
    return;
  const div = document.createElement('div');
  div.textContent = `> ${msg}`;
  if (type === 'error') div.className = 'text-red-400';
  if (type === 'warn') div.className = 'text-yellow-400';
  logContainer.appendChild(div);
  logContainer.scrollTop = logContainer.scrollHeight;
  console.log(msg);
}

// --- Initialization ---
async function init() {
  loading_spinner?.classList.add("hidden");
  try {
    await tf.ready();
    log(`Backend: ${tf.getBackend().toUpperCase()}`);

    const params = new URLSearchParams(window.location.search);
    let model_idx = parseInt(params.get('model') || "0", 10);
    if (model_idx < 0 && model_idx > MODELS.length)
      model_idx = 0;
    const model_spec = MODELS[model_idx];
    MODEL_INPUT_SIZE = model_spec.imgsz;

    log(`Loading model from ${model_spec.url}...`);

    if (loadingModal) loadingModal.classList.remove('hidden');

    // Load Graph Model
    model = await tf.loadGraphModel(model_spec.url, {
      onProgress: (fraction) => {
        const percent = Math.round(fraction * 100);
        if (loadingProgressBar) loadingProgressBar.style.width = `${percent}%`;
        if (loadingProgressText) loadingProgressText.innerText = `${percent}%`;
      }
    });

    if (loadingModal) loadingModal.classList.add('hidden');

    // Warm up
    const dummyInput = tf.zeros([1, 1024, 1024, 3], 'float32');
    try {
      await model.executeAsync(dummyInput);
      tf.dispose(dummyInput);
    } catch(e) {
      log('Warmup warning: ' + e.message, 'warn');
    }

    log('Model Loaded Successfully');
    if (statusBadge) {
      statusBadge.className = "flex items-center gap-2 text-xs font-medium text-emerald-700 bg-emerald-400/40 px-3 py-1 rounded-full border-green-700";
      statusBadge.innerHTML = `<span class="w-2 h-2 rounded-full bg-emerald-400"></span>` + model_spec.name;
    }

  } catch (error) {
    log('Error Loading Model: ' + error.message, 'error');
    log('Ensure "models/model.json" exists and is served via HTTP/HTTPS (not file://)', 'warn');
    if (loadingModal) loadingModal.classList.add('hidden');

    if (statusBadge) {
      statusBadge.className = "flex items-center gap-2 text-xs font-medium text-red-400 bg-red-400/10 px-3 py-1 rounded-full";
      statusBadge.innerHTML = "Model Error";
    }
  }
}

// --- Inference Engine ---
// Core function that takes a tensor and returns parsed boxes/scores
async function runInference(inputTensor: tf.Tensor) {
  let res: tf.Tensor | null = null;
  let myBoxes: Array<Box> = [];
  const minimumScore = 0.01;

  if (!model)
    return { myBoxes };

  try {
    res = await model.executeAsync(inputTensor) as tf.Tensor;
  } catch (error) {
    log('Execution error: ' + error.message, 'error');
    return { myBoxes: [] };
  }

  // Check for YOLO specific shape [1, 5, 21504]
  if (res.shape.length === 3 && res.shape[1] === 5) {
    // YOLO Logic
    const transposed = res.transpose([0, 2, 1]);
    const data = transposed.dataSync(); 
    transposed.dispose();
    res.dispose(); 

    console.debug(data);
    const numAnchors = data.length / 5;
    const candidateBoxes: Array<Array<number>> = [];
    const candidateScores: Array<number> = [];

    for (let i = 0; i < numAnchors; i++) {
      const offset = i * 5;
      const score = data[offset + 4]; 

      if (score > minimumScore) {
        const cx = data[offset];     
        const cy = data[offset + 1]; 
        const w = data[offset + 2];  
        const h = data[offset + 3];  

        const y1 = (cy - h / 2) / MODEL_INPUT_SIZE;
        const x1 = (cx - w / 2) / MODEL_INPUT_SIZE;
        const y2 = (cy + h / 2) / MODEL_INPUT_SIZE;
        const x2 = (cx + w / 2) / MODEL_INPUT_SIZE;

        candidateBoxes.push([y1, x1, y2, x2]);
        candidateScores.push(score);
      }
    }

    if (candidateBoxes.length > 0) {
      const boxTensor = tf.tensor2d(candidateBoxes);
      const scoreTensor = tf.tensor1d(candidateScores);

      const nmsIndices = await tf.image.nonMaxSuppressionAsync(boxTensor, scoreTensor, 1000, 0.5, minimumScore);
      const indices = nmsIndices.dataSync();

      indices.forEach(idx => {
        // Flatten here for consistency with other branches
        const b = candidateBoxes[idx];
        myBoxes.push(new Box(b[1], b[3], b[0], b[2], candidateScores[idx]));
      });

      boxTensor.dispose();
      scoreTensor.dispose();
      nmsIndices.dispose();
    }

  } else if (Array.isArray(res)) {
    console.error("NOT IMPLEMENTED res is Array!!"); 
    if(res && res.dispose) res.dispose();
  } else if (res && typeof res === 'object' && !res.dataSync) {
    console.error("NOT IMPLEMENTED res is object!!"); 
    if(res && res.dispose) res.dispose();
  } else {
    if(res && res.dispose) res.dispose();
  }

  return { myBoxes };
}

// --- Main Detection Loop ---
async function detectFrame(sourceElement: HTMLImageElement) {
  if (!model) return;
  if (!mediaContainer) return;

  // Get Dimensions
  const imgWidth = sourceElement.naturalWidth;
  const imgHeight = sourceElement.naturalHeight;
  const containerWidth = mediaContainer.clientWidth;
  const containerHeight = mediaContainer.clientHeight;

  if (!imgWidth || !imgHeight) return;

  // Resize Canvas to Container
  canvas.width = containerWidth;
  canvas.height = containerHeight;
  ctx.clearRect(0, 0, canvas.width, canvas.height);


  // --- TILING LOGIC START ---
  // Only tile if not webcam (static image) and dimensions exceed input size
  if (imgWidth >= MODEL_INPUT_SIZE || imgHeight >= MODEL_INPUT_SIZE) {

    // Create an offscreen canvas for slicing
    const tileCanvas = document.createElement('canvas');
    tileCanvas.width = MODEL_INPUT_SIZE;
    tileCanvas.height = MODEL_INPUT_SIZE;
    const tileCtx = tileCanvas.getContext('2d');
    if (!tileCtx) {
      log("Missing tilecontext", "error");
      return;
    }

    // Step size (non-overlapping usually preferred for simple grid, 
    // but we make sure to cover the edges by shifting back)
    const step = MODEL_INPUT_SIZE; 

    for (let y = 0; y < imgHeight; y += step) {
      let tileY = y;
      // If tile goes out of bounds, shift back to fit exactly at the edge
      if (tileY + MODEL_INPUT_SIZE > imgHeight) {
        tileY = Math.max(0, imgHeight - MODEL_INPUT_SIZE);
      }

      for (let x = 0; x < imgWidth; x += step) {
        let tileX = x;
        if (tileX + MODEL_INPUT_SIZE > imgWidth) {
          tileX = Math.max(0, imgWidth - MODEL_INPUT_SIZE);
        }

        // Draw slice to temp canvas
        tileCtx.clearRect(0, 0, MODEL_INPUT_SIZE, MODEL_INPUT_SIZE);
        tileCtx.drawImage(
          sourceElement, 
          tileX, tileY, MODEL_INPUT_SIZE, MODEL_INPUT_SIZE, // Source Slice
          0, 0, MODEL_INPUT_SIZE, MODEL_INPUT_SIZE          // Dest Canvas
        );

        // Process this tile
        const inputTensor: tf.Tensor = tf.tidy(() => {
          return tf.browser.fromPixels(tileCanvas)
            .expandDims(0)
            .div(255.0);
        });

        const tileResults = await runInference(inputTensor);
        inputTensor.dispose();

        const tMyBoxes = tileResults.myBoxes;

        for(let i=0; i<tMyBoxes.length; i++) {
          const box = tMyBoxes[i];
          box.normalize(tileX, tileY, MODEL_INPUT_SIZE, imgHeight, imgWidth);
          globalMyBoxes.push(box);
        }


        // Break loop if we just processed the shifted-back edge tile
        if (tileX + MODEL_INPUT_SIZE >= imgWidth) break;
      }
      if (tileY + MODEL_INPUT_SIZE >= imgHeight) break;
    }

  } else {
    // --- STANDARD SINGLE PASS LOGIC ---
    const inputTensor = tf.tidy(() => {
      const img = tf.browser.fromPixels(sourceElement);
      const expanded = img.expandDims(0);
      const resized = tf.image.resizeBilinear(expanded, 
        [MODEL_INPUT_SIZE, MODEL_INPUT_SIZE]);
      return resized.div(255.0); 
    });

    const results = await runInference(inputTensor);
    inputTensor.dispose();
    globalMyBoxes = results.myBoxes;
  }
  // --- TILING LOGIC END ---

  // 4. Draw Final Results
  if (image)
   image.style.display = 'none';

  let boxes: Array<Box> = [];
  for (let i = 0; i < globalMyBoxes.length; i++) {
    const box = globalMyBoxes[i];
    boxes.push(box.absolute(sourceElement.width, sourceElement.height))
  }
  globalMyBoxes = boxes;

  zoom_image = new ZoomImage(canvas, boxes, sourceElement);
  zoom_image.initPosition();
  update_boxes();

  loading_spinner?.classList.add("hidden");
}

// --- Event Handlers ---

// Slider Change
function update_boxes() {
  
  if (!zoom_image)
    return;

  let boxes: Array<Box> = [];
  for (let i = 0; i < globalMyBoxes.length; i++) {
    const box = globalMyBoxes[i];
    if (box.score >= scoreThreshold) {
      boxes.push(box);
    }
  }
  zoom_image.updateBoxes(boxes);
  if (countDisplay)
    countDisplay.innerText = boxes.length.toString();
}

slider?.addEventListener('input', (e) => {
  let el = e.target as HTMLInputElement;
  scoreThreshold = parseInt(el.value) / 100;
  if (thresholdDisplay)
    thresholdDisplay.innerText = `${el.value}%`;
  update_boxes();
});

slider?.dispatchEvent(new Event('input', { bubbles: true }));

// Upload Image
uploadInput?.addEventListener('change', (e) => {
  const file = e.target.files[0];
  if (!file) return;
  if (!image) return;

  loading_spinner?.classList.remove("hidden");

  zoom_image = null;
  image.classList.remove('hidden');

  const reader = new FileReader();
  reader.onload = (event) => {
    if (!event.target || !event.target.result) return;
    image.src = event.target.result as string;
    image.onload = () => {
      log('Image loaded.');
      globalMyBoxes = [];
      detectFrame(image);
    }
  };
  reader.readAsDataURL(file);
});

window.addEventListener('resize', () => {
  update_boxes();
});

// State for Interaction
let isDragging = false;
let startX = 0;
let startY = 0;
let initialPinchDist: number | null = null;

// --- Mouse Wheel (Zoom) ---
canvas.addEventListener('wheel', (e) => {
    e.preventDefault();
    const zoomIntensity = 0.1;
    const direction = e.deltaY < 0 ? 1 : -1;
    const factor = Math.exp(direction * zoomIntensity);
    
    // Get mouse pos
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    if (zoom_image)
      zoom_image.updateScale(factor, x, y);
});

zoomInButton?.addEventListener('click', () => {
    const zoomIntensity = 0.1;
    const factor = Math.exp(zoomIntensity);
    const x = canvas.clientWidth / 2;
    const y = canvas.clientHeight / 2;
    zoom_image?.updateScale(factor, x, y);
});

zoomOutButton?.addEventListener('click', () => {
    const zoomIntensity = -0.1;
    const factor = Math.exp(zoomIntensity);
    const x = canvas.clientWidth / 2;
    const y = canvas.clientHeight / 2;
    if (zoom_image) {
        zoom_image.updateScale(factor, x, y);
    }
});

// --- Mouse Drag (Pan) ---
canvas.addEventListener('mousedown', (e) => {
    isDragging = true;
    startX = e.clientX;
    startY = e.clientY;
    canvas.style.cursor = 'grabbing';
});

window.addEventListener('mousemove', (e) => {
    if (!isDragging) return;
    e.preventDefault();
    
    const dx = e.clientX - startX;
    const dy = e.clientY - startY;

    if (zoom_image)
      zoom_image.updatePan(dx, dy);

    startX = e.clientX;
    startY = e.clientY;
});

window.addEventListener('mouseup', () => {
    isDragging = false;
    canvas.style.cursor = 'default';
});


// --- Touch Events (Mobile) ---

canvas.addEventListener('touchstart', (e) => {
    e.preventDefault();
    if (e.touches.length === 1) {
        // Pan Start
        isDragging = true;
        startX = e.touches[0].clientX;
        startY = e.touches[0].clientY;
    } else if (e.touches.length === 2) {
        // Pinch Start
        isDragging = false;
        initialPinchDist = getDist(e.touches[0], e.touches[1]);
    }
}, { passive: false });

canvas.addEventListener('touchmove', (e) => {
    e.preventDefault();
    if (e.touches.length === 1 && isDragging) {
        // Pan Update
        const dx = e.touches[0].clientX - startX;
        const dy = e.touches[0].clientY - startY;
       
        if (zoom_image)
          zoom_image.updatePan(dx, dy);
        
        startX = e.touches[0].clientX;
        startY = e.touches[0].clientY;
    } else if (e.touches.length === 2) {
        // Pinch Update
        const currentDist = getDist(e.touches[0], e.touches[1]);
        if (initialPinchDist) {
            const factor = currentDist / initialPinchDist;
            const center = getCenter(e.touches[0], e.touches[1]);
            const rect = canvas.getBoundingClientRect();
            zoom_image?.updateScale(factor, center.x - rect.left, center.y - rect.top);
            
            // Reset for next incremental move
            initialPinchDist = currentDist;
        }
    }
}, { passive: false });

canvas.addEventListener('touchend', (e) => {
    if (e.touches.length === 1) {
        isDragging = true;
        startX = e.touches[0].clientX;
        startY = e.touches[0].clientY;
    } else {
        isDragging = false;
        initialPinchDist = null;
    }
});

function getDist(t1: Touch, t2: Touch) {
    return Math.hypot(t2.clientX - t1.clientX, t2.clientY - t1.clientY);
}

function getCenter(t1: Touch, t2: Touch) {
    return {
        x: (t1.clientX + t2.clientX) / 2,
        y: (t1.clientY + t2.clientY) / 2
    };
}

//
init();

