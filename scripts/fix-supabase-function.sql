-- Create the match_documents function that LangChain expects
CREATE OR REPLACE FUNCTION match_documents(
    query_embedding vector(768), -- Google embedding dimension
    match_count int DEFAULT 10,
    filter jsonb DEFAULT '{}'
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
        (filter = '{}' OR document_embeddings.metadata @> filter)
    ORDER BY document_embeddings.embedding <=> query_embedding
    LIMIT match_count;
END;
$$;

-- Also update the table to support Google embeddings (768 dimensions)
ALTER TABLE document_embeddings 
ALTER COLUMN embedding TYPE vector(768);

-- Update the index for the new vector dimension
DROP INDEX IF EXISTS document_embeddings_embedding_idx;
CREATE INDEX document_embeddings_embedding_idx 
ON public.document_embeddings 
USING ivfflat (embedding vector_cosine_ops)
WITH (lists = 100);
