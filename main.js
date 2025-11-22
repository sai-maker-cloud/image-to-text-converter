const fileInput = document.getElementById('fileInput');
const uploadBtn = document.getElementById('uploadBtn');
const previewArea = document.getElementById('previewArea');
const extractedTextEl = document.getElementById('extractedText');
const statusEl = document.getElementById('status');
const progressBarEl = document.getElementById('progressBar'); // New element
const progressBarContainerEl = document.getElementById('progressBarContainer'); // New element

let selectedFile = null;
let currentTaskId = null;

// --- Utility Functions ---

function resetUI(message = '') {
  statusEl.textContent = message;
  extractedTextEl.textContent = '';
  progressBarEl.style.width = '0%';
  progressBarContainerEl.style.display = 'none';
}

function updateStatus(message, isError = false) {
  statusEl.textContent = message;
  statusEl.style.color = isError ? 'red' : '#6b7280';
}

// --- Event Listeners ---

fileInput.addEventListener('change', (e) => {
  const file = e.target.files[0];
  if (!file) return;

  selectedFile = file;
  previewArea.innerHTML = '';
  resetUI('File selected, ready to upload.');

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

  // Determine API endpoint
  const isPDF = selectedFile.type === "application/pdf";
  const endpoint = isPDF ? '/api/pdf' : '/api/image';
  
  // Reset UI and show status
  resetUI();
  updateStatus('Preparing upload...');
  uploadBtn.disabled = true;

  const form = new FormData();
  form.append('file', selectedFile);

  try {
    // 1. UPLOAD (Sync for Image, Async for PDF)
    const resp = await fetch(endpoint, { method: 'POST', body: form });

    if (!resp.ok) {
      const err = await resp.json();
      updateStatus('Upload Error: ' + (err.error || resp.statusText), true);
      uploadBtn.disabled = false;
      return;
    }

    const data = await resp.json();

    if (!isPDF) {
      // Image OCR is synchronous
      updateStatus(data.status || 'Image OCR Done');
      extractedTextEl.textContent = data.text || 'No text found.';
      uploadBtn.disabled = false;
      return;
    } 
    
    // 2. PDF ASYNC PROCESSING & POLLING
    currentTaskId = data.task_id;
    progressBarContainerEl.style.display = 'block';
    
    // Start polling the progress endpoint
    pollProgress();

  } catch (err) {
    updateStatus('Upload failed: ' + err.message, true);
    uploadBtn.disabled = false;
  }
});


async function pollProgress() {
  if (!currentTaskId) return;

  const pollInterval = setInterval(async () => {
    try {
      const resp = await fetch(`/api/progress/${currentTaskId}`);
      
      if (!resp.ok) {
        clearInterval(pollInterval);
        const err = await resp.json();
        updateStatus('Polling Error: ' + (err.error || resp.statusText), true);
        uploadBtn.disabled = false;
        return;
      }
      
      const data = await resp.json();
      const progress = data.progress;
      
      // Update progress bar
      progressBarEl.style.width = `${progress}%`;
      updateStatus(`Processing: ${progress}%...`);

      if (progress === 100) {
        // Task is complete
        clearInterval(pollInterval);
        updateStatus('PDF Processing Done.');
        extractedTextEl.textContent = data.text || 'No text found.';
        uploadBtn.disabled = false;
        currentTaskId = null;
      }
      
    } catch (err) {
      clearInterval(pollInterval);
      updateStatus('Progress polling failed: ' + err.message, true);
      uploadBtn.disabled = false;
    }
  }, 1000); // Poll every 1 second
}
