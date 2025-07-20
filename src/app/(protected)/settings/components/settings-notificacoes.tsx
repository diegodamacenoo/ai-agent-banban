import * as React from "react";
import { PreferenciasIndividuais } from "./notificacoes-components/preferencias-individuais";

export default function SettingsNotificacoes() {
  return (
    <div className="space-y-6">
      <header className="flex h-16 shrink-0 items-center gap-2 px-4 md:px-6">
        <div className="flex items-center gap-2">
          <h2 className="text-lg font-medium">NotificaÃ§Ãµes</h2>
        </div>
      </header>
      
      <div className="px-4 md:px-6 pb-6 space-y-6">
        <div className="flex flex-col gap-4">
          <div>
            <h3 className="text-lg font-medium">PreferÃªncias Individuais</h3>
            <p className="text-sm text-muted-foreground">Configure suas preferÃªncias pessoais de notificaÃ§Ã£o.</p>
          </div>
          <PreferenciasIndividuais />
        </div>

        {/* ALERT: Manter comentado */}
        {/* <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-lg font-medium">Escopo de Silenciamento</h3>
            <p className="text-sm text-muted-foreground">Silencie notificaÃ§Ãµes para contextos especÃ­ficos, como SKUs ou lojas.</p>
          </div>
          <Button size="sm" className="gap-2" variant="outline">
            <SaveIcon className="w-4 h-4" />
            Salvar
          </Button>
        </div>
        <EscopoSilenciamento /> */}

        {/* ALERT: Manter comentado */}
        {/* <div>
          <h3 className="text-lg font-medium">HistÃ³rico de NotificaÃ§Ãµes</h3>
          <p className="text-sm text-muted-foreground">Veja um registro das notificaÃ§Ãµes enviadas anteriormente.</p>
        </div>
        <HistoricoNotificacoes /> */}
      </div>
    </div>
  );
} 
