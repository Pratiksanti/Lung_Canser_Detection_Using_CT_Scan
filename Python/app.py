from flask import Flask, request, jsonify
from flask_cors import CORS
import os
import uuid
from prediction import predict_lung_cancer
import os
os.environ['TF_CPP_MIN_LOG_LEVEL'] = '3'  
os.environ['TF_ENABLE_ONEDNN_OPTS'] = '0' 

# ===============================
# FLASK APP
# ===============================
app = Flask(__name__)
CORS(app)  # Allow frontend requests

# ===============================
# UPLOAD CONFIG
# ===============================
UPLOAD_FOLDER = "uploads"
ALLOWED_EXTENSIONS = {"png", "jpg", "jpeg"}

os.makedirs(UPLOAD_FOLDER, exist_ok=True)
app.config["UPLOAD_FOLDER"] = UPLOAD_FOLDER


# ===============================
# FILE VALIDATION
# ===============================
def allowed_file(filename):
    return "." in filename and filename.rsplit(".", 1)[1].lower() in ALLOWED_EXTENSIONS


# ===============================
# PREDICTION API
# ===============================
@app.route("/predict", methods=["POST"])
def predict():
    if "scan" not in request.files:
        return jsonify({"error": "No file uploaded"}), 400

    file = request.files["scan"]

    if file.filename == "":
        return jsonify({"error": "No file selected"}), 400

    if not allowed_file(file.filename):
        return jsonify({"error": "Invalid file type"}), 400

    # Save file safely
    filename = f"{uuid.uuid4().hex}_{file.filename}"
    file_path = os.path.join(app.config["UPLOAD_FOLDER"], filename)
    file.save(file_path)

    try:
        # Call ML prediction
        result = predict_lung_cancer(file_path)
        return jsonify(result)

    except Exception as e:
        return jsonify({"error": str(e)}), 500

    finally:
        # Clean up uploaded file
        if os.path.exists(file_path):
            os.remove(file_path)


# ===============================
# RUN SERVER
# ===============================
if __name__ == "__main__":
    port = int(os.environ.get('PORT', 5000))
    app.run(host='0.0.0.0', port=port, debug=False)