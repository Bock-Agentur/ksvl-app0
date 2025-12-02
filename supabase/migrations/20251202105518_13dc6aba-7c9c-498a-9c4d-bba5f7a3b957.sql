-- Lösche das PDF aus dem member-documents Bucket
DELETE FROM storage.objects 
WHERE bucket_id = 'member-documents' 
AND name = '5a7f5773-0c9c-4336-b06b-f2aaaa327764/bfa.pdf';