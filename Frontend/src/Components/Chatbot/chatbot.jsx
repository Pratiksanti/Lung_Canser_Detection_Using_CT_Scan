import React, { useState, useRef, useEffect } from 'react';
import Fuse from 'fuse.js';
import './Chatbot.css';

// ── Knowledge Base ──────────────────────────────────────────────────────────
const KB = {
  greet: {
    patterns: ['hello', 'hi', 'hey', 'good morning', 'good evening', 'namaste', 'start'],
    response: `👋 Hello! I'm **LungCare Assistant**, the AI chatbot for the *Lung Cancer Detection* platform.\n\nI can help you with:\n• 🫁 Lung cancer symptoms & types\n• 🔬 How our AI detection works\n• 🛡️ Prevention & risk factors\n• 💊 Treatment options\n• 📊 About our deep learning models\n\nWhat would you like to know?`,
  },

  symptom: {
    patterns: ['symptom', 'symptoms', 'sign', 'signs', 'warning', 'feel', 'feeling', 'pain', 'cough'],
    response: `🫁 **Common Lung Cancer Symptoms**\n\n⚠️ Early Stage:\n• Persistent cough (3+ weeks)\n• Slight shortness of breath\n• Fatigue or tiredness\n• Mild chest discomfort\n\n🚨 Advanced Stage:\n• Coughing up blood (haemoptysis)\n• Severe chest or shoulder pain\n• Hoarse voice\n• Unexplained weight loss\n• Recurring chest infections\n• Swelling in face or neck\n\n💡 Important: Symptoms often appear only in advanced stages — this is why early AI-based screening using our system is critical!\n\n🏥 Please consult a doctor if you notice any of these signs.`,
  },

  types: {
    patterns: ['type', 'types', 'malignant', 'benign', 'normal', 'class', 'classes', 'category', 'categories', 'classify', 'classification', 'result', 'prediction'],
    response: `🔬 **Lung Scan Classification — 3 Classes**\n\nOur deep learning system classifies CT scans into exactly 3 categories:\n\n🔴 **Malignant**\n• Cancerous tumor detected in the lung\n• Abnormal cells growing uncontrollably\n• Requires immediate medical attention\n• Can spread to other organs if untreated\n• Early detection greatly improves survival\n\n🟡 **Benign**\n• A non-cancerous growth or nodule found\n• Abnormal tissue that does NOT invade nearby areas\n• Usually not life-threatening\n• Still requires monitoring by a doctor\n• May include cysts, hamartomas, or granulomas\n\n🟢 **Normal**\n• No suspicious nodules or masses detected\n• Lungs appear healthy on CT scan\n• Regular check-ups still recommended\n• Especially important for high-risk individuals\n\n🤖 Our AI models (VGG16, ResNet50, InceptionV3) analyze your CT scan and classify it into one of these 3 categories instantly!`,
  },

  prevention: {
    patterns: ['prevent', 'prevention', 'avoid', 'reduce risk', 'safe', 'protect', 'lifestyle'],
    response: `🛡️ **Lung Cancer Prevention**\n\n✅ Lifestyle Changes:\n• **Stop smoking** — #1 most effective step\n• Avoid secondhand smoke exposure\n• Eat antioxidant-rich foods (berries, leafy greens)\n• Exercise regularly (30 min/day)\n• Maintain healthy weight\n\n🏠 Environmental Protection:\n• Test your home for **radon gas** (2nd leading cause)\n• Avoid prolonged asbestos exposure\n• Wear protective gear in dusty/chemical environments\n• Use air purifiers indoors\n\n🏥 Medical Screening:\n• Annual low-dose CT (LDCT) scan for high-risk groups\n• Early detection saves lives — use our AI platform!\n• Regular check-ups if age 50+ and/or heavy smoker`,
  },

  risk: {
    patterns: ['risk', 'risk factor', 'cause', 'causes', 'who gets', 'chances', 'radon', 'asbestos', 'smoke', 'smoking'],
    response: `⚠️ **Lung Cancer Risk Factors**\n\n🚬 Primary Risks:\n• **Smoking** — responsible for ~85% of cases\n• **Secondhand smoke** exposure\n• **Radon gas** — naturally occurring radioactive gas\n• **Asbestos** and workplace chemicals\n\n🧬 Secondary Risks:\n• Family history of lung cancer\n• Previous lung diseases (COPD, TB)\n• Air pollution (long-term exposure)\n• Age — risk increases after 50\n• Prior radiation therapy to chest\n\n📊 Key Fact:\n• Lung cancer = leading cause of cancer death worldwide\n• High mortality due to **late detection**\n• Early AI screening can drastically improve outcomes\n\nOur project addresses this by automating early CT scan analysis! 🤖`,
  },

  treatment: {
    patterns: ['treatment', 'treat', 'cure', 'therapy', 'surgery', 'chemo', 'chemotherapy', 'radiation', 'medicine', 'drug'],
    response: `💊 **Lung Cancer Treatment Options**\n\nTreatment depends on cancer type and stage:\n\n🔪 **Surgery**\n• Lobectomy (remove lobe)\n• Pneumonectomy (remove entire lung)\n• Best for early-stage cases\n\n💉 **Chemotherapy**\n• Kills fast-growing cancer cells\n• Often combined with other treatments\n\n☢️ **Radiation Therapy**\n• High-energy beams target tumors\n• Used for inoperable cases\n\n🎯 **Targeted Therapy**\n• Drugs targeting specific gene mutations\n• Effective for certain malignant types\n\n🛡️ **Immunotherapy**\n• Boosts immune system to fight cancer\n• Checkpoint inhibitors (PD-1/PD-L1)\n\n⚡ Early detection = More treatment options!\nIf our AI detects a **Malignant** result, please consult a doctor immediately.`,
  },

  diagnosis: {
    patterns: ['diagnos', 'detect', 'detection', 'test', 'scan', 'ct scan', 'biopsy', 'imaging', 'xray', 'x-ray'],
    response: `🔍 **Lung Cancer Diagnosis Methods**\n\n📷 Imaging Tests:\n• **Low-Dose CT (LDCT)** — gold standard for screening\n• Chest X-ray — initial assessment\n• PET scan — shows metabolic activity\n• MRI — for brain/spine spread\n\n🧪 Lab Tests:\n• Sputum cytology\n• Blood biomarker tests\n\n🔬 Biopsy:\n• Bronchoscopy\n• CT-guided needle biopsy\n• Thoracoscopy (VATS)\n\n🤖 Our AI Approach:\nWe use CT scan images analyzed by three pretrained CNN models:\n• **VGG16** (512 features) — edges, textures\n• **ResNet50** (2048 features) — deep lung patterns\n• **InceptionV3** (2048 features) — multi-scale patterns\n\nAll three are combined via a **Hybrid Module** to output one of:\n✅ Normal | ⚠️ Benign | 🚨 Malignant`,
  },

  models: {
    patterns: ['model', 'models', 'vgg', 'vgg16', 'resnet', 'resnet50', 'inception', 'inceptionv3', 'cnn', 'deep learning', 'neural', 'ai', 'accuracy', 'algorithm', 'hybrid'],
    response: `🤖 **Our Deep Learning Models**\n\nLungCare uses 3 pretrained CNN architectures:\n\n🔷 **VGG16**\n• 138M parameters, 512 features\n• Captures edges, textures, basic shapes\n• Strong baseline performance\n\n🔷 **ResNet50**\n• 25.6M parameters, 2048 features\n• Residual connections for deep learning\n• Captures complex lung patterns\n\n🔷 **InceptionV3**\n• 23.9M parameters, 2048 features\n• Multi-scale parallel convolution blocks\n• Excellent at varied nodule sizes\n\n🔶 **Hybrid Module**\nFeatures from all three models are fused together for the final classification output:\n🟢 Normal | 🟡 Benign | 🔴 Malignant\n\n📈 Literature benchmark: Similar transfer learning systems achieve 97%+ accuracy.\n\n🗃️ Dataset: IQ-OTH/NCCD CT scan dataset`,
  },

  dataset: {
    patterns: ['dataset', 'data', 'iq-oth', 'nccd', 'lidc', 'training data', 'train'],
    response: `📊 **Dataset Information**\n\nOur models are trained on the **IQ-OTH/NCCD** lung cancer CT scan dataset.\n\n🔑 Key Details:\n• Contains labeled CT scan images\n• **3 Classes: Normal, Benign, Malignant**\n• Images preprocessed to **224×224 pixels**\n• Pixel normalization applied\n• Data augmentation used for training\n\n⚠️ Challenges Addressed:\n• Class imbalance handled via augmentation\n• Image quality variations managed in preprocessing\n• Noise and artifacts reduced by normalization\n\n🔬 Referenced datasets in literature include LIDC-IDRI and NLST (Zheng et al. 2020, Jacobs et al. 2021).`,
  },

  technology: {
    patterns: ['tech', 'technology', 'mern', 'react', 'node', 'mongodb', 'express', 'python', 'tensorflow', 'keras', 'stack', 'built', 'framework'],
    response: `⚙️ **Technology Stack — LungCare**\n\n🖥️ Frontend:\n• React.js — interactive UI, image upload, result display\n• Responsive dashboard with patient history\n\n🔧 Backend:\n• Node.js + Express.js — REST API\n• Bridges frontend ↔ Python ML model\n• Handles image routing & preprocessing calls\n\n🧠 AI/ML:\n• Python — model training & inference\n• TensorFlow + Keras — CNN architectures\n• VGG16 / ResNet50 / InceptionV3\n\n🗄️ Database:\n• MongoDB — stores patient records, scan history, predictions\n\n🛠️ Dev Tools:\n• VS Code, Git/GitHub, Postman, npm\n\n📂 GitHub: github.com/PranavChandam/Lung_Cancer_Detection`,
  },

  howItWorks: {
    patterns: ['how it works', 'how does', 'process', 'workflow', 'steps', 'upload', 'predict', 'prediction', 'work'],
    response: `🔄 **How LungCare Works — Step by Step**\n\n**Step 1 — Upload** 📤\nDoctor logs in and uploads a CT scan image (PNG/JPG/JPEG, max 10MB)\n\n**Step 2 — Preprocessing** ⚙️\n• Resize to 224×224 pixels\n• Normalize pixel values\n• Convert to model-ready format\n\n**Step 3 — AI Analysis** 🤖\nVGG16, ResNet50 & InceptionV3 independently analyze the image\n\n**Step 4 — Hybrid Fusion** 🔀\nAll model features combined in Hybrid Module for final output\n\n**Step 5 — Result** 📊\n• 🟢 Normal / 🟡 Benign / 🔴 Malignant\n• Confidence score displayed\n• Patient info saved to MongoDB\n• Full history accessible anytime\n\n⚡ Everything happens in real-time — instant results!`,
  },

  project: {
    patterns: ['project', 'about', 'who made', 'team', 'group 37'],
    response: `📋 **About LungCare**\n\n**Project:** Lung Cancer Detection using Deep Learning\n**Department:** Computer Science & Engineering\n**Year:** 2025–2026, Semester VII\n**Guide:** Prof. S.S. Kore\n\n👥 Team — Group 37:\n• Suresh Irapanna Halkdue\n• Adarsh Ananda Nikam\n• Ganesh Ramchandra Byagalli\n• Pranav Suresh Chandam\n• Pratik Hanmant Santi\n\n🎯 Goal: Automate early lung cancer detection using deep learning + MERN platform to assist doctors and improve patient survival rates.\n\n📂 GitHub: github.com/PranavChandam/Lung_Cancer_Detection`,
  },

  stages: {
    patterns: ['stage', 'stages', 'early', 'late', 'advanced', 'stage 1', 'stage 2', 'stage 3', 'stage 4'],
    response: `📈 **Lung Cancer Stages**\n\n**Stage I** — Localized\n• Tumor ≤ 3cm, confined to lung\n• 5-year survival: ~60-80%\n\n**Stage II** — Regional spread\n• Tumor larger or nearby lymph nodes affected\n• 5-year survival: ~40-60%\n\n**Stage III** — Extensive regional spread\n• Involves chest lymph nodes or structures\n• 5-year survival: ~15-30%\n\n**Stage IV** — Metastatic\n• Spread to other organs\n• 5-year survival: ~5-10%\n\n💡 Key Insight: Early detection at Stage I vs Stage IV improves survival by 6–16x!\n\nThis is exactly why our AI-powered system detects **Malignant** cases as early as possible. 🎯`,
  },

  bye: {
    patterns: ['bye', 'goodbye', 'thanks', 'thank you', 'ok', 'okay', 'done', 'exit', 'close'],
    response: `👋 Thank you for using **LungCare Assistant**!\n\nRemember:\n• 🏥 Consult a doctor for any health concerns\n• 🔬 Early screening saves lives\n• 🤖 Use our AI platform for CT scan analysis\n\nThis chatbot is for informational purposes only and does not replace professional medical advice.\n\nStay healthy! 💚`,
  },
};

