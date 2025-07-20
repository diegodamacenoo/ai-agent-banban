import * as React from "react";
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from "@/shared/ui/table";
import { Button } from "@/shared/ui/button";
import { Loader2 } from "lucide-react";

interface TableColumn {
  header: string;
  cell: (row: any) => React.ReactNode;
  className?: string;
}

interface GenericTableProps {
  data: any[];
  columns: TableColumn[];
  actions?: {
    label: string;
    icon: React.ComponentType<any>;
    onClick: (row: any) => void;
    disabled?: (row: any) => boolean;
  }[];
  className?: string;
  loading?: boolean;
}

export function GenericTable({ data, columns, actions, className, loading }: GenericTableProps) {
  if (loading) {
    return (
      <div className="flex justify-center items-center p-8">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className={className}>
      <Table>
        <TableHeader>
          <TableRow>
            {columns.map((column, index) => (
              <TableHead key={index} className={column.className}>
                {column.header}
              </TableHead>
            ))}
            {actions && <TableHead />}
          </TableRow>
        </TableHeader>
        <TableBody>
          {data.length === 0 ? (
            <TableRow>
              <TableCell colSpan={columns.length + (actions ? 1 : 0)} className="text-center py-8">
                Nenhum registro encontrado
              </TableCell>
            </TableRow>
          ) : (
            data.map((row, rowIndex) => (
              <TableRow key={rowIndex}>
                {columns.map((column, colIndex) => (
                  <TableCell key={colIndex} className={column.className}>
                    {column.cell(row)}
                  </TableCell>
                ))}
                {actions && (
                  <TableCell className="flex gap-2 justify-end min-w-[120px]">
                    {actions.map((action, actionIndex) => (
                      <Button
                        key={actionIndex}
                        variant="outline"
                        size="sm"
                        onClick={() => action.onClick(row)}
                        disabled={action.disabled?.(row)}
                        className="gap-2"
                      >
                        <action.icon className="w-4 h-4" />
                        {action.label}
                      </Button>
                    ))}
                  </TableCell>
                )}
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  );
}
