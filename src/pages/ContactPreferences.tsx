import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Switch } from '@/components/ui/switch';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useContacts } from '@/hooks/useContacts';
import { useContactPreferences } from '@/hooks/useContactPreferences';
import { Mail, MessageSquare, Phone, Search, ShieldCheck, UserX } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

const channels = [
  { key: 'email', label: 'E-mail', icon: Mail },
  { key: 'whatsapp', label: 'WhatsApp', icon: MessageSquare },
  { key: 'sms', label: 'SMS', icon: Phone },
];

export default function ContactPreferencesPage() {
  const { data: contacts = [] } = useContacts();
  const { preferences, isLoading, toggleOptOut } = useContactPreferences();
  const [search, setSearch] = useState('');

  const filteredContacts = contacts.filter(c =>
    !search || `${c.first_name} ${c.last_name || ''} ${c.email || ''}`.toLowerCase().includes(search.toLowerCase())
  );

  const getOptOutStatus = (contactId: string, channel: string) => {
    return preferences.find(p => p.contact_id === contactId && p.channel === channel)?.opted_out ?? false;
  };

  const optedOutCount = (channel: string) =>
    preferences.filter(p => p.channel === channel && p.opted_out).length;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Preferências de Contato</h1>
        <p className="text-muted-foreground">Gestão centralizada de opt-out e preferências de comunicação</p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {channels.map(ch => {
          const Icon = ch.icon;
          const count = optedOutCount(ch.key);
          return (
            <Card key={ch.key}>
              <CardContent className="flex items-center gap-4 pt-6">
                <div className="p-3 rounded-lg bg-destructive/10">
                  <Icon className="h-6 w-6 text-destructive" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Opt-outs {ch.label}</p>
                  <p className="text-2xl font-bold text-foreground">{count}</p>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <ShieldCheck className="h-5 w-5" /> Gerenciar Opt-outs
              </CardTitle>
              <CardDescription>Controle quais contatos optaram por não receber comunicações</CardDescription>
            </div>
            <div className="relative w-72">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input placeholder="Buscar contato..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9" />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Contato</TableHead>
                <TableHead>E-mail</TableHead>
                {channels.map(ch => (
                  <TableHead key={ch.key} className="text-center">{ch.label}</TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredContacts.slice(0, 50).map(contact => (
                <TableRow key={contact.id}>
                  <TableCell className="font-medium">{contact.first_name} {contact.last_name || ''}</TableCell>
                  <TableCell className="text-muted-foreground">{contact.email || '-'}</TableCell>
                  {channels.map(ch => (
                    <TableCell key={ch.key} className="text-center">
                      <Switch
                        checked={!getOptOutStatus(contact.id, ch.key)}
                        onCheckedChange={(checked) =>
                          toggleOptOut.mutate({ contactId: contact.id, channel: ch.key, optedOut: !checked })
                        }
                      />
                    </TableCell>
                  ))}
                </TableRow>
              ))}
              {filteredContacts.length === 0 && (
                <TableRow>
                  <TableCell colSpan={5} className="text-center text-muted-foreground py-8">
                    Nenhum contato encontrado
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
