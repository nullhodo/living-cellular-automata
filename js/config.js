/**
 * config.js
 * グローバル変数、パラメータ、カラーパレットの定義
 */

// グローバル変数
let columns, rows;
let grid; 
let nextGrid;
let simImage; // 描画用のp5.Image
let paletteCache = []; // 配色をRGBA配列としてキャッシュ

let cellSize = 4;
let lastUpdateTime = 0;

// カラーパレット定義
const paletteDefinitions = [
  {
    title: "Grayscale (Default)",
    comment: "グレースケール5色のグラデーション",
    colors: [
      { name: "Black", hex: "#111111", rgb: [17, 17, 17] },
      { name: "Dark Gray", hex: "#444444", rgb: [68, 68, 68] },
      { name: "Gray", hex: "#888888", rgb: [136, 136, 136] },
      { name: "Light Gray", hex: "#BBBBBB", rgb: [187, 187, 187] },
      { name: "White", hex: "#EEEEEE", rgb: [238, 238, 238] },
    ],
  },
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
  cellSize: 4, 
  threshold: 3, 
  range: 1, 
  states: 5, 
  noise: 0.0, 
  speed: 1, 
  currentColorPalette: [], 
};

// UI・システム状態管理
let isDebugMode = false;
let isToolWindowVisible = true;
let undoStack = [];
let redoStack = [];
const MAX_HISTORY = 20;

let mediaRecorder;
let recordedChunks = [];
let isRecording = false;
let recordingStartTime = 0;
let recordingTimerInterval;
