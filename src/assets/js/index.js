var file;
document.addEventListener("DOMContentLoaded", function () {
  const imageInput = document.getElementById("imageInput");
  const convertBtn = document.getElementById("convertBtn");
  imageInput.addEventListener("change", fileSelect);
  convertBtn.addEventListener("click", convertFile);
  document.querySelector(".delete").addEventListener("click", hideErrorMsg);
  document.body.addEventListener("drop", dropHandler);
  document.body.addEventListener("dragover", dragOverHandler);
});

function loadImage(img, src) {
  return new Promise((resolve, reject) => {
    img.onload = () => resolve(img);
    img.onerror = (e) => reject(e);
    img.src = src;
  });
}

function showLoading() {
  const element = document.getElementById("loading");
  element.style.display = "block";
}

function hideLoading() {
  const element = document.getElementById("loading");
  element.style.display = "none";
}

function showErrorMsg(msg) {
  const elementMsg = document.getElementById("message");
  elementMsg.innerHTML = msg;
  const elementContainer = document.getElementById("modal");
  elementContainer.style.display = "block";
}

function hideErrorMsg() {
  const elementMsg = document.getElementById("message");
  elementMsg.innerHTML = null;
  const elementContainer = document.getElementById("modal");
  elementContainer.style.display = "none";
}

function fileSelect(e) {
  file = e.target.files[0];
  const filename = document.querySelector(".file-name");
  const imagePreview = document.getElementById("imagePreview");
  if (!file) {
    imagePreview.style.backgroundImage = "none";
    filename.innerHTML = "";
    return;
  }

  if (!file.type.includes("image")) {
    showErrorMsg("Please select a image file.");
    e.target.value = "";
    imagePreview.style.backgroundImage = "none";
    filename.innerHTML = "";
    return;
  }

  filename.innerHTML = file.name;
  const reader = new FileReader();
  reader.onload = function (event) {
    imagePreview.style.backgroundImage = `url('${event.target.result}')`;
  };
  reader.readAsDataURL(file);
}

function convertFile() {
  showLoading();
  if (!file) {
    hideLoading();
    showErrorMsg("Please select a image file.");
    return;
  }

  if (!file.type.includes("image")) {
    hideLoading();
    showErrorMsg("Please select a image file.");
    return;
  }
  const select = document.getElementById("converFileType");
  const converFileType = select.options[select.selectedIndex];
  if (!converFileType) {
    hideLoading();
    showErrorMsg("Please select target file type.");
    return;
  }

  const reader = new FileReader();
  reader.onload = async function (event) {
    const base64Data = event.target.result;
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");
    const targetHeight = document.getElementById("height").value;
    const targetWidth = document.getElementById("width").value;
    const img = new Image();
    await loadImage(img, base64Data);
    if (targetHeight && targetWidth) {
      canvas.width = targetWidth;
      canvas.height = targetHeight;
      ctx.drawImage(img, 0, 0, targetWidth, targetHeight);
    } else if (targetWidth) {
      canvas.width = targetWidth;
      canvas.height = img.height;
      ctx.drawImage(img, 0, 0, targetWidth, img.height);
    } else if (targetHeight) {
      canvas.width = img.width;
      canvas.height = targetHeight;
      ctx.drawImage(img, 0, 0, img.width, targetHeight);
    } else {
      canvas.width = img.width;
      canvas.height = img.height;
      ctx.drawImage(img, 0, 0);
    }
    try {
      const blob = await new Promise((resolve) =>
        canvas.toBlob(resolve, converFileType.value, 1)
      );
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `${file.name.substring(0, file.name.lastIndexOf("."))}.${
        converFileType.label
      }`;
      link.click();
      URL.revokeObjectURL(url);
    } catch (e) {
      console.error(e);
      showErrorMsg("Failed to Convert the image.");
    } finally {
      hideLoading();
    }
  };

  reader.onerror = function () {
    hideLoading();
    showErrorMsg("Failed to load the image.");
  };
  reader.readAsDataURL(file);
}

function dropHandler(event) {
  event.preventDefault();
  const file = event.dataTransfer.files[0];
  handleFiles(file);
}
function dragOverHandler(event) {
  event.preventDefault();
}
function handleFiles(file) {
  let obj = {
    target: {
      files: [file],
    },
  };
  fileSelect(obj);
}