const QUICK_QUESTIONS = [
  'Symptoms', 'Cancer Types', 'How it Works', 'Prevention', 'Our AI Models', 'Treatment',
];

// ── Helpers ──────────────────────────────────────────────────────────────────
// function getResponse(input) {
//   const lower = input.toLowerCase();
//   for (const key of Object.keys(KB)) {
//     if (KB[key].patterns.some(p => lower.includes(p))) {
//       return KB[key].response;
//     }
//   }
//   return `🤔 I didn't quite catch that. Here are topics I can help with:\n\n• 🫁 Symptoms of lung cancer\n• 🔬 Cancer types (Normal / Benign / Malignant)\n• 🛡️ Prevention tips\n• ⚠️ Risk factors\n• 💊 Treatment options\n• 🤖 Our AI models (VGG16, ResNet50, InceptionV3)\n• 🔄 How our detection system works\n• 📋 About the project\n\nOr tap a quick button above! 👆`;
// }




// ── Smart Search Setup ───────────────────────────────────────────────────────

// Create searchable patterns
const searchablePatterns = [];

Object.keys(KB).forEach(key => {
  KB[key].patterns.forEach(pattern => {
    searchablePatterns.push({
      pattern,
      response: KB[key].response
    });
  });
});

// Configure Fuse.js
const fuse = new Fuse(searchablePatterns, {
  keys: ['pattern'],
  threshold: 0.4,
  includeScore: true,
});

