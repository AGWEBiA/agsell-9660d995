import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useOrganization } from '@/contexts/OrganizationContext';
import { toast } from 'sonner';
import { Loader2, CheckCircle, XCircle, Building2 } from 'lucide-react';

export default function AgencyInvite() {
  const { token } = useParams<{ token: string }>();
  const { user } = useAuth();
  const { currentOrganization } = useOrganization();
  const navigate = useNavigate();
  const [status, setStatus] = useState<'loading' | 'found' | 'accepted' | 'error'>('loading');
  const [invite, setInvite] = useState<any>(null);

  useEffect(() => {
    if (!token) return;
    
    const fetchInvite = async () => {
      const { data, error } = await supabase
        .from('agency_clients')
        .select(`
          *,
          agency_org:organizations!agency_clients_agency_org_id_fkey(id, name, slug)
        `)
        .eq('invite_token', token)
        .eq('status', 'pending')
        .maybeSingle();

      if (error || !data) {
        setStatus('error');
        return;
      }

      setInvite(data);
      setStatus('found');
    };

    fetchInvite();
  }, [token]);

  const handleAccept = async () => {
    if (!invite || !currentOrganization?.id || !user?.id) {
      toast.error('Você precisa estar logado e ter uma organização selecionada.');
      return;
    }

    // Check if client org has an active paid subscription
    const { data: sub } = await supabase
      .from('subscriptions')
      .select('status')
      .eq('organization_id', currentOrganization.id)
      .eq('status', 'active')
      .maybeSingle();

    if (!sub) {
      toast.error('Sua organização precisa ter um plano pago ativo para ser gerenciada por uma agência.');
      return;
    }

    const { error } = await supabase
      .from('agency_clients')
      .update({
        client_org_id: currentOrganization.id,
        status: 'active',
        accepted_at: new Date().toISOString(),
        invite_token: null, // invalidate token
      })
      .eq('id', invite.id);

    if (error) {
      toast.error('Erro ao aceitar convite: ' + error.message);
      return;
    }

    setStatus('accepted');
    toast.success('Vínculo com a agência aceito com sucesso!');
    setTimeout(() => navigate('/organization'), 2000);
  };

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Card className="w-full max-w-md">
          <CardContent className="py-8 text-center">
            <p className="text-muted-foreground mb-4">Você precisa estar logado para aceitar este convite.</p>
            <Button onClick={() => navigate('/login')}>Fazer Login</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <Building2 className="h-12 w-12 mx-auto text-primary mb-4" />
          <CardTitle>Convite de Agência</CardTitle>
        </CardHeader>
        <CardContent className="text-center">
          {status === 'loading' && (
            <div className="flex flex-col items-center gap-4">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <p className="text-muted-foreground">Carregando convite...</p>
            </div>
          )}

          {status === 'found' && invite && (
            <div className="space-y-4">
              <p>
                A agência <strong>{invite.agency_org?.name}</strong> deseja gerenciar sua conta.
              </p>
              <p className="text-sm text-muted-foreground">
                Ao aceitar, a agência terá acesso operacional à sua conta. Você pode alterar
                o nível de acesso a qualquer momento nas configurações da organização.
              </p>
              <div className="flex gap-3 justify-center mt-6">
                <Button variant="outline" onClick={() => navigate('/dashboard')}>
                  Recusar
                </Button>
                <Button onClick={handleAccept}>
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Aceitar Vínculo
                </Button>
              </div>
            </div>
          )}

          {status === 'accepted' && (
            <div className="space-y-4">
              <CheckCircle className="h-12 w-12 mx-auto text-primary" />
              <p className="font-semibold">Vínculo aceito com sucesso!</p>
              <p className="text-sm text-muted-foreground">Redirecionando...</p>
            </div>
          )}

          {status === 'error' && (
            <div className="space-y-4">
              <XCircle className="h-12 w-12 mx-auto text-destructive" />
              <p>Convite inválido ou já utilizado.</p>
              <Button onClick={() => navigate('/dashboard')}>
                Voltar ao Dashboard
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
