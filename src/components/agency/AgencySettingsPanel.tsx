import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Building2, Shield, UserCheck, UserX, Crown, Eye, Wrench } from 'lucide-react';
import { useAgencyClients } from '@/hooks/useAgencyClients';
import { Separator } from '@/components/ui/separator';

const accessOptions = [
  { value: 'owner', label: 'Total (Owner)', icon: Crown, description: 'Acesso completo incluindo configurações e billing' },
  { value: 'operational', label: 'Operacional', icon: Wrench, description: 'Gerencia contatos, deals, campanhas, inbox' },
  { value: 'viewer', label: 'Visualização', icon: Eye, description: 'Apenas visualizar dados e relatórios' },
];

export function AgencySettingsPanel() {
  const { agencies, acceptAgencyLink, revokeAgencyLink, updateAccessLevel } = useAgencyClients();

  if (agencies.length === 0) return null;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Shield className="h-5 w-5" />
          Agências Vinculadas
        </CardTitle>
        <CardDescription>
          Gerencie quais agências podem acessar sua conta e defina o nível de permissão.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {agencies.map((agency: any) => (
          <div key={agency.id} className="flex items-center justify-between p-4 rounded-lg border">
            <div className="flex items-center gap-3">
              <Avatar>
                <AvatarFallback className="bg-primary/10 text-primary">
                  {agency.agency_org?.name?.[0]?.toUpperCase() || 'A'}
                </AvatarFallback>
              </Avatar>
              <div>
                <p className="font-medium">{agency.agency_org?.name || 'Agência'}</p>
                <div className="flex items-center gap-2 mt-1">
                  <Badge variant={agency.status === 'active' ? 'default' : agency.status === 'pending' ? 'secondary' : 'destructive'}>
                    {agency.status === 'active' ? 'Ativo' : agency.status === 'pending' ? 'Pendente' : 'Revogado'}
                  </Badge>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-3">
              {agency.status === 'active' && (
                <Select
                  value={agency.access_level}
                  onValueChange={(value) => updateAccessLevel.mutate({ linkId: agency.id, accessLevel: value })}
                >
                  <SelectTrigger className="w-44 h-8 text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {accessOptions.map(opt => (
                      <SelectItem key={opt.value} value={opt.value}>
                        <div className="flex flex-col">
                          <span>{opt.label}</span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
              {agency.status === 'pending' && (
                <Button size="sm" onClick={() => acceptAgencyLink.mutate(agency.id)}>
                  <UserCheck className="h-4 w-4 mr-1" />
                  Aceitar
                </Button>
              )}
              {agency.status !== 'revoked' && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-destructive"
                  onClick={() => revokeAgencyLink.mutate(agency.id)}
                >
                  <UserX className="h-4 w-4" />
                </Button>
              )}
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
