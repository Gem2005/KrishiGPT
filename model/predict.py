import sys
import json
import os

# Check if we have the required libraries
try:
    import torch
    from PIL import Image
    from torchvision import transforms
    import torch.nn as nn
    from torchvision import models
except ImportError as e:
    print(json.dumps({"error": f"Missing required library: {str(e)}. Please install: pip install torch torchvision pillow"}))
    sys.exit(1)

# Change to model directory
model_dir = os.path.dirname(os.path.abspath(__file__))
os.chdir(model_dir)

# Load classes
try:
    with open("classes.json", "r") as f:
        class_to_idx = json.load(f)
    idx_to_class = {v: k for k, v in class_to_idx.items()}
except FileNotFoundError:
    print(json.dumps({"error": "classes.json file not found"}))
    sys.exit(1)

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

# Initialize model
device = torch.device('cuda' if torch.cuda.is_available() else 'cpu')
model = PlantDiseaseModel(num_classes=len(class_to_idx))

# Load model weights
try:
    if os.path.exists('Model_sk.pth'):
        model.load_state_dict(torch.load('Model_sk.pth', map_location=device))
    elif os.path.exists('model_sk.pth'):
        model.load_state_dict(torch.load('model_sk.pth', map_location=device))
    else:
        print(json.dumps({"error": "Model file not found. Expected 'Model_sk.pth' or 'model_sk.pth'"}))
        sys.exit(1)
except Exception as e:
    print(json.dumps({"error": f"Failed to load model: {str(e)}"}))
    sys.exit(1)

model.to(device)
model.eval()

# Image transforms
test_transforms = transforms.Compose([
    transforms.Resize(256),
    transforms.CenterCrop(224),
    transforms.ToTensor(),
    transforms.Normalize(mean=[0.485, 0.456, 0.406],
                         std=[0.229, 0.224, 0.225])
])

def predict_image(image_path):
    try:
        image = Image.open(image_path).convert("RGB")
        image = test_transforms(image).unsqueeze(0).to(device)
        
        with torch.no_grad():
            outputs = model(image)
            probabilities = torch.nn.functional.softmax(outputs, dim=1)
            confidence, predicted = torch.max(probabilities, 1)
            
            return {
                "prediction": idx_to_class[predicted.item()],
                "confidence": float(confidence.item())
            }
    except Exception as e:
        return {"error": f"Prediction failed: {str(e)}"}

if __name__ == "__main__":
    if len(sys.argv) != 2:
        print(json.dumps({"error": "Usage: python predict.py <image_path>"}))
        sys.exit(1)
    
    image_path = sys.argv[1]
    if not os.path.exists(image_path):
        print(json.dumps({"error": f"Image file not found: {image_path}"}))
        sys.exit(1)
    
    result = predict_image(image_path)
    print(json.dumps(result))
