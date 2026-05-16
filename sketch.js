/**
 * Global Variables
 */
let columns, rows;
// メモリ効率化のため TypedArray を使用
let grid;
let nextGrid;
let simImage; // 描画用のp5.Image
let paletteCache = []; // 配色をRGBA配列としてキャッシュ

let cellSize = 4; // デフォルトを小さくして解像度を上げても軽量
let lastUpdateTime = 0;

// カラーパレット定義
const paletteDefinitions = [
  {
    title: "Retro Sunny Living",
    comment: "レトロで温かみのある暖色",
    colors: [
      { name: "RUBY", hex: "#A6171C", rgb: [166, 23, 28] },
      { name: "NATURAL", hex: "#D6D0C5", rgb: [214, 208, 197] },
      { name: "SUNNY", hex: "#F1C045", rgb: [241, 192, 69] },
    ],
  },
  {
    title: "Citrus Breeze",
    comment: "爽やかな青と柑橘系の黄色",
    colors: [
      { name: "LIGHT BLUE", hex: "#C3E7F1", rgb: [195, 231, 241] },
      { name: "MOONSTONE", hex: "#519CAB", rgb: [81, 156, 171] },
      { name: "SAFFRON", hex: "#FFC64F", rgb: [255, 198, 79] },
      { name: "GUNMETAL", hex: "#20373B", rgb: [32, 55, 59] },
    ],
  },
  {
    title: "Dreamy Sunset",
    comment: "淡いパステルカラーのグラデーション",
    colors: [
      { name: "Peach", hex: "#FAD6A5", rgb: [250, 214, 165] },
      { name: "Pink", hex: "#F593C4", rgb: [245, 147, 196] },
      { name: "Lavender", hex: "#B8AEE3", rgb: [184, 174, 227] },
      { name: "Sky Blue", hex: "#77CAE3", rgb: [119, 202, 227] },
      { name: "Dark Blue", hex: "#11476C", rgb: [17, 71, 108] },
    ],
  },
  {
    title: "Bold Modernism",
    comment: "モダンなビビッドピンクと無彩色",
    colors: [
      { name: "Magenta", hex: "#FF4777", rgb: [255, 71, 119] },
      { name: "Slate", hex: "#36434A", rgb: [54, 67, 74] },
      { name: "Camouflage Sand", hex: "#E5D4C8", rgb: [229, 212, 200] },
    ],
  },
  {
    title: "Fresh Orange",
    comment: "明るいオレンジとフレッシュな水色",
    colors: [
      { name: "Mistral", hex: "#A3DFF1", rgb: [163, 223, 241] },
      { name: "Zéphir", hex: "#FEE4B8", rgb: [254, 228, 184] },
      { name: "Solara", hex: "#FFC065", rgb: [255, 192, 101] },
      { name: "Pulpe", hex: "#FFA43A", rgb: [255, 164, 58] },
    ],
  },
  {
    title: "Classic Marine",
    comment: "クラシックなトリコロール",
    colors: [
      { name: "Deep Red", hex: "#7C170D", rgb: [124, 23, 13] },
      { name: "Navy Blue", hex: "#141A45", rgb: [20, 26, 69] },
      { name: "Off White", hex: "#ECE1D5", rgb: [236, 225, 213] },
    ],
  },
  {
    title: "Bauhaus Geometry",
    comment: "幾何学的な原色構成",
    colors: [
      { name: "Blue", hex: "#1E459F", rgb: [30, 69, 159] },
      { name: "Red", hex: "#CF2A2A", rgb: [207, 42, 42] },
      { name: "Yellow", hex: "#FABD32", rgb: [250, 189, 50] },
      { name: "Beige", hex: "#E1DCCA", rgb: [225, 220, 202] },
    ],
  },
  {
    title: "Dynamic Sport",
    comment: "アクティブでスポーティーなマルチカラー",
    colors: [
      { name: "BLUE", hex: "#2267B1", rgb: [34, 103, 177] },
      { name: "GOLD", hex: "#F7D232", rgb: [247, 210, 50] },
      { name: "ORANGE", hex: "#F36F36", rgb: [243, 111, 54] },
      { name: "GREEN", hex: "#5DC3AB", rgb: [93, 195, 171] },
    ],
  },
  {
    title: "Fruit Salad",
    comment: "鮮やかな青と黄色のコントラスト",
    colors: [
      { name: "Periwinkle", hex: "#9EB6F8", rgb: [158, 182, 248] },
      { name: "Royal Blue", hex: "#386CD4", rgb: [56, 108, 212] },
      { name: "Midnight", hex: "#292E4F", rgb: [41, 46, 79] },
      { name: "Mustard", hex: "#E2AD3E", rgb: [226, 173, 62] },
      { name: "Lemon", hex: "#F3D959", rgb: [243, 217, 89] },
    ],
  },
];