// ── Helpers ──────────────────────────────────────────────────────────────────
function getResponse(input) {

  // Clean user input
  const lower = input
    .toLowerCase()
    .trim()
    .replace(/[^\w\s]/gi, '');

  // Exact keyword matching first
  for (const key of Object.keys(KB)) {
    if (KB[key].patterns.some(p => lower.includes(p))) {
      return KB[key].response;
    }
  }

  // Fuzzy matching for spelling mistakes
  const results = fuse.search(lower);

  if (results.length > 0) {
    return results[0].item.response;
  }

  // Default fallback
  return `🤔 I didn't quite catch that. Here are topics I can help with:

• 🫁 Symptoms of lung cancer
• 🔬 Cancer types (Normal / Benign / Malignant)
• 🛡️ Prevention tips
• ⚠️ Risk factors
• 💊 Treatment options
• 🤖 Our AI models (VGG16, ResNet50, InceptionV3)
• 🔄 How our detection system works
• 📋 About the project

Or tap a quick button above! 👆`;
}

// Renders **bold** markdown inside message text
function formatMessage(text) {
  return text.split('\n').map((line, i, arr) => {
    const parts = line.split(/(\*\*[^*]+\*\*)/g).map((part, j) => {
      if (part.startsWith('**') && part.endsWith('**')) {
        return <strong key={j}>{part.slice(2, -2)}</strong>;
      }
      return part;
    });
    return (
      <span key={i}>
        {parts}
        {i < arr.length - 1 && <br />}
      </span>
    );
  });
}

