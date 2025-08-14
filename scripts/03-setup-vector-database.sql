-- Enable pgvector extension for vector operations
CREATE EXTENSION IF NOT EXISTS vector;

-- Create vector embeddings table for agricultural documents
CREATE TABLE IF NOT EXISTS public.document_embeddings (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    content TEXT NOT NULL,
    metadata JSONB DEFAULT '{}',
    embedding vector(1536), -- OpenAI ada-002 embedding dimension
    document_type VARCHAR(50) DEFAULT 'agricultural_knowledge',
    language VARCHAR(10) DEFAULT 'en',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index for vector similarity search
CREATE INDEX IF NOT EXISTS document_embeddings_embedding_idx 
ON public.document_embeddings 
USING ivfflat (embedding vector_cosine_ops)
WITH (lists = 100);

-- Create index for metadata filtering
CREATE INDEX IF NOT EXISTS document_embeddings_metadata_idx 
ON public.document_embeddings 
USING GIN (metadata);

-- Create index for document type filtering
CREATE INDEX IF NOT EXISTS document_embeddings_type_idx 
ON public.document_embeddings (document_type);

-- Create index for language filtering
CREATE INDEX IF NOT EXISTS document_embeddings_language_idx 
ON public.document_embeddings (language);

-- Create function for similarity search
CREATE OR REPLACE FUNCTION match_documents(
    query_embedding vector(1536),
    match_threshold float DEFAULT 0.78,
    match_count int DEFAULT 10,
    filter_metadata jsonb DEFAULT '{}'
)
RETURNS TABLE (
    id uuid,
    content text,
    metadata jsonb,
    similarity float
)
LANGUAGE plpgsql
AS $$
BEGIN
    RETURN QUERY
    SELECT
        document_embeddings.id,
        document_embeddings.content,
        document_embeddings.metadata,
        1 - (document_embeddings.embedding <=> query_embedding) AS similarity
    FROM document_embeddings
    WHERE 
        (filter_metadata = '{}' OR document_embeddings.metadata @> filter_metadata)
        AND 1 - (document_embeddings.embedding <=> query_embedding) > match_threshold
    ORDER BY document_embeddings.embedding <=> query_embedding
    LIMIT match_count;
END;
$$;

-- Create conversation history table for context management
CREATE TABLE IF NOT EXISTS public.conversation_history (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    session_id VARCHAR(255) NOT NULL,
    message_type VARCHAR(20) NOT NULL CHECK (message_type IN ('user', 'assistant')),
    content TEXT NOT NULL,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index for conversation retrieval
CREATE INDEX IF NOT EXISTS conversation_history_session_idx 
ON public.conversation_history (session_id, created_at DESC);

-- Create index for user conversations
CREATE INDEX IF NOT EXISTS conversation_history_user_idx 
ON public.conversation_history (user_id, created_at DESC);

-- Enable Row Level Security
ALTER TABLE public.document_embeddings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.conversation_history ENABLE ROW LEVEL SECURITY;

-- Create policies for document embeddings (public read access)
CREATE POLICY "Public read access for document embeddings" 
ON public.document_embeddings FOR SELECT 
USING (true);

-- Create policies for conversation history (user can only access their own)
CREATE POLICY "Users can view their own conversations" 
ON public.conversation_history FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own conversations" 
ON public.conversation_history FOR INSERT 
WITH CHECK (auth.uid() = user_id);
