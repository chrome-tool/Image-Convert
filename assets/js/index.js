const state = {
  files: [],
  previewWidth: 0,
  previewHeight: 0,
  formats: [],
  extByMime: {},
};

const FORMAT_CANDIDATES = [
  { mime: "image/png", extension: "png", label: "PNG" },
  { mime: "image/jpeg", extension: "jpg", label: "JPG" },
  { mime: "image/webp", extension: "webp", label: "WEBP" },
  { mime: "image/avif", extension: "avif", label: "AVIF" },
  { mime: "image/bmp", extension: "bmp", label: "BMP" },
  { mime: "image/gif", extension: "gif", label: "GIF" },
  { mime: "image/tiff", extension: "tiff", label: "TIFF" },
  { mime: "image/vnd.microsoft.icon", extension: "ico", label: "ICO" },
  { mime: "image/x-icon", extension: "ico", label: "ICO (X-ICON)" },
  { mime: "image/heif", extension: "heif", label: "HEIF" },
  { mime: "image/heic", extension: "heic", label: "HEIC" },
  { mime: "image/jxl", extension: "jxl", label: "JXL" },
  { mime: "image/jp2", extension: "jp2", label: "JPEG 2000" },
  { mime: "image/svg+xml", extension: "svg", label: "SVG" },
];

const els = {};

document.addEventListener("DOMContentLoaded", () => {
  els.imageInput = document.getElementById("imageInput");
  els.dropzone = document.getElementById("dropzone");
  els.fileName = document.getElementById("fileName");
  els.fileList = document.getElementById("fileList");
  els.convertFileType = document.getElementById("convertFileType");
  els.quality = document.getElementById("quality");
  els.qualityValue = document.getElementById("qualityValue");
  els.width = document.getElementById("width");
  els.height = document.getElementById("height");
  els.keepAspect = document.getElementById("keepAspect");
  els.imagePreview = document.getElementById("imagePreview");
  els.imageMeta = document.getElementById("imageMeta");
  els.convertBtn = document.getElementById("convertBtn");
  els.statusMessage = document.getElementById("statusMessage");
  els.loading = document.getElementById("loading");
  els.loadingText = document.getElementById("loadingText");

  initializeFormats();
  bindEvents();
  updateQualityText();
  updateQualityState();
  updateConvertButtonLabel();
  renderFileList();
});

function initializeFormats() {
  const supported = FORMAT_CANDIDATES.filter((format) => supportsMime(format.mime));
  state.formats = supported.length ? supported : [FORMAT_CANDIDATES[0]];

  state.extByMime = {};
  state.formats.forEach((format) => {
    state.extByMime[format.mime] = format.extension;
  });

  els.convertFileType.innerHTML = "";
  state.formats.forEach((format) => {
    const option = document.createElement("option");
    option.value = format.mime;
    option.dataset.extension = format.extension;
    option.textContent = format.label;
    els.convertFileType.appendChild(option);
  });
}

function supportsMime(mimeType) {
  try {
    const canvas = document.createElement("canvas");
    const data = canvas.toDataURL(mimeType);
    return data.startsWith(`data:${mimeType}`);
  } catch (error) {
    return false;
  }
}

function bindEvents() {
  els.imageInput.addEventListener("change", (event) => {
    const selectedFiles = Array.from(event.target.files || []);
    handleFileSelection(selectedFiles);
  });

  els.dropzone.addEventListener("click", () => els.imageInput.click());
  els.dropzone.addEventListener("keydown", (event) => {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      els.imageInput.click();
    }
  });

  ["dragenter", "dragover"].forEach((eventName) => {
    els.dropzone.addEventListener(eventName, (event) => {
      event.preventDefault();
      els.dropzone.classList.add("is-dragging");
    });
  });

  ["dragleave", "drop"].forEach((eventName) => {
    els.dropzone.addEventListener(eventName, (event) => {
      event.preventDefault();
      els.dropzone.classList.remove("is-dragging");
    });
  });

  els.dropzone.addEventListener("drop", (event) => {
    const droppedFiles = Array.from((event.dataTransfer && event.dataTransfer.files) || []);
    handleFileSelection(droppedFiles);
  });

  document.body.addEventListener("dragover", (event) => event.preventDefault());
  document.body.addEventListener("drop", (event) => event.preventDefault());

  els.convertBtn.addEventListener("click", convertFiles);
  els.convertFileType.addEventListener("change", updateQualityState);
  els.quality.addEventListener("input", updateQualityText);

  els.width.addEventListener("input", () => onDimensionChanged("width"));
  els.height.addEventListener("input", () => onDimensionChanged("height"));
}