// 現在のパラメータ（Undo/Redo対象）
let params = {
  title: "Living Cellular Automata",
  cellSize: 4, // デフォルトを少し細かく
  threshold: 3, // 変化に必要な隣人数
  range: 1, // 近傍半径 (Moore近傍)
  states: 5, // 色数/状態数
  noise: 0.0, // ランダムノイズ確率
  speed: 1, // 更新頻度 (frameSkip)
  currentColorPalette: [], // 現在適用されているパレット配列 [color(), color(), ...]
};

// UIの状態管理
let isDebugMode = false;
let isToolWindowVisible = true;
let undoStack = [];
let redoStack = [];
const MAX_HISTORY = 20;

// 録画関連
let mediaRecorder;
let recordedChunks = [];
let isRecording = false;
let recordingStartTime = 0;
let recordingTimerInterval;

/**
 * p5.js Setup Function
 * 初期化処理を行います。
 */
function setup() {
  createCanvas(windowWidth, windowHeight);
  pixelDensity(1); // 処理負荷軽減のため1倍固定
  noSmooth(); // ドット絵感を出すため

  // フレームレート制限（モニターに合わせる）
  frameRate(60);

  // UI初期化
  initializeUI();

  // デフォルトパレット適用
  applyPaletteByIndex(0);

  // グリッド初期化
  initGrid();

  // 現在の状態を保存
  saveState();
}

/**
 * p5.js Window Resize
 * ウィンドウサイズ変更時にグリッドを再計算します。
 */
function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
  initGrid();
}

/**
 * Grid Initialization
 * グリッドのサイズを計算し、ランダムな状態で初期化します。
 */
function initGrid() {
  // 画面サイズに基づきカラム数と行数を計算
  columns = Math.ceil(width / params.cellSize);
  rows = Math.ceil(height / params.cellSize);

  // 軽量化: TypedArrayを使用
  grid = new Uint8Array(columns * rows);
  nextGrid = new Uint8Array(columns * rows);

  // 描画用のp5.Imageを作成
  simImage = createImage(columns, rows);

  // ランダムな初期状態
  for (let i = 0; i < grid.length; i++) {
    grid[i] = floor(random(params.states));
  }
}

/**
 * パレットキャッシュの更新
 * 描画ループ内でのcolor()呼び出しを避けるため、RGBA配列をプリセットします。
 */
function updatePaletteCache() {
  paletteCache = params.currentColorPalette.map((c) => [
    red(c),
    green(c),
    blue(c),
    255,
  ]);
}

/**
 * p5.js Draw Function
 * メインループ。シミュレーションと描画を行います。
 */
function draw() {
  background(20);

  // シミュレーション更新 (速度調整)
  // speed=10で毎フレーム、speed=1で10フレームに1回
  // よりスムーズな動きのため、ロジックを微調整
  let updateFreq = Math.floor(map(params.speed, 1, 10, 10, 1));
  if (frameCount % updateFreq === 0) {
    updateGrid();
  }

  // 描画 (軽量化: Pixels直接操作)
  renderGridToImage();

  // 生成された画像をキャンバス全体に拡大描画
  // noSmooth()が効いているのでドット絵として拡大される
  image(simImage, 0, 0, width, height);

  // デバッグ表示
  if (isDebugMode) {
    drawDebugInfo();
  }
}

/**
 * Update Grid (Cellular Automata Logic)
 * Cyclic Cellular Automaton のルールに基づいて次世代を計算します。
 * 軽量化: 1次元配列としてアクセスし、計算を最適化
 */
