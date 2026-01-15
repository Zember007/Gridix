import { useEffect, useMemo, useState } from 'react';
import { supabase } from '@/shared/api/supabase';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/ui/card';
import { Button } from '@/shared/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/shared/ui/select';
import Loader from '@/shared/ui/loader';
import { toast } from 'sonner';

type Project = { id: string; name: string; currency: string | null };
type Apartment = {
  id: string;
  apartment_number: string;
  floor_number: number;
  rooms: string;
  area: number;
  price: number | null;
};

function getBitrixDealIdFromPlacement(): number | null {
  try {
    // If available, placement.info() contains entityId
    const info = (BX24 as any)?.placement?.info?.();
    const entityId = info?.options?.ENTITY_ID ?? info?.options?.entityId ?? info?.options?.ID;
    const n = Number(entityId);
    if (Number.isFinite(n) && n > 0) return n;
  } catch {
    // ignore
  }
  return null;
}

export default function BitrixDealTabPage() {
  const [loading, setLoading] = useState(true);
  const [dealId, setDealId] = useState<number | null>(null);
  const [existingLink, setExistingLink] = useState<any | null>(null);

  const [projects, setProjects] = useState<Project[]>([]);
  const [projectId, setProjectId] = useState<string | null>(null);
  const [apartments, setApartments] = useState<Apartment[]>([]);
  const [apartmentId, setApartmentId] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [bxDomain, setBxDomain] = useState<string | null>(null);
  const [bxMemberId, setBxMemberId] = useState<string | null>(null);

  const selectedProject = useMemo(
    () => projects.find((p) => p.id === projectId) ?? null,
    [projects, projectId]
  );

  useEffect(() => {
    const run = async () => {
      try {
        setLoading(true);
        if (typeof BX24 !== 'undefined') {
          BX24.init(() => {
            try {
              BX24.fitWindow?.();
              const auth = (BX24 as any)?.getAuth?.() ?? null;
              const domain = auth?.domain ?? null;
              const memberId = auth?.member_id ?? auth?.memberId ?? null;
              if (domain) setBxDomain(domain);
              if (memberId) setBxMemberId(memberId);
            } catch {
              // ignore
            }
          });
        }

        const dId = getBitrixDealIdFromPlacement();
        setDealId(dId);

        // Bitrix SSO (Amo-like): auto-login once the app is connected
        const { data: u0 } = await supabase.auth.getUser();
        if (!u0?.user && bxDomain && bxMemberId) {
          const { data: ssoData, error: ssoErr } = await supabase.functions.invoke('bitrix-app', {
            body: { action: 'sso_create', domain: bxDomain, member_id: bxMemberId },
          });
          if (!ssoErr && ssoData?.sso) {
            const { data: sessionData, error: verifyErr } = await supabase.functions.invoke('bitrix-app', {
              body: { action: 'sso_verify', token: ssoData.sso },
            });
            if (!verifyErr && sessionData?.access_token && sessionData?.refresh_token) {
              await supabase.auth.setSession({
                access_token: sessionData.access_token,
                refresh_token: sessionData.refresh_token,
              });
            }
          }
        }

        const { data: projectsData, error: projectsErr } = await supabase.functions.invoke('bitrix-app', {
          body: { action: 'get_projects' },
        });
        if (projectsErr) throw projectsErr;
        setProjects((projectsData?.projects ?? []) as Project[]);

        if (dId) {
          const { data: ctx, error: ctxErr } = await supabase.functions.invoke('bitrix-app', {
            body: { action: 'deal_context', bitrix_deal_id: dId },
          });
          if (ctxErr) throw ctxErr;
          setExistingLink(ctx?.link ?? null);
        }
      } catch (e) {
        console.error(e);
        toast.error('Не удалось загрузить данные вкладки');
      } finally {
        setLoading(false);
      }
    };
    void run();
  }, [bxDomain, bxMemberId]);

  useEffect(() => {
    const run = async () => {
      if (!projectId) {
        setApartments([]);
        setApartmentId(null);
        return;
      }
      try {
        const { data, error } = await supabase.functions.invoke('bitrix-app', {
          body: { action: 'get_apartments', project_id: projectId },
        });
        if (error) throw error;
        setApartments((data?.apartments ?? []) as Apartment[]);
      } catch (e) {
        console.error(e);
        toast.error('Не удалось загрузить квартиры');
      }
    };
    void run();
  }, [projectId]);

  const handleLink = async () => {
    if (!dealId) return toast.error('Не удалось определить ID сделки в Bitrix');
    if (!projectId || !apartmentId) return toast.error('Выберите проект и квартиру');

    try {
      setBusy(true);
      const { data, error } = await supabase.functions.invoke('bitrix-app', {
        body: {
          action: 'link_apartment_to_deal',
          bitrix_deal_id: dealId,
          project_id: projectId,
          apartment_id: apartmentId,
        },
      });
      if (error) throw error;
      toast.success('Квартира привязана к сделке');

      // refresh context
      const { data: ctx } = await supabase.functions.invoke('bitrix-app', {
        body: { action: 'deal_context', bitrix_deal_id: dealId },
      });
      setExistingLink(ctx?.link ?? null);
    } catch (e) {
      console.error(e);
      toast.error('Не удалось привязать квартиру');
    } finally {
      setBusy(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-[240px] bg-white flex items-center justify-center">
        <Loader size="md" className="mx-auto" />
      </div>
    );
  }

  return (
    <div className="bg-white p-3 space-y-3">
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Gridix • Сделка Bitrix</CardTitle>
        </CardHeader>
        <CardContent className="text-sm space-y-2">
          <div>
            Deal ID: <span className="font-mono">{dealId ?? 'не определён'}</span>
          </div>
          {existingLink ? (
            <div className="rounded-md border p-2">
              <div className="font-medium">Уже есть связка</div>
              <div className="text-muted-foreground">
                apartment_id: <span className="font-mono">{existingLink.apartment_id}</span>
              </div>
              <div className="text-muted-foreground">
                project_id: <span className="font-mono">{existingLink.project_id}</span>
              </div>
            </div>
          ) : (
            <div className="text-muted-foreground">Связка не найдена — можно привязать квартиру.</div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Привязать квартиру к сделке</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid gap-2">
            <div className="text-sm">Проект</div>
            <Select value={projectId ?? undefined} onValueChange={(v) => setProjectId(v)}>
              <SelectTrigger>
                <SelectValue placeholder="Выберите проект" />
              </SelectTrigger>
              <SelectContent>
                {projects.map((p) => (
                  <SelectItem key={p.id} value={p.id}>
                    {p.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid gap-2">
            <div className="text-sm">Квартира</div>
            <Select value={apartmentId ?? undefined} onValueChange={(v) => setApartmentId(v)} disabled={!projectId}>
              <SelectTrigger>
                <SelectValue placeholder={projectId ? 'Выберите квартиру' : 'Сначала выберите проект'} />
              </SelectTrigger>
              <SelectContent>
                {apartments.slice(0, 200).map((a) => (
                  <SelectItem key={a.id} value={a.id}>
                    {`№${a.apartment_number} • ${a.rooms} • ${a.area}м² • ${typeof a.price === 'number' ? a.price.toLocaleString('ru-RU') : '—'} ${selectedProject?.currency ?? ''}`}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {apartments.length > 200 && (
              <div className="text-xs text-muted-foreground">Список ограничен первыми 200 квартирами.</div>
            )}
          </div>

          <Button onClick={handleLink} disabled={busy || !dealId || !projectId || !apartmentId} className="w-full">
            {busy ? 'Привязка...' : 'Привязать к сделке'}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}

