import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useSentimentAnalysis } from '@/hooks/useSentimentAnalysis';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from '@/lib/recharts';
import { Brain, Smile, Frown, Meh, TrendingUp } from 'lucide-react';
import { format } from 'date-fns';

const sentimentConfig = {
  positive: { label: 'Positivo', color: 'hsl(var(--success))', icon: Smile, variant: 'default' as const },
  negative: { label: 'Negativo', color: 'hsl(var(--destructive))', icon: Frown, variant: 'destructive' as const },
  neutral: { label: 'Neutro', color: 'hsl(var(--muted-foreground))', icon: Meh, variant: 'secondary' as const },
};

export default function SentimentDashboard() {
  const { sentiments, isLoading } = useSentimentAnalysis();

  const counts = { positive: 0, negative: 0, neutral: 0 };
  sentiments.forEach(s => { counts[s.sentiment as keyof typeof counts] = (counts[s.sentiment as keyof typeof counts] || 0) + 1; });
  const total = sentiments.length;
  const pieData = Object.entries(counts).map(([name, value]) => ({
    name: sentimentConfig[name as keyof typeof sentimentConfig]?.label || name,
    value,
    color: sentimentConfig[name as keyof typeof sentimentConfig]?.color || '#888',
  }));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground flex items-center gap-3">
          <Brain className="h-8 w-8 text-primary" /> Análise de Sentimento
        </h1>
        <p className="text-muted-foreground">Monitore o sentimento das mensagens dos seus clientes com IA</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="flex items-center gap-4 pt-6">
            <div className="p-3 rounded-lg bg-primary/10"><TrendingUp className="h-6 w-6 text-primary" /></div>
            <div>
              <p className="text-sm text-muted-foreground">Total Analisado</p>
              <p className="text-2xl font-bold text-foreground">{total}</p>
            </div>
          </CardContent>
        </Card>
        {Object.entries(sentimentConfig).map(([key, cfg]) => {
          const Icon = cfg.icon;
          return (
            <Card key={key}>
              <CardContent className="flex items-center gap-4 pt-6">
                <div className="p-3 rounded-lg" style={{ backgroundColor: `${cfg.color}20` }}>
                  <Icon className="h-6 w-6" style={{ color: cfg.color }} />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">{cfg.label}</p>
                  <p className="text-2xl font-bold text-foreground">
                    {counts[key as keyof typeof counts]}
                    {total > 0 && <span className="text-sm font-normal text-muted-foreground ml-1">({Math.round(counts[key as keyof typeof counts] / total * 100)}%)</span>}
                  </p>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card>
          <CardHeader><CardTitle>Distribuição</CardTitle></CardHeader>
          <CardContent>
            {total > 0 ? (
              <ResponsiveContainer width="100%" height={250}>
                <PieChart>
                  <Pie data={pieData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={90} label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}>
                    {pieData.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <p className="text-center text-muted-foreground py-12">Sem dados</p>
            )}
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader><CardTitle>Análises Recentes</CardTitle></CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Sentimento</TableHead>
                  <TableHead>Confiança</TableHead>
                  <TableHead>Resumo</TableHead>
                  <TableHead>Keywords</TableHead>
                  <TableHead>Data</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sentiments.slice(0, 20).map(s => {
                  const cfg = sentimentConfig[s.sentiment as keyof typeof sentimentConfig] || sentimentConfig.neutral;
                  return (
                    <TableRow key={s.id}>
                      <TableCell><Badge variant={cfg.variant}>{cfg.label}</Badge></TableCell>
                      <TableCell className="text-muted-foreground">{(s.confidence * 100).toFixed(0)}%</TableCell>
                      <TableCell className="text-sm max-w-[200px] truncate text-foreground">{s.summary || '-'}</TableCell>
                      <TableCell>
                        <div className="flex flex-wrap gap-1">
                          {(s.keywords || []).slice(0, 3).map((k, i) => (
                            <Badge key={i} variant="outline" className="text-xs">{k}</Badge>
                          ))}
                        </div>
                      </TableCell>
                      <TableCell className="text-muted-foreground text-sm">{format(new Date(s.analyzed_at), 'dd/MM HH:mm')}</TableCell>
                    </TableRow>
                  );
                })}
                {sentiments.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center text-muted-foreground py-8">
                      A análise de sentimento será feita automaticamente nas conversas do SAC.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
