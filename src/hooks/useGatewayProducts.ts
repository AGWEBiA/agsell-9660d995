import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useOrganization } from '@/contexts/OrganizationContext';

export interface GatewayProduct {
  id: string;
  organization_id: string;
  gateway: string;
  external_product_id: string | null;
  product_name: string;
  price: number | null;
  currency: string | null;
  last_seen_at: string | null;
  created_at: string;
}

export function useGatewayProducts(gateway?: string) {
  const { currentOrganization } = useOrganization();

  return useQuery({
    queryKey: ['gateway-products', currentOrganization?.id, gateway],
    queryFn: async () => {
      if (!currentOrganization) return [];

      let query = supabase
        .from('gateway_products')
        .select('*')
        .eq('organization_id', currentOrganization.id)
        .order('product_name');

      if (gateway && gateway !== 'any') {
        query = query.eq('gateway', gateway);
      }

      const { data, error } = await query;
      if (error) throw error;
      return (data || []) as GatewayProduct[];
    },
    enabled: !!currentOrganization,
  });
}
