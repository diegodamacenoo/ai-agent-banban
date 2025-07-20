import { Button } from '@/shared/ui/button';
import { Input } from '@/shared/ui/input';
import { Label } from '@/shared/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/shared/ui/select';
import { Textarea } from '@/shared/ui/textarea';
import { Switch } from '@/shared/ui/switch';
import { Checkbox } from '@/shared/ui/checkbox';
import { ComponentSection } from '../DesignSystemSection';

export function FormsSection() {
  return (
    <ComponentSection 
      title="Formulários e Card" 
      description="Exemplo de um formulário completo dentro de um Card."
      className="space-y-6"
    >
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
        <div className="space-y-2">
          <Label htmlFor="form-name">Nome</Label>
          <Input id="form-name" placeholder="Digite seu nome..." />
        </div>
        <div className="space-y-2">
          <Label htmlFor="form-email">Email</Label>
          <Input id="form-email" type="email" placeholder="seu@email.com" />
        </div>
        <div className="space-y-2">
          <Label htmlFor="form-role">Cargo</Label>
          <Select>
            <SelectTrigger id="form-role">
              <SelectValue placeholder="Selecione um cargo" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="admin">Administrador</SelectItem>
              <SelectItem value="editor">Editor</SelectItem>
              <SelectItem value="viewer">Visualizador</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="form-bio">Biografia</Label>
          <Textarea id="form-bio" placeholder="Fale um pouco sobre você..." />
        </div>
        <div className="space-y-2 md:col-span-2">
          <Label>Notificações</Label>
          <div className="flex items-center space-x-4 pt-2">
            <div className="flex items-center space-x-2">
              <Switch id="switch-marketing" defaultChecked />
              <Label htmlFor="switch-marketing">Marketing</Label>
            </div>
            <div className="flex items-center space-x-2">
              <Switch id="switch-security" />
              <Label htmlFor="switch-security">Segurança</Label>
            </div>
          </div>
        </div>
        <div className="space-y-2 md:col-span-2">
          <div className="flex items-center space-x-2">
            <Checkbox id="checkbox-terms" />
            <Label htmlFor="checkbox-terms">
              Eu aceito os <a href="#" className="text-primary hover:underline">termos e condições</a>
            </Label>
          </div>
        </div>
      </div>
      <div className="flex justify-end gap-2 mt-6">
        <Button variant="outline">Cancelar</Button>
        <Button>Salvar Alterações</Button>
      </div>
    </ComponentSection>
  );
}