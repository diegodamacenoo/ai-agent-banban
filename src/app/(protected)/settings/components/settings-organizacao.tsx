'use client';
import * as React from "react";
import { useState, useEffect } from "react";
import { useToast } from "@/components/ui/use-toast";
import { getOrganizationSettings } from "@/app/actions/organization/settings";
import { updateOrganizationSettings } from "@/app/actions/organization/settings";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { SaveIcon, ShieldAlertIcon } from "lucide-react";
import { useUser } from "@/app/contexts/UserContext";
import { SkeletonSimple } from "@/components/ui/skeleton-loader";

export default function SettingsOrganizacao() {
    const { toast } = useToast();
    const { userData } = useUser();
    const [isLoading, setIsLoading] = useState(true);
    const [isCheckingPermissions, setIsCheckingPermissions] = useState(true);

    // Basic Info
    const [companyLegalName, setCompanyLegalName] = useState("");
    const [companyTradingName, setCompanyTradingName] = useState("");
    const [cnpj, setCnpj] = useState("");
    const [stateRegistration, setStateRegistration] = useState("");
    const [addressStreet, setAddressStreet] = useState("");
    const [addressState, setAddressState] = useState("");
    const [addressCity, setAddressCity] = useState("");
    const [addressPostalCode, setAddressPostalCode] = useState("");
    const [fusoHorario, setFusoHorario] = useState("america_fortaleza");
    const [moedaPadrao, setMoedaPadrao] = useState("brl");

    // Stock Params
    const [diasSemVenda, setDiasSemVenda] = useState("");
    const [coberturaDias, setCoberturaDias] = useState("");
    const [margemMinima, setMargemMinima] = useState("");

    // Export
    const [formatoExportacao, setFormatoExportacao] = useState("csv");

    // Original values for comparison
    const [originalBasicInfo, setOriginalBasicInfo] = useState({
        companyLegalName: "",
        companyTradingName: "",
        cnpj: "",
        stateRegistration: "",
        addressStreet: "",
        addressState: "",
        addressCity: "",
        addressPostalCode: "",
        fusoHorario: "america_fortaleza",
        moedaPadrao: "brl",
    });

    const [originalStockParams, setOriginalStockParams] = useState({
        diasSemVenda: "",
        coberturaDias: "",
        margemMinima: "",
    });

    const [originalExportSettings, setOriginalExportSettings] = useState({
        formatoExportacao: "csv",
    });

    // Saving states
    const [isSavingBasic, setIsSavingBasic] = useState(false);
    const [isSavingStock, setIsSavingStock] = useState(false);
    const [isSavingExport, setIsSavingExport] = useState(false);

    // Check if there are changes
    const hasBasicInfoChanges = () => {
        return (
            companyLegalName !== originalBasicInfo.companyLegalName ||
            companyTradingName !== originalBasicInfo.companyTradingName ||
            cnpj !== originalBasicInfo.cnpj ||
            stateRegistration !== originalBasicInfo.stateRegistration ||
            addressStreet !== originalBasicInfo.addressStreet ||
            addressState !== originalBasicInfo.addressState ||
            addressCity !== originalBasicInfo.addressCity ||
            addressPostalCode !== originalBasicInfo.addressPostalCode ||
            fusoHorario !== originalBasicInfo.fusoHorario ||
            moedaPadrao !== originalBasicInfo.moedaPadrao
        );
    };

    const hasStockParamsChanges = () => {
        return (
            diasSemVenda !== originalStockParams.diasSemVenda ||
            coberturaDias !== originalStockParams.coberturaDias ||
            margemMinima !== originalStockParams.margemMinima
        );
    };

    const hasExportSettingsChanges = () => {
        return formatoExportacao !== originalExportSettings.formatoExportacao;
    };

    useEffect(() => {
        if (userData !== null) {
            setIsCheckingPermissions(false);
            if (userData.role === 'organization_admin') { 
                (async () => {
                    setIsLoading(true);
                    const result = await getOrganizationSettings();
                    setIsLoading(false);
                    if (result.error) {
                        toast({ title: "Erro ao carregar configurações da organização", description: result.error, variant: "destructive" });
                        return;
                    }
                    const s = result.data!;
                    
                    // Set current values
                    const basicInfo = {
                        companyLegalName: s.company_legal_name ?? "",
                        companyTradingName: s.company_trading_name ?? "",
                        cnpj: s.cnpj ?? "",
                        stateRegistration: s.state_registration ?? "",
                        addressStreet: s.address_street ?? "",
                        addressState: s.address_state_province ?? "",
                        addressCity: s.address_city ?? "",
                        addressPostalCode: s.address_postal_code ?? "",
                        fusoHorario: s.default_timezone ?? "america_fortaleza",
                        moedaPadrao: s.default_currency ?? "brl",
                    };

                    const stockParams = {
                        diasSemVenda: s.idle_product_threshold_days?.toString() ?? "",
                        coberturaDias: s.min_stock_coverage_alert_days?.toString() ?? "",
                        margemMinima: s.min_acceptable_margin_percentage?.toString() ?? "",
                    };

                    const exportSettings = {
                        formatoExportacao: s.default_export_format ?? "csv",
                    };

                    // Set current values
                    setCompanyLegalName(basicInfo.companyLegalName);
                    setCompanyTradingName(basicInfo.companyTradingName);
                    setCnpj(basicInfo.cnpj);
                    setStateRegistration(basicInfo.stateRegistration);
                    setAddressStreet(basicInfo.addressStreet);
                    setAddressState(basicInfo.addressState);
                    setAddressCity(basicInfo.addressCity);
                    setAddressPostalCode(basicInfo.addressPostalCode);
                    setFusoHorario(basicInfo.fusoHorario);
                    setMoedaPadrao(basicInfo.moedaPadrao);
                    setDiasSemVenda(stockParams.diasSemVenda);
                    setCoberturaDias(stockParams.coberturaDias);
                    setMargemMinima(stockParams.margemMinima);
                    setFormatoExportacao(exportSettings.formatoExportacao);

                    // Set original values for comparison
                    setOriginalBasicInfo(basicInfo);
                    setOriginalStockParams(stockParams);
                    setOriginalExportSettings(exportSettings);
                })();
            } else {
                setIsLoading(false);
            }
        }
    }, [userData, toast]);

    const handleSaveBasicInfo = async () => {
        if (userData?.role !== 'organization_admin') {
            toast({ title: "Acesso Negado", description: "Você não tem permissão para alterar estas configurações.", variant: "destructive"});
            return;
        }
        setIsSavingBasic(true);
        const payload = {
            name: companyTradingName,
            company_legal_name: companyLegalName,
            company_trading_name: companyTradingName,
            cnpj,
            state_registration: stateRegistration,
            address_street: addressStreet,
            address_state_province: addressState,
            address_city: addressCity,
            address_postal_code: addressPostalCode,
            default_timezone: fusoHorario,
            default_currency: moedaPadrao,
        };
        const result = await updateOrganizationSettings(payload);
        setIsSavingBasic(false);
        if (result.success) {
            // Update original values after successful save
            setOriginalBasicInfo({
                companyLegalName,
                companyTradingName,
                cnpj,
                stateRegistration,
                addressStreet,
                addressState,
                addressCity,
                addressPostalCode,
                fusoHorario,
                moedaPadrao,
            });
            toast({ title: "Configurações salvas com sucesso!" });
        } else {
            toast({ title: "Erro ao salvar configurações", description: result.error, variant: "destructive" });
        }
    };

    const handleSaveStockParams = async () => {
        if (userData?.role !== 'organization_admin') {
            toast({ title: "Acesso Negado", description: "Você não tem permissão para alterar estas configurações.", variant: "destructive"});
            return;
        }
        setIsSavingStock(true);
        const payload = {
            name: companyTradingName,
            idle_product_threshold_days: diasSemVenda ? parseInt(diasSemVenda, 10) : null,
            min_stock_coverage_alert_days: coberturaDias ? parseInt(coberturaDias, 10) : null,
            min_acceptable_margin_percentage: margemMinima ? parseFloat(margemMinima) : null,
        };
        const result = await updateOrganizationSettings(payload);
        setIsSavingStock(false);
        if (result.success) {
            // Update original values after successful save
            setOriginalStockParams({
                diasSemVenda,
                coberturaDias,
                margemMinima,
            });
            toast({ title: "Parâmetros de estoque salvos!" });
        } else {
            toast({ title: "Erro ao salvar parâmetros de estoque", description: result.error, variant: "destructive" });
        }
    };

    const handleSaveExport = async () => {
        if (userData?.role !== 'organization_admin') {
            toast({ title: "Acesso Negado", description: "Você não tem permissão para alterar estas configurações.", variant: "destructive"});
            return;
        }
        setIsSavingExport(true);
        const payload = { 
            name: companyTradingName,
            default_export_format: formatoExportacao 
        };
        const result = await updateOrganizationSettings(payload);
        setIsSavingExport(false);
        if (result.success) {
            // Update original values after successful save
            setOriginalExportSettings({
                formatoExportacao,
            });
            toast({ title: "Configurações de exportação salvas!" });
        } else {
            toast({ title: "Erro ao salvar exportação", description: result.error, variant: "destructive" });
        }
    };

    if (isCheckingPermissions || userData === null) {
        return (
          <div className="p-6">
            <SkeletonSimple height="h-full" />
          </div>
        );
    }
    
    if (userData.role !== 'organization_admin') {
        return (
          <div className="p-6 flex flex-col items-center justify-center h-full text-center">
            <ShieldAlertIcon className="w-16 h-16 text-destructive mb-4" />
            <h3 className="text-xl font-semibold">Acesso Negado</h3>
            <p className="text-muted-foreground">Você não tem permissão para gerenciar as configurações da organização.</p>
          </div>
        );
    }

    return (
        <div className="space-y-6">
            <header className="flex h-16 shrink-0 items-center px-6">
                <h2 className="text-lg font-medium">Organização</h2>
            </header>

            <div className="px-6 space-y-6">
                {/* Informações Básicas */}
                <div className="flex flex-col gap-4">
                    <div className="flex items-center justify-between">
                        <div>
                            <h3 className="text-lg font-medium">Informações Básicas</h3>
                            <p className="text-sm text-muted-foreground">Dados cadastrais da empresa</p>
                        </div>
                        <Button size="sm" variant={hasBasicInfoChanges() ? "default" : "outline"} className="gap-2" onClick={handleSaveBasicInfo} disabled={isSavingBasic || isLoading || !hasBasicInfoChanges()}>
                            <SaveIcon className="w-4 h-4" />
                            {isSavingBasic ? "Salvando..." : "Salvar"}
                        </Button>
                    </div>
                
                    <Card className="shadow-none">
                        <CardContent className="p-6 space-y-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="razaoSocial">Razão Social</Label>
                                    <Input id="razaoSocial" placeholder="Razão Social da Empresa" value={companyLegalName} onChange={(e) => setCompanyLegalName(e.target.value)} disabled={isLoading} />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="nomeFantasia">Nome Fantasia</Label>
                                    <Input id="nomeFantasia" placeholder="Nome Fantasia" value={companyTradingName} onChange={(e) => setCompanyTradingName(e.target.value)} disabled={isLoading} />
                                </div>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="cnpj">CNPJ</Label>
                                    <Input id="cnpj" placeholder="00.000.000/0000-00" value={cnpj} onChange={(e) => setCnpj(e.target.value)} disabled={isLoading} />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="inscricaoEstadual">Inscrição Estadual</Label>
                                    <Input id="inscricaoEstadual" placeholder="Inscrição Estadual" value={stateRegistration} onChange={(e) => setStateRegistration(e.target.value)} disabled={isLoading} />
                                </div>
                            </div>
                            <Separator />
                            <div className="space-y-2">
                                <Label htmlFor="endereco">Endereço</Label>
                                <Input id="endereco" placeholder="Rua, Número, Bairro" value={addressStreet} onChange={(e) => setAddressStreet(e.target.value)} disabled={isLoading} />
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="estado">Estado</Label>
                                    <Input id="estado" placeholder="Estado" value={addressState} onChange={(e) => setAddressState(e.target.value)} disabled={isLoading} />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="cidade">Cidade</Label>
                                    <Input id="cidade" placeholder="Cidade" value={addressCity} onChange={(e) => setAddressCity(e.target.value)} disabled={isLoading} />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="cep">CEP</Label>
                                    <Input id="cep" placeholder="00000-000" value={addressPostalCode} onChange={(e) => setAddressPostalCode(e.target.value)} disabled={isLoading} />
                                </div>
                            </div>
                            <Separator />
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="fusoHorario">Fuso Horário Padrão</Label>
                                    <Select value={fusoHorario} onValueChange={setFusoHorario} disabled={isLoading}>
                                        <SelectTrigger id="fusoHorario">
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="america_fortaleza">America/Fortaleza (GMT-3)</SelectItem>
                                            <SelectItem value="america_saopaulo">America/Sao_Paulo (GMT-3)</SelectItem>
                                            <SelectItem value="america_manaus">America/Manaus (GMT-4)</SelectItem>
                                            <SelectItem value="america_rio_branco">America/Rio_Branco (GMT-5)</SelectItem>
                                            <SelectItem value="america_noronha">America/Noronha (GMT-2)</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="moedaPadrao">Moeda Padrão</Label>
                                    <Select value={moedaPadrao} onValueChange={setMoedaPadrao} disabled={isLoading}>
                                        <SelectTrigger id="moedaPadrao">
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="brl">Real Brasileiro (R$)</SelectItem>
                                            <SelectItem value="usd">Dólar Americano (US$)</SelectItem>
                                            <SelectItem value="eur">Euro (€)</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>
                {/* Parâmetros de Estoque */}
                <div className="flex flex-col gap-4">
                    <div className="flex items-center justify-between">
                        <div>
                            <h3 className="text-lg font-medium">Parâmetros Globais de Estoque</h3>
                            <p className="text-sm text-muted-foreground">Configurações para gerenciamento de estoque</p>
                        </div>
                        <Button size="sm" variant="outline" className="gap-2" onClick={handleSaveStockParams} disabled={isSavingStock || isLoading || !hasStockParamsChanges()}>
                            <SaveIcon className="w-4 h-4" />
                            {isSavingStock ? "Salvando..." : "Salvar"}
                        </Button>
                    </div>
                    <Card className="shadow-none">
                        <CardContent className="p-6 space-y-4">
                            <div className="space-y-4">
                                <div className="flex items-center gap-4 justify-between">
                                    <Label htmlFor="diasSemVenda" className="min-w-[230px]">Dias sem venda para "produto parado"</Label>
                                    <Input id="diasSemVenda" type="number" placeholder="30" value={diasSemVenda} onChange={(e) => setDiasSemVenda(e.target.value)} className="max-w-[160px]" disabled={isLoading} />
                                </div>
                                <div className="flex items-center gap-4 justify-between">
                                    <Label htmlFor="coberturaDias" className="min-w-[230px]">Cobertura mínima de dias para alerta</Label>
                                    <Input id="coberturaDias" type="number" placeholder="15" value={coberturaDias} onChange={(e) => setCoberturaDias(e.target.value)} className="max-w-[160px]" disabled={isLoading} />
                                </div>
                                <div className="flex items-center gap-4 justify-between">
                                    <Label htmlFor="margemMinima" className="min-w-[230px]">Margem mínima aceitável (%)</Label>
                                    <Input id="margemMinima" type="number" placeholder="20" value={margemMinima} onChange={(e) => setMargemMinima(e.target.value)} className="max-w-[160px]" disabled={isLoading} />
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
} 