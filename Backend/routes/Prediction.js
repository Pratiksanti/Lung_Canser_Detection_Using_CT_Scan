
const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const FormData = require('form-data');
const fetch = require('node-fetch'); 
const Prediction = require('../models/Prediction');
const auth = require('../middleware/auth'); 

const router = express.Router();


const uploadsDir = path.join(__dirname, '..', 'uploads');
if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir);

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadsDir),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    const name = `${Date.now()}-${Math.round(Math.random() * 1e9)}${ext}`;
    cb(null, name);
  }
});
const upload = multer({ storage, limits: { fileSize: 10 * 1024 * 1024 } });

router.use((req, res, next) => {
  console.log(new Date().toISOString(), req.method, req.originalUrl);
  next();
});


async function forwardToPython(filePath, originalName, req) {
  const PY_API = process.env.PY_API || 'http://127.0.0.1:8000';
  const pythonUrl = `${PY_API}/api/predict`; 

  const form = new FormData();
  form.append('file', fs.createReadStream(filePath), originalName);

  
  const headers = form.getHeaders();
  if (req.headers.authorization) {
    headers['Authorization'] = req.headers.authorization;
  }

  const response = await fetch(pythonUrl, {
    method: 'POST',
    body: form,
    headers: headers,
  });

  const contentType = response.headers.get('content-type') || '';
  let body;
  if (contentType.includes('application/json')) {
    body = await response.json();
  } else {
    body = await response.text();
  }

  return { status: response.status, body };
}


async function handleImagePrediction(req, res) {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'No file uploaded' });
    }

 
    const filePath = req.file.path;
    const originalName = req.file.originalname;

    const { status, body } = await forwardToPython(filePath, originalName, req);

    let resultToSave = null;
    if (body && typeof body === 'object') {
      
      resultToSave = body;
    } else {
     
      resultToSave = { raw: String(body) };
    }

    // Try to attach user if token present
    let userId = null;
    if (req.headers.authorization) {
      try {
        const jwt = require('jsonwebtoken');
        const token = req.headers.authorization.split(' ')[1];
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        userId = decoded.id;
      } catch (err) {
       
      }
    }

    // Save Prediction document (so you have a record)
    const pred = await Prediction.create({
      user: userId,
      imagePath: `/uploads/${req.file.filename}`,
      inputData: { originalName: originalName, mimeType: req.file.mimetype },
      result: resultToSave,
    });

    fs.unlink(filePath, (err) => {
      if (err) console.warn('Could not remove temp file:', filePath, err);
    });

    
    if (status >= 200 && status < 300) {
      // success — include prediction id and imageUrl for frontend
      const responseBody =
        typeof body === 'object'
          ? { ...body, success: true, id: pred._id, imageUrl: pred.imagePath }
          : { success: true, id: pred._id, imageUrl: pred.imagePath, data: body };

      return res.status(200).json(responseBody);
    } else {
      // Python returned error — forward message and status
      const responseBody =
        typeof body === 'object'
          ? { success: false, error: body, id: pred._id, imageUrl: pred.imagePath }
          : { success: false, error: body, id: pred._1, imageUrl: pred.imagePath };

      return res.status(status).json(responseBody);
    }
  } catch (err) {
    console.error('Image predict error:', err);
    return res.status(500).json({ success: false, message: 'Server error during image prediction', error: err.message });
  }
}


router.post('/', upload.single('file'), async (req, res) => {
  await handleImagePrediction(req, res);
});


router.post('/image', upload.single('image'), async (req, res) => {
  await handleImagePrediction(req, res);
});

/*
  Other routes: symptoms and history (unchanged)
*/
router.post('/symptoms', async (req, res) => {
  try {
    const input = req.body;
    const mockResult = { label: 'low_risk', confidence: 0.62 };
    const pred = await Prediction.create({ user: null, inputData: input, result: mockResult });
    return res.json({ success: true, message: 'Prediction saved', id: pred._id, result: mockResult });
  } catch (err) {
    console.error('Symptoms predict error:', err);
    return res.status(500).json({ success: false, message: 'Server error during symptoms prediction' });
  }
});

router.get('/history', auth, async (req, res) => {
  try {
    const preds = await Prediction.find({ user: req.user.id }).sort({ createdAt: -1 }).limit(50);
    return res.json({ success: true, data: preds });
  } catch (err) {
    console.error('History error:', err);
    return res.status(500).json({ success: false, message: 'Server error fetching history' });
  }
});

module.exports = router;
