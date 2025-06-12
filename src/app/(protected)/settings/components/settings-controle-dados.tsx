import * as React from "react";
import { Button } from "@/components/ui/button";
import { SaveIcon } from "lucide-react";

import { ExportacaoDados } from "./controle-dados-components/exportacao-dados";
import { CorrecaoDados } from "./controle-dados-components/correcao-dados";
import { AnonimizacaoExclusao } from "./controle-dados-components/anonimizacao-exclusao";
import { PeriodoRetencao } from "./controle-dados-components/periodo-retencao";
import { BackupsCriptografados } from "./controle-dados-components/backups-criptografados";
import { HistoricoConsentimentos } from "./controle-dados-components/historico-consentimentos";

export default function SettingsControleDados() {
  // Estados para controlar os diferentes formulários e opções
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
            <p className="text-sm text-muted-foreground">Solicite uma cópia dos seus dados pessoais armazenados na plataforma</p>
          </div>
        </div>
        <ExportacaoDados
          formatoExportacao={formatoExportacao}
          setFormatoExportacao={setFormatoExportacao}
        />

        {/* 2. Solicitar correção de dados */}
        {/* <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-lg font-medium">Solicitar Correção de Dados</h3>
            <p className="text-sm text-muted-foreground">Solicite a correção de informações incorretas no seu perfil</p>
          </div>
        </div>
        <CorrecaoDados
          tipoSolicitacao={tipoSolicitacao}
          setTipoSolicitacao={setTipoSolicitacao}
          descricaoSolicitacao={descricaoSolicitacao}
          setDescricaoSolicitacao={setDescricaoSolicitacao}
        /> */}

        {/* 3. Solicitar anonimização ou exclusão */}
        {/* <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-lg font-medium">Solicitar Anonimização ou Exclusão</h3>
            <p className="text-sm text-muted-foreground">Solicite a anonimização ou exclusão da sua conta</p>
          </div>
        </div>
        <AnonimizacaoExclusao
          tipoExclusao={tipoExclusao}
          setTipoExclusao={setTipoExclusao}
        /> */}

        {/* 4. Período de retenção automática */}
        {/* <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-lg font-medium">Período de Retenção Automática</h3>
            <p className="text-sm text-muted-foreground">Configure por quanto tempo os dados sensíveis devem ser mantidos</p>
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
            <p className="text-sm text-muted-foreground">Disponível apenas para administradores</p>
          </div>
        </div>
        <BackupsCriptografados
          formatoBackup={formatoBackup}
          setFormatoBackup={setFormatoBackup}
        /> */}

        {/* 6. Histórico de consentimentos */}
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-lg font-medium">Histórico de Consentimentos</h3>
            <p className="text-sm text-muted-foreground">Registro de aceitação dos termos e políticas de privacidade</p>
          </div>
        </div>
        <HistoricoConsentimentos />
      </div>
    </div>
  );
} 