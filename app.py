from flask import Flask, request, jsonify, send_file
from PIL import Image
import pytesseract
import os
from datetime import datetime

app = Flask(__name__)

UPLOAD_FOLDER = "uploads"
TEXT_FOLDER = "text_output"

os.makedirs(UPLOAD_FOLDER, exist_ok=True)
os.makedirs(TEXT_FOLDER, exist_ok=True)

@app.route("/")
def home():
    return send_file("index.html")

@app.route("/extract", methods=["POST"])
def extract():
    file = request.files["image"]
    path = os.path.join(UPLOAD_FOLDER, file.filename)
    file.save(path)

    image = Image.open(path)
    text = pytesseract.image_to_string(image)

    name = datetime.now().strftime("%Y%m%d%H%M%S") + ".txt"
    text_path = os.path.join(TEXT_FOLDER, name)

    with open(text_path, "w", encoding="utf-8") as f:
        f.write(text)

    return jsonify({
        "text": text,
        "download": f"/download/{name}"
    })

@app.route("/download/<filename>")
def download(filename):
    return send_file(os.path.join(TEXT_FOLDER, filename), as_attachment=True)

if __name__ == "__main__":
    app.run(debug=True)
