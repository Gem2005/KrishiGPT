from fastapi import FastAPI, UploadFile, File
import torch
from PIL import Image
from torchvision import transforms
import json
import torch.nn as nn
from torchvision import models
import io
import uvicorn


with open("classes.json", "r") as f:
    class_to_idx: dict = json.load(f)
idx_to_class = {v: k for k, v in class_to_idx.items()}


class PlantDiseaseModel(nn.Module):
    def __init__(self, num_classes):
        super().__init__()
        self.resnet = models.resnet34(pretrained=True)
        for param in self.resnet.parameters():
            param.requires_grad = False
        num_ftrs = self.resnet.fc.in_features
        self.resnet.fc = nn.Linear(num_ftrs, num_classes)

    def forward(self, x):
        return self.resnet(x)


device = torch.device('cuda' if torch.cuda.is_available() else 'cpu')
model = PlantDiseaseModel(num_classes=len(class_to_idx))
model.load_state_dict(torch.load('model_sk.pth', map_location=device))
model.to(device)
model.eval()


test_transforms = transforms.Compose([
    transforms.Resize(256),
    transforms.CenterCrop(224),
    transforms.ToTensor(),
    transforms.Normalize(mean=[0.485, 0.456, 0.406],
                         std=[0.229, 0.224, 0.225])
])


def predict_image(image: Image.Image) -> str:
    image = image.convert("RGB")
    image = test_transforms(image).unsqueeze(0).to(device)

    with torch.no_grad():
        outputs = model(image)
        _, predicted = torch.max(outputs, 1)
        return idx_to_class[predicted.item()]

app = FastAPI()

@app.post("/predict")
async def predict(file: UploadFile = File(...)):
    image_bytes = await file.read()
    image = Image.open(io.BytesIO(image_bytes))
    prediction = predict_image(image)
    return {"prediction": prediction}


if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000, reload=False)