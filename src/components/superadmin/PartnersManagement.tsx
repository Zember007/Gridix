import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Badge } from '../ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '../ui/dialog';
import { Label } from '../ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../ui/table';
import { Handshake, Search, Filter, UserCheck, UserX, DollarSign } from 'lucide-react';
import { useToast } from '../../hooks/use-toast';
import { supabase } from '../../integrations/supabase/client';

interface PartnerWithUser {
  id: string;
  user_id: string;
  partner_code: string;
  total_earned: number;
  total_withdrawn: number;
  status: 'active' | 'suspended' | 'inactive';
  created_at: string;
  updated_at: string;
  user_profiles: {
    id: string;
    full_name: string;
    email: string;
  };
}

export function PartnersManagement() {
  const { toast } = useToast();
  const [partners, setPartners] = useState<PartnerWithUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'suspended' | 'inactive'>('all');
  const [selectedPartner, setSelectedPartner] = useState<PartnerWithUser | null>(null);
  const [isActionDialogOpen, setIsActionDialogOpen] = useState(false);
  const [action, setAction] = useState<'suspend' | 'activate' | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  const fetchPartners = async () => {
    try {
      setLoading(true);

      const { data, error: functionError } = await supabase.functions.invoke('partner-program', {
        body: {
          action: 'admin_manage',
          admin_action: 'list'
        }
      });

      if (functionError) {
        throw new Error(functionError.message);
      }

      if (data.error) {
        throw new Error(data.error);
      }

      setPartners(data.partners || []);
    } catch (error) {
      console.error('Error fetching partners:', error);
      toast({
        title: "Ошибка",
        description: "Не удалось загрузить список партнёров",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPartners();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handlePartnerAction = async (partnerId: string, action: 'suspend' | 'activate') => {
    try {
      setIsProcessing(true);

      const { data, error: functionError } = await supabase.functions.invoke('partner-program', {
        body: {
          action: 'admin_manage',
          admin_action: action,
          partner_id: partnerId
        }
      });

      if (functionError) {
        throw new Error(functionError.message);
      }

      if (data.error) {
        throw new Error(data.error);
      }

      toast({
        title: "Успешно",
        description: `Партнёр ${action === 'suspend' ? 'приостановлен' : 'активирован'}`,
      });

      // Обновляем список
      await fetchPartners();
      setIsActionDialogOpen(false);
      setSelectedPartner(null);
    } catch (error) {
      console.error('Error updating partner:', error);
      toast({
        title: "Ошибка",
        description: error instanceof Error ? error.message : "Не удалось обновить статус партнёра",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const openActionDialog = (partner: PartnerWithUser, action: 'suspend' | 'activate') => {
    setSelectedPartner(partner);
    setAction(action);
    setIsActionDialogOpen(true);
  };

  const filteredPartners = partners.filter(partner => {
    const matchesSearch =
      partner.user_profiles.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      partner.user_profiles.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      partner.partner_code.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesFilter = statusFilter === 'all' || partner.status === statusFilter;

    return matchesSearch && matchesFilter;
  });

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="h-8 bg-gray-200 rounded w-1/4 animate-pulse"></div>
        <div className="space-y-3">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="h-16 bg-gray-200 rounded animate-pulse"></div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Управление партнёрами</h2>
          <p className="text-muted-foreground">
            Управляйте партнёрской программой и статусами партнёров
          </p>
        </div>
      </div>

      {/* Статистика */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Всего партнёров</CardTitle>
            <Handshake className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{partners.length}</div>
            <p className="text-xs text-muted-foreground">
              {partners.filter(p => p.status === 'active').length} активных
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Общий доход</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              ${partners.reduce((sum, p) => sum + p.total_earned, 0).toFixed(2)}
            </div>
            <p className="text-xs text-muted-foreground">
              Заработано партнёрами
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Выплачено</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              ${partners.reduce((sum, p) => sum + p.total_withdrawn, 0).toFixed(2)}
            </div>
            <p className="text-xs text-muted-foreground">
              Выведено партнёрами
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Приостановлено</CardTitle>
            <UserX className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {partners.filter(p => p.status === 'suspended').length}
            </div>
            <p className="text-xs text-muted-foreground">
              Неактивных партнёров
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Фильтры */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-4 w-4" />
            Фильтры
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="search">Поиск</Label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="search"
                  placeholder="Поиск по имени, email или коду..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="status">Статус</Label>
              <Select value={statusFilter} onValueChange={(value: 'all' | 'active' | 'suspended' | 'inactive') => setStatusFilter(value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Все статусы</SelectItem>
                  <SelectItem value="active">Активные</SelectItem>
                  <SelectItem value="suspended">Приостановленные</SelectItem>
                  <SelectItem value="inactive">Неактивные</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Таблица партнёров */}
      <Card>
        <CardHeader>
          <CardTitle>Партнёры</CardTitle>
          <CardDescription>
            {filteredPartners.length} из {partners.length} партнёров
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Партнёр</TableHead>
                <TableHead>Код</TableHead>
                <TableHead>Статус</TableHead>
                <TableHead>Заработано</TableHead>
                <TableHead>Выведено</TableHead>
                <TableHead>Дата регистрации</TableHead>
                <TableHead>Действия</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredPartners.map((partner) => (
                <TableRow key={partner.id}>
                  <TableCell>
                    <div>
                      <p className="font-medium">
                        {partner.user_profiles.full_name}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {partner.user_profiles.email}
                      </p>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className="font-mono">
                      {partner.partner_code}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant={
                        partner.status === 'active' ? 'default' :
                          partner.status === 'suspended' ? 'destructive' :
                            'secondary'
                      }
                    >
                      {partner.status === 'active' ? 'Активный' :
                        partner.status === 'suspended' ? 'Приостановлен' :
                          'Неактивный'}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <span className="font-medium text-green-600">
                      ${partner.total_earned.toFixed(2)}
                    </span>
                  </TableCell>
                  <TableCell>
                    <span className="font-medium">
                      ${partner.total_withdrawn.toFixed(2)}
                    </span>
                  </TableCell>
                  <TableCell>
                    {new Date(partner.created_at).toLocaleDateString()}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      {partner.status === 'active' ? (
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => openActionDialog(partner, 'suspend')}
                        >
                          <UserX className="h-4 w-4 mr-1" />
                          Приостановить
                        </Button>
                      ) : (
                        <Button
                          size="sm"
                          variant="default"
                          onClick={() => openActionDialog(partner, 'activate')}
                        >
                          <UserCheck className="h-4 w-4 mr-1" />
                          Активировать
                        </Button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Диалог подтверждения действия */}
      <Dialog open={isActionDialogOpen} onOpenChange={setIsActionDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {action === 'suspend' ? 'Приостановить партнёра' : 'Активировать партнёра'}
            </DialogTitle>
            <DialogDescription>
              {action === 'suspend'
                ? 'Вы уверены, что хотите приостановить этого партнёра? Он не сможет получать новые комиссии.'
                : 'Вы уверены, что хотите активировать этого партнёра? Он снова сможет получать комиссии.'
              }
            </DialogDescription>
          </DialogHeader>
          {selectedPartner && (
            <div className="space-y-4">
              <div className="p-4 bg-muted rounded-lg">
                <p className="font-medium">
                  {selectedPartner.user_profiles.full_name}
                </p>
                <p className="text-sm text-muted-foreground">
                  {selectedPartner.user_profiles.email}
                </p>
                <p className="text-sm text-muted-foreground">
                  Код: {selectedPartner.partner_code}
                </p>
              </div>

              <div className="flex justify-end gap-2">
                <Button
                  variant="outline"
                  onClick={() => setIsActionDialogOpen(false)}
                >
                  Отмена
                </Button>
                <Button
                  variant={action === 'suspend' ? 'destructive' : 'default'}
                  onClick={() => selectedPartner && handlePartnerAction(selectedPartner.id, action!)}
                  disabled={isProcessing}
                >
                  {isProcessing ? "Обработка..." :
                    action === 'suspend' ? "Приостановить" : "Активировать"}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
