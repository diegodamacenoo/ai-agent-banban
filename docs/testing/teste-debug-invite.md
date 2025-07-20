# 🔍 TESTE DEBUG - Convite com Logs

## 📋 INSTRUÇÕES:

1. **Reiniciar o servidor Next.js** (para aplicar as mudanças)
2. **Enviar um novo convite** pela interface
3. **Verificar os logs** no terminal do Next.js
4. **Procurar pelas linhas:**
   ```
   🔍 DEBUG INVITE:
   baseUrl: http://localhost:3000
   fullRedirectTo: http://localhost:3000/auth/callback?type=invite&next=%2Fsetup-account%3Ffrom%3Dinvite
   ```

## 🎯 OBJETIVO:

Confirmar se o `redirectTo` está sendo construído corretamente no código, mas o Supabase está ignorando ou truncando.

## 📝 RESULTADO ESPERADO:

Se os logs mostrarem o `fullRedirectTo` completo, mas o email ainda vier com apenas `http://localhost:3000/auth/callback`, então confirmamos que é o **Supabase que está ignorando** nosso parâmetro.

## 🔧 PRÓXIMO PASSO:

Baseado no resultado, decidiremos se:
- A) Problema no código (se logs estiverem incorretos)
- B) Problema no Supabase (se logs estiverem corretos mas email vier truncado) 