import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useOrganization } from '@/contexts/OrganizationContext';
import { toast } from 'sonner';

export interface ApiWebhookSubscription {
  id: string;
  organization_id: string;
  user_id: string;
  name: string;
  url: string;
  events: string[];
  secret: string | null;
  is_active: boolean;
  last_triggered_at: string | null;
  failure_count: number;
  created_at: string;
  updated_at: string;
}

export interface WebhookDelivery {
  id: string;
  webhook_id: string | null;
  url: string;
  status: string;
  attempts: number;
  max_attempts: number;
  next_retry_at: string | null;
  last_attempt_at: string | null;
  last_status_code: number | null;
  last_error: string | null;
  payload: any;
  created_at: string;
  completed_at: string | null;
}

const generateSecret = () => {
  const arr = new Uint8Array(24);
  crypto.getRandomValues(arr);
  return 'whsec_' + Array.from(arr).map((b) => b.toString(16).padStart(2, '0')).join('');
};

export function useApiWebhooks() {
  const qc = useQueryClient();
  const { currentOrganization } = useOrganization();
  const orgId = currentOrganization?.id;

  const subscriptions = useQuery({
    queryKey: ['api-webhook-subscriptions', orgId],
    queryFn: async () => {
      if (!orgId) return [];
      const { data, error } = await supabase
        .from('api_webhook_subscriptions')
        .select('*')
        .eq('organization_id', orgId)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return (data || []) as ApiWebhookSubscription[];
    },
    enabled: !!orgId,
  });

  const create = useMutation({
    mutationFn: async (input: { name: string; url: string; events: string[] }) => {
      if (!orgId) throw new Error('No organization');
      const { data: userData } = await supabase.auth.getUser();
      const { data, error } = await supabase
        .from('api_webhook_subscriptions')
        .insert({
          organization_id: orgId,
          user_id: userData.user!.id,
          name: input.name,
          url: input.url,
          events: input.events,
          secret: generateSecret(),
        })
        .select()
        .single();
      if (error) throw error;
      return data as ApiWebhookSubscription;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['api-webhook-subscriptions', orgId] });
      toast.success('Webhook criado');
    },
    onError: (e: any) => toast.error(e.message),
  });

  const update = useMutation({
    mutationFn: async ({ id, ...updates }: Partial<ApiWebhookSubscription> & { id: string }) => {
      const { error } = await supabase
        .from('api_webhook_subscriptions')
        .update(updates)
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['api-webhook-subscriptions', orgId] });
      toast.success('Atualizado');
    },
    onError: (e: any) => toast.error(e.message),
  });

  const remove = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('api_webhook_subscriptions')
        .delete()
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['api-webhook-subscriptions', orgId] });
      toast.success('Webhook removido');
    },
    onError: (e: any) => toast.error(e.message),
  });

  const rotateSecret = useMutation({
    mutationFn: async (id: string) => {
      const newSecret = generateSecret();
      const { error } = await supabase
        .from('api_webhook_subscriptions')
        .update({ secret: newSecret })
        .eq('id', id);
      if (error) throw error;
      return newSecret;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['api-webhook-subscriptions', orgId] });
      toast.success('Novo segredo gerado');
    },
    onError: (e: any) => toast.error(e.message),
  });

  const sendTest = useMutation({
    mutationFn: async (sub: ApiWebhookSubscription) => {
      const payload = {
        event: 'test',
        organization_id: sub.organization_id,
        created_at: new Date().toISOString(),
        data: { message: 'This is a test webhook delivery from your platform.' },
      };
      const { error } = await supabase.from('webhook_deliveries').insert({
        webhook_id: sub.id,
        organization_id: sub.organization_id,
        url: sub.url,
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Webhook-Event': 'test',
          'X-Webhook-Subscription': sub.id,
        },
        payload,
        status: 'pending',
        attempts: 0,
        max_attempts: 3,
        next_retry_at: new Date().toISOString(),
      });
      if (error) throw error;

      // Trigger immediate processing
      await supabase.functions.invoke('process-webhook-deliveries', { body: {} }).catch(() => {});
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['webhook-deliveries', orgId] });
      toast.success('Teste enviado — verifique os logs');
    },
    onError: (e: any) => toast.error(e.message),
  });

  return {
    subscriptions: subscriptions.data || [],
    isLoading: subscriptions.isLoading,
    create,
    update,
    remove,
    rotateSecret,
    sendTest,
  };
}

export function useWebhookDeliveries(webhookId?: string) {
  const { currentOrganization } = useOrganization();
  const orgId = currentOrganization?.id;

  return useQuery({
    queryKey: ['webhook-deliveries', orgId, webhookId],
    queryFn: async () => {
      if (!orgId) return [];
      let q = supabase
        .from('webhook_deliveries')
        .select('*')
        .eq('organization_id', orgId)
        .order('created_at', { ascending: false })
        .limit(100);
      if (webhookId) q = q.eq('webhook_id', webhookId);
      const { data, error } = await q;
      if (error) throw error;
      return (data || []) as WebhookDelivery[];
    },
    enabled: !!orgId,
    refetchInterval: 10_000,
  });
}
