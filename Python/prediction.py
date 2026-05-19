import tensorflow as tf
import cv2
import numpy as np
import os
os.environ['CUDA_VISIBLE_DEVICES'] = '-1'
os.environ['TF_CPP_MIN_LOG_LEVEL'] = '3'
import uuid
import gc
import gdown
from collections import Counter

# ─────────────────────────────────────────────────────────────
# Download Models from Google Drive if not present
# ─────────────────────────────────────────────────────────────
def download_models():
    os.makedirs('modules', exist_ok=True)
    models = {
        'modules/resnet50.keras':     '1PHuwfFuAACH_w7g80enlBz8F7IYuwNgE',
        'modules/vgg16.keras':        '1y3Nx4dOAvnyuMdkcW_zmDAMFz_i4pa12',
        'modules/inceptionv3.keras':  '1IqpAkePh4M6ovn66ibgiiTun05Qf-vDT',
        'modules/advanced_cnn.keras': '1Hzv7I76ddYezyZ_VE_N-3ZWkZE4uXWZZ'
    }
    for path, file_id in models.items():
        if not os.path.exists(path):
            print(f"Downloading {path}...")
            gdown.download(
                f'https://drive.google.com/uc?id={file_id}',
                path, quiet=False
            )
            print(f"✅ {path} downloaded!")
        else:
            print(f"✅ {path} already exists!")

download_models()

# ─────────────────────────────────────────────────────────────
# Class Names
# ─────────────────────────────────────────────────────────────
CLASS_NAMES = ["Benign cases", "Malignant cases", "Normal cases"]

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
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
        "model": load_model_safe(os.path.join(BASE_DIR, "modules/resnet50.keras")),
        "size": (224, 224),
        "grayscale": False
    },
    "VGG16": {
        "model": load_model_safe(os.path.join(BASE_DIR, "modules/vgg16.keras")),
        "size": (224, 224),
        "grayscale": False
    },
    "InceptionV3": {
        "model": load_model_safe(os.path.join(BASE_DIR, "modules/inceptionv3.keras")),
        "size": (224, 224),
        "grayscale": False
    },
    "Hybrid Model": {
        "model": load_model_safe(os.path.join(BASE_DIR, "modules/advanced_cnn.keras")),
        "size": (128, 128),
        "grayscale": True
    }
}

# ─────────────────────────────────────────────────────────────
# Temperature Scaling — Reduces Overconfidence
# Updated: temperature lowered to 2.0 for better calibration
# ─────────────────────────────────────────────────────────────
def apply_temperature_scaling(probs, temperature=2.0):
    """
    Reduces model overconfidence via temperature scaling.
    temperature=2.0 gives a good balance:
      CT scan images  → realistic confidence (65–90%)
      Random images   → lower confidence    (30–55%)
    """
    probs = np.array(probs, dtype=np.float64)
    # Apply temperature in log space, then softmax
    scaled = np.log(probs + 1e-10) / temperature
    scaled = np.exp(scaled - np.max(scaled))
    scaled = scaled / scaled.sum()
    return scaled.astype(np.float32)


# ─────────────────────────────────────────────────────────────
# Entropy Check — Detects Uncertain / Wrong Predictions
# ─────────────────────────────────────────────────────────────
def calculate_entropy(probs):
    """
    Measures prediction uncertainty.
      Low entropy  → model is very confident
      High entropy → model is uncertain (possibly bad input)

    After temperature scaling (T=2.0):
      Valid CT scan  → entropy ~ 0.3 – 0.9  (calibrated confidence)
      Random image   → entropy ~ 0.9 – 1.1  (uncertain)
      Overconfident  → entropy < 0.05       (suspiciously certain)
    """
    probs = np.clip(probs, 1e-10, 1.0)
    return float(-np.sum(probs * np.log(probs)))