function updateQualityText() {
  els.qualityValue.textContent = `${els.quality.value}%`;
}

function updateQualityState() {
  const mimeType = els.convertFileType.value;
  const canControlQuality = mimeType === "image/jpeg" || mimeType === "image/webp" || mimeType === "image/avif";
  els.quality.disabled = !canControlQuality;
  els.qualityValue.style.opacity = canControlQuality ? "1" : "0.5";
}

function setStatus(message, type) {
  els.statusMessage.textContent = message || "";
  els.statusMessage.classList.remove("is-success", "is-error");
  if (type) {
    els.statusMessage.classList.add(type === "error" ? "is-error" : "is-success");
  }
}

function showLoading(isVisible, text) {
  els.loading.style.display = isVisible ? "block" : "none";
  els.loading.setAttribute("aria-hidden", isVisible ? "false" : "true");
  els.loadingText.textContent = text || "Converting...";
  els.convertBtn.disabled = isVisible;
}

function isImageFile(file) {
  return Boolean(file && file.type && file.type.startsWith("image/"));
}

function clearSelection() {
  state.files = [];
  state.previewWidth = 0;
  state.previewHeight = 0;
  els.fileName.textContent = "No files selected";
  els.imageMeta.textContent = "No image loaded";
  els.imagePreview.style.backgroundImage = "none";
  renderFileList();
  updateConvertButtonLabel();
}

function renderFileList() {
  if (!els.fileList) {
    return;
  }

  els.fileList.innerHTML = "";
  if (!state.files.length) {
    const li = document.createElement("li");
    li.textContent = "No files selected";
    els.fileList.appendChild(li);
    return;
  }

  const maxVisible = 8;
  state.files.slice(0, maxVisible).forEach((file) => {
    const li = document.createElement("li");
    li.textContent = file.name;
    els.fileList.appendChild(li);
  });

  if (state.files.length > maxVisible) {
    const li = document.createElement("li");
    li.textContent = `... and ${state.files.length - maxVisible} more`;
    els.fileList.appendChild(li);
  }
}

function updateConvertButtonLabel() {
  const count = state.files.length;
  els.convertBtn.textContent = count > 1 ? `Convert ${count} Files` : "Convert and Download";
}

async function handleFileSelection(candidateFiles) {
  const validFiles = candidateFiles.filter(isImageFile);
  if (!validFiles.length) {
    clearSelection();
    setStatus("Please select one or more valid image files.", "error");
    return;
  }

  state.files = validFiles;
  els.fileName.textContent = `${validFiles.length} file(s) selected`;
  renderFileList();
  updateConvertButtonLabel();

  try {
    const preview = await loadPreviewInfo(validFiles[0]);
    state.previewWidth = preview.width;
    state.previewHeight = preview.height;
    els.imagePreview.style.backgroundImage = `url('${preview.dataUrl}')`;
    const suffix = validFiles.length > 1 ? ` | Total ${validFiles.length} files` : "";
    els.imageMeta.textContent = `${preview.width} x ${preview.height}px${suffix}`;
    setStatus("Files loaded. Ready for batch conversion.");
  } catch (error) {
    console.error(error);
    setStatus("Failed to read selected files.", "error");
  }
}

function onDimensionChanged(changedField) {
  if (!els.keepAspect.checked || !state.previewWidth || !state.previewHeight) {
    return;
  }

  const widthValue = toPositiveInt(els.width.value);
  const heightValue = toPositiveInt(els.height.value);

  if (changedField === "width" && widthValue && !heightValue) {
    els.height.value = String(Math.round((widthValue * state.previewHeight) / state.previewWidth));
    return;
  }

  if (changedField === "height" && heightValue && !widthValue) {
    els.width.value = String(Math.round((heightValue * state.previewWidth) / state.previewHeight));
  }
}

