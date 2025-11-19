-- Phase 1: Komplette Entfernung der Dokumentensuche-Funktion
-- Entfernt match_documents RPC, document_embeddings Tabelle und AI-Spalten aus file_metadata

-- 1. Lösche match_documents RPC-Funktion
DROP FUNCTION IF EXISTS match_documents(vector, double precision, integer);

-- 2. Lösche document_embeddings Tabelle
DROP TABLE IF EXISTS document_embeddings CASCADE;

-- 3. Entferne AI-Indexierung Spalten aus file_metadata
ALTER TABLE file_metadata
  DROP COLUMN IF EXISTS ai_searchable,
  DROP COLUMN IF EXISTS text_content,
  DROP COLUMN IF EXISTS indexed_at,
  DROP COLUMN IF EXISTS indexing_status;