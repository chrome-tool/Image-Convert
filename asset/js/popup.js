document.addEventListener('DOMContentLoaded', function () {
    // image
    const imageInput = document.getElementById('imageInput');
    // preview
    const imagePreview = document.getElementById('imagePreview');
    // convert button
    const convertBtn = document.getElementById('convertBtn');
    // conver File Type
    const select = document.getElementById('converFileType');
    // image change.
    imageInput.addEventListener('change', function () {
        const file = imageInput.files[0];
        // file check
        if (!file) {
            imagePreview.style.backgroundImage = 'none';
            return;
        }

        if (!file.type.includes('image')) {
            alert('Please select a PNG image file.');
            imageInput.value = '';
            imagePreview.style.backgroundImage = 'none';
            return;
        }
        // read seleted image
        const reader = new FileReader();
        reader.onload = function (event) {
            imagePreview.style.backgroundImage = `url('${event.target.result}')`;
        };
        reader.readAsDataURL(file);
    });

    // conver button click
    convertBtn.addEventListener('click', function () {
        showLoading();
        const file = imageInput.files[0];
        // file check
        if (!file) {
            hideLoading();
            alert('Please select a image file.');
            return;
        }

        if (!file.type.includes('image')) {
            hideLoading();
            alert('Please select a image file.');
            return;
        }
        // target type check
        const converFileType = select.options[select.selectedIndex];
        if (!converFileType) {
            hideLoading();
            alert('Please select target file type.');
            return;
        }

        // read seleted image
        const reader = new FileReader();
        reader.onload = async function (event) {
            // get base64 content
            const base64Data = event.target.result;
            // create a canvas
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');
            const targetHeight = document.getElementById('height').value;
            const targetWidth = document.getElementById('width').value;
            const img = new Image();
            await loadImage(img, base64Data)
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

            const blob = await new Promise(resolve => canvas.toBlob(resolve, converFileType.value, 1));
            const url = URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = `${file.name.substring(0, file.name.lastIndexOf('.'))}.${converFileType.label}`;
            link.click();
            URL.revokeObjectURL(url);
            hideLoading();
        };

        reader.onerror = function() {
            hideLoading();
            alert('Failed to load the image.');
        }
        reader.readAsDataURL(file);
    });
});

function loadImage(img, src) {
    return new Promise((resolve, reject) => {
        img.onload = () => resolve(img);
        img.onerror = (e) => reject(e);
        img.src = src;
    });
}

function showLoading() {
    const loadingElement = document.getElementById('loading');
    loadingElement.style.display = 'block';
}

function hideLoading() {
    const loadingElement = document.getElementById('loading');
    loadingElement.style.display = 'none';
}
