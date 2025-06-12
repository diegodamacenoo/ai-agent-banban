'use client';
import * as React from "react"
import { Suspense } from "react";
import { Button, buttonVariants } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import Link from "next/link"
import clsx from 'clsx';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertTriangle } from 'lucide-react';
import AccountRecoveryForm from './account-recovery-form';

// Componente de loading para o Suspense
function AccountRecoveryLoading() {
  return (
    <Card className="w-[400px]">
      <CardHeader>
        <CardTitle>Recuperar senha</CardTitle>
        <CardDescription>
          Carregando...
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex items-center justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      </CardContent>
    </Card>
  );
}

export default function AccountRecoveryPage() {
  return (
    <Suspense fallback={<AccountRecoveryLoading />}>
      <AccountRecoveryForm />
    </Suspense>
  );
}
