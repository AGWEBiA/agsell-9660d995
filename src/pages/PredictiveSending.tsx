import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { usePredictiveProfiles, getBestSendTime } from '@/hooks/usePredictiveSending';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Clock, Mail, MessageSquare, TrendingUp, Zap } from 'lucide-react';

const dayNames = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];

export default function PredictiveSending() {
  const { data: profiles = [], isLoading } = usePredictiveProfiles();

  const avgEngagement = profiles.length > 0
    ? (profiles.reduce((s, p) => s + Number(p.engagement_score), 0) / profiles.length).toFixed(1)
    : '0';

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Predictive Sending</h1>
        <p className="text-muted-foreground">Envie mensagens no melhor horário para cada contato com base em IA</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="flex items-center gap-4 pt-6">
            <div className="p-3 rounded-lg bg-primary/10"><Zap className="h-6 w-6 text-primary" /></div>
            <div>
              <p className="text-sm text-muted-foreground">Perfis Analisados</p>
              <p className="text-2xl font-bold text-foreground">{profiles.length}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-4 pt-6">
            <div className="p-3 rounded-lg bg-success/10"><TrendingUp className="h-6 w-6 text-success" /></div>
            <div>
              <p className="text-sm text-muted-foreground">Engajamento Médio</p>
              <p className="text-2xl font-bold text-foreground">{avgEngagement}%</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-4 pt-6">
            <div className="p-3 rounded-lg bg-info/10"><Clock className="h-6 w-6 text-info" /></div>
            <div>
              <p className="text-sm text-muted-foreground">Status</p>
              <Badge variant="default">Ativo</Badge>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Como funciona</CardTitle>
          <CardDescription>
            O Predictive Sending analisa o histórico de interações de cada contato para determinar o melhor momento para enviar e-mails e mensagens WhatsApp.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 border rounded-lg space-y-2">
              <div className="flex items-center gap-2 text-primary font-semibold">
                <span className="bg-primary text-primary-foreground rounded-full w-6 h-6 flex items-center justify-center text-sm">1</span>
                Coleta
              </div>
              <p className="text-sm text-muted-foreground">Analisamos horários de abertura de e-mails e respostas no WhatsApp</p>
            </div>
            <div className="p-4 border rounded-lg space-y-2">
              <div className="flex items-center gap-2 text-primary font-semibold">
                <span className="bg-primary text-primary-foreground rounded-full w-6 h-6 flex items-center justify-center text-sm">2</span>
                Análise
              </div>
              <p className="text-sm text-muted-foreground">A IA identifica padrões de engajamento por dia e horário</p>
            </div>
            <div className="p-4 border rounded-lg space-y-2">
              <div className="flex items-center gap-2 text-primary font-semibold">
                <span className="bg-primary text-primary-foreground rounded-full w-6 h-6 flex items-center justify-center text-sm">3</span>
                Otimização
              </div>
              <p className="text-sm text-muted-foreground">Campanhas são enviadas no horário ideal para cada contato</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Perfis de Envio Preditivo</CardTitle>
          <CardDescription>Melhores horários calculados para cada contato</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Contato ID</TableHead>
                <TableHead><Mail className="h-4 w-4 inline mr-1" />Melhor Horário E-mail</TableHead>
                <TableHead><MessageSquare className="h-4 w-4 inline mr-1" />Melhor Horário WhatsApp</TableHead>
                <TableHead>Engajamento</TableHead>
                <TableHead>Amostras</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {profiles.map(p => (
                <TableRow key={p.id}>
                  <TableCell className="font-mono text-sm">{p.contact_id.substring(0, 8)}...</TableCell>
                  <TableCell>{getBestSendTime(p, 'email')}</TableCell>
                  <TableCell>{getBestSendTime(p, 'whatsapp')}</TableCell>
                  <TableCell>
                    <Badge variant={Number(p.engagement_score) > 50 ? 'default' : 'secondary'}>
                      {Number(p.engagement_score).toFixed(0)}%
                    </Badge>
                  </TableCell>
                  <TableCell className="text-muted-foreground">{p.sample_size}</TableCell>
                </TableRow>
              ))}
              {profiles.length === 0 && (
                <TableRow>
                  <TableCell colSpan={5} className="text-center text-muted-foreground py-8">
                    Os perfis preditivos serão gerados automaticamente conforme você envia campanhas e recebe interações.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