function updateGrid() {
  let numColors = paletteCache.length;
  let activeStates = Math.min(params.states, numColors);
  let r = params.range;
  let threshold = params.threshold;

  // 高速化のため、ローカル変数にコピー
  let cols = columns;
  let rw = rows;

  // ランダムノイズ用
  let hasNoise = params.noise > 0;
  let noiseProb = params.noise;

  for (let y = 0; y < rw; y++) {
    for (let x = 0; x < cols; x++) {
      let index = x + y * cols;
      let state = grid[index];
      let nextStateVal = (state + 1) % activeStates;
      let count = 0;

      // Moore近傍のチェック
      // ループ展開やオフセット計算の最適化が可能だが、可読性維持のためループを使用
      for (let dy = -r; dy <= r; dy++) {
        let ny = (y + dy + rw) % rw; // トーラスY
        let yOffset = ny * cols;

        for (let dx = -r; dx <= r; dx++) {
          if (dx === 0 && dy === 0) continue;

          let nx = (x + dx + cols) % cols; // トーラスX

          if (grid[nx + yOffset] === nextStateVal) {
            count++;
          }
        }
      }

      // ルール適用
      if (count >= threshold) {
        nextGrid[index] = nextStateVal;
      } else {
        nextGrid[index] = state;
      }

      // ノイズ
      if (hasNoise && Math.random() < noiseProb) {
        nextGrid[index] = Math.floor(Math.random() * activeStates);
      }
    }
  }

  // グリッド入れ替え (TypedArrayの中身をコピーするより参照入れ替えが速い)
  let temp = grid;
  grid = nextGrid;
  nextGrid = temp;
}

/**
 * Render Grid to Image (軽量化の要)
 * p5.Imageのpixels配列を直接操作します。rect()より圧倒的に高速です。
 */
function renderGridToImage() {
  simImage.loadPixels();
  let numColors = paletteCache.length;

  // pixelsは [r, g, b, a, r, g, b, a, ...] の1次元配列
  let px = simImage.pixels;
  let len = grid.length;

  for (let i = 0; i < len; i++) {
    let state = grid[i];
    let colorIdx = state % numColors;
    let c = paletteCache[colorIdx];

    // ピクセル配列への書き込み (4要素ずつ)
    let pxIndex = i * 4;
    px[pxIndex] = c[0]; // R
    px[pxIndex + 1] = c[1]; // G
    px[pxIndex + 2] = c[2]; // B
    px[pxIndex + 3] = 255; // A
  }

  simImage.updatePixels();
}

/**
 * Debug Info
 * デバッグ情報を画面に表示します。
 */
function drawDebugInfo() {
  fill(0, 0, 0, 150);
  rect(0, height - 100, 250, 100);
  fill(0, 255, 0);
  textSize(14);
  textAlign(LEFT, TOP);
  text(`FPS: ${frameRate().toFixed(1)}`, 10, height - 90);
  text(`Grid: ${columns} x ${rows}`, 10, height - 70);
  text(`Cells: ${columns * rows}`, 10, height - 50);
  text(`Method: Uint8Array + PixelBuffer`, 10, height - 30);
}

/**
 * Helper: Format Date
 * ファイル名用の日時文字列を生成します。
 */
function getFormattedDate() {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, "0");
  const d = String(now.getDate()).padStart(2, "0");
  const h = String(now.getHours()).padStart(2, "0");
  const min = String(now.getMinutes()).padStart(2, "0");
  const s = String(now.getSeconds()).padStart(2, "0");
  return `${y}_${m}${d}_${h}${min}${s}`;
}

// ---------------------------------------------------------
// UI & Interaction Logic
// ---------------------------------------------------------

/**
 * UI Initialization
 * DOM要素の生成とイベントリスナーの設定を行います。
 */
