import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useOrganization } from '@/contexts/OrganizationContext';
import { usePlans } from '@/hooks/usePlans';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Building2, ArrowLeftRight } from 'lucide-react';
import { toast } from 'sonner';

export function AgencyAccountSelector() {
  const { currentOrganization, organizations, setCurrentOrganization } = useOrganization();
  const { currentPlan } = usePlans();
  const isAgencyPlan = currentPlan?.features?.includes('agency_management') ?? false;

  // Get the agency's own org (the one with agency_management feature)
  const agencyOrg = organizations.find(o => o.id === currentOrganization?.id);

  // Fetch active agency clients
  const { data: agencyClients } = useQuery({
    queryKey: ['agency-client-orgs', currentOrganization?.id],
    queryFn: async () => {
      if (!currentOrganization?.id) return [];
      const { data, error } = await supabase
        .from('agency_clients')
        .select(`
          id,
          client_org_id,
          access_level,
          client_org:organizations!agency_clients_client_org_id_fkey(id, name, slug, logo_url)
        `)
        .eq('agency_org_id', currentOrganization.id)
        .eq('status', 'active');
      if (error) throw error;
      return data || [];
    },
    enabled: !!currentOrganization?.id && isAgencyPlan,
  });

  if (!isAgencyPlan || !agencyClients?.length) return null;

  const isViewingClient = agencyClients.some(
    (c: any) => c.client_org_id === currentOrganization?.id
  );

  const handleSwitch = async (value: string) => {
    if (value === 'agency-home') {
      // Switch back to agency's own org
      const agencyHome = organizations.find(o => {
        // find the org that is the agency itself
        return agencyClients.some((c: any) => c.client_org_id !== o.id);
      }) || organizations[0];
      
      if (agencyHome) {
        setCurrentOrganization(agencyHome);
        toast.success('Voltando para sua conta de agência');
      }
      return;
    }

    const client = agencyClients.find((c: any) => c.client_org_id === value);
    if (client?.client_org) {
      setCurrentOrganization(client.client_org as any);
      toast.success(`Acessando: ${(client.client_org as any).name}`);
    }
  };

  return (
    <div className="flex items-center gap-2">
      <ArrowLeftRight className="h-4 w-4 text-muted-foreground" />
      <Select
        value={currentOrganization?.id || ''}
        onValueChange={handleSwitch}
      >
        <SelectTrigger className="w-48 h-8 text-xs">
          <Building2 className="h-3.5 w-3.5 mr-1" />
          <SelectValue placeholder="Selecionar conta" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="agency-home">
            <div className="flex items-center gap-2">
              <span className="font-medium">🏠 Minha Agência</span>
            </div>
          </SelectItem>
          {agencyClients.map((client: any) => (
            <SelectItem key={client.client_org_id} value={client.client_org_id}>
              <div className="flex items-center gap-2">
                <span>{client.client_org?.name || 'Cliente'}</span>
                <Badge variant="outline" className="text-[10px] px-1">
                  {client.access_level === 'owner' ? 'Total' : 
                   client.access_level === 'operational' ? 'Operacional' : 'Viewer'}
                </Badge>
              </div>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
