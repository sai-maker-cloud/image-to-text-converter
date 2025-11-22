from flask import Flask, request, jsonify, render_template
from flask_cors import CORS
import numpy as np
import io
import easyocr
import cv2
import PyPDF2   # <--- NEW: to extract text from PDF

app = Flask(__name__)
CORS(app)

# Initialize EasyOCR
try:
    reader = easyocr.Reader(['en'], gpu=True)
    print("EasyOCR reader initialized on GPU.")
except:
    reader = easyocr.Reader(['en'], gpu=False)
    print("EasyOCR reader initialized on CPU.")

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/api/ocr', methods=['POST'])
def ocr_endpoint():
    if 'file' not in request.files:
        return jsonify({'error': 'No file found under key "file"'}), 400

    file = request.files['file']

    if file.filename == '':
        return jsonify({'error': 'No file selected'}), 400

    filename = file.filename.lower()

    # ------------------------------
    # 🔍 If file is PDF → extract text
    # ------------------------------
    if filename.endswith('.pdf'):
        try:
            pdf_reader = PyPDF2.PdfReader(file)
            text = ""

            for page in pdf_reader.pages:
                text += page.extract_text() + "\n"

            return jsonify({
                'status': 'PDF uploaded successfully',
                'text': text.strip()
            })

        except Exception as e:
            return jsonify({'error': f'PDF processing failed: {str(e)}'}), 500

    # ------------------------------
    # 🔍 Else assume IMAGE OCR
    # ------------------------------
    try:
        image_bytes = file.read()

        nparr = np.frombuffer(image_bytes, np.uint8)
        img = cv2.imdecode(nparr, cv2.IMREAD_COLOR)

        gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)

        clahe = cv2.createCLAHE(clipLimit=2.0, tileGridSize=(8, 8))
        enhanced_gray = clahe.apply(gray)

        _, buffer = cv2.imencode('.png', enhanced_gray)
        processed_image_bytes = buffer.tobytes()

        results = reader.readtext(processed_image_bytes)
        text = "\n".join([res[1] for res in results])

        return jsonify({
            'status': 'Image uploaded successfully',
            'text': text.strip()
        })

    except Exception as e:
        return jsonify({'error': str(e)}), 500

if __name__ == '__main__':
    app.run(debug=True, host='0.0.0.0', port=5000)