function toPositiveInt(value) {
  const parsed = Number.parseInt(value, 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : 0;
}

function getTargetSize(originalWidth, originalHeight) {
  const widthValue = toPositiveInt(els.width.value);
  const heightValue = toPositiveInt(els.height.value);

  if (!originalWidth || !originalHeight) {
    return { width: 0, height: 0 };
  }

  if (widthValue && heightValue) {
    return { width: widthValue, height: heightValue };
  }

  if (widthValue) {
    const height = els.keepAspect.checked
      ? Math.round((widthValue * originalHeight) / originalWidth)
      : originalHeight;
    return { width: widthValue, height };
  }

  if (heightValue) {
    const width = els.keepAspect.checked
      ? Math.round((heightValue * originalWidth) / originalHeight)
      : originalWidth;
    return { width, height: heightValue };
  }

  return { width: originalWidth, height: originalHeight };
}

function getOutputFileName(originalName, mimeType) {
  const baseName = originalName.includes(".")
    ? originalName.slice(0, originalName.lastIndexOf("."))
    : originalName;
  const extension = state.extByMime[mimeType] || "png";
  return `${baseName}.${extension}`;
}

function canvasToBlob(canvas, mimeType, quality) {
  return new Promise((resolve) => {
    canvas.toBlob((blob) => resolve(blob), mimeType, quality);
  });
}

function triggerDownload(blob, fileName) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = fileName;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

function loadPreviewInfo(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const img = new Image();
      img.onload = () => {
        resolve({ width: img.width, height: img.height, dataUrl: reader.result });
      };
      img.onerror = reject;
      img.src = reader.result;
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

function loadImageFromFile(file) {
  return new Promise((resolve, reject) => {
    const objectUrl = URL.createObjectURL(file);
    const image = new Image();
    image.onload = () => {
      URL.revokeObjectURL(objectUrl);
      resolve(image);
    };
    image.onerror = (error) => {
      URL.revokeObjectURL(objectUrl);
      reject(error);
    };
    image.src = objectUrl;
  });
}

function sleep(ms) {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

async function convertSingleFile(file, mimeType, quality) {
  const image = await loadImageFromFile(file);
  const size = getTargetSize(image.width, image.height);
  if (!size.width || !size.height) {
    throw new Error("Invalid target size");
  }

  const canvas = document.createElement("canvas");
  canvas.width = size.width;
  canvas.height = size.height;

  const ctx = canvas.getContext("2d");
  if (!ctx) {
    throw new Error("Canvas context is unavailable");
  }

  if (mimeType === "image/jpeg" || mimeType === "image/bmp") {
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  }

  ctx.drawImage(image, 0, 0, size.width, size.height);

  const useQuality = mimeType === "image/jpeg" || mimeType === "image/webp" || mimeType === "image/avif";
  const blob = await canvasToBlob(canvas, mimeType, useQuality ? quality : undefined);
  if (!blob) {
    throw new Error("Conversion returned empty blob");
  }

  const outputFileName = getOutputFileName(file.name, mimeType);
  triggerDownload(blob, outputFileName);
}

async function convertFiles() {
  if (!state.files.length) {
    setStatus("Please choose at least one image before converting.", "error");
    return;
  }

  showLoading(true, `Converting 1/${state.files.length}...`);
  setStatus("");

  const mimeType = els.convertFileType.value;
  const quality = Number(els.quality.value) / 100;
  let successCount = 0;
  let failedCount = 0;

  try {
    for (let i = 0; i < state.files.length; i += 1) {
      const file = state.files[i];
      const stepText = `Converting ${i + 1}/${state.files.length}: ${file.name}`;
      showLoading(true, stepText);
      try {
        await convertSingleFile(file, mimeType, quality);
        successCount += 1;
      } catch (error) {
        console.error(error);
        failedCount += 1;
      }
      await sleep(80);
    }

    if (failedCount > 0) {
      setStatus(
        `Batch completed: ${successCount} succeeded, ${failedCount} failed.`,
        failedCount === state.files.length ? "error" : "success"
      );
      return;
    }

    setStatus(`Batch conversion completed: ${successCount} file(s) downloaded.`, "success");
  } finally {
    showLoading(false);
  }
}
