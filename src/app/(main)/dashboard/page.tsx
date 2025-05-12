// Não precisamos mais de createClient ou redirect aqui, pois o layout trata disso.
// import { createClient } from '@/lib/supabase/server';
// import { redirect } from 'next/navigation';
// Remova importações de UI que não serão usadas diretamente aqui se você as moveu para um layout
// import { Button } from '@/components/ui/button'; 
// import Link from 'next/link';
// import { NavUser } from '@/app/ui/dashboard/nav-user';

import { getCachedUserProps } from "@/lib/auth/getUserData"; // Importar a função cacheada
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { createSupabaseClient } from "@/lib/supabase/server"; // Voltar para o cliente padrão (anon)
import { cookies } from "next/headers"; // Importar para obter o cookieStore

// Esta é uma Server Component, por isso podemos usar async/await diretamente.
export default async function DashboardPage() {
  // A chamada a getCachedUserProps() aqui garante que temos os dados do usuário.
  // Se o layout já chamou, isso retornará os dados cacheados.
  // Se o usuário não estiver autenticado, getCachedUserProps já terá redirecionado.
  const userData = await getCachedUserProps();

  // TODO: Implementar a lógica de submissão do formulário
  // Exemplo: chamar uma server action para enviar o convite
  const handleInviteSubmit = async (formData: FormData) => {
    "use server"; // Necessário para Server Actions

    // Ler todos os campos do formulário
    const email = formData.get("email") as string;

    // Validação básica (poderia ser mais robusta)
    if (!email) {
      console.error("Todos os campos do formulário são obrigatórios.");
      // TODO: Retornar erro para o cliente
      return;
    }

    try {
      // Obter o cookieStore (com await)
      const cookieStore = await cookies();
      // Criar cliente Supabase padrão (anon key)
      const supabase = createSupabaseClient(cookieStore);

      // Obter organization_id dos dados do admin logado
      // Certifique-se que userData está acessível aqui ou passe como argumento se necessário
      const organizationId = userData.organization_id;
      if (!organizationId) {
        console.error("Organization ID não encontrado para o administrador.");
        // TODO: Retornar erro para o cliente
        return;
      }

      console.log(`Invocando Edge Function 'invite-new-user' para email: ${email}`);

      // Chamar a Edge Function 'invite-new-user' com todos os dados necessários
      const { data, error } = await supabase.functions.invoke('invite-new-user', {
        body: {
          email,
          organization_id: organizationId,
          role: "standard_user", // Adicionando role fixo
        },
      });

      if (error) {
        // Erro ao invocar a função
        throw error;
      }

      // Função invocada com sucesso
      console.log("Edge Function 'invite-new-user' invocada com sucesso. Resposta:", data);
      // TODO: Adicionar feedback de sucesso para o usuário

    } catch (error: any) {
      console.error("Erro ao invocar a Edge Function 'invite-new-user':", error.message);
      // TODO: Adicionar feedback de erro para o usuário
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen py-2">
      <main className="flex flex-col items-center justify-center w-full flex-1 px-20 text-center">
        {/* 
          Aqui você integraria o NavUser através do seu sistema de layout.
          Por exemplo, seu layout principal poderia receber `navUserProps` 
          e renderizar o <NavUser user={navUserProps} /> em um cabeçalho ou sidebar.
        */}
        <h1 className="text-4xl font-bold mb-6">
          Bem-vindo ao Dashboard, {userData.name}!
        </h1>
        <p className="mb-4">
          Seu email registrado é: {userData.email}.
        </p>
        {userData.avatar && (
          <img src={userData.avatar} alt={`Avatar de ${userData.name}`} className="w-24 h-24 rounded-full mx-auto mb-4" />
        )}
        <p className="mb-8">
          Este é o conteúdo principal da sua página de dashboard.
        </p>
        {/* Adicione outros componentes e lógica que usam userData aqui */}

        {/* Formulário de Convite para Admin da Organização */}
        {userData.role === 'organization_admin' && (
          <Card className="w-full max-w-md mt-8">
            <CardHeader>
              <CardTitle>Convidar Novo Usuário</CardTitle>
              <CardDescription>
                Insira o email do usuário que você deseja convidar para a organização.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form action={handleInviteSubmit}>
                <div className="grid w-full items-center gap-4">
                  <div className="flex flex-col space-y-1.5">
                    <Label htmlFor="email">Email</Label>
                    <Input id="email" name="email" type="email" placeholder="nome@exemplo.com" required />
                  </div>
                  <Button type="submit">Enviar Convite</Button>
                </div>
              </form>
            </CardContent>
          </Card>
        )}
      </main>
    </div>
  );
}
