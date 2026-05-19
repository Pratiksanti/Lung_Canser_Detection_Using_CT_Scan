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
# Entropy Check — ONLY used to detect invalid images
# ─────────────────────────────────────────────────────────────
# Temperature scaling is applied ONLY inside this function.
# It is NOT applied to the actual prediction probabilities
# because the models were trained without it — applying it
# at inference time flips the argmax on sensitive models
# and drops accuracy from 99% → 52%.
# ─────────────────────────────────────────────────────────────
def _entropy_with_temperature(raw_probs, temperature=2.0):
    """
    Apply temperature scaling and return entropy.
    Used ONLY to check whether an image is a valid CT scan.
    Never used for the actual class prediction or confidence.
    """
    probs = np.array(raw_probs, dtype=np.float64)
    scaled = np.log(probs + 1e-10) / temperature
    scaled = np.exp(scaled - np.max(scaled))
    scaled = scaled / scaled.sum()
    scaled = np.clip(scaled, 1e-10, 1.0)
    return float(-np.sum(scaled * np.log(scaled)))


def _raw_entropy(probs):
    """Entropy of raw model probabilities (no temperature)."""
    probs = np.clip(probs, 1e-10, 1.0)
    return float(-np.sum(probs * np.log(probs)))


# ─────────────────────────────────────────────────────────────
# CT Scan Validation
# ─────────────────────────────────────────────────────────────
# Thresholds measured from 42 real CT scan images across 3
# augmentation folders: flipped, zoomed, rotated, colour-jittered,
# contour-cropped, sharpened, blurred, hist-equalised, etc.
#
# Measured ranges across all 42 CT scans:
#   mean_gray    →  67 – 148   (X-rays: 180+, blank: ~255)
#   dark_ratio   → 0.0 – 0.62  (REMOVED — many augmented CTs = 0%)
#   bright_ratio → 0.41 – 1.0  (always high — lung tissue is visible)
#   texture      →  71 – 4557  (CT tissue is always complex)
#   color_diff   → always 0.0  (CT scans are always grayscale)
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
    # All 42 measured CT scans → color_diff = 0.0
    # Nature photos / selfies → color_diff >> 15
    b, g, r = cv2.split(img)
    color_diff = (
        np.mean(np.abs(b.astype(int) - g.astype(int))) +
        np.mean(np.abs(g.astype(int) - r.astype(int)))
    )
    if color_diff > 15:
        print(f"❌ Rejected: Colored image (diff={color_diff:.2f})")
        return False

    # ── Convert to grayscale ──────────────────────────────────
    gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
    mean_gray = np.mean(gray)

    # ── Check 5: Brightness Range ─────────────────────────────
    # Real CT scans: mean 67–148
    # X-rays: 180+   Blank white: ~255   Black/corrupt: <10
    if mean_gray > 200:
        print(f"❌ Rejected: Too bright (mean={mean_gray:.1f}) — likely X-ray or blank")
        return False
    if mean_gray < 10:
        print(f"❌ Rejected: Too dark (mean={mean_gray:.1f}) — blank or corrupt")
        return False

    # ── Check 6: Must Have Tissue Content ────────────────────
    # All 42 CT scans: bright_ratio 41%–100%
    bright_ratio = np.sum(gray > 40) / gray.size
    if bright_ratio < 0.05:
        print(f"❌ Rejected: No tissue content (bright_ratio={bright_ratio:.3f})")
        return False

    # ── Check 7: Must Have Medical Texture ───────────────────
    # All 42 CT scans: texture min=71, max=4557
    # Flat/blank images: texture < 30
    laplacian = cv2.Laplacian(gray, cv2.CV_64F)
    texture_score = laplacian.var()
    if texture_score < 30:
        print(f"❌ Rejected: No texture (score={texture_score:.1f})")
        return False

    del img, gray, b, g, r, laplacian
    gc.collect()

    print(f"✅ CT scan accepted (mean={mean_gray:.1f}, bright={bright_ratio:.3f}, texture={texture_score:.1f})")
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

    # ── Step 1: Validate CT Scan ──────────────────────────────
    if not is_ct_image(image_path):
        return {
            "error": "Invalid image! Please upload a Lung CT scan image only. "
                     "Color photos, nature images, X-rays and other images are not accepted."
        }

    img = preprocess_and_save(image_path)
    results = {}
    predictions = []
    confidences = []
    raw_probs_list = []

    # ── Step 2: Run Each Model ────────────────────────────────
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

            # ── Raw prediction — NO temperature scaling ───────
            # Models were trained on raw probabilities.
            # Applying T scaling at inference shifts the
            # distribution and drops accuracy on 2 of 4 models.
            raw_probs = model.predict(input_img, verbose=0)[0]
            raw_probs = np.nan_to_num(raw_probs)
            raw_probs_list.append(raw_probs)

            idx = int(np.argmax(raw_probs))
            predicted_class = CLASS_NAMES[idx]
            confidence = float(raw_probs[idx]) * 100

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
            results[model_name] = {"case": "Error", "confidence": 0}

    # ── Step 3: Overconfidence Gate (uses T scaling internally) ──
    # T scaling is applied here ONLY to compute entropy for the
    # invalid-image check. It never touches the class predictions.
    #
    # Gate A — Raw entropy too low + confidence too high:
    #   The model is near-certain on a non-CT image (e.g. blank page).
    # Gate B — T-scaled entropy too high:
    #   Even after flattening, model stays confused → not a CT scan.
    if raw_probs_list:
        raw_entropies    = [_raw_entropy(p) for p in raw_probs_list]
        scaled_entropies = [_entropy_with_temperature(p, temperature=2.0) for p in raw_probs_list]
        avg_raw_entropy    = np.mean(raw_entropies)
        avg_scaled_entropy = np.mean(scaled_entropies)
        avg_max_conf       = np.mean([np.max(p) for p in raw_probs_list])

        print(f"Entropy raw={avg_raw_entropy:.4f}  scaled={avg_scaled_entropy:.4f}  max_conf={avg_max_conf:.4f}")

        # Gate A: suspiciously overconfident on a non-CT image
        if avg_raw_entropy < 0.05 and avg_max_conf > 0.99:
            del img
            gc.collect()
            return {
                "error": "Invalid image! Please upload a proper Lung CT scan image only."
            }

        # Gate B: model confused even after scaling → not a CT scan
        if avg_scaled_entropy > 1.05:
            del img
            gc.collect()
            return {
                "error": "Image does not appear to be a valid Lung CT scan. "
                         "Please upload a proper CT scan image only."
            }

    # ── Step 4: Ensemble Voting ───────────────────────────────
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