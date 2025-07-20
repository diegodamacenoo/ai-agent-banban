import * as React from "react";
import { Card, CardContent } from "@/shared/ui/card";
import { Button } from "@/shared/ui/button";
import { Label } from "@/shared/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/shared/ui/select";
import { Switch } from "@/shared/ui/switch";
import { DownloadIcon } from "lucide-react";

interface BackupsCriptografadosProps {
  formatoBackup: string;
  setFormatoBackup: (value: string) => void;
}

export function BackupsCriptografados({ formatoBackup, setFormatoBackup }: BackupsCriptografadosProps) {
  const [backupCriptografado, setBackupCriptografado] = React.useState(false);

  return (
    <Card className="shadow-none">
      <CardContent className="p-6 space-y-4">
        <div className="space-y-2">
          <Label htmlFor="formatoBackup">Formato do backup</Label>
          <Select value={formatoBackup} onValueChange={setFormatoBackup}>
            <SelectTrigger id="formatoBackup">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="sql">SQL (dump completo)</SelectItem>
              <SelectItem value="csv">CSV (exportaÃ§Ã£o por tabelas)</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <Switch 
              id="backupCriptografado" 
              checked={backupCriptografado}
              onCheckedChange={setBackupCriptografado}
            />
            <Label htmlFor="backupCriptografado">Ativar criptografia para o backup</Label>
          </div>
          <p className="text-xs text-muted-foreground">
            Os backups criptografados sÃ£o protegidos com criptografia AES-256 e requerem uma chave para desbloquear.
          </p>
        </div>
        <div className="flex gap-3">
          <Button variant="outline" className="gap-2">
            <DownloadIcon className="w-4 h-4" />
            Backup completo
          </Button>
          <Button variant="outline" className="gap-2">
            <DownloadIcon className="w-4 h-4" />
            Somente dados
          </Button>
        </div>
      </CardContent>
    </Card>
  );
} 
