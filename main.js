const fileInput = document.getElementById("fileInput");
const uploadBtn = document.getElementById("uploadBtn");
const previewArea = document.getElementById("previewArea");
const extractedTextEl = document.getElementById("extractedText");
const statusEl = document.getElementById("status");

const progressContainer = document.getElementById("progressContainer");
const progressBar = document.getElementById("progressBar");

let selectedFile = null;

// ---------------------- FILE PREVIEW -------------------------
fileInput.addEventListener("change", (e) => {
    const file = e.target.files[0];
    if (!file) return;

    selectedFile = file;
    previewArea.innerHTML = "";

    if (file.type.startsWith("image/")) {
        const img = document.createElement("img");
        img.src = URL.createObjectURL(file);
        img.className = "preview-img";
        previewArea.appendChild(img);
    } else if (file.type === "application/pdf") {
        previewArea.textContent = "PDF Selected ✔";
    } else {
        previewArea.textContent = "Unsupported file type.";
    }
});

// ---------------------- UPLOAD WITH PROGRESS -------------------------
uploadBtn.onclick = () => {
    if (!selectedFile) {
        alert("Please select a file.");
        return;
    }

    statusEl.textContent = "Uploading...";
    extractedTextEl.textContent = "";

    const form = new FormData();
    form.append("file", selectedFile);

    const xhr = new XMLHttpRequest();
    xhr.open("POST", "http://127.0.0.1:5000/api/ocr");  // IMPORTANT FIX

    progressContainer.style.display = "block";
    progressBar.style.width = "0%";

    xhr.upload.onprogress = (e) => {
        if (e.lengthComputable) {
            let percent = Math.round((e.loaded / e.total) * 100);
            progressBar.style.width = percent + "%";
        }
    };

    xhr.onload = () => {
        try {
            const res = JSON.parse(xhr.responseText);
            statusEl.textContent = res.status || "Completed";
            extractedTextEl.textContent = res.text || "No text extracted";
        } catch (err) {
            statusEl.textContent = "Server returned invalid JSON.";
        }
        progressBar.style.width = "100%";
    };

    xhr.onerror = () => {
        statusEl.textContent = "Upload failed.";
    };

    xhr.send(form);
};
