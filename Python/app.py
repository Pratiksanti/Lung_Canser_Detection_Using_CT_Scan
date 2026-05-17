from flask import Flask, request, jsonify
from flask_cors import CORS
import os
import uuid
from prediction import predict_lung_cancer

# ===============================
# TENSORFLOW SETTINGS
# ===============================
os.environ['TF_CPP_MIN_LOG_LEVEL'] = '3'
os.environ['TF_ENABLE_ONEDNN_OPTS'] = '0'

# ===============================
# FLASK APP
# ===============================
app = Flask(__name__)
CORS(app)

# ===============================
# HEALTH CHECK ROUTES
# ===============================
@app.route("/", methods=["GET"])
def home():
    return jsonify({
        "status": "running",
        "message": "Lung Cancer Detection API is running!",
        "endpoints": {
            "predict": "/predict (POST)",
            "health": "/health (GET)"
        }
    })

@app.route("/health", methods=["GET"])
def health():
    return jsonify({
        "status": "ok"
    })

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

    return (
        "." in filename and
        filename.rsplit(".", 1)[1].lower() in ALLOWED_EXTENSIONS
    )

# ===============================
# PREDICTION API
# ===============================
@app.route("/predict", methods=["POST"])
def predict():

    if "scan" not in request.files:
        return jsonify({
            "error": "No file uploaded"
        }), 400

    file = request.files["scan"]

    if file.filename == "":
        return jsonify({
            "error": "No file selected"
        }), 400

    if not allowed_file(file.filename):
        return jsonify({
            "error": "Invalid file type"
        }), 400

    # Save uploaded file
    filename = f"{uuid.uuid4().hex}_{file.filename}"

    file_path = os.path.join(
        app.config["UPLOAD_FOLDER"],
        filename
    )

    file.save(file_path)

    try:
        # Run prediction
        result = predict_lung_cancer(file_path)

        return jsonify(result)

    except Exception as e:

        print("Prediction Error:", str(e))

        return jsonify({
            "error": str(e)
        }), 500

    finally:
        # Delete uploaded file
        if os.path.exists(file_path):
            os.remove(file_path)

# ===============================
# RUN SERVER
# ===============================
if __name__ == "__main__":

    port = int(os.environ.get("PORT", 7860))

    app.run(
        host="0.0.0.0",
        port=port,
        debug=False
    )