import { Euro, TrendingUp, AlertCircle, CreditCard } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface FinanceData {
  monthlyRevenue: number;
  outstandingPayments: number;
  totalDebts: number;
  growthPercent: number;
  recentTransactions: Array<{
    id: string;
    member: string;
    amount: number;
    type: "payment" | "fee" | "refund";
    date: string;
  }>;
}

export function FinanceOverviewWidget() {
  const finance: FinanceData = {
    monthlyRevenue: 0,
    outstandingPayments: 0,
    totalDebts: 0,
    growthPercent: 0,
    recentTransactions: []
  };

  const getTransactionIcon = (type: string) => {
    switch (type) {
      case "payment":
        return <CreditCard className="h-3 w-3 text-success" />;
      case "refund":
        return <AlertCircle className="h-3 w-3 text-warning" />;
      default:
        return <Euro className="h-3 w-3 text-primary" />;
    }
  };

  const getTransactionColor = (type: string) => {
    switch (type) {
      case "payment": return "text-success";
      case "refund": return "text-warning";
      default: return "text-primary";
    }
  };

  return (
    <Card className="shadow-card-maritime md:rounded-[2rem]">
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          <Euro className="h-5 w-5 text-primary" />
          Finanzübersicht
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 gap-3">
          <div className="p-3 rounded-lg bg-success/5 border border-success/20">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-lg font-bold text-success">€{finance.monthlyRevenue.toLocaleString()}</p>
                <p className="text-xs text-muted-foreground">Monatsumsatz</p>
              </div>
              <div className="flex items-center gap-1 text-success">
                <TrendingUp className="h-4 w-4" />
                <span className="text-sm font-medium">+{finance.growthPercent}%</span>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2 text-sm">
            <div className="p-2 rounded bg-muted/50">
              <p className="font-medium text-warning">€{finance.outstandingPayments}</p>
              <p className="text-xs text-muted-foreground">Ausstehend</p>
            </div>
            <div className="p-2 rounded bg-muted/50">
              <p className="font-medium text-destructive">€{finance.totalDebts}</p>
              <p className="text-xs text-muted-foreground">Schulden</p>
            </div>
          </div>
        </div>

        <div>
          <p className="text-sm font-medium mb-2">Letzte Transaktionen</p>
          <div className="space-y-2">
            {finance.recentTransactions.map((tx) => (
              <div key={tx.id} className="flex items-center justify-between text-xs p-2 rounded bg-muted/30">
                <div className="flex items-center gap-2">
                  {getTransactionIcon(tx.type)}
                  <span>{tx.member}</span>
                </div>
                <div className="text-right">
                  <p className={`font-medium ${getTransactionColor(tx.type)}`}>
                    €{tx.amount}
                  </p>
                  <p className="text-muted-foreground">{tx.date}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}