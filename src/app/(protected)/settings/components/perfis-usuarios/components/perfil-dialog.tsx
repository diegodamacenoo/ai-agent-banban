import * as React from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { cn } from "@/lib/utils";
import { UserProfile, RoleEnum, UserStatusEnum } from "../../../types/perfis";
import { useState } from "react";

interface PerfilDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSalvar: (dadosFormulario: Partial<UserProfile>) => Promise<void>;
  perfil?: UserProfile;
  isLoading?: boolean;
}

export function PerfilDialog({ open, onOpenChange, onSalvar, perfil, isLoading }: PerfilDialogProps) {
  const [formData, setFormData] = useState<Partial<UserProfile>>({
    first_name: perfil?.first_name || "",
    last_name: perfil?.last_name || "",
    username: perfil?.username || "",
    role: perfil?.role || "standard_user",
    job_title: perfil?.job_title || "",
    team: perfil?.team || "",
    status: perfil?.status || "active",
    is_2fa_enabled: perfil?.is_2fa_enabled || false,
    prefers_email_notifications: perfil?.prefers_email_notifications || true,
    prefers_push_notifications: perfil?.prefers_push_notifications || true,
    theme: perfil?.theme || "light",
    phone: perfil?.phone || "",
    location: perfil?.location || "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await onSalvar(formData);
  };

  const handleInputChange = (field: keyof UserProfile, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>{perfil ? "Editar Perfil" : "Novo Perfil"}</DialogTitle>
          <DialogDescription>
            {perfil ? "Edite os dados do perfil do usuário" : "Preencha os dados para criar um novo perfil"}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="first_name">Nome</Label>
              <Input
                id="first_name"
                value={formData.first_name || ""}
                onChange={(e) => handleInputChange("first_name", e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="last_name">Sobrenome</Label>
              <Input
                id="last_name"
                value={formData.last_name || ""}
                onChange={(e) => handleInputChange("last_name", e.target.value)}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="username">Nome de Usuário</Label>
              <Input
                id="username"
                value={formData.username || ""}
                onChange={(e) => handleInputChange("username", e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="role">Função</Label>
              <Select
                value={formData.role}
                onValueChange={(value) => handleInputChange("role", value as RoleEnum)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione uma função" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="standard_user">Usuário Padrão</SelectItem>
                  <SelectItem value="organization_admin">Administrador</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="job_title">Cargo</Label>
              <Input
                id="job_title"
                value={formData.job_title || ""}
                onChange={(e) => handleInputChange("job_title", e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="team">Equipe</Label>
              <Input
                id="team"
                value={formData.team || ""}
                onChange={(e) => handleInputChange("team", e.target.value)}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="phone">Telefone</Label>
              <Input
                id="phone"
                value={formData.phone || ""}
                onChange={(e) => handleInputChange("phone", e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="location">Localização</Label>
              <Input
                id="location"
                value={formData.location || ""}
                onChange={(e) => handleInputChange("location", e.target.value)}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="status">Status</Label>
            <Select
              value={formData.status}
              onValueChange={(value) => handleInputChange("status", value as UserStatusEnum)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecione um status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="active">Ativo</SelectItem>
                <SelectItem value="inactive">Inativo</SelectItem>
                <SelectItem value="suspended">Suspenso</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <Label htmlFor="is_2fa_enabled">Autenticação de dois fatores</Label>
              <Switch
                id="is_2fa_enabled"
                checked={formData.is_2fa_enabled}
                onCheckedChange={(checked) => handleInputChange("is_2fa_enabled", checked)}
              />
            </div>

            <div className="flex items-center justify-between">
              <Label htmlFor="prefers_email_notifications">Notificações por email</Label>
              <Switch
                id="prefers_email_notifications"
                checked={formData.prefers_email_notifications}
                onCheckedChange={(checked) => handleInputChange("prefers_email_notifications", checked)}
              />
            </div>

            <div className="flex items-center justify-between">
              <Label htmlFor="prefers_push_notifications">Notificações push</Label>
              <Switch
                id="prefers_push_notifications"
                checked={formData.prefers_push_notifications}
                onCheckedChange={(checked) => handleInputChange("prefers_push_notifications", checked)}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="theme">Tema</Label>
            <Select
              value={formData.theme}
              onValueChange={(value) => handleInputChange("theme", value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecione um tema" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="light">Claro</SelectItem>
                <SelectItem value="dark">Escuro</SelectItem>
                <SelectItem value="system">Sistema</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex justify-end space-x-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isLoading}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? "Salvando..." : "Salvar"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
