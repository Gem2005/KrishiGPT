from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.middleware.cors import CORSMiddleware
import torch
import torch.nn as nn
from torchvision import models, transforms
from PIL import Image
import json
import io
import uvicorn
import os

app = FastAPI(title="KrishiGPT Disease Detection API")

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Global variables
model = None
class_names = []
idx_to_class = {}
device = torch.device('cuda' if torch.cuda.is_available() else 'cpu')

class PlantDiseaseModel(nn.Module):
    def __init__(self, num_classes):
        super().__init__()
        self.resnet = models.resnet34(pretrained=False)
        for param in self.resnet.parameters():
            param.requires_grad = False
        num_ftrs = self.resnet.fc.in_features
        self.resnet.fc = nn.Linear(num_ftrs, num_classes)

    def forward(self, x):
        return self.resnet(x)

def load_model():
    global model, class_names, idx_to_class
    try:
        # Load classes
        with open("classes.json", "r") as f:
            class_to_idx = json.load(f)
        idx_to_class = {v: k for k, v in class_to_idx.items()}
        class_names = list(class_to_idx.keys())
        
        # Initialize and load model
        model = PlantDiseaseModel(num_classes=len(class_to_idx))
        
        # Try both model file names
        model_path = None
        if os.path.exists('Model_sk.pth'):
            model_path = 'Model_sk.pth'
        elif os.path.exists('model_sk.pth'):
            model_path = 'model_sk.pth'
        else:
            raise FileNotFoundError("Model file not found")
            
        model.load_state_dict(torch.load(model_path, map_location=device))
        model.to(device)
        model.eval()
        
        print(f"Model loaded successfully with {len(class_names)} classes on {device}")
        return True
        
    except Exception as e:
        print(f"Error loading model: {e}")
        return False

# Image preprocessing
transform = transforms.Compose([
    transforms.Resize(256),
    transforms.CenterCrop(224),
    transforms.ToTensor(),
    transforms.Normalize(mean=[0.485, 0.456, 0.406], std=[0.229, 0.224, 0.225])
])


@app.on_event("startup")
async def startup_event():
    load_model()

@app.get("/")
async def root():
    return {
        "message": "KrishiGPT Disease Detection API",
        "status": "healthy",
        "version": "1.0.0"
    }

@app.get("/health")
async def health_check():
    return {
        "status": "healthy" if model is not None else "unhealthy",
        "model_loaded": model is not None,
        "classes_count": len(class_names),
        "device": str(device),
        "service": "local"
    }

def predict_image(image: Image.Image) -> dict:
    if model is None:
        return {"error": "Model not loaded"}
    
    try:
        image = image.convert("RGB")
        input_tensor = transform(image).unsqueeze(0).to(device)

        with torch.no_grad():
            outputs = model(input_tensor)
            probabilities = torch.nn.functional.softmax(outputs[0], dim=0)
            confidence, predicted_idx = torch.max(probabilities, 0)
        
        # Get prediction details
        predicted_class = idx_to_class[predicted_idx.item()]
        confidence_score = float(confidence.item())
        
        # Get top 3 predictions
        top3_prob, top3_idx = torch.topk(probabilities, 3)
        top3_predictions = [
            {
                "disease": idx_to_class[idx.item()],
                "confidence": float(prob.item())
            }
            for prob, idx in zip(top3_prob, top3_idx)
        ]
        
        return {
            "success": True,
            "prediction": {
                "disease": predicted_class,
                "confidence": confidence_score,
                "top_predictions": top3_predictions
            },
            "service": "local"
        }
        
    except Exception as e:
        return {"error": str(e)}

# Function for direct script usage
def predict_from_path(image_path: str) -> dict:
    try:
        image = Image.open(image_path)
        return predict_image(image)
    except Exception as e:
        return {"error": str(e)}

@app.post("/predict")
async def predict_disease(file: UploadFile = File(...)):
    if model is None:
        raise HTTPException(status_code=500, detail="Model not loaded")
    
    try:
        # Validate file type
        if not file.content_type.startswith('image/'):
            raise HTTPException(status_code=400, detail="File must be an image")
        
        # Read and process image
        image_data = await file.read()
        image = Image.open(io.BytesIO(image_data)).convert('RGB')
        
        # Get prediction
        result = predict_image(image)
        
        if "error" in result:
            raise HTTPException(status_code=500, detail=result["error"])
            
        return result
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Prediction failed: {str(e)}")

# CLI support
if __name__ == "__main__":
    import sys
    if len(sys.argv) == 2:
        # Direct prediction mode
        if not load_model():
            print(json.dumps({"error": "Failed to load model"}))
            sys.exit(1)
            
        image_path = sys.argv[1]
        result = predict_from_path(image_path)
        print(json.dumps(result))
    else:
        # FastAPI server mode
        port = int(os.environ.get("PORT", 8000))
        uvicorn.run(app, host="0.0.0.0", port=port)