# KrishiGPT Deployment Guide

## Local Development

### Prerequisites
- Node.js 18+ and npm
- Python 3.8+ and pip
- Required environment variables (see .env.example)

### Setup Instructions

1. **Install dependencies:**
   ```bash
   npm install
   npm run setup-local  # Installs Python dependencies
   ```

2. **Set up environment variables:**
   Copy `.env.example` to `.env.local` and configure all required variables.

3. **Development with ML model:**
   ```bash
   npm run dev:full  # Runs both Next.js and Python model service
   ```

   Or run separately:
   ```bash
   npm run dev       # Next.js only
   npm run model:dev # Python model service only
   ```

## Deployment Options

### Option 1: Vercel + Render (Recommended for Production)

#### Vercel (Main Application)
- Deploy the Next.js application to Vercel
- Set environment variable: `NODE_ENV=production`
- Set environment variable: `RENDER_SERVICE_URL=https://your-render-service.onrender.com`

#### Render (ML Model Service)
1. Create a new Web Service on Render
2. Connect your GitHub repository
3. Set the following:
   - **Build Command:** `cd model && pip install -r requirements.txt`
   - **Start Command:** `cd model && python main.py`
   - **Environment:** Python 3.8+
4. Deploy and note the service URL

### Option 2: Self-hosted Server
- Requires Python environment with GPU support (optional but recommended)
- Run both services on the same machine:
  ```bash
  npm run dev:full
  ```

## Environment Variables

### Required for Production
- `RENDER_SERVICE_URL`: URL of your deployed ML model service
- `NODE_ENV=production`: Enables production mode

### Required for Local Development
- All Supabase, AI provider, and other service credentials as per .env.example

## API Endpoints

### ML Model Service
- `GET /health` - Health check
- `POST /predict` - Image classification
  - Input: multipart/form-data with image file
  - Output: JSON with disease prediction and confidence

### Next.js Application
- `POST /api/search/image` - Image search with RAG integration
- Standard Next.js routes for the web interface

## Architecture

```
┌─────────────────┐    ┌──────────────────┐
│   Vercel        │    │    Render        │
│   Next.js App   │───▶│   ML Service     │
│   - Web UI      │    │   - PyTorch      │
│   - RAG System  │    │   - FastAPI      │
│   - API Routes  │    │   - Disease AI   │
└─────────────────┘    └──────────────────┘
         │
         ▼
┌─────────────────┐
│   Supabase      │
│   - Database    │
│   - Vector DB   │
│   - Auth        │
└─────────────────┘
```

## Model Information
- **Architecture:** ResNet-34 with transfer learning
- **Classes:** 38 plant diseases across multiple crops
- **Input:** RGB images (224x224 after preprocessing)
- **Output:** Disease classification with confidence scores
