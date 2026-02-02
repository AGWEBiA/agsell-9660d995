import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from '@/components/ui/command';
import { Badge } from '@/components/ui/badge';
import {
  Users,
  Building2,
  DollarSign,
  CheckSquare,
  Settings,
  Mail,
  MessageSquare,
  Zap,
  BarChart3,
  FileText,
  Tag,
  Search,
  Loader2,
} from 'lucide-react';
import { useContacts } from '@/hooks/useContacts';
import { useDeals } from '@/hooks/usePipeline';
import { useTasks } from '@/hooks/useTasks';

const navigationItems = [
  { name: 'Dashboard', href: '/dashboard', icon: BarChart3, keywords: ['home', 'início', 'visão geral'] },
  { name: 'Contatos', href: '/contacts', icon: Users, keywords: ['leads', 'clientes', 'pessoas'] },
  { name: 'Empresas', href: '/companies', icon: Building2, keywords: ['organizações', 'contas'] },
  { name: 'Pipeline', href: '/pipeline', icon: DollarSign, keywords: ['vendas', 'negócios', 'deals', 'funil'] },
  { name: 'Tarefas', href: '/tasks', icon: CheckSquare, keywords: ['atividades', 'to-do', 'pendências'] },
  { name: 'Email', href: '/email', icon: Mail, keywords: ['campanhas', 'marketing'] },
  { name: 'WhatsApp', href: '/whatsapp', icon: MessageSquare, keywords: ['mensagens', 'chat'] },
  { name: 'Automações', href: '/automations', icon: Zap, keywords: ['fluxos', 'workflows'] },
  { name: 'Formulários', href: '/forms', icon: FileText, keywords: ['captura', 'landing'] },
  { name: 'Tags', href: '/tags', icon: Tag, keywords: ['etiquetas', 'categorias'] },
  { name: 'Configurações', href: '/settings', icon: Settings, keywords: ['preferências', 'conta'] },
];

export function GlobalSearch() {
  const [open, setOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const navigate = useNavigate();

  const { data: contacts = [], isLoading: loadingContacts } = useContacts();
  const { data: deals = [], isLoading: loadingDeals } = useDeals();
  const { data: tasks = [], isLoading: loadingTasks } = useTasks();

  // Keyboard shortcut
  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen((open) => !open);
      }
    };

    document.addEventListener('keydown', down);
    return () => document.removeEventListener('keydown', down);
  }, []);

  const handleSelect = useCallback((href: string) => {
    setOpen(false);
    setSearchQuery('');
    navigate(href);
  }, [navigate]);

  // Filter results based on search query
  const filteredNavigation = navigationItems.filter((item) =>
    item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    item.keywords.some((k) => k.includes(searchQuery.toLowerCase()))
  );

  const filteredContacts = contacts
    .filter((contact) =>
      `${contact.first_name} ${contact.last_name}`.toLowerCase().includes(searchQuery.toLowerCase()) ||
      contact.email?.toLowerCase().includes(searchQuery.toLowerCase())
    )
    .slice(0, 5);

  const filteredDeals = deals
    .filter((deal) =>
      deal.title.toLowerCase().includes(searchQuery.toLowerCase())
    )
    .slice(0, 5);

  const filteredTasks = tasks
    .filter((task) =>
      task.title.toLowerCase().includes(searchQuery.toLowerCase())
    )
    .slice(0, 5);

  const isLoading = loadingContacts || loadingDeals || loadingTasks;
  const hasResults = filteredNavigation.length > 0 || filteredContacts.length > 0 || filteredDeals.length > 0 || filteredTasks.length > 0;

  return (
    <CommandDialog open={open} onOpenChange={setOpen}>
      <CommandInput 
        placeholder="Buscar contatos, deals, tarefas..." 
        value={searchQuery}
        onValueChange={setSearchQuery}
      />
      <CommandList>
        {isLoading ? (
          <div className="flex items-center justify-center py-6">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : !hasResults ? (
          <CommandEmpty>
            <div className="flex flex-col items-center py-6">
              <Search className="h-10 w-10 text-muted-foreground mb-2" />
              <p>Nenhum resultado encontrado.</p>
            </div>
          </CommandEmpty>
        ) : (
          <>
            {/* Navigation */}
            {filteredNavigation.length > 0 && (
              <CommandGroup heading="Navegação">
                {filteredNavigation.map((item) => {
                  const Icon = item.icon;
                  return (
                    <CommandItem
                      key={item.href}
                      value={item.name}
                      onSelect={() => handleSelect(item.href)}
                    >
                      <Icon className="mr-2 h-4 w-4" />
                      <span>{item.name}</span>
                    </CommandItem>
                  );
                })}
              </CommandGroup>
            )}

            {/* Contacts */}
            {filteredContacts.length > 0 && (
              <>
                <CommandSeparator />
                <CommandGroup heading="Contatos">
                  {filteredContacts.map((contact) => (
                    <CommandItem
                      key={contact.id}
                      value={`contact-${contact.id}`}
                      onSelect={() => handleSelect(`/contacts?id=${contact.id}`)}
                    >
                      <Users className="mr-2 h-4 w-4" />
                      <span>{contact.first_name} {contact.last_name}</span>
                      {contact.email && (
                        <span className="ml-2 text-xs text-muted-foreground">{contact.email}</span>
                      )}
                      {contact.lead_score && contact.lead_score >= 80 && (
                        <Badge variant="default" className="ml-auto">Hot</Badge>
                      )}
                    </CommandItem>
                  ))}
                </CommandGroup>
              </>
            )}

            {/* Deals */}
            {filteredDeals.length > 0 && (
              <>
                <CommandSeparator />
                <CommandGroup heading="Negócios">
                  {filteredDeals.map((deal) => (
                    <CommandItem
                      key={deal.id}
                      value={`deal-${deal.id}`}
                      onSelect={() => handleSelect(`/pipeline?deal=${deal.id}`)}
                    >
                      <DollarSign className="mr-2 h-4 w-4" />
                      <span>{deal.title}</span>
                      {deal.value && (
                        <span className="ml-2 text-xs text-muted-foreground">
                          R$ {deal.value.toLocaleString('pt-BR')}
                        </span>
                      )}
                    </CommandItem>
                  ))}
                </CommandGroup>
              </>
            )}

            {/* Tasks */}
            {filteredTasks.length > 0 && (
              <>
                <CommandSeparator />
                <CommandGroup heading="Tarefas">
                  {filteredTasks.map((task) => (
                    <CommandItem
                      key={task.id}
                      value={`task-${task.id}`}
                      onSelect={() => handleSelect(`/tasks?id=${task.id}`)}
                    >
                      <CheckSquare className="mr-2 h-4 w-4" />
                      <span>{task.title}</span>
                      <Badge 
                        variant={task.status === 'completed' ? 'default' : 'secondary'}
                        className="ml-auto"
                      >
                        {task.status === 'completed' ? 'Concluída' : 'Pendente'}
                      </Badge>
                    </CommandItem>
                  ))}
                </CommandGroup>
              </>
            )}
          </>
        )}
      </CommandList>
    </CommandDialog>
  );
}
