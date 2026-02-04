import tensorflow as tf
import cv2
import numpy as np
import os
import uuid
from collections import Counter

# ===============================
# CLASS NAMES (MUST MATCH TRAINING)
# ===============================
CLASS_NAMES = ["Benign", "Malignant", "Normal"]  

# ===============================
# BASE DIRECTORY
# ===============================
BASE_DIR = os.path.dirname(os.path.abspath(__file__))

# ===============================
# PREPROCESSED IMAGE FOLDER
# ===============================
PREPROCESSED_DIR = os.path.join(BASE_DIR, "preprocessed")
os.makedirs(PREPROCESSED_DIR, exist_ok=True)

# ===============================
# LOAD MODELS
# ===============================
MODELS = {
    "ResNet50": {
        "model": tf.keras.models.load_model(
            os.path.join(BASE_DIR, "modules/resnet50.keras")
        ),
        "size": (224, 224)
    },
    "VGG16": {
        "model": tf.keras.models.load_model(
            os.path.join(BASE_DIR, "modules/vgg16.keras")
        ),
        "size": (224, 224)
    },
    "InceptionV3": {
        "model": tf.keras.models.load_model(
            os.path.join(BASE_DIR, "modules/inceptionv3.keras")
        ),
        "size": (224, 224)
    }
}

# ===============================
# STEP 1: CT IMAGE VALIDATION
# ===============================
def is_ct_image(image_path):
    img = cv2.imread(image_path)
    if img is None:
        return False

    b, g, r = cv2.split(img)
    color_diff = np.mean(np.abs(b - g)) + np.mean(np.abs(g - r))

    return color_diff <= 40

# ===============================
# STEP 2: PREPROCESS (MATCH TRAINING)
# ===============================
def preprocess_and_save(image_path):
    img = cv2.imread(image_path)
    if img is None:
        raise ValueError("Invalid image")

    # 1 Resize FIRST (MOST IMPORTANT)
    img = cv2.resize(img, (224, 224))

    # 2 Convert to RGB
    img = cv2.cvtColor(img, cv2.COLOR_BGR2RGB)

    # 3 Normalize
    img = img.astype("float32") / 255.0

    # Force 3 channels (SAFE)
    if img.ndim == 2:
        img = np.expand_dims(img, axis=-1)

    if img.shape[-1] == 1:
        img = np.repeat(img, 3, axis=-1)

    #  FINAL SHAPE CHECK
    assert img.shape == (224, 224, 3), f"Wrong shape: {img.shape}"

    # 5️ Save preprocessed image
    filename = f"{uuid.uuid4().hex}.jpg"
    save_path = os.path.join(PREPROCESSED_DIR, filename)
    cv2.imwrite(save_path, (img * 255).astype("uint8"))

    return img
# ===============================
# MODEL-SPECIFIC PREPROCESS
# ===============================
def preprocess_for_model(img, target_size):
    # Resize
    img = cv2.resize(img, target_size)

    # FORCE SHAPE (H, W, 3) — NO EXCEPTIONS
    if img.ndim == 2:
        img = np.expand_dims(img, axis=-1)

    if img.shape[-1] == 1:
        img = np.repeat(img, 3, axis=-1)

    # Final safety check
    assert img.shape[-1] == 3, f"Invalid image shape before model: {img.shape}"

    img = np.nan_to_num(img).astype("float32")

    # Add batch dimension → (1, 224, 224, 3)
    img = np.expand_dims(img, axis=0)

    return img

# ===============================
# STEP 3: PREDICTION + FINAL CASE
# ===============================
def predict_lung_cancer(image_path):

    if not is_ct_image(image_path):
        return {"error": "Non-CT image detected"}

    img = preprocess_and_save(image_path)

    results = {}
    predictions = []

    for model_name, cfg in MODELS.items():
        model = cfg["model"]
        size = cfg["size"]

        input_img = preprocess_for_model(img, size)
        probs = model.predict(input_img, verbose=0)[0]
        probs = np.nan_to_num(probs)

        idx = int(np.argmax(probs))
        case = CLASS_NAMES[idx]
        confidence = float(probs[idx]) * 100

        predictions.append(case)

        results[model_name] = {
            "case": case,
            "confidence": round(confidence, 2)
        }

    # ===============================
    # FINAL CASE (MAJORITY VOTING)
    # ===============================
    final_case = Counter(predictions).most_common(1)[0][0]

    results["final_case"] = final_case

    return results