// ── Component ────────────────────────────────────────────────────────────────
const Chatbot = () => {
  const [isOpen, setIsOpen]     = useState(false);
  const [messages, setMessages] = useState([
    { text: KB.greet.response, sender: 'bot' }
  ]);
  const [input, setInput]       = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const endRef                  = useRef(null);

  // Auto-scroll to latest message
  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping]);

  const toggleChat = () => setIsOpen(v => !v);

  const handleSend = (overrideText) => {
    const msg = overrideText || input;
    if (!msg.trim() || isTyping) return;

    setMessages(prev => [...prev, { text: msg, sender: 'user' }]);
    setInput('');
    setIsTyping(true);

    setTimeout(() => {
      setMessages(prev => [...prev, { text: getResponse(msg), sender: 'bot' }]);
      setIsTyping(false);
    }, 900 + Math.random() * 500);
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') handleSend();
  };

  return (
    <>
      {/* ── Floating Button ── */}
      <div
        className="chatbot-floating-btn"
        onClick={toggleChat}
        title="Chat with LungCare Assistant"
      >
        🫁
        <div className="online-indicator" />
      </div>

      {/* ── Chat Popup ── */}
      {isOpen && (
        <div className="chatbot-popup">

          {/* Header */}
          <div className="chatbot-header">
            <div className="header-content">
              <div className="header-avatar">🩺</div>
              <div>
                <h3>LungCare Assistant</h3>
                <span className="status">
                  <span className="status-dot">●</span> Online · AI-Powered
                </span>
              </div>
            </div>
            <button className="close-btn" onClick={toggleChat}>×</button>
          </div>

          {/* Quick Buttons */}
          <div className="quick-btns-row">
            {QUICK_QUESTIONS.map(q => (
              <button
                key={q}
                className="quick-btn"
                onClick={() => handleSend(q)}
                disabled={isTyping}
              >
                {q}
              </button>
            ))}
          </div>

          {/* Messages */}
          <div className="chatbot-messages">
            {messages.map((msg, index) => (
              <div key={index} className={`message ${msg.sender}`}>
                {formatMessage(msg.text)}
              </div>
            ))}

            {/* Typing Indicator */}
            {isTyping && (
              <div className="message bot typing">
                <div className="typing-indicator">
                  <span></span>
                  <span></span>
                  <span></span>
                </div>
              </div>
            )}

            <div ref={endRef} />
          </div>

          {/* Input Row */}
          <div className="chatbot-input">
            <input
              type="text"
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Ask about lung cancer..."
              disabled={isTyping}
            />
            <button onClick={() => handleSend()} disabled={isTyping}>
              ➤
            </button>
          </div>

          {/* Disclaimer */}
          <div className="chatbot-disclaimer">
            ⚕️ For informational purposes only · Always consult a doctor
          </div>

        </div>
      )}
    </>
  );
};

export default Chatbot;