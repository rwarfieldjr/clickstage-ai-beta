import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle, Clock, Coins } from "lucide-react";
import { CreditSummary } from "@/hooks/use-credits";

interface CreditsSummaryProps {
  summary: CreditSummary | null;
  loading: boolean;
  compact?: boolean;
}

export const CreditsSummary = ({ summary, loading, compact = false }: CreditsSummaryProps) => {
  if (loading) {
    return (
      <Card className={compact ? "" : "shadow-custom-lg"}>
        <CardContent className="pt-6">
          <div className="animate-pulse space-y-3">
            <div className="h-4 bg-muted rounded w-3/4"></div>
            <div className="h-4 bg-muted rounded w-1/2"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!summary) {
    return null;
  }

  if (compact) {
    return (
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2">
          <Coins className="w-5 h-5 text-primary" />
          <span className="text-xl font-bold text-primary">{summary.total}</span>
          <span className="text-sm text-muted-foreground">credits available</span>
        </div>
      </div>
    );
  }

  return (
    <Card className="shadow-custom-lg">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Coins className="w-5 h-5 text-primary" />
          Credits Overview
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="bg-primary/10 rounded-lg p-4">
          <div className="text-sm text-muted-foreground mb-1">Available Credits</div>
          <div className="text-3xl font-bold text-primary">{summary.total}</div>
        </div>
      </CardContent>
    </Card>
  );
};
