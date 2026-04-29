import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Users, Merge } from 'lucide-react';
import { useDuplicateContacts, useMergeContacts } from '@/hooks/useCRMIntelligence';

export function DuplicatesPanel() {
  const { data: dups = [], isLoading, refetch } = useDuplicateContacts();
  const merge = useMergeContacts();

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span className="flex items-center gap-2"><Users className="h-5 w-5" /> Contatos Duplicados ({dups.length})</span>
          <Button variant="outline" size="sm" onClick={() => refetch()}>Recarregar</Button>
        </CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <p className="text-sm text-muted-foreground">Buscando...</p>
        ) : dups.length === 0 ? (
          <p className="text-sm text-muted-foreground">Nenhuma duplicata encontrada. ✓</p>
        ) : (
          <div className="space-y-3">
            {dups.map((g, idx) => (
              <div key={`${g.match_type}-${g.key_value}-${idx}`} className="p-3 border rounded-md">
                <div className="flex items-center gap-2 mb-2">
                  <Badge variant={g.match_type === 'email' ? 'default' : 'secondary'}>{g.match_type}</Badge>
                  <span className="font-mono text-sm">{g.key_value}</span>
                  <Badge variant="outline">{g.contact_ids.length} contatos</Badge>
                </div>
                <div className="space-y-1.5">
                  {g.contact_ids.map((cid, i) => (
                    <div key={cid} className="flex items-center justify-between text-sm bg-muted/30 px-2 py-1.5 rounded">
                      <div>
                        <span className="font-medium">{g.names[i] || '—'}</span>
                        <span className="text-xs text-muted-foreground ml-2">{cid.slice(0, 8)}</span>
                        {i === 0 && <Badge variant="outline" className="ml-2 text-xs">Mais antigo</Badge>}
                      </div>
                      {i > 0 && (
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => merge.mutate({ keepId: g.contact_ids[0], removeId: cid })}
                          disabled={merge.isPending}
                        >
                          <Merge className="h-3.5 w-3.5 mr-1" /> Mesclar com primeiro
                        </Button>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
