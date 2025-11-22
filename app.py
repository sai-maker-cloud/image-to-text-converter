from flask import Flask, request, jsonify, render_template
from flask_cors import CORS
import numpy as np
import easyocr
import cv2
import PyPDF2

app = Flask(__name__)
CORS(app)

# Initialize EasyOCR
try:
    reader = easyocr.Reader(['en'], gpu=True)
    print("EasyOCR on GPU")
except:
    reader = easyocr.Reader(['en'], gpu=False)
    print("EasyOCR on CPU")

@app.route("/")
def index():
    return render_template("index.html")

# ---------- GLOBAL ERROR HANDLER (NO HTML ERRORS) ----------
@app.errorhandler(Exception)
def handle_error(e):
    return jsonify({"error": str(e)}), 500

# ---------- OCR + PDF API ----------
@app.route("/api/ocr", methods=["POST"])
def ocr_endpoint():
    if "file" not in request.files:
        return jsonify({"error": "No file uploaded"}), 400

    file = request.files["file"]
    filename = file.filename.lower()

    # ---------------- PDF Extract ----------------
    if filename.endswith(".pdf"):
        try:
            pdf_reader = PyPDF2.PdfReader(file)
            text = ""

            for page in pdf_reader.pages:
                txt = page.extract_text()
                if txt:
                    text += txt + "\n"

            return jsonify({
                "status": "PDF uploaded successfully",
                "text": text.strip()
            })
        except Exception as e:
            return jsonify({"error": f"PDF error: {str(e)}"}), 500

    # ---------------- IMAGE OCR ----------------
    try:
        image_bytes = file.read()
        nparr = np.frombuffer(image_bytes, np.uint8)
        img = cv2.imdecode(nparr, cv2.IMREAD_COLOR)

        gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)

        results = reader.readtext(gray)
        text = "\n".join([res[1] for res in results])

        return jsonify({
            "status": "Image uploaded successfully",
            "text": text.strip()
        })

    except Exception as e:
        return jsonify({"error": str(e)}), 500


if __name__ == "__main__":
    app.run(debug=True, host="0.0.0.0", port=5000)
