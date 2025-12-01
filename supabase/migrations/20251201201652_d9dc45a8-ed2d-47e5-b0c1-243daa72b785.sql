-- Remove unused pgvector extension that was installed for a removed AI document search feature
-- This resolves the "Extension in Public Schema" security warning

DROP EXTENSION IF EXISTS vector CASCADE;