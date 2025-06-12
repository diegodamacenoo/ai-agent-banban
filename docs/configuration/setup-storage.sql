-- Script de configuração do Supabase Storage para Fluxos Auxiliares
-- Execute este script no SQL Editor do Supabase Dashboard

-- 1. Criar bucket para exportações de dados (se não existir)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'data-exports',
  'data-exports',
  false,
  52428800, -- 50MB
  ARRAY['application/json', 'text/csv', 'application/pdf', 'application/zip']
)
ON CONFLICT (id) DO NOTHING;

-- 2. Habilitar RLS no bucket
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

-- 3. Políticas RLS para permitir que usuários acessem apenas seus próprios arquivos

-- Política para upload de arquivos (INSERT)
CREATE POLICY "Users can upload their own export files" ON storage.objects
FOR INSERT 
TO public
WITH CHECK (
  bucket_id = 'data-exports' 
  AND (auth.uid())::text = (storage.foldername(name))[1]
);

-- Política para download de arquivos (SELECT)
CREATE POLICY "Users can download their own export files" ON storage.objects
FOR SELECT 
TO public
USING (
  bucket_id = 'data-exports' 
  AND (auth.uid())::text = (storage.foldername(name))[1]
);

-- Política para deletar arquivos (DELETE)
CREATE POLICY "Users can delete their own export files" ON storage.objects
FOR DELETE 
TO public
USING (
  bucket_id = 'data-exports' 
  AND (auth.uid())::text = (storage.foldername(name))[1]
);

-- 4. Verificar configuração
SELECT 
  name,
  public,
  file_size_limit,
  allowed_mime_types
FROM storage.buckets 
WHERE name = 'data-exports';

-- 5. Verificar políticas
SELECT 
  policyname,
  cmd,
  roles
FROM pg_policies 
WHERE tablename = 'objects' 
  AND schemaname = 'storage'
  AND policyname LIKE '%export%';

-- 6. Comentários sobre estrutura de pastas
-- Os arquivos serão organizados da seguinte forma:
-- data-exports/
--   ├── {user_id}/
--   │   ├── {export_id}.json
--   │   ├── {export_id}.csv
--   │   └── {export_id}.pdf
--   └── {user_id}/
--       └── ...

-- 7. Exemplo de uso das políticas
-- Um usuário com ID "123" só pode acessar arquivos em:
-- - data-exports/123/export1.json ✅ 
-- - data-exports/123/export2.csv ✅
-- - data-exports/456/export3.json ❌ (Acesso negado)

COMMENT ON TABLE storage.objects IS 'Armazena arquivos de exportação de dados pessoais com RLS para garantir que usuários acessem apenas seus próprios arquivos.'; 