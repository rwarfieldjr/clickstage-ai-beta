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

  const hasExpiringCredits = summary.expiring_soon > 0;
  const hasExpiredCredits = summary.expired > 0;

  // Get upcoming expirations
  const upcomingExpirations = summary.details
    .filter((detail) => {
      if (!detail.expires_at) return false;
      const expiryDate = new Date(detail.expires_at);
      const now = new Date();
      return expiryDate > now && detail.amount > 0;
    })
    .sort((a, b) => {
      const dateA = new Date(a.expires_at!);
      const dateB = new Date(b.expires_at!);
      return dateA.getTime() - dateB.getTime();
    })
    .slice(0, 3); // Show up to 3 upcoming expirations

  if (compact) {
    return (
      <div className="space-y-3">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <Coins className="w-5 h-5 text-primary" />
            <span className="text-xl font-bold text-primary">{summary.total}</span>
            <span className="text-sm text-muted-foreground">credits available</span>
          </div>
        </div>

        {hasExpiringCredits && (
          <Alert variant="default" className="border-amber-500/50 bg-amber-50 dark:bg-amber-950/20">
            <Clock className="h-4 w-4 text-amber-600" />
            <AlertDescription className="text-amber-800 dark:text-amber-200">
              <strong>{summary.expiring_soon} credits</strong> expire within 30 days
            </AlertDescription>
          </Alert>
        )}

        {hasExpiredCredits && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              {summary.expired} credits have expired
            </AlertDescription>
          </Alert>
        )}
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
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-primary/10 rounded-lg p-4">
            <div className="text-sm text-muted-foreground mb-1">Available Credits</div>
            <div className="text-3xl font-bold text-primary">{summary.total}</div>
          </div>

          {hasExpiringCredits && (
            <div className="bg-amber-50 dark:bg-amber-950/20 rounded-lg p-4 border border-amber-200 dark:border-amber-800">
              <div className="text-sm text-amber-800 dark:text-amber-200 mb-1 flex items-center gap-1">
                <Clock className="w-4 h-4" />
                Expiring Soon
              </div>
              <div className="text-3xl font-bold text-amber-600 dark:text-amber-400">
                {summary.expiring_soon}
              </div>
              <div className="text-xs text-amber-700 dark:text-amber-300 mt-1">
                within 30 days
              </div>
            </div>
          )}

          {hasExpiredCredits && (
            <div className="bg-destructive/10 rounded-lg p-4">
              <div className="text-sm text-muted-foreground mb-1">Expired</div>
              <div className="text-3xl font-bold text-destructive">{summary.expired}</div>
            </div>
          )}
        </div>

        {upcomingExpirations.length > 0 && (
          <div className="mt-6">
            <h4 className="text-sm font-semibold mb-3">Upcoming Expirations</h4>
            <div className="space-y-2">
              {upcomingExpirations.map((detail, index) => {
                const expiryDate = new Date(detail.expires_at!);
                const daysUntilExpiry = Math.ceil(
                  (expiryDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24)
                );
                const isUrgent = daysUntilExpiry <= 7;

                return (
                  <div
                    key={index}
                    className={`flex items-center justify-between p-3 rounded-lg border ${
                      isUrgent
                        ? "bg-red-50 dark:bg-red-950/20 border-red-200 dark:border-red-800"
                        : "bg-muted/50 border-border"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <Clock
                        className={`w-4 h-4 ${
                          isUrgent
                            ? "text-red-600 dark:text-red-400"
                            : "text-muted-foreground"
                        }`}
                      />
                      <div>
                        <div className="font-medium">
                          {detail.amount} credits
                        </div>
                        <div
                          className={`text-xs ${
                            isUrgent
                              ? "text-red-600 dark:text-red-400"
                              : "text-muted-foreground"
                          }`}
                        >
                          Expires {expiryDate.toLocaleDateString()} ({daysUntilExpiry}{" "}
                          days)
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {hasExpiringCredits && (
          <Alert variant="default" className="border-amber-500/50 bg-amber-50 dark:bg-amber-950/20">
            <AlertCircle className="h-4 w-4 text-amber-600" />
            <AlertDescription className="text-amber-800 dark:text-amber-200">
              Don't let your credits expire! Use them to stage your properties before they're gone.
            </AlertDescription>
          </Alert>
        )}
      </CardContent>
    </Card>
  );
};
