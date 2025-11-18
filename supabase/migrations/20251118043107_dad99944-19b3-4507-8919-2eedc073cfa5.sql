-- Phase 1: Enable pgvector extension and extend database for AI document search

-- Enable pgvector extension for vector similarity search
CREATE EXTENSION IF NOT EXISTS vector;

-- Extend file_metadata table with AI search capabilities
ALTER TABLE file_metadata 
ADD COLUMN IF NOT EXISTS ai_searchable BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS text_content TEXT,
ADD COLUMN IF NOT EXISTS indexed_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS indexing_status TEXT DEFAULT 'not_indexed' CHECK (indexing_status IN ('not_indexed', 'indexing', 'indexed', 'failed'));

-- Create document_embeddings table for vector search
CREATE TABLE IF NOT EXISTS document_embeddings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  file_id UUID REFERENCES file_metadata(id) ON DELETE CASCADE NOT NULL,
  content_chunk TEXT NOT NULL,
  chunk_index INTEGER NOT NULL,
  embedding vector(768),
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(file_id, chunk_index)
);

-- Create indexes for fast vector search
CREATE INDEX IF NOT EXISTS document_embeddings_vector_idx ON document_embeddings 
USING ivfflat (embedding vector_cosine_ops) WITH (lists = 100);

CREATE INDEX IF NOT EXISTS document_embeddings_file_id_idx ON document_embeddings(file_id);

-- Enable RLS on document_embeddings
ALTER TABLE document_embeddings ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Admins can manage all embeddings
CREATE POLICY "Admins can manage all embeddings"
ON document_embeddings FOR ALL
TO authenticated
USING (is_admin(auth.uid()))
WITH CHECK (is_admin(auth.uid()));

-- RLS Policy: Service role can read embeddings (for AI assistant)
CREATE POLICY "Service role can read embeddings"
ON document_embeddings FOR SELECT
TO service_role
USING (true);

-- Function for vector similarity search
CREATE OR REPLACE FUNCTION match_documents(
  query_embedding vector(768),
  match_threshold FLOAT DEFAULT 0.7,
  match_count INT DEFAULT 5
)
RETURNS TABLE (
  file_id UUID,
  content_chunk TEXT,
  chunk_index INT,
  similarity FLOAT,
  filename TEXT,
  metadata JSONB
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT
    de.file_id,
    de.content_chunk,
    de.chunk_index,
    1 - (de.embedding <=> query_embedding) AS similarity,
    fm.filename,
    de.metadata
  FROM document_embeddings de
  JOIN file_metadata fm ON fm.id = de.file_id
  WHERE 1 - (de.embedding <=> query_embedding) > match_threshold
    AND fm.ai_searchable = true
  ORDER BY de.embedding <=> query_embedding
  LIMIT match_count;
END;
$$;