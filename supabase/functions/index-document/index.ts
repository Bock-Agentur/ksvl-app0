import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.58.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Text chunking with overlap
function chunkText(text: string, chunkSize: number = 500, overlap: number = 100): string[] {
  const chunks: string[] = [];
  let start = 0;
  
  while (start < text.length) {
    const end = Math.min(start + chunkSize, text.length);
    chunks.push(text.substring(start, end));
    start += chunkSize - overlap;
  }
  
  return chunks;
}

// Generate embeddings using OpenAI text-embedding-3-small
async function generateEmbedding(text: string, apiKey: string): Promise<number[]> {
  const response = await fetch('https://api.openai.com/v1/embeddings', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'text-embedding-3-small',
      input: text,
    })
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error('OpenAI Embedding API error:', response.status, errorText);
    throw new Error(`OpenAI Embedding API error: ${response.status}`);
  }

  const data = await response.json();
  return data.data[0].embedding;
}

// Extract text from different file types using unpdf with explicit PDF.js import
async function extractText(fileBuffer: ArrayBuffer, mimeType: string): Promise<string> {
  try {
    // Only PDF is supported for now
    if (mimeType !== 'application/pdf') {
      throw new Error(`Unsupported file type: ${mimeType}. Currently only PDF is supported.`);
    }
    
    console.log(`Parsing PDF document (${fileBuffer.byteLength} bytes)`);
    
    // Explicitly import pdfjs-dist first to make it available for unpdf
    const pdfjsLib = await import('https://esm.sh/pdfjs-dist@4.0.379/build/pdf.mjs');
    
    // Import unpdf which will use the pdfjs-dist we just loaded
    const { extractText: extractPDFText } = await import('https://esm.sh/unpdf@0.12.0');
    
    // Convert ArrayBuffer to Uint8Array
    const buffer = new Uint8Array(fileBuffer);
    
    // Extract text from PDF with pdfjs available
    const data = await extractPDFText(buffer, { mergePages: true });
    
    if (!data.text || data.text.trim().length === 0) {
      throw new Error('PDF contains no extractable text (might be a scanned document)');
    }
    
    console.log(`PDF parsed successfully: ${data.totalPages} pages, ${data.text.length} characters extracted`);
    return data.text;
    
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : 'Unknown error';
    console.error('Document parsing error:', error);
    throw new Error(`Failed to parse document: ${errorMsg}`);
  }
}


serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { fileId } = await req.json();
    console.log('Indexing document:', fileId);

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const openaiApiKey = Deno.env.get('OPENAI_API_KEY')!;

    if (!openaiApiKey) {
      throw new Error('OPENAI_API_KEY not configured');
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Update status to 'indexing'
    await supabase
      .from('file_metadata')
      .update({ indexing_status: 'indexing' })
      .eq('id', fileId);

    // Fetch file metadata
    const { data: fileMetadata, error: metadataError } = await supabase
      .from('file_metadata')
      .select('*')
      .eq('id', fileId)
      .single();

    if (metadataError || !fileMetadata) {
      throw new Error('File not found');
    }

    console.log('File metadata:', fileMetadata.filename, fileMetadata.mime_type);

    // Download file from storage
    const { data: fileData, error: downloadError } = await supabase
      .storage
      .from(fileMetadata.category === 'login_media' ? 'login-media' : 
            fileMetadata.category === 'user_document' ? 'member-documents' : 'documents')
      .download(fileMetadata.storage_path);

    if (downloadError || !fileData) {
      throw new Error('Failed to download file: ' + downloadError?.message);
    }

    console.log('File downloaded, size:', fileData.size);

    // Extract text
    const fileBuffer = await fileData.arrayBuffer();
    const text = await extractText(fileBuffer, fileMetadata.mime_type);
    
    if (!text || text.trim().length === 0) {
      throw new Error('No text content extracted');
    }

    console.log('Text extracted, length:', text.length);

    // Chunk text
    const chunks = chunkText(text);
    console.log('Text chunked into', chunks.length, 'chunks');

    // Delete existing embeddings for this file
    await supabase
      .from('document_embeddings')
      .delete()
      .eq('file_id', fileId);

    // Create embeddings for each chunk using OpenAI
    for (let i = 0; i < chunks.length; i++) {
      console.log(`Processing chunk ${i + 1}/${chunks.length}`);
      
      const embedding = await generateEmbedding(chunks[i], openaiApiKey);

      // Store embedding
      const { error: insertError } = await supabase
        .from('document_embeddings')
        .insert({
          file_id: fileId,
          content_chunk: chunks[i],
          chunk_index: i,
          embedding: embedding,
          metadata: {
            filename: fileMetadata.filename,
            mime_type: fileMetadata.mime_type,
            chunk_length: chunks[i].length
          }
        });

      if (insertError) {
        console.error('Insert error:', insertError);
        throw insertError;
      }
    }

    // Update file_metadata with success status
    await supabase
      .from('file_metadata')
      .update({
        indexing_status: 'indexed',
        indexed_at: new Date().toISOString(),
        text_content: text.substring(0, 10000) // Store first 10k chars
      })
      .eq('id', fileId);

    console.log('Indexing completed successfully');

    return new Response(
      JSON.stringify({ 
        success: true, 
        chunks: chunks.length,
        message: 'Document indexed successfully'
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in index-document function:', error);

    // Update status to 'failed'
    if (req.json && (await req.json().catch(() => null))?.fileId) {
      const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
      const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
      const supabase = createClient(supabaseUrl, supabaseServiceKey);
      
      await supabase
        .from('file_metadata')
        .update({ indexing_status: 'failed' })
        .eq('id', (await req.json()).fileId);
    }

    return new Response(
      JSON.stringify({ 
        error: error instanceof Error ? error.message : 'Unknown error',
        success: false
      }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});