function initializeUI() {
  const container = document.getElementById("sliders-container");

  // パレット選択肢の生成
  const paletteSelect = document.getElementById("palette-select");
  paletteDefinitions.forEach((p, index) => {
    let option = document.createElement("option");
    option.value = index;
    option.text = p.title;
    paletteSelect.appendChild(option);
  });

  // スライダー生成ヘルパー
  const createSlider = (key, label, min, max, step) => {
    let div = document.createElement("div");
    div.className = "control-group";
    div.style.marginBottom = "5px";
    div.style.border = "none";

    let labelEl = document.createElement("label");
    let valSpan = document.createElement("span");
    valSpan.className = "value-display";
    valSpan.innerText = params[key];
    labelEl.innerHTML = `${label} <span class="val">${params[key]}</span>`;

    let input = document.createElement("input");
    input.type = "range";
    input.min = min;
    input.max = max;
    input.step = step;
    input.value = params[key];

    input.oninput = (e) => {
      let val = parseFloat(e.target.value);
      params[key] = val;
      labelEl.querySelector(".val").innerText = val;

      // cellSizeが変更された場合はグリッド再初期化
      if (key === "cellSize") {
        initGrid();
      }
    };

    input.onchange = () => {
      saveState(); // 値確定時に履歴保存
    };

    div.appendChild(labelEl);
    div.appendChild(input);
    container.appendChild(div);

    // 参照を保持して更新可能にする
    params[`_ui_${key}`] = { input, labelEl };
  };

  createSlider("cellSize", "Cell Size (px)", 1, 20, 1); // 最小1pxまで許可
  createSlider("threshold", "Threshold (Neighbors)", 1, 8, 1);
  createSlider("range", "Range (Radius)", 1, 5, 1);
  createSlider("states", "States (Colors)", 2, 16, 1);
  createSlider("noise", "Noise (Mutation)", 0, 0.1, 0.001);
  createSlider("speed", "Speed", 1, 10, 1);

  // キー入力イベント
  window.addEventListener("keydown", (e) => {
    if (e.key === "r" || e.key === "R") {
      if (!isRecording) startRecording();
    } else if (e.key === "s" || e.key === "S") {
      if (isRecording) stopRecording();
    }
  });
}

/**
 * Toggle Tool Window
 */
function toggleToolWindow() {
  const win = document.getElementById("tool-window");
  isToolWindowVisible = !isToolWindowVisible;
  if (isToolWindowVisible) {
    win.classList.remove("hidden");
  } else {
    win.classList.add("hidden");
  }
}

/**
 * Toggle Debug Mode
 */
function toggleDebug() {
  isDebugMode = !isDebugMode;
  document.getElementById("debug-btn").innerText =
    `デバッグモード: ${isDebugMode ? "ON" : "OFF"}`;
}

/**
 * Apply Palette
 */
function applyPaletteByIndex(index) {
  const p = paletteDefinitions[index];
  // p5.Colorオブジェクトに変換して保持
  params.currentColorPalette = p.colors.map((c) =>
    color(c.rgb[0], c.rgb[1], c.rgb[2]),
  );
  updatePaletteCache();
  // UI更新
  document.getElementById("palette-select").value = index;
  updateColorPickers();
}

function applyPaletteFromSelect() {
  const index = document.getElementById("palette-select").value;
  applyPaletteByIndex(parseInt(index));
  saveState();
}

function applyRandomPalette() {
  const index = floor(random(paletteDefinitions.length));
  applyPaletteByIndex(index);
  saveState();
}

/**
 * Update Color Pickers in UI
 * 現在のパレットに基づいてカラーピッカーを再生成します。
 */
function updateColorPickers() {
  // 既存のピッカーがあれば削除して再生成（簡易実装）
  // 本来はID管理すべきだが、ここでは動的生成エリアに追加する
  const container = document.getElementById("sliders-container");

  // 既存のピッカーコンテナを探す
  let pickerContainer = document.getElementById("color-pickers");
  if (!pickerContainer) {
    pickerContainer = document.createElement("div");
    pickerContainer.id = "color-pickers";
    pickerContainer.className = "control-group";
    container.appendChild(pickerContainer);
  }
  pickerContainer.innerHTML =
    '<label>Palette Colors</label><div style="display:flex; flex-wrap:wrap; gap:5px;"></div>';
  const flexBox = pickerContainer.querySelector("div");

  params.currentColorPalette.forEach((c, i) => {
    let input = document.createElement("input");
    input.type = "color";
    // p5 color -> hex
    input.value = "#" + hex(red(c), 2) + hex(green(c), 2) + hex(blue(c), 2);
    input.oninput = (e) => {
      // 色更新
      let newCol = color(e.target.value);
      params.currentColorPalette[i] = newCol;
      updatePaletteCache(); // キャッシュも更新
    };
    input.onchange = () => saveState(); // 確定時保存
    flexBox.appendChild(input);
  });
}

/**
 * Randomize Parameters
 */
