-- Create embedding cache table for performance optimization
CREATE TABLE IF NOT EXISTS public.embedding_cache (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    cache_key VARCHAR(255) NOT NULL,
    text TEXT NOT NULL,
    embedding vector(1536) NOT NULL,
    model VARCHAR(50) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(cache_key, model)
);

-- Create indexes for fast lookup
CREATE INDEX IF NOT EXISTS embedding_cache_key_model_idx 
ON public.embedding_cache (cache_key, model);

CREATE INDEX IF NOT EXISTS embedding_cache_created_at_idx 
ON public.embedding_cache (created_at DESC);

-- Enable Row Level Security
ALTER TABLE public.embedding_cache ENABLE ROW LEVEL SECURITY;

-- Create policy for public read access (embeddings can be shared)
CREATE POLICY "Public read access for embedding cache" 
ON public.embedding_cache FOR SELECT 
USING (true);

-- Create policy for service role write access
CREATE POLICY "Service role write access for embedding cache" 
ON public.embedding_cache FOR ALL 
USING (auth.role() = 'service_role');
