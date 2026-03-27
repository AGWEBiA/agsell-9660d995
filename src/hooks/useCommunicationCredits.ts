import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useOrganization } from '@/contexts/OrganizationContext';
import { toast } from 'sonner';

export interface CommunicationCreditPackage {
  id: string;
  name: string;
  credits: number;
  price_cents: number;
  price_per_credit_cents: number;
  is_active: boolean;
  sort_order: number;
}

export interface CommunicationCredits {
  id: string;
  organization_id: string;
  balance: number;
  total_purchased: number;
  total_used: number;
}

export interface CommunicationTransaction {
  id: string;
  organization_id: string;
  user_id: string;
  type: string;
  amount: number;
  channel: string | null;
  package_id: string | null;
  payment_method: string | null;
  payment_reference: string | null;
  description: string | null;
  created_at: string;
}

export const useCommunicationCredits = () => {
  const { user } = useAuth();
  const { currentOrganization } = useOrganization();
  const queryClient = useQueryClient();
  const orgId = currentOrganization?.id;

  const packagesQuery = useQuery({
    queryKey: ['communication-packages'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('communication_credit_packages')
        .select('*')
        .eq('is_active', true)
        .order('sort_order');
      if (error) throw error;
      return data as CommunicationCreditPackage[];
    },
  });

  const creditsQuery = useQuery({
    queryKey: ['communication-credits', orgId],
    queryFn: async () => {
      if (!orgId) return null;
      const { data, error } = await supabase
        .from('communication_credits')
        .select('*')
        .eq('organization_id', orgId)
        .maybeSingle();
      if (error) throw error;
      return data as CommunicationCredits | null;
    },
    enabled: !!orgId,
  });

  const transactionsQuery = useQuery({
    queryKey: ['communication-transactions', orgId],
    queryFn: async () => {
      if (!orgId) return [];
      const { data, error } = await supabase
        .from('communication_transactions')
        .select('*')
        .eq('organization_id', orgId)
        .order('created_at', { ascending: false })
        .limit(50);
      if (error) throw error;
      return data as CommunicationTransaction[];
    },
    enabled: !!orgId,
  });

  const purchaseCredits = async (packageId: string) => {
    const { data, error } = await supabase.functions.invoke('purchase-communication-credits', {
      body: { packageId },
    });
    if (error) throw error;
    if (data?.url) {
      window.open(data.url, '_blank');
    } else {
      throw new Error('Nenhuma URL de checkout retornada');
    }
  };

  return {
    packages: packagesQuery.data ?? [],
    credits: creditsQuery.data,
    transactions: transactionsQuery.data ?? [],
    isLoading: packagesQuery.isLoading || creditsQuery.isLoading,
    purchaseCredits,
    refetch: () => {
      queryClient.invalidateQueries({ queryKey: ['communication-credits'] });
      queryClient.invalidateQueries({ queryKey: ['communication-transactions'] });
    },
  };
};