# ─────────────────────────────────────────────────────────────
# CT Scan Validation
# Accepts: Lung CT scans
# Rejects: Color photos, nature images, X-rays, documents
# ─────────────────────────────────────────────────────────────
def is_ct_image(image_path):
    image_path = str(image_path)

    # ── Check 1: File Extension ───────────────────────────────
    allowed_extensions = ['.jpg', '.jpeg', '.png']
    ext = os.path.splitext(image_path)[1].lower()
    if ext not in allowed_extensions:
        print("❌ Rejected: Invalid file format")
        return False

    # ── Check 2: Read Image ───────────────────────────────────
    img = cv2.imread(image_path, cv2.IMREAD_UNCHANGED)
    if img is None:
        print("❌ Rejected: Cannot read image")
        return False

    # ── Normalize to BGR ──────────────────────────────────────
    if len(img.shape) == 2:
        img = cv2.cvtColor(img, cv2.COLOR_GRAY2BGR)
    elif len(img.shape) == 3 and img.shape[2] == 4:
        img = cv2.cvtColor(img, cv2.COLOR_BGRA2BGR)

    # ── Check 3: Minimum Size ─────────────────────────────────
    h, w = img.shape[:2]
    if h < 50 or w < 50:
        print("❌ Rejected: Image too small")
        return False

    # ── Check 4: Reject Colored Images ───────────────────────
    # Nature photos, selfies are colorful; CT scans are grayscale
    b, g, r = cv2.split(img)
    color_diff = (
        np.mean(np.abs(b.astype(int) - g.astype(int))) +
        np.mean(np.abs(g.astype(int) - r.astype(int)))
    )
    if color_diff > 20:
        print(f"❌ Rejected: Colored image (diff={color_diff:.2f})")
        return False

    # ── Convert to grayscale ──────────────────────────────────
    gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
    total_pixels = gray.size
    mean_gray = np.mean(gray)

    # ── Check 5: Reject Chest X-rays ─────────────────────────
    # X-rays are very bright (mean > 110); CT scans are darker (40–100)
    if mean_gray > 110:
        print(f"❌ Rejected: Too bright (mean={mean_gray:.1f}) likely X-ray")
        return False

    # ── Check 6: Must Have Dark Background ───────────────────
    # CT scans always have a black background
    dark_ratio = np.sum(gray < 40) / total_pixels
    if dark_ratio < 0.15:
        print(f"❌ Rejected: No dark background (dark={dark_ratio:.3f})")
        return False

    # ── Check 7: Must Have Bright Regions ────────────────────
    bright_ratio = np.sum(gray > 40) / total_pixels
    if bright_ratio < 0.05:
        print("❌ Rejected: No bright content")
        return False

    # ── Check 8: Must Have Medical Texture ───────────────────
    # CT scans have complex tissue texture
    laplacian = cv2.Laplacian(gray, cv2.CV_64F)
    texture_score = laplacian.var()
    if texture_score < 25:
        print(f"❌ Rejected: No texture (score={texture_score:.1f})")
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
    image_path = str(image_path)
    gc.collect()

    # ── Validate CT Scan ──────────────────────────────────────
    if not is_ct_image(image_path):
        return {
            "error": "Invalid image! Please upload a Lung CT scan image only. "
                     "Color photos, nature images, X-rays and other images are not accepted."
        }

    img = preprocess_and_save(image_path)
    results = {}
    predictions = []
    confidences = []

    # Raw (pre-temperature) probs collected for overconfidence check
    raw_probs_list = []
    # Temperature-scaled probs collected for entropy check
    scaled_probs_list = []

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

            # ── Raw prediction ────────────────────────────────
            raw_probs = model.predict(input_img, verbose=0)[0]
            raw_probs = np.nan_to_num(raw_probs)
            raw_probs_list.append(raw_probs)

            # ── Temperature Scaling (T=2.0) ───────────────────
            # Brings overconfident predictions down to realistic levels
            scaled_probs = apply_temperature_scaling(raw_probs, temperature=2.0)
            scaled_probs_list.append(scaled_probs)

            idx = int(np.argmax(scaled_probs))
            predicted_class = CLASS_NAMES[idx]
            confidence = float(scaled_probs[idx]) * 100

            predictions.append(predicted_class)
            confidences.append(confidence)

            results[model_name] = {
                "case": predicted_class,
                "confidence": round(confidence, 2)
            }

            del input_img
            gc.collect()

        except Exception as e:
            print(f"❌ Error in {model_name}: {e}")
            results[model_name] = {
                "case": "Error",
                "confidence": 0
            }

    # ── Dual Overconfidence / Validity Check ──────────────────
    # Check 1 — Raw overconfidence gate:
    #   If raw probs are suspiciously near-certain (entropy < 0.05
    #   and max confidence > 0.99) the model has likely latched
    #   onto an irrelevant pattern in a non-CT image.
    if raw_probs_list:
        avg_raw_entropy = np.mean([calculate_entropy(p) for p in raw_probs_list])
        avg_max_conf    = np.mean([np.max(p) for p in raw_probs_list])

        print(f"Raw  → avg_entropy: {avg_raw_entropy:.4f}, avg_max_conf: {avg_max_conf:.4f}")

        if avg_raw_entropy < 0.05 and avg_max_conf > 0.99:
            del img
            gc.collect()
            return {
                "error": "Invalid image! Please upload a proper Lung CT scan image only."
            }

    # Check 2 — Scaled entropy gate:
    #   After temperature scaling, genuinely valid CT scans still
    #   produce confident predictions (entropy 0.3–0.9).
    #   Very high entropy (> 1.05) means the model remains confused
    #   even after scaling — strong sign the image is not a CT scan.
    if scaled_probs_list:
        avg_scaled_entropy = np.mean([calculate_entropy(p) for p in scaled_probs_list])
        avg_confidence     = np.mean(confidences) if confidences else 0

        print(f"Scaled → avg_entropy: {avg_scaled_entropy:.4f}, avg_confidence: {avg_confidence:.1f}%")

        if avg_scaled_entropy > 1.05:
            del img
            gc.collect()
            return {
                "error": "Image does not appear to be a valid Lung CT scan. "
                         "Please upload a proper CT scan image only."
            }

    # ── Ensemble Voting ───────────────────────────────────────
    valid_predictions = [p for p in predictions if p != "Error"]

    if valid_predictions:
        final_case       = Counter(valid_predictions).most_common(1)[0][0]
        final_confidence = round(np.mean(confidences), 2)
    else:
        final_case       = "Error"
        final_confidence = 0

    results["Ensemble"] = {
        "case": final_case,
        "confidence": final_confidence
    }

    results["final_case"] = final_case

    del img
    gc.collect()

    return results