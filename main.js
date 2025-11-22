const fileInput = document.getElementById('fileInput');
const uploadBtn = document.getElementById('uploadBtn');
const previewArea = document.getElementById('previewArea');
const extractedTextEl = document.getElementById('extractedText');
const statusEl = document.getElementById('status');

let selectedFile = null;

fileInput.addEventListener('change', (e) => {
  const file = e.target.files[0];
  if (!file) return;

  selectedFile = file;
  previewArea.innerHTML = '';

  // Show preview only if image
  if (file.type.startsWith("image/")) {
      const img = document.createElement('img');
      img.src = URL.createObjectURL(file);
      img.onload = () => URL.revokeObjectURL(img.src);
      img.className = 'preview-img';
      previewArea.appendChild(img);
  } else if (file.type === "application/pdf") {
      previewArea.textContent = "PDF selected ✔";
  }
});

uploadBtn.addEventListener('click', async () => {
  if (!selectedFile) {
    alert('Please choose a file first');
    return;
  }

  statusEl.textContent = 'Uploading...';
  extractedTextEl.textContent = '';

  const form = new FormData();
  form.append('file', selectedFile);

  try {
    const resp = await fetch('/api/ocr', { method: 'POST', body: form });

    if (!resp.ok) {
      const err = await resp.json();
      statusEl.textContent = 'Error: ' + (err.error || resp.statusText);
      return;
    }

    const data = await resp.json();

    statusEl.textContent = data.status || 'Done';
    extractedTextEl.textContent = data.text || 'No text found.';

  } catch (err) {
    statusEl.textContent = 'Upload failed: ' + err.message;
  }
});
