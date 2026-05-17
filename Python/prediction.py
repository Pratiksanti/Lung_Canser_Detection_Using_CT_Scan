import tensorflow as tf
import cv2
import numpy as np
import os
import uuid
import gc
from collections import Counter

# ─────────────────────────────────────────────────────────────
# Class Names — Must Match Training Exactly
# ─────────────────────────────────────────────────────────────
CLASS_NAMES = ["Benign cases", "Malignant cases", "Normal cases"]

# ─────────────────────────────────────────────────────────────
# Base Directory
# ─────────────────────────────────────────────────────────────
BASE_DIR = os.path.dirname(os.path.abspath(__file__))

# ─────────────────────────────────────────────────────────────
# Preprocessed Image Folder
# ─────────────────────────────────────────────────────────────
PREPROCESSED_DIR = os.path.join(BASE_DIR, "preprocessed")
os.makedirs(PREPROCESSED_DIR, exist_ok=True)

# ─────────────────────────────────────────────────────────────
# Safe Model Loader
# ─────────────────────────────────────────────────────────────
def load_model_safe(path):
    try:
        model = tf.keras.models.load_model(path, compile=False)
        print(f"✅ Loaded: {path}")
        return model
    except Exception as e:
        print(f"❌ Failed to load {path}: {e}")
        return None

# ─────────────────────────────────────────────────────────────
# Load Models
# ─────────────────────────────────────────────────────────────
MODELS = {
    "ResNet50": {
        "model": load_model_safe(
            os.path.join(BASE_DIR, "modules/resnet50.keras")
        ),
        "size": (224, 224),
        "grayscale": False
    },
    "VGG16": {
        "model": load_model_safe(
            os.path.join(BASE_DIR, "modules/vgg16.keras")
        ),
        "size": (224, 224),
        "grayscale": False
    },
    "InceptionV3": {
        "model": load_model_safe(
            os.path.join(BASE_DIR, "modules/inceptionv3.keras")
        ),
        "size": (224, 224),
        "grayscale": False
    },
    "Hybrid Model": {
        "model": load_model_safe(
            os.path.join(BASE_DIR, "modules/advanced_cnn.keras")
        ),
        "size": (128, 128),
        "grayscale": True
    }
}

# ─────────────────────────────────────────────────────────────
# CT Scan Validation — Strict Lung CT Only
# ─────────────────────────────────────────────────────────────
def is_ct_image(image_path):

    # ── Force string path ─────────────────────────────────────
    image_path = str(image_path)

    # ── Check 1: File Extension ───────────────────────────────
    allowed_extensions = ['.jpg', '.jpeg', '.png']
    ext = os.path.splitext(image_path)[1].lower()
    if ext not in allowed_extensions:
        print("❌ Rejected: Invalid file format")
        return False

    # ── Check 2: Fresh Image Read ─────────────────────────────
    img = cv2.imread(image_path, cv2.IMREAD_UNCHANGED)
    if img is None:
        print("❌ Rejected: Cannot read image")
        return False

    # ── Convert to BGR if needed ──────────────────────────────
    if len(img.shape) == 2:
        img = cv2.cvtColor(img, cv2.COLOR_GRAY2BGR)
    elif len(img.shape) == 3 and img.shape[2] == 4:
        img = cv2.cvtColor(img, cv2.COLOR_BGRA2BGR)

    # ── Check 3: Minimum Size ─────────────────────────────────
    h, w = img.shape[:2]
    if h < 50 or w < 50:
        print("❌ Rejected: Image too small")
        return False

    # ── Check 4: Grayscale Check ──────────────────────────────
    # CT scans are always grayscale
    b, g, r = cv2.split(img)
    color_diff = (
        np.mean(np.abs(b.astype(int) - g.astype(int))) +
        np.mean(np.abs(g.astype(int) - r.astype(int)))
    )
    if color_diff > 35:
        print("❌ Rejected: Colored image — not a CT scan")
        return False

    # ── Check 5: Grayscale Conversion ────────────────────────
    gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
    total_pixels = gray.size

    # ── Check 6: Dark Background ──────────────────────────────
    dark_pixels = np.sum(gray < 30)
    dark_ratio = dark_pixels / total_pixels
    if dark_ratio < 0.10:
        print("❌ Rejected: No dark background — not a CT scan")
        return False

    # ── Check 7: Bright Region Check ─────────────────────────
    bright_pixels = np.sum(gray > 30)
    bright_ratio = bright_pixels / total_pixels
    if bright_ratio < 0.05 or bright_ratio > 0.98:
        print("❌ Rejected: Invalid pixel distribution")
        return False

    # ── Check 8: Texture Check ────────────────────────────────
    # CT scans have complex tissue textures
    # Use Laplacian variance to measure texture complexity
    laplacian = cv2.Laplacian(gray, cv2.CV_64F)
    texture_score = laplacian.var()
    if texture_score < 50:
        print("❌ Rejected: No texture — not a CT scan")
        return False

    # ── Clear memory ──────────────────────────────────────────
    del img, gray, b, g, r, laplacian
    gc.collect()

    print("✅ Valid CT scan accepted!")
    return True
