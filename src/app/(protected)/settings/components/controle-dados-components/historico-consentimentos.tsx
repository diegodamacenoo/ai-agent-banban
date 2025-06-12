import * as React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useEffect, useState } from "react";
import { SkeletonConsentTable } from "@/components/ui/skeleton-loader";
import { toast } from "sonner";

interface ConsentRecord {
  id: string;
  consent_type: string;
  version: string;
  accepted_at: string;
  ip_address: string | null;
  user_agent: string | null;
}

const formatConsentType = (type: string): string => {
  const types: Record<string, string> = {
    'terms_of_service': 'Termos de Uso',
    'privacy_policy': 'Política de Privacidade',
    'marketing': 'Marketing'
  };
  return types[type] || type;
};

const formatDate = (dateString: string): string => {
  return new Date(dateString).toLocaleString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
};

const formatUserAgent = (userAgent: string | null): string => {
  if (!userAgent) return 'Não disponível';
  
  // Extrair informações básicas do user agent
  const browserMatch = userAgent.match(/(Chrome|Firefox|Safari|Edge)\/[\d.]+/);
  const osMatch = userAgent.match(/(Windows|Mac|Linux|Android|iOS)/);
  
  const browser = browserMatch ? browserMatch[1] : 'Desconhecido';
  const os = osMatch ? osMatch[1] : 'Desconhecido';
  
  return `${browser}/${os}`;
};

export function HistoricoConsentimentos() {
  const [consents, setConsents] = useState<ConsentRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadConsentHistory = async () => {
      try {
        setIsLoading(true);
        const response = await fetch('/api/consent/history', {
          method: 'GET',
          credentials: 'include',
        });
        
        if (!response.ok) {
          throw new Error('Erro ao carregar histórico');
        }

        const result = await response.json();
        
        if (result.success) {
          setConsents(result.data || []);
        } else {
          setError(result.error || 'Erro ao carregar histórico de consentimentos');
        }
      } catch (err) {
        setError('Erro ao carregar histórico de consentimentos');
        toast.error('Erro ao carregar histórico de consentimentos');
      } finally {
        setIsLoading(false);
      }
    };

    loadConsentHistory();
  }, []);

  if (isLoading) {
    return (
      <Card className="shadow-none">
        <CardContent className="p-6">
          <SkeletonConsentTable rows={4} />
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="shadow-none">
        <CardContent className="p-6">
          <p className="text-destructive text-center">{error}</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="shadow-none">
      <CardContent className="p-6 space-y-4">
        {consents.length === 0 ? (
          <p className="text-muted-foreground text-center py-4">
            Nenhum registro de consentimento encontrado.
          </p>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Tipo de consentimento</TableHead>
                <TableHead>Versão</TableHead>
                <TableHead>Data e hora</TableHead>
                <TableHead>IP</TableHead>
                <TableHead>Dispositivo</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {consents.map((consent) => (
                <TableRow key={consent.id}>
                  <TableCell>{formatConsentType(consent.consent_type)}</TableCell>
                  <TableCell>{consent.version}</TableCell>
                  <TableCell>{formatDate(consent.accepted_at)}</TableCell>
                  <TableCell>{consent.ip_address || 'Não disponível'}</TableCell>
                  <TableCell>{formatUserAgent(consent.user_agent)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
} 