function randomizeParams() {
  params.cellSize = floor(random(2, 10));
  params.threshold = floor(random(1, 6));
  params.range = floor(random(1, 3));
  params.states = floor(random(2, 6));
  params.noise = random(0, 0.01);
  params.speed = floor(random(5, 11));

  applyRandomPalette();
  updateUIFromParams();
  initGrid();
  saveState();
}

/**
 * Update UI Elements from Params
 * パラメータ変更をスライダー等の表示に反映します。
 */
function updateUIFromParams() {
  const keys = ["cellSize", "threshold", "range", "states", "noise", "speed"];
  keys.forEach((key) => {
    if (params[`_ui_${key}`]) {
      params[`_ui_${key}`].input.value = params[key];
      params[`_ui_${key}`].labelEl.querySelector(".val").innerText =
        params[key];
    }
  });
}

// ---------------------------------------------------------
// Undo / Redo System
// ---------------------------------------------------------

function saveState() {
  // ディープコピーを作成 (p5.Colorは特殊なので注意)
  const state = {
    params: { ...params },
    paletteColors: params.currentColorPalette.map((c) => c.toString()), // 文字列化して保存
  };
  // 不要なUI参照キーを削除
  Object.keys(state.params).forEach((k) => {
    if (k.startsWith("_ui_")) delete state.params[k];
  });
  delete state.params.currentColorPalette;

  // スタックに追加
  if (undoStack.length > 0) {
    // 直前と同じなら保存しない
    const last = JSON.stringify(undoStack[undoStack.length - 1]);
    if (last === JSON.stringify(state)) return;
  }

  undoStack.push(state);
  if (undoStack.length > MAX_HISTORY) undoStack.shift();
  redoStack = []; // 新しいアクションでRedoはクリア
}

function restoreState(state) {
  // パラメータ復元
  Object.assign(params, state.params);
  // パレット復元
  params.currentColorPalette = state.paletteColors.map((s) => color(s));
  updatePaletteCache();

  updateUIFromParams();
  updateColorPickers();
  initGrid(); // グリッド再生成が必要な変更が含まれる可能性があるため
}

function undo() {
  if (undoStack.length <= 1) return; // 初期状態は残す
  const current = undoStack.pop();
  redoStack.push(current);
  const prev = undoStack[undoStack.length - 1];
  restoreState(prev);
}

function redo() {
  if (redoStack.length === 0) return;
  const next = redoStack.pop();
  undoStack.push(next);
  restoreState(next);
}

// ---------------------------------------------------------
// Export Logic
// ---------------------------------------------------------

/**
 * Export High Resolution Image
 * 現在のシミュレーション状態を維持したまま、高解像度で書き出します。
 * ピクセルデータを拡大して保存するため、レイアウトは崩れません。
 */
function exportHighResImage() {
  // ターゲット解像度: 短辺2160px (4K基準)
  let scaleFactor = Math.max(2160 / width, 2160 / height);
  let exportW = floor(width * scaleFactor);
  let exportH = floor(height * scaleFactor);

  let pg = createGraphics(exportW, exportH);
  pg.noSmooth();
  // 現在のシミュレーション画像を描画（拡大）
  pg.image(simImage, 0, 0, exportW, exportH);

  // ファイル名生成
  const dateStr = getFormattedDate();
  const title = params.title.replace(/\s+/g, "");
  const filename = `Gemini_p5_${title}_${dateStr}_${exportW}x${exportH}`;

  // 画像保存
  save(pg, filename, "jpg");

  // JSONC保存
  exportJsonc(filename);
}

/**
 * Generate and Download JSONC
 */
