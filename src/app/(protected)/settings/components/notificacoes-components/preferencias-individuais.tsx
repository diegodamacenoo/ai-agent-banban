'use client';

import * as React from "react";
import {
    Card,
    CardContent,
} from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { MailIcon, MessageSquareIcon, SmartphoneIcon, MoonIcon } from "lucide-react";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import { SaveIcon } from "lucide-react";
import { useState, useEffect } from "react";
import { toast } from "sonner";
import { SkeletonPreferences } from "@/components/ui/skeleton-loader";

interface NotificationPreferences {
    prefers_email_notifications: boolean;
    prefers_push_notifications: boolean;
}

export function PreferenciasIndividuais() {
    const [preferences, setPreferences] = useState<NotificationPreferences>({
        prefers_email_notifications: true,
        prefers_push_notifications: false,
    });
    const [isLoading, setIsLoading] = useState(true);
    const [savingStates, setSavingStates] = useState<{[key: string]: boolean}>({});

    // Carregar preferências do usuário via API Route
    useEffect(() => {
        const loadPreferences = async () => {
            try {
                setIsLoading(true);
                const response = await fetch('/api/notifications/preferences', {
                    method: 'GET',
                    credentials: 'include',
                });
                
                if (!response.ok) {
                    throw new Error('Erro ao carregar preferências');
                }

                const result = await response.json();
                
                if (result.success && result.data) {
                    const prefs = {
                        prefers_email_notifications: result.data.prefers_email_notifications ?? true,
                        prefers_push_notifications: result.data.prefers_push_notifications ?? false,
                    };
                    setPreferences(prefs);
                } else {
                    toast.error(result.error || 'Erro ao carregar preferências');
                }
            } catch (error) {
                toast.error('Erro ao carregar preferências');
            } finally {
                setIsLoading(false);
            }
        };

        loadPreferences();
    }, []);

    const handlePreferenceChange = async (key: keyof NotificationPreferences, value: boolean) => {
        // Atualização otimista
        const previousValue = preferences[key];
        setPreferences(prev => ({
            ...prev,
            [key]: value
        }));

        // Indicar que está salvando esta preferência específica
        setSavingStates(prev => ({ ...prev, [key]: true }));

        try {
            const updatedPreferences = {
                ...preferences,
                [key]: value
            };

            const response = await fetch('/api/notifications/preferences', {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                },
                credentials: 'include',
                body: JSON.stringify(updatedPreferences),
            });

            if (!response.ok) {
                throw new Error('Erro na requisição');
            }

            const result = await response.json();
            
            if (result.success) {
                toast.success('Preferência atualizada com sucesso');
            } else {
                // Reverter em caso de erro
                setPreferences(prev => ({
                    ...prev,
                    [key]: previousValue
                }));
                toast.error(result.error || 'Erro ao salvar preferência');
            }
        } catch (error) {
            // Reverter em caso de erro
            setPreferences(prev => ({
                ...prev,
                [key]: previousValue
            }));
            toast.error('Erro inesperado ao salvar preferência');
        } finally {
            setSavingStates(prev => ({ ...prev, [key]: false }));
        }
    };

    if (isLoading) {
        return (
            <Card className="shadow-none">
                <CardContent className="p-6">
                    <SkeletonPreferences items={2} />
                </CardContent>
            </Card>
        );
    }

    return (
        <Card className="shadow-none">
            <CardContent className="p-6 space-y-6">              
                {/* Canal E-mail */}
                <div className="space-y-4">
                    <div className="flex items-center justify-between">
                        <div className="space-y-0.5">
                            <h4 className="font-medium">E-mail</h4>
                            <p className="text-sm text-muted-foreground">Receba notificações via e-mail</p>
                        </div>
                        <div className="flex items-center gap-2">
                            <Switch
                                id="email-switch"
                                checked={preferences.prefers_email_notifications}
                                onCheckedChange={(checked) => handlePreferenceChange('prefers_email_notifications', checked)}
                                disabled={savingStates.prefers_email_notifications}
                            />
                        </div>
                    </div>
                </div>

                <Separator />

                {/* Canal Push/SMS */}
                <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                        <h4 className="font-medium">Notificações Push</h4>
                        <p className="text-sm text-muted-foreground">Receba notificações push no navegador</p>
                    </div>
                    <div className="flex items-center gap-2">
                        <Switch
                            id="push-switch"
                            checked={preferences.prefers_push_notifications}
                            onCheckedChange={(checked) => handlePreferenceChange('prefers_push_notifications', checked)}
                            disabled={savingStates.prefers_push_notifications}
                        />
                    </div>
                </div>
            </CardContent>
        </Card>
    );
} 