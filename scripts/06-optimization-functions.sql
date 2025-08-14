-- Function to remove duplicate embeddings
CREATE OR REPLACE FUNCTION remove_duplicate_embeddings()
RETURNS INTEGER
LANGUAGE plpgsql
AS $$
DECLARE
    removed_count INTEGER;
BEGIN
    -- Remove duplicates based on content hash
    WITH duplicates AS (
        SELECT id, 
               ROW_NUMBER() OVER (
                   PARTITION BY md5(content), document_type, language 
                   ORDER BY created_at DESC
               ) as rn
        FROM public.document_embeddings
    )
    DELETE FROM public.document_embeddings 
    WHERE id IN (
        SELECT id FROM duplicates WHERE rn > 1
    );
    
    GET DIAGNOSTICS removed_count = ROW_COUNT;
    RETURN removed_count;
END;
$$;

-- Function to get table statistics
CREATE OR REPLACE FUNCTION get_table_stats(table_name TEXT)
RETURNS TABLE (
    row_count BIGINT,
    table_size TEXT,
    index_size TEXT
)
LANGUAGE plpgsql
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        (SELECT reltuples::BIGINT FROM pg_class WHERE relname = table_name),
        pg_size_pretty(pg_total_relation_size(table_name::regclass)),
        pg_size_pretty(pg_indexes_size(table_name::regclass));
END;
$$;

-- Function to execute SQL (for optimization queries)
CREATE OR REPLACE FUNCTION execute_sql(sql TEXT)
RETURNS VOID
LANGUAGE plpgsql
AS $$
BEGIN
    EXECUTE sql;
END;
$$;

-- Function to get vector search performance stats
CREATE OR REPLACE FUNCTION get_vector_performance_stats()
RETURNS TABLE (
    avg_similarity_search_time NUMERIC,
    total_documents BIGINT,
    index_efficiency NUMERIC
)
LANGUAGE plpgsql
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        0.0::NUMERIC as avg_similarity_search_time, -- Placeholder
        COUNT(*)::BIGINT as total_documents,
        100.0::NUMERIC as index_efficiency -- Placeholder
    FROM public.document_embeddings;
END;
$$;
