'use client';

import * as React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useToast } from "@/components/ui/use-toast";
import { useRefresh } from '@/app/(protected)/settings/contexts/refresh-context';
import { ErrorCardContainer } from "@/app/ui/utils/error-card-container";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { uploadAvatar } from "@/app/actions/profiles/avatar";
import AvatarUpload from './avatar-upload';
import { IMaskInput } from 'react-imask';
import { cn } from '@/lib/utils';
import { Spinner } from "@/components/ui/spinner";
import { useOptimisticProfileUpdate } from "@/hooks/use-optimistic-action";
import { SkeletonProfile } from "@/components/ui/skeleton-loader";
import type { UserData } from "@/app/contexts/UserContext";

// Schema do formulário
const formSchema = z.object({
  first_name: z.string().min(1, "O primeiro nome é obrigatório"),
  last_name: z.string().min(1, "O sobrenome é obrigatório"),
  job_title: z.string().optional(),
  phone: z.string().optional(),
  location: z.string().optional(),
  avatar_url: z.string().url().optional().nullable(),
});

// Interface para os dados do perfil
interface DadosPessoaisProps {
  profile: UserData | null;
  onProfileUpdate?: (newData: Partial<UserData>) => void;
}

export default function DadosPessoais({ profile, onProfileUpdate }: DadosPessoaisProps) {
  // Estados para o blob do avatar selecionado, carregamento, edição, envio, avatar do formulário, avatar inicial na edição e contexto de atualização de página
  const [selectedAvatarBlob, setSelectedAvatarBlob] = React.useState<Blob | null>(null);
  const [isLoading, setIsLoading] = React.useState(true);
  const [isEditing, setIsEditing] = React.useState(false);
  const [currentAvatarUrlForForm, setCurrentAvatarUrlForForm] = React.useState<string | null>(null);
  const [initialAvatarUrlOnEditStart, setInitialAvatarUrlOnEditStart] = React.useState<string | null>(null);

  // Optimistic updates para perfil
  const {
    data: optimisticProfile,
    isPending: isSubmitting,
    execute: executeProfileUpdate,
  } = useOptimisticProfileUpdate(profile);

  // Contexto de atualização de página
  const { refreshPage } = useRefresh();
  // Roteador
  const router = useRouter();
  // Toast
  const { toast } = useToast();

  // Formulário
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: { 
      first_name: "",
      last_name: "",
      job_title: "",
      phone: "",
      location: "",
      avatar_url: null,
    },
  });
  // Reset do formulário
  const { reset: formReset } = form;

  // Função para resetar o formulário
  React.useEffect(() => {
    if (profile) {
      // Reseta o formulário com os dados do perfil
      formReset({
        first_name: profile.first_name || "",
        last_name: profile.last_name || "",
        job_title: profile.job_title || "",
        phone: profile.phone || "",
        location: profile.location || "",
        avatar_url: profile.avatar_url || null,
      });
      // Se não está editando, define o avatar do formulário com o avatar do perfil
      if (!isEditing) {
        setCurrentAvatarUrlForForm(profile.avatar_url || null);
      } 
      // Define o estado de carregamento como false
      setIsLoading(false);
    } else {
      // Reseta o formulário com os dados do perfil
      formReset({ first_name: "", last_name: "", job_title: "", phone: "", location: "", avatar_url: null });
      // Define o avatar do formulário como null
      setCurrentAvatarUrlForForm(null);
      // Define o avatar inicial na edição como null
      setInitialAvatarUrlOnEditStart(null);
      // Define o estado de carregamento como false
      setIsLoading(false);
    }
  }, [profile, formReset, isEditing]);

  // Função para editar o perfil
  const handleEdit = () => {
    // Se não houver perfil, retorna
    if (!profile) return;
    // Define o estado de edição como true
    setIsEditing(true);
    // Define o avatar inicial na edição como o avatar do perfil
    setInitialAvatarUrlOnEditStart(profile.avatar_url || null);
  };
  // Função para cancelar a edição do perfil
  const handleCancel = () => {
    // Define o estado de edição como false
    setIsEditing(false);
    // Se houver perfil, reseta o formulário com os dados do perfil
    if (profile) {
      formReset({
        first_name: profile.first_name || "",
        last_name: profile.last_name || "",
        job_title: profile.job_title || "",
        phone: profile.phone || "",
        location: profile.location || "",
        avatar_url: initialAvatarUrlOnEditStart, 
      });
    } else {
      // Reseta o formulário com os dados do perfil
      formReset({ first_name: "", last_name: "", job_title: "", phone: "", location: "", avatar_url: null });
    }
    // Define o avatar do formulário com o avatar inicial na edição
    setCurrentAvatarUrlForForm(initialAvatarUrlOnEditStart);
  };
  // Função para enviar os dados do perfil com optimistic updates
  async function onSubmit(values: z.infer<typeof formSchema>) {
    if (!profile) return;

    // Preparar dados para optimistic update
    const optimisticUpdates = {
      ...values,
      avatar_url: currentAvatarUrlForForm,
    };

    executeProfileUpdate({
      // 1. Aplicar mudanças otimisticamente
      optimisticUpdate: (currentProfile) => ({
        ...currentProfile,
        ...optimisticUpdates,
      }),
      
      // 2. Executar ação real
      action: async () => {
        try {
          // Processar upload de avatar se necessário
          let avatarUrlToSave = currentAvatarUrlForForm;
          if (selectedAvatarBlob) {
            const formDataUpload = new FormData();
            formDataUpload.append('avatar', selectedAvatarBlob, `avatar-${Date.now()}.png`);
            if (initialAvatarUrlOnEditStart) {
              formDataUpload.append('oldAvatarUrl', initialAvatarUrlOnEditStart);
            }
            
            const uploadResponse = await uploadAvatar(formDataUpload);
            if (uploadResponse.error) {
              return { success: false, error: uploadResponse.error };
            }
            avatarUrlToSave = uploadResponse.url as string;
          }

          // Preparar dados finais
          const dataToSubmit = {
            ...values,
            avatar_url: avatarUrlToSave,
            username: profile.username,
            email: profile.email,
            team_id: profile.team_id && profile.team_id.trim() !== '' ? profile.team_id : null,
            role: profile.role,
            theme: profile.theme,
          };

          // Enviar dados via API
          const response = await fetch('/api/profiles/update', {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
            body: JSON.stringify(dataToSubmit),
          });

          if (!response.ok) {
            const errorData = await response.json();
            return { success: false, error: errorData.error || 'Falha ao atualizar perfil' };
          }

          const responseData = await response.json();
          return { success: true, data: responseData };
        } catch (error) {
          return { 
            success: false, 
            error: error instanceof Error ? error.message : 'Erro inesperado' 
          };
        }
      },

      // 3. Configurar mensagens
      messages: {
        loading: "Atualizando perfil...",
        success: "Perfil atualizado!",
        error: "Erro ao atualizar perfil",
      },

      // 4. Callbacks de sucesso e erro
      onSuccess: () => {
        setIsEditing(false);
        if (refreshPage) {
          refreshPage();
        } else if (onProfileUpdate) {
          const { avatar_url, ...restOfUpdates } = optimisticUpdates;
          onProfileUpdate({
            ...restOfUpdates,
            avatar_url: avatar_url || undefined,
          });
        }
      },
      
      onError: (error) => {
        console.error('Erro ao atualizar perfil:', error);
      },
    });
  }

  return (
    <>
    <Card className="shadow-none">
      <CardContent className="p-6">
        {isLoading && <SkeletonProfile />}
        {optimisticProfile && !isLoading && (
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
              <div className="flex flex-col md:flex-row gap-8 items-start">
              <AvatarUpload
                profile={optimisticProfile}
                currentFormAvatarUrl={currentAvatarUrlForForm}
                setCurrentFormAvatarUrl={setCurrentAvatarUrlForForm}
                onImageCrop={(blob) => {
                  setSelectedAvatarBlob(blob);
                  const previewUrl = blob ? URL.createObjectURL(blob) : null;
                  setCurrentAvatarUrlForForm(previewUrl);
                  form.setValue('avatar_url', previewUrl);
                }}
                disabled={!isEditing}
              />
              <div className="flex-1 space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <FormField control={form.control} name="first_name" render={({ field }) => (<FormItem><FormLabel>Primeiro nome</FormLabel><FormControl><Input placeholder="Seu primeiro nome" {...field} disabled={!isEditing} /></FormControl><FormMessage /></FormItem>)} />
                  <FormField control={form.control} name="last_name" render={({ field }) => (<FormItem><FormLabel>Sobrenome</FormLabel><FormControl><Input placeholder="Seu sobrenome" {...field} disabled={!isEditing} /></FormControl><FormMessage /></FormItem>)} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="emailLogin">E-mail de login</Label>
                  <Input id="emailLogin" type="email" placeholder="seu@email.com" value={optimisticProfile?.email || ""} readOnly disabled />
                  <p className="text-xs text-muted-foreground">
                    Este e-mail é usado para login. Para alterá-lo,{" "}
                    <a href="/settings/email-change" className="text-primary hover:underline">solicite uma mudança</a>.
                  </p>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <FormField control={form.control} name="phone" render={({ field }) => (<FormItem><FormLabel>Telefone/WhatsApp</FormLabel><FormControl><IMaskInput mask="(00) 00000-0000" value={field.value || ''} onAccept={(value) => field.onChange(value)} onBlur={field.onBlur} inputRef={field.ref} placeholder="(00) 00000-0000" disabled={!isEditing} type="tel" className={cn("flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background", "file:border-0 file:bg-transparent file:text-sm file:font-medium", "placeholder:text-muted-foreground", "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2", "disabled:cursor-not-allowed disabled:opacity-50")} /></FormControl><FormMessage /></FormItem>)} />
                  <FormField control={form.control} name="job_title" render={({ field }) => (<FormItem><FormLabel>Cargo</FormLabel><FormControl><Input placeholder="Seu cargo na empresa" {...field} value={field.value || ''} disabled={!isEditing} /></FormControl><FormMessage /></FormItem>)} />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <FormField control={form.control} name="location" render={({ field }) => (<FormItem><FormLabel>Localização</FormLabel><FormControl><Input placeholder="Sua localização" {...field} value={field.value || ''} disabled={!isEditing} /></FormControl><FormMessage /></FormItem>)} />
                </div>
                <div className="text-right space-x-2">
                  {isEditing ? (
                    <>
                      <Button type="button" variant="ghost" onClick={handleCancel} disabled={isSubmitting}>Cancelar</Button>
                      <Button type="submit" disabled={isSubmitting || !form.formState.isDirty}> {isSubmitting && <Spinner className="w-4 h-4 mr-2 animate-spin" variant="ring" />} Salvar Alterações</Button>
                    </>
                  ) : (
                    <Button type="button" variant="outline" onClick={handleEdit}>Editar Perfil</Button>
                  )}
                </div>
              </div>
            </div>
          </form>
          </Form>
        )}
        {!optimisticProfile && <ErrorCardContainer />}
      </CardContent>
    </Card>
    </>
  );
} 