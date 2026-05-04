import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Sparkles, AlertTriangle, Layers, ListFilter, Users, Target, Building2 } from 'lucide-react';
import { RottingDealsPanel } from '@/components/crm/RottingDealsPanel';
import { CustomFieldsManager } from '@/components/crm/CustomFieldsManager';
import { DuplicatesPanel } from '@/components/crm/DuplicatesPanel';
import { ForecastPanel } from '@/components/crm/ForecastPanel';
import { SmartListsPanel } from '@/components/crm/SmartListsPanel';
import { CompanyHierarchyPanel } from '@/components/crm/CompanyHierarchyPanel';

export default function CRMIntelligence() {
  return (
    <div className="space-y-6">

      <Tabs defaultValue="rotting" className="w-full">
        <TabsList className="w-full justify-start overflow-x-auto">
          <TabsTrigger value="rotting"><AlertTriangle className="h-4 w-4 mr-2" /> Pipeline Inteligente</TabsTrigger>
          <TabsTrigger value="forecast"><Target className="h-4 w-4 mr-2" /> Forecast & Metas</TabsTrigger>
          <TabsTrigger value="custom"><Layers className="h-4 w-4 mr-2" /> Campos Custom</TabsTrigger>
          <TabsTrigger value="smart"><ListFilter className="h-4 w-4 mr-2" /> Smart Lists</TabsTrigger>
          <TabsTrigger value="dupes"><Users className="h-4 w-4 mr-2" /> Duplicatas</TabsTrigger>
          <TabsTrigger value="hierarchy"><Building2 className="h-4 w-4 mr-2" /> Hierarquia</TabsTrigger>
        </TabsList>

        <TabsContent value="rotting" className="mt-4"><RottingDealsPanel /></TabsContent>
        <TabsContent value="forecast" className="mt-4"><ForecastPanel /></TabsContent>
        <TabsContent value="custom" className="mt-4"><CustomFieldsManager /></TabsContent>
        <TabsContent value="smart" className="mt-4"><SmartListsPanel /></TabsContent>
        <TabsContent value="dupes" className="mt-4"><DuplicatesPanel /></TabsContent>
        <TabsContent value="hierarchy" className="mt-4"><CompanyHierarchyPanel /></TabsContent>
      </Tabs>
    </div>
  );
}