# ─────────────────────────────────────────────────────────────
# Save Preprocessed Image
# ─────────────────────────────────────────────────────────────
def preprocess_and_save(image_path):

    image_path = str(image_path)
    img = cv2.imread(image_path, cv2.IMREAD_UNCHANGED)

    if img is None:
        raise ValueError("Invalid image")

    # Convert to BGR if needed
    if len(img.shape) == 2:
        img = cv2.cvtColor(img, cv2.COLOR_GRAY2BGR)
    elif len(img.shape) == 3 and img.shape[2] == 4:
        img = cv2.cvtColor(img, cv2.COLOR_BGRA2BGR)

    img = cv2.cvtColor(img, cv2.COLOR_BGR2RGB)

    filename = f"{uuid.uuid4().hex}.jpg"
    save_path = os.path.join(PREPROCESSED_DIR, filename)
    cv2.imwrite(save_path, cv2.cvtColor(img, cv2.COLOR_RGB2BGR))

    return img

# ─────────────────────────────────────────────────────────────
# Model Preprocessing
# ─────────────────────────────────────────────────────────────
def preprocess_for_model(img, target_size, grayscale=False):

    img = cv2.resize(img, target_size)

    if grayscale:
        img = cv2.cvtColor(img, cv2.COLOR_RGB2GRAY)
        img = np.expand_dims(img, axis=-1)

    if img.ndim == 2:
        img = np.expand_dims(img, axis=-1)

    if img.shape[-1] == 1 and not grayscale:
        img = np.repeat(img, 3, axis=-1)

    img = np.nan_to_num(img).astype("float32") / 255.0
    img = np.expand_dims(img, axis=0)

    return img

# ─────────────────────────────────────────────────────────────
# Lung Cancer Prediction
# ─────────────────────────────────────────────────────────────
def predict_lung_cancer(image_path):

    # ── Force string path ─────────────────────────────────────
    image_path = str(image_path)

    # ── Clear cached data every time ─────────────────────────
    cv2.destroyAllWindows()
    gc.collect()

    # ── Validate CT Scan ──────────────────────────────────────
    if not is_ct_image(image_path):
        return {
            "error": "Invalid image! Please upload a Lung CT scan image only. X-rays, hand/leg/kidney scans, documents and other images are not accepted."
        }

    # ── Preprocess and Save ───────────────────────────────────
    img = preprocess_and_save(image_path)

    results = {}
    predictions = []
    confidences = []

    # ── Predict From All Models ───────────────────────────────
    for model_name, cfg in MODELS.items():
        try:
            model = cfg["model"]
            if model is None:
                raise ValueError("Model not loaded")

            input_img = preprocess_for_model(
                img.copy(),
                cfg["size"],
                grayscale=cfg.get("grayscale", False)
            )

            probs = model.predict(input_img, verbose=0)[0]
            probs = np.nan_to_num(probs)

            idx = int(np.argmax(probs))
            predicted_class = CLASS_NAMES[idx]
            confidence = float(probs[idx]) * 100

            predictions.append(predicted_class)
            confidences.append(confidence)

            results[model_name] = {
                "case": predicted_class,
                "confidence": round(confidence, 2)
            }

            # Clear input after each model
            del input_img
            gc.collect()

        except Exception as e:
            print(f"❌ Error in {model_name}: {e}")
            results[model_name] = {
                "case": "Error",
                "confidence": 0
            }

    # ── Ensemble Voting ───────────────────────────────────────
    valid_predictions = [p for p in predictions if p != "Error"]

    if valid_predictions:
        final_case = Counter(valid_predictions).most_common(1)[0][0]
        final_confidence = round(np.mean(confidences), 2)
    else:
        final_case = "Error"
        final_confidence = 0

    results["Ensemble"] = {
        "case": final_case,
        "confidence": final_confidence
    }

    results["final_case"] = final_case

    # ── Clear memory after prediction ─────────────────────────
    del img
    gc.collect()

    return results