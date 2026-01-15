import { useEffect, useMemo, useState } from 'react';
import { supabase } from '@/shared/api/supabase';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/ui/card';
import { Button } from '@/shared/ui/button';
import Loader from '@/shared/ui/loader';
import { toast } from 'sonner';

type Project = {
  id: string;
  name: string;
  description: string | null;
  address: string | null;
  building_image_url: string | null;
  currency: string | null;
  slug: string | null;
};

type Apartment = {
  id: string;
  apartment_number: string;
  floor_number: number;
  rooms: string;
  area: number;
  price: number | null;
  status: string;
  type: string | null;
};

export default function BitrixProjectsPage() {
  const [loading, setLoading] = useState(true);
  const [projects, setProjects] = useState<Project[]>([]);
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);
  const [apartments, setApartments] = useState<Apartment[]>([]);
  const [apartmentsLoading, setApartmentsLoading] = useState(false);

  const selectedProject = useMemo(
    () => projects.find((p) => p.id === selectedProjectId) ?? null,
    [projects, selectedProjectId]
  );

  useEffect(() => {
    const run = async () => {
      try {
        setLoading(true);
        if (typeof BX24 !== 'undefined') {
          BX24.init(() => {
            try {
              BX24.fitWindow?.();
            } catch {
              // ignore
            }
          });
        }

        const { data, error } = await supabase.functions.invoke('bitrix-app', {
          body: { action: 'get_projects' },
        });
        if (error) throw error;
        setProjects((data?.projects ?? []) as Project[]);
      } catch (e) {
        console.error(e);
        toast.error('Не удалось загрузить проекты');
      } finally {
        setLoading(false);
      }
    };
    void run();
  }, []);

  useEffect(() => {
    const run = async () => {
      if (!selectedProjectId) {
        setApartments([]);
        return;
      }
      try {
        setApartmentsLoading(true);
        const { data, error } = await supabase.functions.invoke('bitrix-app', {
          body: { action: 'get_apartments', project_id: selectedProjectId },
        });
        if (error) throw error;
        setApartments((data?.apartments ?? []) as Apartment[]);
      } catch (e) {
        console.error(e);
        toast.error('Не удалось загрузить квартиры');
      } finally {
        setApartmentsLoading(false);
      }
    };
    void run();
  }, [selectedProjectId]);

  const handleCreateDeal = async (apartmentId: string) => {
    if (!selectedProjectId) return;
    try {
      const { data, error } = await supabase.functions.invoke('bitrix-app', {
        body: { action: 'create_deal_from_apartment', project_id: selectedProjectId, apartment_id: apartmentId },
      });
      if (error) throw error;

      const dealId = data?.bitrix_deal_id;
      toast.success(dealId ? `Сделка создана (#${dealId})` : 'Сделка создана');
    } catch (e) {
      console.error(e);
      toast.error('Не удалось создать сделку в Bitrix');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <Loader size="lg" className="mx-auto" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white p-4 space-y-4">
      <div className="flex items-center justify-between gap-4">
        <h1 className="text-xl font-semibold">Проекты (Gridix)</h1>
        <Button variant="outline" size="sm" onClick={() => window.location.reload()}>
          Обновить
        </Button>
      </div>

      {projects.length === 0 ? (
        <Card>
          <CardContent className="p-4 text-sm text-muted-foreground">
            Нет проектов. Войдите в Gridix под аккаунтом застройщика и создайте проект.
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {projects.map((p) => (
            <Card
              key={p.id}
              className={p.id === selectedProjectId ? 'ring-2 ring-black' : undefined}
            >
              <CardHeader className="pb-2">
                <CardTitle className="text-base">{p.name}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {p.address && <div className="text-sm text-muted-foreground">{p.address}</div>}
                <Button
                  size="sm"
                  className="w-full"
                  onClick={() => setSelectedProjectId((cur) => (cur === p.id ? null : p.id))}
                >
                  {p.id === selectedProjectId ? 'Скрыть квартиры' : 'Показать квартиры'}
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {selectedProject && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Квартиры проекта: {selectedProject.name}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {apartmentsLoading ? (
              <div className="py-6">
                <Loader size="md" className="mx-auto" />
              </div>
            ) : apartments.length === 0 ? (
              <div className="text-sm text-muted-foreground">Квартир не найдено.</div>
            ) : (
              <div className="space-y-2">
                {apartments.slice(0, 50).map((a) => (
                  <div key={a.id} className="border rounded-md p-3 flex items-center justify-between gap-4">
                    <div className="min-w-0">
                      <div className="font-medium truncate">
                        Квартира {a.apartment_number} • {a.rooms} • {a.area} м² • этаж {a.floor_number}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        Цена: {typeof a.price === 'number' ? a.price.toLocaleString('ru-RU') : '—'}{' '}
                        {selectedProject.currency ?? ''}
                      </div>
                    </div>
                    <Button size="sm" onClick={() => handleCreateDeal(a.id)}>
                      Создать сделку
                    </Button>
                  </div>
                ))}
                {apartments.length > 50 && (
                  <div className="text-xs text-muted-foreground">
                    Показаны первые 50 квартир (для производительности в iframe).
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}

