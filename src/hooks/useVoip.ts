import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useOrganization } from '@/contexts/OrganizationContext';
import { toast } from 'sonner';

export interface VoipCreditPackage {
  id: string;
  name: string;
  credits: number;
  price_cents: number;
  price_per_credit_cents: number;
  is_active: boolean;
  sort_order: number;
}

export interface VoipCredits {
  id: string;
  organization_id: string;
  balance: number;
  total_purchased: number;
  total_used: number;
}

export interface VoipTransaction {
  id: string;
  organization_id: string;
  user_id: string;
  type: string;
  amount: number;
  package_id: string | null;
  payment_method: string | null;
  payment_reference: string | null;
  description: string | null;
  created_at: string;
}

export interface Call {
  id: string;
  organization_id: string;
  user_id: string;
  contact_id: string | null;
  deal_id: string | null;
  phone_number: string;
  direction: string;
  status: string;
  duration_seconds: number | null;
  recording_url: string | null;
  notes: string | null;
  credits_used: number;
  started_at: string | null;
  ended_at: string | null;
  created_at: string;
}

export const useVoip = () => {
  const { user } = useAuth();
  const { currentOrganization } = useOrganization();
  const queryClient = useQueryClient();
  const orgId = currentOrganization?.id;

  const packagesQuery = useQuery({
    queryKey: ['voip-packages'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('voip_credit_packages')
        .select('*')
        .eq('is_active', true)
        .order('sort_order');
      if (error) throw error;
      return data as VoipCreditPackage[];
    },
  });

  const creditsQuery = useQuery({
    queryKey: ['voip-credits', orgId],
    queryFn: async () => {
      if (!orgId) return null;
      const { data, error } = await supabase
        .from('voip_credits')
        .select('*')
        .eq('organization_id', orgId)
        .maybeSingle();
      if (error) throw error;
      return data as VoipCredits | null;
    },
    enabled: !!orgId,
  });

  const transactionsQuery = useQuery({
    queryKey: ['voip-transactions', orgId],
    queryFn: async () => {
      if (!orgId) return [];
      const { data, error } = await supabase
        .from('voip_transactions')
        .select('*')
        .eq('organization_id', orgId)
        .order('created_at', { ascending: false })
        .limit(50);
      if (error) throw error;
      return data as VoipTransaction[];
    },
    enabled: !!orgId,
  });

  const callsQuery = useQuery({
    queryKey: ['voip-calls', orgId],
    queryFn: async () => {
      if (!orgId) return [];
      const { data, error } = await supabase
        .from('calls')
        .select('*')
        .eq('organization_id', orgId)
        .order('created_at', { ascending: false })
        .limit(100);
      if (error) throw error;
      return data as Call[];
    },
    enabled: !!orgId,
  });

  const registerCall = useMutation({
    mutationFn: async (callData: { phone_number: string; contact_id?: string; deal_id?: string; notes?: string }) => {
      if (!user || !orgId) throw new Error('Usuário não autenticado');
      const { data, error } = await supabase
        .from('calls')
        .insert({
          organization_id: orgId,
          user_id: user.id,
          phone_number: callData.phone_number,
          contact_id: callData.contact_id || null,
          deal_id: callData.deal_id || null,
          notes: callData.notes || null,
          direction: 'outbound',
          status: 'completed',
          started_at: new Date().toISOString(),
        })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['voip-calls'] });
      toast.success('Ligação registrada com sucesso!');
    },
    onError: () => toast.error('Erro ao registrar ligação'),
  });

  const makeCall = (phone: string, contactId?: string) => {
    // Phase 1: Use tel: link for native calling
    const cleanPhone = phone.replace(/\D/g, '');
    const telUrl = cleanPhone.startsWith('55') ? `tel:+${cleanPhone}` : `tel:+55${cleanPhone}`;
    window.open(telUrl, '_self');
    
    // Register the call
    registerCall.mutate({ phone_number: cleanPhone, contact_id: contactId });
  };

  return {
    packages: packagesQuery.data ?? [],
    credits: creditsQuery.data,
    transactions: transactionsQuery.data ?? [],
    calls: callsQuery.data ?? [],
    isLoading: packagesQuery.isLoading || creditsQuery.isLoading,
    makeCall,
    registerCall,
  };
};
