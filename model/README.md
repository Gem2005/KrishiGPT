# Disease Classification Model Integration

This document explains how the plant disease classification model is integrated with the KrishiGPT RAG system.

## Architecture

```
Image Upload → ML Model (PyTorch) → Disease Detection → RAG System → Comprehensive Response
                    ↓                      ↓                ↓
              Plant Disease         Disease Info      Detailed Advice
              Classification        + Confidence     + Treatment Plan
                                                    + Prevention Tips
                                                    + Future Care
```

## Components

### 1. Disease Classifier (`lib/model/disease-classifier.ts`)
- Integrates PyTorch model with Next.js
- Supports 38 plant diseases across multiple crops
- Returns disease prediction with confidence scores
- Handles model loading and image preprocessing

### 2. Integrated RAG Service (`lib/model/integrated-disease-rag.ts`)
- Combines ML model output with RAG system
- Generates comprehensive treatment plans
- Provides preventive measures and future care advice
- Supports 5 languages (English, Hindi, Telugu, Bengali, Tamil)

### 3. Enhanced Image API (`app/api/search/image/route.ts`)
- Processes image uploads with optional text queries
- Integrates weather data for location-specific advice
- Returns structured responses with confidence scores

## Model Details

### Supported Plants and Diseases
The model can identify:
- **Apple**: Scab, Black rot, Cedar apple rust, Healthy
- **Corn**: Cercospora leaf spot, Common rust, Northern Leaf Blight, Healthy  
- **Tomato**: Multiple diseases including Bacterial spot, Early/Late blight, Leaf Mold, etc.
- **Potato**: Early blight, Late blight, Healthy
- **Grape**: Black rot, Esca, Leaf blight, Healthy
- And many more... (see `model/classes.json` for complete list)

### Technical Specifications
- **Model**: ResNet-34 based architecture
- **Input**: 224x224 RGB images
- **Framework**: PyTorch
- **Confidence**: Softmax probability scores

## Setup Instructions

### Prerequisites
- Python 3.8 or higher
- Node.js and npm/pnpm
- PyTorch and torchvision

### Installation

1. **Setup Python Environment**:
   ```bash
   # Windows
   cd model
   setup.bat
   
   # Linux/Mac
   cd model
   chmod +x setup.sh
   ./setup.sh
   ```

2. **Install Node Dependencies**:
   ```bash
   pnpm install
   ```

3. **Verify Model Files**:
   Ensure these files exist in the `model/` directory:
   - `Model_sk.pth` or `model_sk.pth` (trained model weights)
   - `classes.json` (class mappings)
   - `predict_single.py` (auto-generated prediction script)

### Testing

Test the model directly:
```bash
cd model
python predict_single.py path/to/plant_image.jpg
```

Test via API:
```bash
curl -X POST http://localhost:3000/api/search/image \
  -F "image=@plant_image.jpg" \
  -F "language=en" \
  -F "userLocation=Mumbai"
```

## Usage Flow

1. **Image Upload**: User uploads plant image via frontend
2. **Disease Detection**: ML model analyzes image and identifies disease
3. **RAG Integration**: System constructs detailed query for RAG system
4. **Comprehensive Response**: Returns formatted advice including:
   - Current disease status
   - Immediate recommendations  
   - Detailed treatment plan
   - Preventive measures
   - Future care guidelines

## Response Format

```json
{
  "results": [{
    "title": "Disease Name in Plant - Treatment Guide",
    "content": "Formatted response with emojis and sections",
    "diseaseInfo": {
      "plant": "Tomato",
      "disease": "Early blight", 
      "isHealthy": false
    },
    "confidence": 0.95,
    "modelPrediction": "Tomato___Early_blight"
  }],
  "analysisDetails": {
    "diseaseDetected": "Tomato___Early_blight",
    "confidence": 0.95,
    "plantType": "Tomato",
    "isHealthy": false
  }
}
```

## Supported Languages

All responses are available in:
- **English** (en)
- **Hindi** (hi) 
- **Telugu** (te)
- **Bengali** (bn)
- **Tamil** (ta)

## Fallback Mechanisms

1. **Model Failure**: Falls back to basic disease information
2. **RAG Failure**: Uses predefined treatment templates
3. **Complete Failure**: Returns error with guidance to consult experts

## Performance Considerations

- Model inference time: ~1-3 seconds per image
- RAG response generation: ~3-5 seconds
- Total response time: ~4-8 seconds
- Image size limit: 10MB (configurable)

## Error Handling

The system gracefully handles:
- Invalid image formats
- Model loading failures  
- RAG system errors
- Network connectivity issues
- Missing dependencies

## Future Enhancements

- [ ] Support for additional plant diseases
- [ ] Real-time disease progression tracking
- [ ] Integration with IoT sensors
- [ ] Batch image processing
- [ ] Mobile app optimization