function exportJsonc(baseFilename) {
  // パラメータの整理
  const exportData = {
    title: params.title,
    date: getFormattedDate(),
    cellSize: params.cellSize,
    threshold: params.threshold,
    range: params.range,
    states: params.states,
    noise: params.noise,
    colors: params.currentColorPalette.map((c) => c.toString()),
  };

  // JSONC文字列の手動構築 (コメント付き)
  let jsonc = `{\n`;
  jsonc += `  "title": "${exportData.title}",\n`;
  jsonc += `  "date": "${exportData.date}",\n`;
  jsonc += `  "cellSize": ${exportData.cellSize},   // Size of each cell in pixels\n`;
  jsonc += `  "threshold": ${exportData.threshold},  // Neighbors required to change state\n`;
  jsonc += `  "range": ${exportData.range},      // Neighborhood radius\n`;
  jsonc += `  "states": ${exportData.states},     // Number of cyclic states\n`;
  jsonc += `  "noise": ${exportData.noise},    // Mutation probability\n`;
  jsonc += `  "colors": [\n`;
  exportData.colors.forEach((c, i) => {
    jsonc += `    "${c}"${i < exportData.colors.length - 1 ? "," : ""}\n`;
  });
  jsonc += `  ]   // Palette colors used\n`;
  jsonc += `}`;

  // Blob作成とダウンロード
  const blob = new Blob([jsonc], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = baseFilename + ".jsonc";
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

/**
 * Video Recording Logic
 * MediaRecorder APIを使用
 */
function toggleRecording() {
  if (isRecording) {
    stopRecording();
  } else {
    startRecording();
  }
}

function startRecording() {
  isRecording = true;
  recordedChunks = [];

  // キャンバスのストリームを取得 (60fps指定)
  const stream = document.querySelector("canvas").captureStream(60);

  // 高ビットレート設定を試みる
  const options = {
    mimeType: "video/webm; codecs=vp9",
    videoBitsPerSecond: 8000000,
  };

  try {
    mediaRecorder = new MediaRecorder(stream, options);
  } catch (e) {
    // フォールバック
    console.warn("VP9 not supported, falling back to default.");
    mediaRecorder = new MediaRecorder(stream);
  }

  mediaRecorder.ondataavailable = (event) => {
    if (event.data.size > 0) {
      recordedChunks.push(event.data);
    }
  };

  mediaRecorder.onstop = exportVideo;

  mediaRecorder.start();

  // UI更新
  const btn = document.getElementById("rec-btn");
  btn.innerText = "⏹ 録画停止 (S)";
  btn.classList.add("recording");
  document.getElementById("recording-status").style.display = "block";

  recordingStartTime = Date.now();
  recordingTimerInterval = setInterval(updateRecordingTimer, 1000);
}

function stopRecording() {
  if (!isRecording || !mediaRecorder) return;

  isRecording = false;
  mediaRecorder.stop();

  // UI更新
  const btn = document.getElementById("rec-btn");
  btn.innerText = "🎥 録画開始 (R)";
  btn.classList.remove("recording");
  document.getElementById("recording-status").style.display = "none";

  clearInterval(recordingTimerInterval);
}

function updateRecordingTimer() {
  const elapsed = Date.now() - recordingStartTime;
  const s = Math.floor((elapsed / 1000) % 60)
    .toString()
    .padStart(2, "0");
  const m = Math.floor(elapsed / 1000 / 60)
    .toString()
    .padStart(2, "0");
  document.getElementById("rec-time").innerText = `${m}:${s}`;
}

function exportVideo() {
  const blob = new Blob(recordedChunks, { type: "video/webm" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.style.display = "none";
  a.href = url;

  const dateStr = getFormattedDate();
  const title = params.title.replace(/\s+/g, "");
  const filename = `Gemini_p5_${title}_${dateStr}_video.webm`;

  a.download = filename;
  document.body.appendChild(a);
  a.click();

  // JSONCも出力
  exportJsonc(filename.replace(".webm", ""));

  setTimeout(() => {
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  }, 100);
}

/**
 * Load Settings from File
 * JSONファイルを読み込んで設定を適用します。
 */
function loadSettingsFromFile(input) {
  const file = input.files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = (e) => {
    try {
      // JSONCのコメントを除去してパース (簡易的な正規表現)
      const jsonStr = e.target.result.replace(/\/\/.*$/gm, "");
      const data = JSON.parse(jsonStr);

      // 値の適用
      if (data.cellSize) params.cellSize = data.cellSize;
      if (data.threshold) params.threshold = data.threshold;
      if (data.range) params.range = data.range;
      if (data.states) params.states = data.states;
      if (data.noise !== undefined) params.noise = data.noise;
      if (data.colors) {
        params.currentColorPalette = data.colors.map((c) => color(c));
        updatePaletteCache();
      }

      // UI更新とグリッド再初期化
      updateUIFromParams();
      updateColorPickers();
      initGrid();
      saveState(); // 履歴に追加

      // inputリセット
      input.value = "";
    } catch (err) {
      console.error("Failed to load JSON", err);
      alert("ファイルの読み込みに失敗しました。形式を確認してください。");
    }
  };
  reader.readAsText(file);
}
