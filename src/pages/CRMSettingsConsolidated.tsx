import React, { useState } from 'react';
import { cn } from '@/lib/utils';
import SalesRoutingTab from './SalesRoutingTab';
import TagsTab from './TagsTab';
import ContactPreferencesTab from './ContactPreferencesTab';

export default function CRMSettingsConsolidated() {
  const [activeTab, setActiveTab] = useState<'routing' | 'tags' | 'preferences'>('routing');

  const tabs = [
    { id: 'routing', label: 'Sales Routing' },
    { id: 'tags', label: 'Tags' },
    { id: 'preferences', label: 'Preferências' },
  ];

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="border-b border-border">
        <nav className="-mb-px flex space-x-8" aria-label="Tabs">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={cn(
                'whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm transition-colors',
                activeTab === tab.id
                  ? 'border-[#c0392b] text-[#c0392b]'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              )}
            >
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      <div className="mt-6">
        {activeTab === 'routing' && <SalesRoutingTab />}
        {activeTab === 'tags' && <TagsTab />}
        {activeTab === 'preferences' && <ContactPreferencesTab />}
      </div>
    </div>
  );
}
