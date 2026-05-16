/**
 * export.js
 * 画像、動画のエクスポート、設定（JSONC）の保存と読み込み
 */

function exportHighResImage() {
  let scaleFactor = Math.max(2160 / width, 2160 / height);
  let exportW = floor(width * scaleFactor);
  let exportH = floor(height * scaleFactor);

  let pg = createGraphics(exportW, exportH);
  pg.noSmooth();
  pg.image(simImage, 0, 0, exportW, exportH);

  const dateStr = getFormattedDate();
  const title = params.title.replace(/\s+/g, "");
  const filename = `Gemini_p5_${title}_${dateStr}_${exportW}x${exportH}`;

  save(pg, filename, "jpg");
  exportJsonc(filename);
}

function exportJsonc(baseFilename) {
  const exportData = {
    title: params.title,
    date: getFormattedDate(),
    cellSize: params.cellSize,
    threshold: params.threshold,
    range: params.range,
    states: params.states,
    noise: params.noise,
    useNoise: params.useNoise,
    colors: params.currentColorPalette.map((c) => c.toString()),
  };

  let jsonc = `{\n`;
  jsonc += `  "title": "${exportData.title}",\n`;
  jsonc += `  "date": "${exportData.date}",\n`;
  jsonc += `  "cellSize": ${exportData.cellSize},   // Size of each cell in pixels\n`;
  jsonc += `  "threshold": ${exportData.threshold},  // Neighbors required to change state\n`;
  jsonc += `  "range": ${exportData.range},      // Neighborhood radius\n`;
  jsonc += `  "states": ${exportData.states},     // Number of cyclic states\n`;
  jsonc += `  "noise": ${exportData.noise},    // Mutation probability\n`;
  jsonc += `  "useNoise": ${exportData.useNoise}, // Whether noise is enabled\n`;
  jsonc += `  "colors": [\n`;
  exportData.colors.forEach((c, i) => {
    jsonc += `    "${c}"${i < exportData.colors.length - 1 ? "," : ""}\n`;
  });
  jsonc += `  ]   // Palette colors used\n`;
  jsonc += `}`;

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

  const stream = document.querySelector("canvas").captureStream(60);
  const options = {
    mimeType: "video/webm; codecs=vp9",
    videoBitsPerSecond: 8000000,
  };

  try {
    mediaRecorder = new MediaRecorder(stream, options);
  } catch (e) {
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

  const btn = document.getElementById("rec-btn");
  btn.innerText = "🎥 録画開始 (R)";
  btn.classList.remove("recording");
  document.getElementById("recording-status").style.display = "none";

  clearInterval(recordingTimerInterval);
}

function updateRecordingTimer() {
  const elapsed = Date.now() - recordingStartTime;
  const s = Math.floor((elapsed / 1000) % 60).toString().padStart(2, "0");
  const m = Math.floor(elapsed / 1000 / 60).toString().padStart(2, "0");
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

  exportJsonc(filename.replace(".webm", ""));

  setTimeout(() => {
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  }, 100);
}

function loadSettingsFromFile(input) {
  const file = input.files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = (e) => {
    try {
      const jsonStr = e.target.result.replace(/\/\/.*$/gm, "");
      const data = JSON.parse(jsonStr);

      if (data.cellSize) params.cellSize = data.cellSize;
      if (data.threshold) params.threshold = data.threshold;
      if (data.range) params.range = data.range;
      if (data.states) params.states = data.states;
      if (data.noise !== undefined) params.noise = data.noise;
      if (data.useNoise !== undefined) params.useNoise = data.useNoise;
      if (data.colors) {
        params.currentColorPalette = data.colors.map((c) => color(c));
        updatePaletteCache();
      }

      updateUIFromParams();
      updateColorPickers();
      initGrid();
      saveState();

      input.value = "";
    } catch (err) {
      console.error("Failed to load JSON", err);
      alert("ファイルの読み込みに失敗しました。形式を確認してください。");
    }
  };
  reader.readAsText(file);
}

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
