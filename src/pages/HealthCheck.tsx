import { useEffect, useState } from "react";
import { healthCheck } from "@/lib/healthcheck";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2, XCircle, RefreshCcw } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function HealthCheck() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const check = async () => {
    setLoading(true);
    const result = await healthCheck();
    setData(result);
    setLoading(false);
  };

  useEffect(() => {
    check();
  }, []);

  return (
    <div className="container max-w-md py-20 flex justify-center">
      <Card className="w-full">
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            System Health
            <Button variant="ghost" size="icon" onClick={check} disabled={loading}>
              <RefreshCcw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between p-3 rounded-lg border">
            <span className="font-medium">Application</span>
            <Badge variant="default">ONLINE</Badge>
          </div>
          
          <div className="flex items-center justify-between p-3 rounded-lg border">
            <span className="font-medium">Database</span>
            {loading ? (
              <Badge variant="outline">CHECKING...</Badge>
            ) : data?.status === 'ok' ? (
              <Badge variant="default" className="bg-green-600">CONNECTED</Badge>
            ) : (
              <Badge variant="destructive">DISCONNECTED</Badge>
            )}
          </div>

          {data?.timestamp && (
            <p className="text-xs text-center text-muted-foreground mt-4">
              Last check: {new Date(data.timestamp).toLocaleString()}
            </p>
          )}

          {!loading && data?.status === 'error' && (
            <div className="p-3 bg-red-50 text-red-700 text-xs rounded border border-red-100">
              Error: {data.message}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
