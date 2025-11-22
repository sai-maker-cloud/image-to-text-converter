from flask import Flask, request, jsonify, render_template
from flask_cors import CORS
import numpy as np
import io
import easyocr
import cv2
import PyPDF2
from pdf2image import convert_from_bytes

app = Flask(__name__)
CORS(app)

# Initialize EasyOCR
try:
    reader = easyocr.Reader(['en'], gpu=True)
    print("EasyOCR initialized on GPU")
except:
    reader = easyocr.Reader(['en'], gpu=False)
    print("EasyOCR initialized on CPU")


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

    # =====================================================================
    #  🔍 CASE 1: PDF → Extract text (first PyPDF2, then OCR fallback)
    # =====================================================================
    if filename.endswith('.pdf'):
        try:
            file_bytes = file.read()
            pdf_reader = PyPDF2.PdfReader(io.BytesIO(file_bytes))

            final_text = ""
            total_pages = len(pdf_reader.pages)

            for i, page in enumerate(pdf_reader.pages):
                extracted = page.extract_text()

                if extracted and extracted.strip():
                    final_text += f"\n--- Page {i+1} (Text) ---\n"
                    final_text += extracted + "\n"
                else:
                    # Fallback to OCR → Convert PDF page to image
                    final_text += f"\n--- Page {i+1} (OCR Applied) ---\n"
                    pages = convert_from_bytes(file_bytes, first_page=i+1, last_page=i+1)

                    for img in pages:
                        # Convert to OpenCV image
                        cv_img = cv2.cvtColor(np.array(img), cv2.COLOR_RGB2BGR)
                        gray = cv2.cvtColor(cv_img, cv2.COLOR_BGR2GRAY)

                        results = reader.readtext(gray)
                        ocr_text = "\n".join([r[1] for r in results])

                        final_text += ocr_text + "\n"

            return jsonify({
                'status': 'PDF processed successfully',
                'pages': total_pages,
                'text': final_text.strip()
            })

        except Exception as e:
            return jsonify({'error': f'PDF processing failed: {str(e)}'}), 500

    # =====================================================================
    #  🔍 CASE 2: IMAGE FILE → Perform OCR
    # =====================================================================
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
            'status': 'Image processed successfully',
            'text': text.strip()
        })

    except Exception as e:
        return jsonify({'error': str(e)}), 500


if __name__ == '__main__':
    # NOTE: Run with poppler installed for pdf2image!
    app.run(debug=True, host='0.0.0.0', port=5000)
