-- Create users table for authentication
CREATE TABLE IF NOT EXISTS users (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create agricultural knowledge base table
CREATE TABLE IF NOT EXISTS agricultural_knowledge (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title VARCHAR(500) NOT NULL,
  content TEXT NOT NULL,
  category VARCHAR(100) NOT NULL, -- crops, livestock, weather, diseases, etc.
  subcategory VARCHAR(100),
  language VARCHAR(10) DEFAULT 'en', -- en, hi, bn, ta, etc.
  tags TEXT[], -- array of tags for better search
  embedding VECTOR(1536), -- for RAG embeddings
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create chat sessions table
CREATE TABLE IF NOT EXISTS chat_sessions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  title VARCHAR(255),
  language VARCHAR(10) DEFAULT 'en',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create chat messages table
CREATE TABLE IF NOT EXISTS chat_messages (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  session_id UUID REFERENCES chat_sessions(id) ON DELETE CASCADE,
  role VARCHAR(20) NOT NULL, -- user, assistant, system
  content TEXT NOT NULL,
  metadata JSONB, -- for storing additional data like sources, confidence, etc.
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create search queries table for analytics
CREATE TABLE IF NOT EXISTS search_queries (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  query TEXT NOT NULL,
  query_type VARCHAR(20) DEFAULT 'text', -- text, voice, image
  language VARCHAR(10) DEFAULT 'en',
  results_count INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_agricultural_knowledge_category ON agricultural_knowledge(category);
CREATE INDEX IF NOT EXISTS idx_agricultural_knowledge_language ON agricultural_knowledge(language);
CREATE INDEX IF NOT EXISTS idx_agricultural_knowledge_tags ON agricultural_knowledge USING GIN(tags);
CREATE INDEX IF NOT EXISTS idx_chat_sessions_user_id ON chat_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_chat_messages_session_id ON chat_messages(session_id);
CREATE INDEX IF NOT EXISTS idx_search_queries_user_id ON search_queries(user_id);

-- Enable Row Level Security
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE search_queries ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Users can view own data" ON users FOR ALL USING (auth.uid() = id);
CREATE POLICY "Users can view own chat sessions" ON chat_sessions FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users can view own chat messages" ON chat_messages FOR ALL USING (
  EXISTS (SELECT 1 FROM chat_sessions WHERE chat_sessions.id = chat_messages.session_id AND chat_sessions.user_id = auth.uid())
);
CREATE POLICY "Users can view own search queries" ON search_queries FOR ALL USING (auth.uid() = user_id);

-- Agricultural knowledge is public for reading
CREATE POLICY "Anyone can read agricultural knowledge" ON agricultural_knowledge FOR SELECT USING (true);
