import React, { useState, useRef } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription, DialogTrigger } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Volume2, Plus, Play, Pause, Trash2, Clock, Users, Phone,
  CheckCircle2, XCircle, Loader2, Calendar, Tag, Upload, BarChart3,
  FileAudio, X, Send, Wallet, Package, History, CreditCard,
  MessageSquare, Zap, Megaphone, TrendingUp, DollarSign, PieChart,
  ArrowUpDown, Inbox as InboxIcon, PhoneCall, AlertTriangle,
} from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useOrganization } from '@/contexts/OrganizationContext';
import { useTags } from '@/hooks/useTags';
import { useCommunicationCredits } from '@/hooks/useCommunicationCredits';
import { useSms } from '@/hooks/useSms';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { SearchableTagSelect } from '@/components/whatsapp/SearchableTagSelect';

interface VoipCampaign {
  id: string;
  organization_id: string;
  user_id: string;
  name: string;
  audio_url: string;
  fallback_message: string | null;
  status: string;
  target_tags: string[];
  target_count: number;
  sent_count: number;
  answered_count: number;
  failed_count: number;
  scheduled_at: string | null;
  started_at: string | null;
  completed_at: string | null;
  credits_per_call: number;
  created_at: string;
}

export default function CommunicationCampaigns() {
  const { user } = useAuth();
  const { currentOrganization } = useOrganization();
  const { tags } = useTags();
  const { packages, credits, transactions, isLoading: creditsLoading, purchaseCredits } = useCommunicationCredits();
  const { campaigns: smsCampaigns, isLoading: smsLoading, createCampaign: createSmsCampaign } = useSms();
  const queryClient = useQueryClient();
  const orgId = currentOrganization?.id;

  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [campaignType, setCampaignType] = useState<'sms' | 'voip' | null>(null);
  const [purchasingId, setPurchasingId] = useState<string | null>(null);

  // SMS form state
  const [smsName, setSmsName] = useState('');
  const [smsMessage, setSmsMessage] = useState('');

  // VoIP form state
  const [uploading, setUploading] = useState(false);
  const [audioFileName, setAudioFileName] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [voipForm, setVoipForm] = useState({
    name: '',
    audio_url: '',
    fallback_message: '',
    target_tags: [] as string[],
    scheduled_at: '',
    credits_per_call: 1,
  });

  const isLoading = creditsLoading || smsLoading;
  const charCount = smsMessage.length;
  const smsCount = Math.ceil(charCount / 160) || 1;

  // VoIP campaigns query
  const { data: voipCampaigns = [] } = useQuery({
    queryKey: ['voip-campaigns', orgId],
    queryFn: async () => {
      if (!orgId) return [];
      const { data, error } = await supabase
        .from('voip_campaigns')
        .select('*')
        .eq('organization_id', orgId)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data as VoipCampaign[];
    },
    enabled: !!orgId,
  });

  // Contact count for VoIP
  const { data: contactCount = 0 } = useQuery({
    queryKey: ['voip-campaign-contact-count', orgId, voipForm.target_tags],
    queryFn: async () => {
      if (!orgId || voipForm.target_tags.length === 0) return 0;
      const { count, error } = await supabase
        .from('contact_tags')
        .select('contact_id', { count: 'exact', head: true })
        .in('tag_id', voipForm.target_tags);
      if (error) throw error;
      return count || 0;
    },
    enabled: !!orgId && voipForm.target_tags.length > 0,
  });

  const estimatedVoipCredits = contactCount * voipForm.credits_per_call;
  const hasEnoughVoipCredits = (credits?.balance ?? 0) >= estimatedVoipCredits;

  // Audio upload
  const handleAudioUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;
    const allowedTypes = ['audio/mpeg', 'audio/mp3', 'audio/wav', 'audio/ogg', 'audio/mp4', 'audio/x-m4a'];
    if (!allowedTypes.includes(file.type)) {
      toast.error('Formato não suportado. Use MP3, WAV, OGG ou M4A.');
      return;
    }
    if (file.size > 20 * 1024 * 1024) {
      toast.error('Arquivo muito grande. Máximo 20MB.');
      return;
    }
    setUploading(true);
    try {
      const ext = file.name.split('.').pop();
      const path = `${orgId}/${Date.now()}.${ext}`;
      const { error: uploadError } = await supabase.storage.from('voip-audio').upload(path, file);
      if (uploadError) throw uploadError;
      const { data: urlData } = supabase.storage.from('voip-audio').getPublicUrl(path);
      setVoipForm(f => ({ ...f, audio_url: urlData.publicUrl }));
      setAudioFileName(file.name);
      toast.success('Áudio enviado com sucesso!');
    } catch (err: any) {
      toast.error(err.message || 'Erro ao enviar áudio');
    } finally {
      setUploading(false);
    }
  };

  // Create VoIP campaign
  const createVoipCampaign = useMutation({
    mutationFn: async () => {
      if (!user || !orgId) throw new Error('Não autenticado');
      if (!hasEnoughVoipCredits) throw new Error(`Saldo insuficiente. Necessário: ${estimatedVoipCredits}, disponível: ${credits?.balance ?? 0}`);
      const { data, error } = await supabase
        .from('voip_campaigns')
        .insert({
          organization_id: orgId,
          user_id: user.id,
          name: voipForm.name,
          audio_url: voipForm.audio_url,
          fallback_message: voipForm.fallback_message || null,
          target_tags: voipForm.target_tags,
          target_count: contactCount,
          credits_per_call: voipForm.credits_per_call,
          scheduled_at: voipForm.scheduled_at || null,
          status: voipForm.scheduled_at ? 'scheduled' : 'draft',
        })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['voip-campaigns'] });
      resetAndClose();
      toast.success('Campanha de torpedo de voz criada!');
    },
    onError: (e: Error) => toast.error(e.message),
  });

  // Start VoIP campaign
  const startVoipCampaign = useMutation({
    mutationFn: async (campaignId: string) => {
      const { error } = await supabase.from('voip_campaigns').update({ status: 'processing', started_at: new Date().toISOString() }).eq('id', campaignId);
      if (error) throw error;
      await supabase.functions.invoke('process-voip-campaign', { body: { campaignId } });
    },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['voip-campaigns'] }); toast.success('Campanha iniciada!'); },
    onError: () => toast.error('Erro ao iniciar campanha'),
  });

  // Delete VoIP campaign
  const deleteVoipCampaign = useMutation({
    mutationFn: async (campaignId: string) => {
      const { error } = await supabase.from('voip_campaigns').delete().eq('id', campaignId);
      if (error) throw error;
    },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['voip-campaigns'] }); toast.success('Campanha excluída!'); },
    onError: () => toast.error('Erro ao excluir campanha'),
  });

  const resetAndClose = () => {
    setShowCreateDialog(false);
    setCampaignType(null);
    setSmsName('');
    setSmsMessage('');
    setVoipForm({ name: '', audio_url: '', fallback_message: '', target_tags: [], scheduled_at: '', credits_per_call: 1 });
    setAudioFileName('');
  };

  const handleCreateSms = () => {
    if (!smsName.trim() || !smsMessage.trim()) return toast.error('Preencha todos os campos');
    if (!credits || credits.balance <= 0) return toast.error('Saldo de créditos insuficiente. Adquira créditos antes de criar campanhas.');
    createSmsCampaign.mutate({ name: smsName, message: smsMessage }, { onSuccess: resetAndClose });
  };

  const handlePurchase = async (packageId: string) => {
    try {
      setPurchasingId(packageId);
      await purchaseCredits(packageId);
    } catch (err: any) {
      toast.error(err.message || 'Erro ao iniciar compra');
    } finally {
      setPurchasingId(null);
    }
  };

  const formatCurrency = (cents: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(cents / 100);

  const getStatusBadge = (status: string) => {
    const map: Record<string, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' }> = {
      draft: { label: 'Rascunho', variant: 'secondary' },
      scheduled: { label: 'Agendada', variant: 'outline' },
      processing: { label: 'Enviando...', variant: 'default' },
      completed: { label: 'Concluída', variant: 'default' },
      sent: { label: 'Enviada', variant: 'default' },
      paused: { label: 'Pausada', variant: 'secondary' },
      failed: { label: 'Falhou', variant: 'destructive' },
    };
    const info = map[status] || { label: status, variant: 'secondary' as const };
    return <Badge variant={info.variant}>{info.label}</Badge>;
  };

  // Stats
  const smsStats = {
    total_sent: smsCampaigns.reduce((s, c) => s + c.sent_count, 0),
    total_delivered: smsCampaigns.reduce((s, c) => s + c.delivered_count, 0),
    total_clicks: smsCampaigns.reduce((s, c) => s + c.click_count, 0),
  };
  const voipStats = {
    total_sent: voipCampaigns.reduce((a, c) => a + (c.sent_count || 0), 0),
    total_answered: voipCampaigns.reduce((a, c) => a + (c.answered_count || 0), 0),
    total_failed: voipCampaigns.reduce((a, c) => a + (c.failed_count || 0), 0),
  };

  // Credit cost estimates
  const totalSmsCreditsUsed = transactions.filter(t => t.channel === 'sms' && t.type === 'consumption').reduce((s, t) => s + t.amount, 0);
  const totalVoipCreditsUsed = transactions.filter(t => t.channel === 'voip' && t.type === 'consumption').reduce((s, t) => s + t.amount, 0);

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-64" />
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-32" />)}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <Megaphone className="h-6 w-6 text-primary" />
            Campanhas de Comunicação
          </h1>
          <p className="text-muted-foreground mt-1">SMS e Torpedo de Voz com créditos unificados</p>
        </div>
        <Button onClick={() => setShowCreateDialog(true)}>
          <Plus className="h-4 w-4 mr-2" /> Nova Campanha
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Saldo de Créditos</CardTitle>
            <Wallet className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-foreground">{credits?.balance?.toLocaleString('pt-BR') ?? '0'}</div>
            <p className="text-xs text-muted-foreground mt-1">créditos disponíveis (SMS + VoIP)</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Campanhas SMS</CardTitle>
            <MessageSquare className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-foreground">{smsCampaigns.length}</div>
            <p className="text-xs text-muted-foreground mt-1">{smsStats.total_sent} enviados • {smsStats.total_delivered} entregues</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Campanhas VoIP</CardTitle>
            <PhoneCall className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-foreground">{voipCampaigns.length}</div>
            <p className="text-xs text-muted-foreground mt-1">{voipStats.total_sent} chamadas • {voipStats.total_answered} atendidas</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Créditos Usados</CardTitle>
            <TrendingUp className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-foreground">{(credits?.total_used ?? 0).toLocaleString('pt-BR')}</div>
            <p className="text-xs text-muted-foreground mt-1">{totalSmsCreditsUsed} SMS • {totalVoipCreditsUsed} VoIP</p>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="campaigns" className="space-y-4">
        <TabsList className="flex-wrap h-auto gap-1">
          <TabsTrigger value="campaigns" className="gap-1.5">
            <Send className="h-4 w-4" /> Campanhas
          </TabsTrigger>
          <TabsTrigger value="reports" className="gap-1.5">
            <BarChart3 className="h-4 w-4" /> Relatórios
          </TabsTrigger>
          <TabsTrigger value="pricing" className="gap-1.5">
            <DollarSign className="h-4 w-4" /> Tabela de Custos
          </TabsTrigger>
          <TabsTrigger value="packages" className="gap-1.5">
            <Package className="h-4 w-4" /> Comprar Créditos
          </TabsTrigger>
          <TabsTrigger value="history" className="gap-1.5">
            <History className="h-4 w-4" /> Transações
          </TabsTrigger>
        </TabsList>

        {/* === CAMPANHAS === */}
        <TabsContent value="campaigns" className="space-y-6">
          {/* SMS Campaigns */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><MessageSquare className="h-5 w-5 text-primary" /> Campanhas SMS</CardTitle>
              <CardDescription>Campanhas de mensagem de texto em massa</CardDescription>
            </CardHeader>
            <CardContent>
              {smsCampaigns.length === 0 ? (
                <div className="text-center py-8">
                  <MessageSquare className="h-10 w-10 mx-auto text-muted-foreground/40 mb-2" />
                  <p className="text-muted-foreground text-sm">Nenhuma campanha SMS criada</p>
                </div>
              ) : (
                smsCampaigns.map(c => (
                  <div key={c.id} className="flex items-center justify-between p-3 border rounded-lg mb-2 last:mb-0">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-semibold text-foreground text-sm">{c.name}</h3>
                        {getStatusBadge(c.status)}
                        <Badge variant="outline" className="text-xs">SMS</Badge>
                      </div>
                      <p className="text-xs text-muted-foreground line-clamp-1">{c.message}</p>
                      {c.status === 'sent' && (
                        <div className="flex gap-3 mt-1 text-xs text-muted-foreground">
                          <span>Enviados: {c.sent_count}</span>
                          <span>Entregues: {c.delivered_count}</span>
                          <span>Cliques: {c.click_count}</span>
                          <span>Créditos: {c.credits_used}</span>
                        </div>
                      )}
                    </div>
                    {c.status === 'draft' && (
                      <Button size="sm"><Send className="h-3.5 w-3.5 mr-1" /> Enviar</Button>
                    )}
                  </div>
                ))
              )}
            </CardContent>
          </Card>

          {/* VoIP Campaigns */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><Volume2 className="h-5 w-5 text-primary" /> Torpedo de Voz</CardTitle>
              <CardDescription>Campanhas de áudio em massa para leads</CardDescription>
            </CardHeader>
            <CardContent>
              {voipCampaigns.length === 0 ? (
                <div className="text-center py-8">
                  <Volume2 className="h-10 w-10 mx-auto text-muted-foreground/40 mb-2" />
                  <p className="text-muted-foreground text-sm">Nenhuma campanha de voz criada</p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Nome</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Leads</TableHead>
                      <TableHead>Enviados</TableHead>
                      <TableHead>Atendidas</TableHead>
                      <TableHead>Progresso</TableHead>
                      <TableHead>Data</TableHead>
                      <TableHead>Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {voipCampaigns.map(c => (
                      <TableRow key={c.id}>
                        <TableCell className="font-medium">{c.name}</TableCell>
                        <TableCell>{getStatusBadge(c.status)}</TableCell>
                        <TableCell>{c.target_count}</TableCell>
                        <TableCell>{c.sent_count}</TableCell>
                        <TableCell>{c.answered_count}</TableCell>
                        <TableCell>
                          <div className="w-24">
                            <Progress value={c.target_count > 0 ? (c.sent_count / c.target_count) * 100 : 0} className="h-2" />
                            <span className="text-xs text-muted-foreground">
                              {c.target_count > 0 ? Math.round((c.sent_count / c.target_count) * 100) : 0}%
                            </span>
                          </div>
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {format(new Date(c.created_at), 'dd/MM/yyyy HH:mm', { locale: ptBR })}
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-1">
                            {(c.status === 'draft' || c.status === 'scheduled') && (
                              <Button size="sm" variant="outline" onClick={() => startVoipCampaign.mutate(c.id)}>
                                <Play className="h-3 w-3" />
                              </Button>
                            )}
                            {c.status !== 'processing' && (
                              <Button size="sm" variant="ghost" className="text-destructive" onClick={() => deleteVoipCampaign.mutate(c.id)}>
                                <Trash2 className="h-3 w-3" />
                              </Button>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* === RELATÓRIOS === */}
        <TabsContent value="reports" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* SMS Report */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <MessageSquare className="h-5 w-5 text-primary" /> Relatório SMS
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-3 rounded-lg bg-muted/50">
                    <p className="text-xs text-muted-foreground">Total Enviados</p>
                    <p className="text-2xl font-bold text-foreground">{smsStats.total_sent.toLocaleString()}</p>
                  </div>
                  <div className="p-3 rounded-lg bg-muted/50">
                    <p className="text-xs text-muted-foreground">Entregues</p>
                    <p className="text-2xl font-bold text-foreground">{smsStats.total_delivered.toLocaleString()}</p>
                  </div>
                  <div className="p-3 rounded-lg bg-muted/50">
                    <p className="text-xs text-muted-foreground">Cliques</p>
                    <p className="text-2xl font-bold text-foreground">{smsStats.total_clicks.toLocaleString()}</p>
                  </div>
                  <div className="p-3 rounded-lg bg-muted/50">
                    <p className="text-xs text-muted-foreground">Créditos Gastos</p>
                    <p className="text-2xl font-bold text-foreground">{totalSmsCreditsUsed.toLocaleString()}</p>
                  </div>
                </div>
                <div className="p-3 rounded-lg border">
                  <p className="text-xs text-muted-foreground mb-1">Taxa de Entrega</p>
                  <Progress value={smsStats.total_sent > 0 ? (smsStats.total_delivered / smsStats.total_sent) * 100 : 0} className="h-2" />
                  <p className="text-xs text-muted-foreground mt-1">
                    {smsStats.total_sent > 0 ? Math.round((smsStats.total_delivered / smsStats.total_sent) * 100) : 0}%
                  </p>
                </div>
                <div className="p-3 rounded-lg border">
                  <p className="text-xs text-muted-foreground mb-1">Taxa de Cliques (CTR)</p>
                  <Progress value={smsStats.total_delivered > 0 ? (smsStats.total_clicks / smsStats.total_delivered) * 100 : 0} className="h-2" />
                  <p className="text-xs text-muted-foreground mt-1">
                    {smsStats.total_delivered > 0 ? Math.round((smsStats.total_clicks / smsStats.total_delivered) * 100) : 0}%
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* VoIP Report */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <PhoneCall className="h-5 w-5 text-primary" /> Relatório Torpedo de Voz
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-3 rounded-lg bg-muted/50">
                    <p className="text-xs text-muted-foreground">Total Chamadas</p>
                    <p className="text-2xl font-bold text-foreground">{voipStats.total_sent.toLocaleString()}</p>
                  </div>
                  <div className="p-3 rounded-lg bg-muted/50">
                    <p className="text-xs text-muted-foreground">Atendidas</p>
                    <p className="text-2xl font-bold text-foreground">{voipStats.total_answered.toLocaleString()}</p>
                  </div>
                  <div className="p-3 rounded-lg bg-muted/50">
                    <p className="text-xs text-muted-foreground">Falhas</p>
                    <p className="text-2xl font-bold text-foreground">{voipStats.total_failed.toLocaleString()}</p>
                  </div>
                  <div className="p-3 rounded-lg bg-muted/50">
                    <p className="text-xs text-muted-foreground">Créditos Gastos</p>
                    <p className="text-2xl font-bold text-foreground">{totalVoipCreditsUsed.toLocaleString()}</p>
                  </div>
                </div>
                <div className="p-3 rounded-lg border">
                  <p className="text-xs text-muted-foreground mb-1">Taxa de Atendimento</p>
                  <Progress value={voipStats.total_sent > 0 ? (voipStats.total_answered / voipStats.total_sent) * 100 : 0} className="h-2" />
                  <p className="text-xs text-muted-foreground mt-1">
                    {voipStats.total_sent > 0 ? Math.round((voipStats.total_answered / voipStats.total_sent) * 100) : 0}%
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Combined Cost Report */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <DollarSign className="h-5 w-5 text-primary" /> Resumo de Gastos
              </CardTitle>
              <CardDescription>Visão geral de consumo de créditos por canal</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="p-4 rounded-lg border text-center">
                  <p className="text-sm text-muted-foreground mb-1">Total Comprado</p>
                  <p className="text-3xl font-bold text-foreground">{(credits?.total_purchased ?? 0).toLocaleString('pt-BR')}</p>
                  <p className="text-xs text-muted-foreground">créditos</p>
                </div>
                <div className="p-4 rounded-lg border text-center">
                  <p className="text-sm text-muted-foreground mb-1">Total Consumido</p>
                  <p className="text-3xl font-bold text-foreground">{(credits?.total_used ?? 0).toLocaleString('pt-BR')}</p>
                  <p className="text-xs text-muted-foreground">créditos</p>
                </div>
                <div className="p-4 rounded-lg border text-center">
                  <p className="text-sm text-muted-foreground mb-1">Saldo Restante</p>
                  <p className="text-3xl font-bold text-primary">{(credits?.balance ?? 0).toLocaleString('pt-BR')}</p>
                  <p className="text-xs text-muted-foreground">créditos</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* === TABELA DE CUSTOS === */}
        <TabsContent value="pricing">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <DollarSign className="h-5 w-5 text-primary" /> Tabela de Custos por Crédito
              </CardTitle>
              <CardDescription>
                Cada crédito pode ser usado para SMS ou VoIP. Veja abaixo o custo de cada operação.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Canal</TableHead>
                    <TableHead>Operação</TableHead>
                    <TableHead className="text-center">Créditos por unidade</TableHead>
                    <TableHead>Observação</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  <TableRow>
                    <TableCell><Badge variant="outline" className="gap-1"><MessageSquare className="h-3 w-3" /> SMS</Badge></TableCell>
                    <TableCell>Envio de 1 SMS (até 160 caracteres)</TableCell>
                    <TableCell className="text-center font-bold">1 crédito</TableCell>
                    <TableCell className="text-sm text-muted-foreground">Mensagens maiores consomem 1 crédito a cada 160 chars</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell><Badge variant="outline" className="gap-1"><MessageSquare className="h-3 w-3" /> SMS</Badge></TableCell>
                    <TableCell>SMS com link rastreável</TableCell>
                    <TableCell className="text-center font-bold">1 crédito</TableCell>
                    <TableCell className="text-sm text-muted-foreground">Inclui rastreamento de cliques automaticamente</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell><Badge variant="outline" className="gap-1"><PhoneCall className="h-3 w-3" /> VoIP</Badge></TableCell>
                    <TableCell>Torpedo de Voz (até 1 minuto)</TableCell>
                    <TableCell className="text-center font-bold">1 crédito</TableCell>
                    <TableCell className="text-sm text-muted-foreground">Reprodução de áudio pré-gravado para o contato</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell><Badge variant="outline" className="gap-1"><PhoneCall className="h-3 w-3" /> VoIP</Badge></TableCell>
                    <TableCell>Torpedo de Voz (até 2 minutos)</TableCell>
                    <TableCell className="text-center font-bold">2 créditos</TableCell>
                    <TableCell className="text-sm text-muted-foreground">Para áudios mais longos</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell><Badge variant="outline" className="gap-1"><PhoneCall className="h-3 w-3" /> VoIP</Badge></TableCell>
                    <TableCell>Torpedo de Voz (até 3 minutos)</TableCell>
                    <TableCell className="text-center font-bold">3 créditos</TableCell>
                    <TableCell className="text-sm text-muted-foreground">Para apresentações completas</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell><Badge variant="outline" className="gap-1"><PhoneCall className="h-3 w-3" /> VoIP</Badge></TableCell>
                    <TableCell>Torpedo de Voz com fallback SMS</TableCell>
                    <TableCell className="text-center font-bold">+1 crédito</TableCell>
                    <TableCell className="text-sm text-muted-foreground">Adicional se o lead não atender e SMS for enviado</TableCell>
                  </TableRow>
                </TableBody>
              </Table>

              <div className="p-4 rounded-lg bg-muted/50 border space-y-2">
                <h4 className="font-medium text-foreground text-sm flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4 text-primary" /> Regras Importantes
                </h4>
                <ul className="text-sm text-muted-foreground space-y-1">
                  <li>• <strong>1 crédito = 1 SMS (160 chars) ou 1 minuto de ligação VoIP</strong></li>
                  <li>• SMS com mais de 160 caracteres consome 1 crédito adicional a cada segmento</li>
                  <li>• Torpedos de voz consomem créditos conforme a duração do áudio selecionada</li>
                  <li>• Fallback SMS (caso não atenda) consome 1 crédito adicional por contato</li>
                  <li>• Créditos são debitados <strong>após o envio</strong>, não na criação da campanha</li>
                  <li>• Os créditos <strong>não expiram</strong> e ficam vinculados à sua organização</li>
                  <li>• Provedor: Zenvia (Brasil) — custos otimizados para números brasileiros</li>
                </ul>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* === COMPRAR CRÉDITOS === */}
        <TabsContent value="packages">
          <Card>
            <CardHeader>
              <CardTitle>Comprar Créditos de Comunicação</CardTitle>
              <CardDescription>Créditos unificados para SMS e VoIP. Quanto maior o pacote, menor o custo por crédito.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {packages.map((pkg) => {
                  const isPopular = pkg.credits === 5000;
                  return (
                    <Card key={pkg.id} className={`relative transition-all hover:shadow-lg hover:border-primary/50 ${isPopular ? 'border-primary ring-1 ring-primary/20' : ''}`}>
                      {isPopular && <Badge className="absolute -top-2.5 left-1/2 -translate-x-1/2 bg-primary text-primary-foreground">Popular</Badge>}
                      <CardHeader className="text-center pb-2">
                        <CardTitle className="text-lg">{pkg.credits.toLocaleString('pt-BR')}</CardTitle>
                        <CardDescription>créditos</CardDescription>
                      </CardHeader>
                      <CardContent className="text-center space-y-3">
                        <div>
                          <span className="text-2xl font-bold text-foreground">{formatCurrency(pkg.price_cents)}</span>
                        </div>
                        <p className="text-xs text-muted-foreground">
                          {formatCurrency(pkg.price_per_credit_cents)} por crédito
                        </p>
                        <p className="text-xs text-muted-foreground">
                          = {pkg.credits.toLocaleString()} SMS ou {pkg.credits.toLocaleString()} min VoIP
                        </p>
                        <Button
                          className="w-full"
                          variant={isPopular ? 'default' : 'outline'}
                          onClick={() => handlePurchase(pkg.id)}
                          disabled={purchasingId === pkg.id}
                        >
                          {purchasingId === pkg.id ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <CreditCard className="h-4 w-4 mr-2" />}
                          {purchasingId === pkg.id ? 'Processando...' : 'Comprar'}
                        </Button>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* === TRANSAÇÕES === */}
        <TabsContent value="history">
          <Card>
            <CardHeader>
              <CardTitle>Histórico de Transações</CardTitle>
              <CardDescription>Todas as compras e consumos de créditos de comunicação</CardDescription>
            </CardHeader>
            <CardContent>
              {transactions.length === 0 ? (
                <div className="text-center py-12">
                  <Wallet className="h-12 w-12 mx-auto text-muted-foreground/50 mb-3" />
                  <p className="text-muted-foreground">Nenhuma transação encontrada</p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Data</TableHead>
                      <TableHead>Tipo</TableHead>
                      <TableHead>Canal</TableHead>
                      <TableHead>Descrição</TableHead>
                      <TableHead className="text-right">Créditos</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {transactions.map((tx) => (
                      <TableRow key={tx.id}>
                        <TableCell className="text-sm">
                          {format(new Date(tx.created_at), 'dd/MM/yyyy HH:mm', { locale: ptBR })}
                        </TableCell>
                        <TableCell>
                          <Badge variant={tx.type === 'purchase' ? 'default' : 'secondary'}>
                            {tx.type === 'purchase' ? 'Compra' : tx.type === 'purchase_pending' ? 'Pendente' : 'Consumo'}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">
                            {tx.channel === 'sms' ? 'SMS' : tx.channel === 'voip' ? 'VoIP' : 'Geral'}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">{tx.description || '-'}</TableCell>
                        <TableCell className={`text-right font-medium ${tx.type.includes('purchase') ? 'text-green-600' : 'text-red-500'}`}>
                          {tx.type.includes('purchase') ? '+' : '-'}{tx.amount.toLocaleString('pt-BR')}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* === CREATE CAMPAIGN DIALOG === */}
      <Dialog open={showCreateDialog} onOpenChange={(open) => { if (!open) resetAndClose(); else setShowCreateDialog(true); }}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Megaphone className="h-5 w-5 text-primary" />
              Nova Campanha
            </DialogTitle>
            <DialogDescription>
              {!campaignType ? 'Selecione o tipo de campanha' : campaignType === 'sms' ? 'Configure sua campanha SMS' : 'Configure sua campanha de Torpedo de Voz'}
            </DialogDescription>
          </DialogHeader>

          {/* Step 1: Select Type */}
          {!campaignType && (
            <div className="grid grid-cols-2 gap-4 py-4">
              <button
                onClick={() => setCampaignType('sms')}
                className="flex flex-col items-center gap-3 p-6 rounded-lg border-2 border-muted hover:border-primary hover:bg-accent/50 transition-all"
              >
                <MessageSquare className="h-10 w-10 text-primary" />
                <div className="text-center">
                  <p className="font-semibold text-foreground">SMS</p>
                  <p className="text-xs text-muted-foreground mt-1">Mensagem de texto em massa</p>
                  <p className="text-xs text-primary mt-1 font-medium">1 crédito por SMS</p>
                </div>
              </button>
              <button
                onClick={() => setCampaignType('voip')}
                className="flex flex-col items-center gap-3 p-6 rounded-lg border-2 border-muted hover:border-primary hover:bg-accent/50 transition-all"
              >
                <Volume2 className="h-10 w-10 text-primary" />
                <div className="text-center">
                  <p className="font-semibold text-foreground">Torpedo de Voz</p>
                  <p className="text-xs text-muted-foreground mt-1">Áudio pré-gravado em massa</p>
                  <p className="text-xs text-primary mt-1 font-medium">1-3 créditos por chamada</p>
                </div>
              </button>
            </div>
          )}

          {/* Step 2: SMS Form */}
          {campaignType === 'sms' && (
            <div className="space-y-4">
              <div>
                <Label>Nome da campanha *</Label>
                <Input value={smsName} onChange={e => setSmsName(e.target.value)} placeholder="Ex: Promoção de Natal" />
              </div>
              <div>
                <Label>Mensagem *</Label>
                <Textarea value={smsMessage} onChange={e => setSmsMessage(e.target.value)} placeholder="Olá {nome}! Use variáveis com {chaves}" rows={4} />
                <div className="flex justify-between text-xs text-muted-foreground mt-1">
                  <span>{charCount} caracteres • {smsCount} SMS(s) por contato • {smsCount} crédito(s)/contato</span>
                  <span>Variáveis: {'{nome}'}, {'{email}'}, {'{link}'}</span>
                </div>
              </div>

              {/* Balance check */}
              <div className={`p-3 rounded-lg border ${(!credits || credits.balance <= 0) ? 'border-destructive bg-destructive/5' : 'bg-muted/30'}`}>
                <div className="flex justify-between items-center text-sm">
                  <span className="text-muted-foreground">Saldo atual:</span>
                  <span className={`font-bold ${(!credits || credits.balance <= 0) ? 'text-destructive' : 'text-foreground'}`}>
                    {(credits?.balance ?? 0).toLocaleString('pt-BR')} créditos
                  </span>
                </div>
                {(!credits || credits.balance <= 0) && (
                  <p className="text-xs text-destructive mt-1">⚠️ Saldo insuficiente. Adquira créditos na aba "Comprar Créditos".</p>
                )}
              </div>

              <DialogFooter>
                <Button variant="outline" onClick={() => setCampaignType(null)}>Voltar</Button>
                <Button onClick={handleCreateSms} disabled={createSmsCampaign.isPending || !credits || credits.balance <= 0}>
                  {createSmsCampaign.isPending ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Send className="h-4 w-4 mr-2" />}
                  Criar Campanha SMS
                </Button>
              </DialogFooter>
            </div>
          )}

          {/* Step 2: VoIP Form */}
          {campaignType === 'voip' && (
            <div className="space-y-4">
              <div>
                <Label>Nome da Campanha *</Label>
                <Input placeholder="Ex: Promoção de Janeiro" value={voipForm.name} onChange={e => setVoipForm(f => ({ ...f, name: e.target.value }))} />
              </div>

              <div>
                <Label>Áudio da Campanha *</Label>
                <div className="mt-2 space-y-3">
                  <input ref={fileInputRef} type="file" accept="audio/mpeg,audio/mp3,audio/wav,audio/ogg,audio/mp4,audio/x-m4a" className="hidden" onChange={handleAudioUpload} />
                  {voipForm.audio_url ? (
                    <div className="flex items-center gap-2 p-3 rounded-lg border bg-accent/30">
                      <FileAudio className="h-5 w-5 text-primary shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{audioFileName || 'Áudio selecionado'}</p>
                        <audio controls className="w-full mt-1 h-8" src={voipForm.audio_url}><track kind="captions" /></audio>
                      </div>
                      <Button type="button" size="icon" variant="ghost" className="shrink-0 h-7 w-7" onClick={() => { setVoipForm(f => ({ ...f, audio_url: '' })); setAudioFileName(''); }}>
                        <X className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  ) : (
                    <Button type="button" variant="outline" className="w-full h-16 border-dashed" onClick={() => fileInputRef.current?.click()} disabled={uploading}>
                      {uploading ? (
                        <div className="flex items-center gap-2"><Loader2 className="h-5 w-5 animate-spin" /><span>Enviando...</span></div>
                      ) : (
                        <div className="flex flex-col items-center gap-1">
                          <Upload className="h-5 w-5 text-muted-foreground" />
                          <span className="text-xs text-muted-foreground">MP3, WAV, OGG — até 20MB</span>
                        </div>
                      )}
                    </Button>
                  )}
                  {!voipForm.audio_url && (
                    <div>
                      <p className="text-xs text-muted-foreground mb-1">Ou cole uma URL:</p>
                      <Input placeholder="https://..." onChange={e => setVoipForm(f => ({ ...f, audio_url: e.target.value }))} />
                    </div>
                  )}
                </div>
              </div>

              <div>
                <Label>Mensagem Fallback (SMS)</Label>
                <Textarea rows={2} placeholder="SMS se não atender..." value={voipForm.fallback_message} onChange={e => setVoipForm(f => ({ ...f, fallback_message: e.target.value }))} />
                {voipForm.fallback_message && <p className="text-xs text-muted-foreground mt-1">⚠️ Fallback ativo: +1 crédito por contato não atendido</p>}
              </div>

              <div>
                <Label className="flex items-center gap-1"><Tag className="h-3.5 w-3.5" /> Filtrar por Tags *</Label>
                <SearchableTagSelect tags={tags} selectedTags={voipForm.target_tags} onTagsChange={t => setVoipForm(f => ({ ...f, target_tags: t }))} />
                {voipForm.target_tags.length > 0 && (
                  <p className="text-sm text-primary mt-1 flex items-center gap-1"><Users className="h-3.5 w-3.5" /> {contactCount} contatos</p>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Créditos por Chamada</Label>
                  <Select value={String(voipForm.credits_per_call)} onValueChange={v => setVoipForm(f => ({ ...f, credits_per_call: Number(v) }))}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="1">1 crédito (até 1 min)</SelectItem>
                      <SelectItem value="2">2 créditos (até 2 min)</SelectItem>
                      <SelectItem value="3">3 créditos (até 3 min)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label><Calendar className="h-3.5 w-3.5 inline mr-1" />Agendar (opcional)</Label>
                  <Input type="datetime-local" value={voipForm.scheduled_at} onChange={e => setVoipForm(f => ({ ...f, scheduled_at: e.target.value }))} />
                </div>
              </div>

              {/* Cost Estimate */}
              <Card className={!hasEnoughVoipCredits && estimatedVoipCredits > 0 ? 'border-destructive' : ''}>
                <CardContent className="pt-4">
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-muted-foreground">Estimativa:</span>
                    <span className="font-bold text-lg">{estimatedVoipCredits.toLocaleString('pt-BR')} créditos</span>
                  </div>
                  <div className="flex justify-between items-center text-sm mt-1">
                    <span className="text-muted-foreground">Saldo:</span>
                    <span className={!hasEnoughVoipCredits && estimatedVoipCredits > 0 ? 'text-destructive font-medium' : 'text-muted-foreground'}>
                      {(credits?.balance ?? 0).toLocaleString('pt-BR')} créditos
                    </span>
                  </div>
                  {!hasEnoughVoipCredits && estimatedVoipCredits > 0 && (
                    <p className="text-xs text-destructive mt-2">⚠️ Saldo insuficiente. Adquira créditos na aba "Comprar Créditos".</p>
                  )}
                </CardContent>
              </Card>

              <DialogFooter>
                <Button variant="outline" onClick={() => setCampaignType(null)}>Voltar</Button>
                <Button
                  onClick={() => createVoipCampaign.mutate()}
                  disabled={!voipForm.name || !voipForm.audio_url || voipForm.target_tags.length === 0 || createVoipCampaign.isPending || (estimatedVoipCredits > 0 && !hasEnoughVoipCredits)}
                >
                  {createVoipCampaign.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Volume2 className="h-4 w-4 mr-2" />}
                  {voipForm.scheduled_at ? 'Agendar Campanha' : 'Criar Campanha'}
                </Button>
              </DialogFooter>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
