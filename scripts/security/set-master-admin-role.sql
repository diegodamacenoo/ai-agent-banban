-- ================================================
-- 🚨 SCRIPT DE SEGURANÇA: DEFINIR MASTER_ADMIN
-- ================================================
-- Este script define o role master_admin para o usuário especificado
-- APENAS execute este script se você tem certeza do que está fazendo

-- 1. VERIFICAR USUÁRIOS EXISTENTES
SELECT 
  id,
  email,
  role,
  created_at
FROM auth.users 
JOIN profiles ON auth.users.id = profiles.id
ORDER BY created_at DESC
LIMIT 10;

-- 2. ATUALIZAR ROLE PARA MASTER_ADMIN
-- Substitua 'SEU_EMAIL@EXEMPLO.COM' pelo seu email real
UPDATE profiles 
SET role = 'master_admin',
    updated_at = NOW()
WHERE id = (
  SELECT id 
  FROM auth.users 
  WHERE email = 'SEU_EMAIL@EXEMPLO.COM'  -- 🔴 ALTERE AQUI!
);

-- 3. VERIFICAR SE FOI APLICADO
SELECT 
  au.email,
  p.role,
  p.updated_at
FROM auth.users au
JOIN profiles p ON au.id = p.id
WHERE au.email = 'SEU_EMAIL@EXEMPLO.COM';  -- 🔴 ALTERE AQUI!

-- 4. LISTAR TODOS OS MASTER_ADMINS
SELECT 
  au.email,
  p.role,
  p.created_at
FROM auth.users au
JOIN profiles p ON au.id = p.id
WHERE p.role = 'master_admin'
ORDER BY p.created_at; 