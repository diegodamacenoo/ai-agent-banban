import * as React from "react";
import { Button } from "@/shared/ui/button";
import { SaveIcon } from "lucide-react";

import { ExportacaoDados } from "./controle-dados-components/exportacao-dados";
import { CorrecaoDados } from "./controle-dados-components/correcao-dados";
import { AnonimizacaoExclusao } from "./controle-dados-components/anonimizacao-exclusao";
import { PeriodoRetencao } from "./controle-dados-components/periodo-retencao";
import { BackupsCriptografados } from "./controle-dados-components/backups-criptografados";
import { HistoricoConsentimentos } from "./controle-dados-components/historico-consentimentos";

export default function SettingsControleDados() {
  // Estados para controlar os diferentes formulÃ¡rios e opÃ§Ãµes
  const [formatoExportacao, setFormatoExportacao] = React.useState("json");
  const [periodoRetencao, setPeriodoRetencao] = React.useState("365");
  const [formatoBackup, setFormatoBackup] = React.useState("sql");
  const [tipoSolicitacao, setTipoSolicitacao] = React.useState("correcao");
  const [descricaoSolicitacao, setDescricaoSolicitacao] = React.useState("");
  const [tipoExclusao, setTipoExclusao] = React.useState("anonimizacao");

  return (
    <div className="space-y-6">
      <header className="flex h-16 shrink-0 items-center px-6">
        <h2 className="text-lg font-medium">Controle de Dados</h2>
      </header>

      <div className="px-6 space-y-6">
        {/* 1. Exportar dados pessoais */}
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-lg font-medium">Exportar Dados Pessoais</h3>
            <p className="text-sm text-muted-foreground">Solicite uma cÃ³pia dos seus dados pessoais armazenados na plataforma</p>
          </div>
        </div>
        <ExportacaoDados
          formatoExportacao={formatoExportacao}
          setFormatoExportacao={setFormatoExportacao}
        />

        {/* 2. Solicitar correÃ§Ã£o de dados */}
        {/* <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-lg font-medium">Solicitar CorreÃ§Ã£o de Dados</h3>
            <p className="text-sm text-muted-foreground">Solicite a correÃ§Ã£o de informaÃ§Ãµes incorretas no seu perfil</p>
          </div>
        </div>
        <CorrecaoDados
          tipoSolicitacao={tipoSolicitacao}
          setTipoSolicitacao={setTipoSolicitacao}
          descricaoSolicitacao={descricaoSolicitacao}
          setDescricaoSolicitacao={setDescricaoSolicitacao}
        /> */}

        {/* 3. Solicitar anonimizaÃ§Ã£o ou exclusÃ£o */}
        {/* <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-lg font-medium">Solicitar AnonimizaÃ§Ã£o ou ExclusÃ£o</h3>
            <p className="text-sm text-muted-foreground">Solicite a anonimizaÃ§Ã£o ou exclusÃ£o da sua conta</p>
          </div>
        </div>
        <AnonimizacaoExclusao
          tipoExclusao={tipoExclusao}
          setTipoExclusao={setTipoExclusao}
        /> */}

        {/* 4. PerÃ­odo de retenÃ§Ã£o automÃ¡tica */}
        {/* <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-lg font-medium">PerÃ­odo de RetenÃ§Ã£o AutomÃ¡tica</h3>
            <p className="text-sm text-muted-foreground">Configure por quanto tempo os dados sensÃ­veis devem ser mantidos</p>
          </div>
          <Button size="sm" variant="outline" className="gap-2">
            <SaveIcon className="w-4 h-4" />
            Salvar
          </Button>
        </div>
        <PeriodoRetencao
          periodoRetencao={periodoRetencao}
          setPeriodoRetencao={setPeriodoRetencao}
        /> */}

        {/* 5. Download de backups criptografados (para admins) */}
        {/* <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-lg font-medium">Download de Backups Criptografados</h3>
            <p className="text-sm text-muted-foreground">DisponÃ­vel apenas para administradores</p>
          </div>
        </div>
        <BackupsCriptografados
          formatoBackup={formatoBackup}
          setFormatoBackup={setFormatoBackup}
        /> */}

        {/* 6. HistÃ³rico de consentimentos */}
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-lg font-medium">HistÃ³rico de Consentimentos</h3>
            <p className="text-sm text-muted-foreground">Registro de aceitaÃ§Ã£o dos termos e polÃ­ticas de privacidade</p>
          </div>
        </div>
        <HistoricoConsentimentos />
      </div>
    </div>
  );
} 
