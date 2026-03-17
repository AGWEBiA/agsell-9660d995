import { useState } from 'react';
import { GroupRotatorCampaigns } from '@/components/group-rotator/GroupRotatorCampaigns';
import { GroupRotatorEntries } from '@/components/group-rotator/GroupRotatorEntries';

export default function GroupRotator() {
  const [selectedCampaignId, setSelectedCampaignId] = useState<string | null>(null);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Direcionador de Grupos</h1>
        <p className="text-muted-foreground">Direcione automaticamente usuários para os grupos de WhatsApp certos com links inteligentes.</p>
      </div>

      {selectedCampaignId ? (
        <GroupRotatorEntries campaignId={selectedCampaignId} onBack={() => setSelectedCampaignId(null)} />
      ) : (
        <GroupRotatorCampaigns onSelect={setSelectedCampaignId} />
      )}
    </div>
  );
}
