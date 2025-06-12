'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ReactNode } from 'react';
import { Eye, ExternalLink } from 'lucide-react';
import { AlertDetailModal } from './alert-detail-modal';
import { AlertType } from '@/app/actions/alerts/alert-management';

interface Column {
  key: string;
  label: string;
}

interface AlertSectionProps {
  title: string;
  description: string;
  icon: ReactNode;
  data: any[];
  columns: Column[];
  renderRow: (item: any) => Record<string, ReactNode>;
  totalCount: number;
  alertType: AlertType;
}

export function AlertSection({ 
  title, 
  description, 
  icon, 
  data, 
  columns, 
  renderRow,
  totalCount,
  alertType
}: AlertSectionProps) {

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              {icon}
              {title}
              <Badge variant="outline">{totalCount}</Badge>
            </CardTitle>
            <CardDescription>{description}</CardDescription>
          </div>
          {data.length > 0 && (
            <Button variant="outline" size="sm">
              <ExternalLink className="w-4 h-4 mr-2" />
              Ver Todos
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent>
        {data && data.length > 0 ? (
          <Table>
            <TableHeader>
              <TableRow>
                {columns.map((col) => (
                  <TableHead key={col.key}>{col.label}</TableHead>
                ))}
                <TableHead>Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.map((item) => {
                const row = renderRow(item);
                return (
                  <TableRow key={item.id}>
                    {columns.map((col) => (
                      <TableCell key={col.key}>{row[col.key]}</TableCell>
                    ))}
                    <TableCell>
                      <AlertDetailModal alertId={item.id} alertType={alertType}>
                        <Button variant="ghost" size="sm">
                          <Eye className="w-4 h-4" />
                        </Button>
                      </AlertDetailModal>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        ) : (
          <div className="text-center py-8 text-muted-foreground">
            Nenhum alerta deste tipo encontrado com os filtros atuais.
          </div>
        )}
      </CardContent>
    </Card>
  );
} 