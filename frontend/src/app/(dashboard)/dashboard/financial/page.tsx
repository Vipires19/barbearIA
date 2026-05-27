import { CircleDollarSign } from "lucide-react";

import { RequireRole } from "@/components/auth/require-role";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function FinancialPlaceholderPage() {
  return (
    <RequireRole allow={["admin"]}>
    <div className="mx-auto max-w-lg space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CircleDollarSign className="h-5 w-5 text-muted-foreground" aria-hidden />
            Financeiro
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Módulo financeiro em breve. Esta área integrará faturamento, comissões e relatórios
            operacionais.
          </p>
        </CardContent>
      </Card>
    </div>
    </RequireRole>
  );
}
