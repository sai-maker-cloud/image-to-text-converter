from flask import Flask, request, jsonify, render_template
from flask_cors import CORS
import threading
import time
import uuid
import io
import numpy as np
import cv2
import easyocr
import PyPDF2
from pdf2image import convert_from_bytes

app = Flask(__name__)
CORS(app)

# Store progress { task_id: {progress, text} }
tasks = {}

# Initialize EasyOCR
try:
    reader = easyocr.Reader(['en'], gpu=True)
    print("EasyOCR initialized on GPU")
except:
    reader = easyocr.Reader(['en'], gpu=False)
    print("EasyOCR initialized on CPU")


def process_pdf_background(task_id, file_bytes):
    """Process PDF in background with progress tracking"""

    tasks[task_id] = {"progress": 0, "text": ""}

    pdf_reader = PyPDF2.PdfReader(io.BytesIO(file_bytes))
    total_pages = len(pdf_reader.pages)

    # Convert ALL pages at once (Fix for multiple pages)
    all_images = convert_from_bytes(file_bytes)

    collected_text = ""

    for i, page in enumerate(pdf_reader.pages):
        # Update progress
        tasks[task_id]["progress"] = int((i / total_pages) * 100)

        # Try text extraction first
        extracted = page.extract_text()

        if extracted and extracted.strip():
            collected_text += f"\n--- Page {i+1} (Text) ---\n"
            collected_text += extracted + "\n"

        else:
            # Fallback to OCR using the pre-rendered page image
            img = all_images[i]

            cv_img = cv2.cvtColor(np.array(img), cv2.COLOR_RGB2BGR)
            gray = cv2.cvtColor(cv_img, cv2.COLOR_BGR2GRAY)

            results = reader.readtext(gray)
            ocr_text = "\n".join([r[1] for r in results])

            collected_text += f"\n--- Page {i+1} (OCR) ---\n"
            collected_text += ocr_text + "\n"

        time.sleep(0.3)  # smooth progress updates

    tasks[task_id]["text"] = collected_text
    tasks[task_id]["progress"] = 100  # finished


@app.route('/api/pdf', methods=['POST'])
def upload_pdf():
    if 'file' not in request.files:
        return jsonify({"error": "No file found"}), 400

    file = request.files['file']
    file_bytes = file.read()

    task_id = str(uuid.uuid4())

    # Run background thread
    threading.Thread(target=process_pdf_background, args=(task_id, file_bytes)).start()

    return jsonify({"task_id": task_id})


@app.route('/api/progress/<task_id>')
def progress(task_id):
    if task_id not in tasks:
        return jsonify({"error": "Invalid task ID"}), 404

    return jsonify({
        "progress": tasks[task_id]["progress"],
        "text": tasks[task_id]["text"] if tasks[task_id]["progress"] == 100 else ""
    })


@app.route('/')
def index():
    return render_template('index.html')


if __name__ == '__main__':
    app.run(debug=True, host='0.0.0.0', port=5000)
