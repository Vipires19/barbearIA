"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export function DashboardSettings() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Configurações</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Preferências da conta e do estabelecimento serão adicionadas nas próximas etapas.
        </p>
      </div>

      <Card className="border-border/60 bg-card/80">
        <CardHeader>
          <CardTitle className="text-base">Em breve</CardTitle>
          <CardDescription>
            Perfil, notificações e integrações estarão disponíveis aqui.
          </CardDescription>
        </CardHeader>
        <CardContent />
      </Card>
    </div>
  );
}
