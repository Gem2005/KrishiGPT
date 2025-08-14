# KrishiGPT - AI-Powered Agricultural Assistant

**Built for Capital One Hackathon 2024**

KrishiGPT is a comprehensive AI-powered agricultural assistant that helps farmers make smarter farming decisions through multilingual support, voice/image search capabilities, and intelligent RAG (Retrieval Augmented Generation) system.

## 🌟 Features

### Core Functionality
- **Multilingual Support**: English, Hindi, Telugu, Bengali, Tamil
- **Voice Search**: Speech-to-text input for hands-free queries
- **Image Search**: Upload images for pest/disease identification
- **Text-to-Speech**: Audio responses for accessibility
- **Real-time Chat**: Interactive AI assistant powered by Groq LLaMA

### Technical Features
- **RAG System**: Retrieval Augmented Generation for accurate agricultural knowledge
- **Authentication**: Secure user accounts with Supabase Auth
- **Responsive Design**: Mobile-first design with dynamic navbar
- **Database Integration**: PostgreSQL with vector embeddings
- **API Routes**: RESTful endpoints for chat, search, and knowledge management

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ and npm
- Supabase account
- Groq API key

### Environment Variables
Create a `.env.local` file with:

\`\`\`env
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# AI Configuration
GROQ_API_KEY=your_groq_api_key

# Development
NEXT_PUBLIC_DEV_SUPABASE_REDIRECT_URL=http://localhost:3000/chat
\`\`\`

### Installation & Setup

1. **Clone and Install**
   \`\`\`bash
   git clone <repository-url>
   cd krishigpt
   npm install
   \`\`\`

2. **Database Setup**
   - Run the SQL scripts in `/scripts` folder in your Supabase SQL editor
   - Or use the built-in script runner in the v0 interface

3. **Start Development Server**
   \`\`\`bash
   npm run dev
   \`\`\`

4. **Access the Application**
   - Landing Page: http://localhost:3000
   - Chat Interface: http://localhost:3000/chat
   - Health Check: http://localhost:3000/api/health

## 🏗️ Architecture

### Frontend
- **Next.js 14** with App Router
- **TypeScript** for type safety
- **Tailwind CSS** for styling
- **shadcn/ui** components
- **Lucide React** icons

### Backend
- **Next.js API Routes**
- **Supabase** for database and authentication
- **Groq AI** for LLaMA model inference
- **Vector Embeddings** for semantic search

### Database Schema
- `agricultural_knowledge` - Knowledge base with embeddings
- `chat_sessions` - User chat history
- `chat_messages` - Individual messages
- `search_queries` - Search analytics
- `users` - User profiles (managed by Supabase Auth)

## 📱 User Journey

1. **Landing Page**: Dynamic navbar, search bar with voice/image options
2. **Authentication**: Sign up/login with email and password
3. **Chat Interface**: Interactive AI assistant with multilingual support
4. **Search**: Text, voice, and image search capabilities
5. **Knowledge Base**: RAG-powered responses with source citations

## 🔧 API Endpoints

### Chat API
\`\`\`
POST /api/chat
Body: { message: string, language: string, userId?: string }
Response: { response: string, relevantKnowledge: Array, language: string }
\`\`\`

### Search APIs
\`\`\`
POST /api/search/text
POST /api/search/image
\`\`\`

### Knowledge Management
\`\`\`
POST /api/knowledge/upload
\`\`\`

### Health Check
\`\`\`
GET /api/health
Response: { status: string, services: object, timestamp: string }
\`\`\`

## 🌐 Deployment

### Vercel Deployment (Recommended)
1. Connect your GitHub repository to Vercel
2. Add environment variables in Vercel dashboard
3. Deploy automatically on push to main branch

### Manual Deployment
\`\`\`bash
npm run build
npm start
\`\`\`

## 🧪 Testing

### Health Check
Visit `/api/health` to verify all services are running correctly.

### Manual Testing Checklist
- [ ] Landing page loads with dynamic navbar
- [ ] User registration and login works
- [ ] Chat interface responds to queries
- [ ] Voice input functions (requires HTTPS)
- [ ] Language switching works
- [ ] Mobile responsiveness
- [ ] Database connections are stable

## 🔒 Security Features

- **Authentication**: Supabase Auth with JWT tokens
- **Route Protection**: Middleware-based auth guards
- **Environment Variables**: Secure API key management
- **Input Validation**: Sanitized user inputs
- **Error Handling**: Graceful error boundaries

## 🎯 Hackathon Highlights

### Innovation
- **RAG Implementation**: Custom vector embeddings for agricultural knowledge
- **Multilingual AI**: Seamless language switching in conversations
- **Voice/Image Search**: Multiple input modalities for accessibility

### Technical Excellence
- **Full-Stack TypeScript**: End-to-end type safety
- **Modern Architecture**: Next.js 14 with App Router
- **Responsive Design**: Mobile-first approach
- **Performance**: Optimized with caching and lazy loading

### User Experience
- **Intuitive Interface**: Clean, farmer-friendly design
- **Accessibility**: Voice input/output, screen reader support
- **Real-time Feedback**: Loading states and error handling

## 🤝 Contributing

This is a hackathon project built for demonstration purposes. For production use, consider:
- Enhanced error handling and logging
- Rate limiting and API security
- Advanced vector search optimization
- Comprehensive testing suite
- Performance monitoring

## 📄 License

Built for Capital One Hackathon 2024 - Educational and demonstration purposes.

---

**KrishiGPT** - Empowering farmers with AI technology 🌱
