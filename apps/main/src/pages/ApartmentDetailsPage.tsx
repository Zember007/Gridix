import { useLocation, useNavigate, useParams } from "react-router-dom";
import { useLanguage } from "@/contexts/LanguageContext";
import type { Project } from "@/entities/project/queries/useProjects";
import { useProjectCRUD } from "@/entities/project/queries/useProjects";
import { formatPriceWithCurrency, convertPrice } from "@gridix/utils/lib";
import { CurrencyToggle } from "@/shared/ui/currency-toggle";
import { Language } from "@gridix/utils/lib";
import { Badge } from "@gridix/ui";
import { Button } from "@gridix/ui";
import { Loader } from "@gridix/ui";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@gridix/ui";
import {
  ArrowLeft,
  Calculator,
  FileDown,
  Home,
  Square,
  Share2,
  Heart,
  Loader2,
} from "lucide-react";
import { toast } from "sonner";
import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { useAsyncAction } from "@/shared/hooks/useAsyncAction";
import { generateApartmentPdf } from "@/features/apartment/lib/generateApartmentPdf";
import { supabase } from "@gridix/utils/api";
import { fetchCurrentSession } from "@gridix/utils";
import {
  Apartment,
  normalizeApartmentData,
} from "@/entities/apartment/model/types";
import { loadApartmentDetails } from "@/features/projectSelector/api/projectSelectorApi";
import { normalizeSubProjectKind } from "@/components/project-selector/lib/subProjectDisplay";
import type { FieldSetting } from "@/hooks/useFields";
import { getApartmentFieldVisibility } from "@/shared/lib/fieldVisibility";
import RecommendedApartmentCard from "@/pages/components/RecommendedApartmentCard";
import ApartmentPhotosViewer from "@/entities/apartment/ui/ApartmentPhotosViewer";
import ApartmentReservationForm from "@/features/apartment-reservation/ui/ApartmentReservationForm";
import InstallmentCalculator from "@/components/InstallmentCalculator";
import { useInstallment } from "@/hooks/useInstallment";
import { useFavorites } from "@/hooks/useFavorites";
import { useExchangeRatesEpoch } from "@/app/providers";

interface ApartmentDetailsPageProps {
  useId?: boolean;
  apartmentIdProp?: string;
  projectIdProp?: string;
  onClose?: () => void;
}

const ApartmentDetailsPage = ({
  useId = false,
  apartmentIdProp = "",
  projectIdProp = "",
  onClose,
}: ApartmentDetailsPageProps) => {
  useExchangeRatesEpoch();
  const location = useLocation();
  const navigate = useNavigate();
  const {
    projectId,
    projectSlug,
    apartmentId,
    apartmentNumber,
    lang,
    subSlug,
  } = useParams<{
    projectId?: string;
    projectSlug?: string;
    apartmentId?: string;
    apartmentNumber?: string;
    lang?: string;
    subSlug?: string;
  }>();

  const [overrideApartmentId, setOverrideApartmentId] = useState<string | null>(
    null,
  );

  const projectIdentifier = useId
    ? projectIdProp
    : projectSlug || projectId || projectIdProp;
  const apartmentIdentifier =
    overrideApartmentId ||
    (useId ? apartmentIdProp : apartmentNumber || apartmentId);
  const effectiveUseId = overrideApartmentId ? true : useId;

  const { t, language } = useLanguage();
  const { incrementViewCount } = useProjectCRUD();
  const { isFavorite, toggleFavorite } = useFavorites();

  const [project, setProject] = useState<Project | null>(null);
  const [apartment, setApartment] = useState<Apartment | null>(null);
  const [fieldSettings, setFieldSettings] = useState<FieldSetting[]>([]);
  const [dataLoading, setDataLoading] = useState(true);
  const [dataError, setDataError] = useState<string | null>(null);
  const [recommendedApartments, setRecommendedApartments] = useState<
    Apartment[]
  >([]);
  const [recommendationThumbnails, setRecommendationThumbnails] = useState<
    Record<string, string | null>
  >({});

  const [isReserveDialogOpen, setIsReserveDialogOpen] = useState(false);
  const [isCalculatorDialogOpen, setIsCalculatorDialogOpen] = useState(false);
  const [bitrixBusy, setBitrixBusy] = useState(false);
  const [isBitrixDealPickerOpen, setIsBitrixDealPickerOpen] = useState(false);
  const [bitrixDealsLoading, setBitrixDealsLoading] = useState(false);
  const [bitrixDeals, setBitrixDeals] = useState<
    Array<{ id: number; title: string; stage_id?: string | null }>
  >([]);
  const [bitrixDealsQuery, setBitrixDealsQuery] = useState("");
  const [selectedCurrency, setSelectedCurrency] = useState<string>("RUB");
  const trackedApartmentViewsRef = useRef<Set<string>>(new Set());
  const trackedProjectViewsRef = useRef<Set<string>>(new Set());

  const { calculateMonthlyPayment } = useInstallment(
    project?.installment_enabled && project
      ? {
          ...project,
          installment_enabled: project.installment_enabled,
          min_down_payment_percent: project.min_down_payment_percent || 20,
          max_installment_months: project.max_installment_months || 24,
        }
      : undefined,
  );

  const bitrixContext = useMemo(() => {
    const sp = new URLSearchParams(location.search);
    const crm = sp.get("crm");
    const dealIdRaw = sp.get("deal_id");
    const dealIdNum = dealIdRaw ? Number(dealIdRaw) : NaN;
    return {
      isBitrix: crm === "bitrix",
      dealId: Number.isFinite(dealIdNum) && dealIdNum > 0 ? dealIdNum : null,
    };
  }, [location.search]);

  const [bitrixDealId, setBitrixDealId] = useState<number | null>(
    bitrixContext.dealId,
  );

  useEffect(() => {
    setBitrixDealId(bitrixContext.dealId);
  }, [bitrixContext.dealId]);

  const patchSearchParams = useCallback(
    (patch: Record<string, string | null>) => {
      const url = new URL(window.location.href);
      for (const [k, v] of Object.entries(patch)) {
        if (v === null || v === undefined || v === "")
          url.searchParams.delete(k);
        else url.searchParams.set(k, v);
      }
      navigate({ search: url.search }, { replace: true });
    },
    [navigate],
  );

  const selectBitrixDealId = async (): Promise<number> => {
    if (typeof BX24 === "undefined") throw new Error("BX24 недоступен");
    const bx = BX24 as unknown as {
      selectCRM?: (
        opts: { entityType: string | string[]; multiple?: boolean },
        cb: (res: unknown) => void,
      ) => void;
    };
    const fn = bx.selectCRM;
    if (typeof fn !== "function") throw new Error("BX24.selectCRM недоступен");

    return await new Promise<number>((resolve, reject) => {
      const timeout = setTimeout(
        () => reject(new Error("Bitrix: таймаут выбора сделки")),
        15000,
      );
      try {
        // Some portals expect entityType as array, some accept string.
        const opts: { entityType: string | string[]; multiple?: boolean } = {
          entityType: ["deal", "DEAL"],
          multiple: false,
        };
        fn(opts, (res: unknown) => {
          clearTimeout(timeout);
          const first = Array.isArray(res)
            ? res[0]
            : typeof res === "object" &&
                res !== null &&
                "0" in (res as Record<string, unknown>)
              ? (res as Record<string, unknown>)["0"]
              : res;
          const obj = first as { id?: unknown; ID?: unknown } | unknown;
          const id = Number(
            (obj as { id?: unknown })?.id ??
              (obj as { ID?: unknown })?.ID ??
              obj,
          );
          if (Number.isFinite(id) && id > 0) return resolve(id);
          return reject(new Error("Сделка не выбрана"));
        });
      } catch (e) {
        clearTimeout(timeout);
        reject(
          e instanceof Error ? e : new Error("Не удалось открыть выбор сделки"),
        );
      }
    });
  };

  const ensureGridixAuth = useCallback(async () => {
    const { user } = await fetchCurrentSession();
    if (!user)
      throw new Error("Нужно подключить Bitrix к аккаунту Gridix (SSO)");
    return user;
  }, []);

  const loadBitrixUnlinkedDeals = useCallback(async () => {
    if (!apartment) return;
    try {
      setBitrixDealsLoading(true);
      await ensureGridixAuth();
      const { data, error } = await supabase.functions.invoke("bitrix-app", {
        body: {
          action: "bitrix_list_unlinked_deals",
          project_id: apartment.project_id,
          limit: 50,
        },
      });
      if (error) throw error;
      const deals = ((data as any)?.deals ?? []) as Array<any>;
      const normalized = Array.isArray(deals)
        ? deals
            .map((d) => ({
              id: Number(d?.id),
              title: String(d?.title ?? ""),
              stage_id: d?.stage_id ? String(d.stage_id) : null,
            }))
            .filter(
              (d) =>
                Number.isFinite(d.id) && d.id > 0 && d.title.trim().length > 0,
            )
        : [];
      setBitrixDeals(normalized);
    } catch (e) {
      console.error(e);
      toast.error(
        e instanceof Error ? e.message : "Не удалось загрузить сделки Bitrix",
      );
    } finally {
      setBitrixDealsLoading(false);
    }
  }, [apartment, ensureGridixAuth]);

  const bitrixCreateDeal = async () => {
    if (!apartment || !project) return;
    try {
      setBitrixBusy(true);
      await ensureGridixAuth();

      const { data, error } = await supabase.functions.invoke("bitrix-app", {
        body: {
          action: "create_deal_from_apartment",
          project_id: apartment.project_id,
          apartment_id: apartment.id,
        },
      });
      if (error) throw error;

      const createdDealId = Number(
        (data as { bitrix_deal_id?: unknown } | null)?.bitrix_deal_id,
      );
      if (Number.isFinite(createdDealId) && createdDealId > 0) {
        setBitrixDealId(createdDealId);
        patchSearchParams({ crm: "bitrix", deal_id: String(createdDealId) });
      }

      toast.success(
        createdDealId ? `Сделка создана (#${createdDealId})` : "Сделка создана",
      );
    } catch (e) {
      console.error(e);
      toast.error(
        e instanceof Error ? e.message : "Не удалось создать сделку в Bitrix",
      );
    } finally {
      setBitrixBusy(false);
    }
  };

  const linkApartmentToBitrixDeal = useCallback(
    async (dealId: number) => {
      if (!apartment || !project) return;
      try {
        setBitrixBusy(true);
        await ensureGridixAuth();

        setBitrixDealId(dealId);
        patchSearchParams({ crm: "bitrix", deal_id: String(dealId) });

        const { error } = await supabase.functions.invoke("bitrix-app", {
          body: {
            action: "link_apartment_to_deal",
            bitrix_deal_id: dealId,
            project_id: apartment.project_id,
            apartment_id: apartment.id,
          },
        });
        if (error) throw error;

        toast.success(`Квартира привязана к сделке #${dealId}`);
      } catch (e) {
        console.error(e);
        toast.error(
          e instanceof Error
            ? e.message
            : "Не удалось привязать квартиру к сделке",
        );
      } finally {
        setBitrixBusy(false);
      }
    },
    [apartment, ensureGridixAuth, patchSearchParams, project],
  );

  const bitrixLinkToDeal = async () => {
    if (!apartment || !project) return;

    // If deal already known (Bitrix placement passed deal_id), link immediately.
    if (bitrixDealId) {
      await linkApartmentToBitrixDeal(bitrixDealId);
      return;
    }

    // Otherwise show our non-blocking picker (instead of waiting on BX24.selectCRM).
    setIsBitrixDealPickerOpen(true);
    if (!bitrixDeals.length) {
      void loadBitrixUnlinkedDeals();
    }
  };

  interface CombinedPhoto {
    id: string;
    image_url: string;
    description?: string | null;
    order_index: number;
    type: "layout" | "apartment";
  }
  const [photos, setPhotos] = useState<CombinedPhoto[]>([]);
  const [subProjectEntityKind, setSubProjectEntityKind] = useState<
    "building" | "object"
  >("building");

  // Single edge function call for ALL read data
  useEffect(() => {
    if (!projectIdentifier || !apartmentIdentifier) {
      setDataLoading(false);
      return;
    }

    let cancelled = false;
    const fetchAll = async () => {
      setDataLoading(true);
      setDataError(null);
      try {
        const result = await loadApartmentDetails(
          projectIdentifier,
          apartmentIdentifier,
          effectiveUseId,
          subSlug,
        );

        if (cancelled) return;

        if (!result.project) {
          setDataError("Проект не найден");
          setDataLoading(false);
          return;
        }

        setProject(result.project);
        setSubProjectEntityKind(normalizeSubProjectKind(result.subProjectType));

        if (result.apartment) {
          setApartment(normalizeApartmentData(result.apartment));
        } else {
          setApartment(null);
        }

        const mergedFields: FieldSetting[] = [
          ...(result.fieldSettings ?? []).map((f) => ({
            id: f.id,
            field_name: f.field_name,
            field_label: f.field_label,
            field_type: f.field_type as
              | "text"
              | "number"
              | "select"
              | "boolean",
            is_custom: Boolean(f.is_custom),
            is_visible: Boolean(f.is_visible),
            sort_order: Number(f.sort_order),
          })),
          ...(result.customFields ?? []).map((f) => ({
            id: f.id,
            field_name: f.field_name,
            field_label: f.field_label,
            field_type: f.field_type as
              | "text"
              | "number"
              | "select"
              | "boolean",
            is_custom: true,
            is_visible: f.is_visible !== false,
            sort_order: Number(f.sort_order) || 999,
            field_label_translations:
              (f.field_label_translations as Record<string, string>) || {},
          })),
        ].sort((a, b) => a.sort_order - b.sort_order);
        setFieldSettings(mergedFields);

        const aptPhotos: CombinedPhoto[] = result.apartmentPhotos.map((p) => ({
          id: p.id,
          image_url: p.image_url,
          description: p.description ?? null,
          order_index: p.order_index,
          type: "apartment" as const,
        }));

        const layoutPhotos: CombinedPhoto[] = result.layoutPhotos.map((p) => ({
          id: p.id,
          image_url: p.image_url,
          description: p.description ?? null,
          order_index: p.order_index,
          type: "layout" as const,
        }));

        setPhotos(
          [...layoutPhotos, ...aptPhotos].sort(
            (a, b) => a.order_index - b.order_index,
          ),
        );

        const normalizedRec = result.recommended.map(normalizeApartmentData);
        setRecommendedApartments(normalizedRec);
        setRecommendationThumbnails(result.thumbnails);

        if (result.project.currency) {
          setSelectedCurrency(result.project.currency);
        }
      } catch (err) {
        if (cancelled) return;
        console.error("Error loading apartment details:", err);
        setDataError(err instanceof Error ? err.message : "Ошибка загрузки");
      } finally {
        if (!cancelled) setDataLoading(false);
      }
    };

    fetchAll();
    return () => {
      cancelled = true;
    };
  }, [projectIdentifier, apartmentIdentifier, effectiveUseId, subSlug]);

  // View tracking (fire-and-forget writes, kept separate)
  useEffect(() => {
    if (!apartment || !project?.id || dataLoading) return;

    if (!trackedProjectViewsRef.current.has(project.id)) {
      trackedProjectViewsRef.current.add(project.id);
      incrementViewCount(project.id).catch((err: unknown) => {
        console.error("Error tracking project view:", err);
      });
    }

    const trackingKey = `${project.id}:${apartment.id}`;
    if (trackedApartmentViewsRef.current.has(trackingKey)) return;
    trackedApartmentViewsRef.current.add(trackingKey);

    const trackApartmentView = async () => {
      try {
        const { user } = await fetchCurrentSession();
        await supabase.from("apartment_views").insert({
          apartment_id: apartment.id,
          project_id: project.id,
          user_id: user?.id || null,
          user_agent: navigator.userAgent,
          referrer: document.referrer || null,
        });
      } catch (error) {
        trackedApartmentViewsRef.current.delete(trackingKey);
        console.error("Error tracking apartment view:", error);
      }
    };

    void trackApartmentView();
  }, [apartment, project, dataLoading, incrementViewCount]);

  const handleShare = async () => {
    try {
      const url = window.location.href;
      const title = `${apartment?.type === "apartment" ? t("apartment.apartment") : apartment?.type} № ${apartment?.apartment_number}`;
      const text = project?.name ? project.name : "";
      if (navigator.share) {
        await navigator.share({ title, text, url });
      } else {
        await navigator.clipboard.writeText(url);
        toast.success(t("common.copied"));
      }
    } catch (error) {
      // User might cancel share; fallback to copying link
      try {
        await navigator.clipboard.writeText(window.location.href);
        toast.success(t("common.copied"));
      } catch (error) {
        console.error("Error copying link to clipboard:", error);
      }
    }
  };

  const handleToggleFavorite = () => {
    if (!apartment) return;

    const favoriteImageUrl = photos[0]?.image_url ?? null;
    toggleFavorite({
      id: apartment.id,
      project_id: apartment.project_id,
      apartment_number: apartment.apartment_number,
      rooms: !isNaN(Number(apartment.rooms)) ? Number(apartment.rooms) : 0,
      area: apartment.area,
      price: apartment.price || 0,
      status: apartment.status,
      floor_number: apartment.floor_number,
      image_url: favoriteImageUrl,
    });
  };

  // Get project colors from polygon settings
  const getProjectColors = () => {
    const themeColor =
      ((project as unknown as Record<string, unknown>)
        ?.theme_color as string) || "#000000";

    return {
      available: themeColor,
      sold: "#ef4444",
      reserved: "#f59e0b",
    };
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "sold":
        return "text-white";
      case "reserved":
        return "text-white";
      case "available":
        return "text-white";
      default:
        return "bg-gray-500 text-white";
    }
  };

  const getStatusStyle = (status: string) => {
    const colors = getProjectColors();
    switch (status) {
      case "sold":
        return { backgroundColor: colors.sold };
      case "reserved":
        return { backgroundColor: colors.reserved };
      case "available":
        return { backgroundColor: colors.available };
      default:
        return { backgroundColor: "#6b7280" };
    }
  };

  const getButtonStyle = (status: string = "available") => {
    const colors = getProjectColors();
    return {
      backgroundColor:
        colors[status as keyof typeof colors] || colors.available,
    };
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case "sold":
        return t("apartment.sold");
      case "reserved":
        return t("apartment.reserved");
      case "available":
        return t("apartment.available");
      default:
        return status;
    }
  };

  const getFieldLabel = (field: {
    field_label: string;
    field_label_translations?: Partial<Record<Language, string>>;
  }) => {
    if (
      field.field_label_translations &&
      field.field_label_translations[language]
    ) {
      return field.field_label_translations[language] as string;
    }
    return field.field_label;
  };

  const getVisibleFields = () => {
    return fieldSettings
      .filter((field) => field.is_visible)
      .sort((a, b) => a.sort_order - b.sort_order);
  };

  const getCustomFieldValue = (apt: Apartment, fieldName: string) => {
    if (!apt.custom_fields) return null;
    const customFields = apt.custom_fields as Record<string, unknown>;
    return customFields[fieldName] || null;
  };

  const formatFieldValue = (
    value: unknown,
    fieldType: string,
    fieldName: string,
  ) => {
    if (value === null || value === undefined) return "-";

    if (fieldName === "price") {
      return typeof value === "number"
        ? formatPriceWithCurrency(
            convertPrice(value, project?.currency || null, selectedCurrency),
            selectedCurrency,
          )
        : "-";
    }

    if (fieldName === "area") {
      return `${value} ${t("apartment.sqm")}`;
    }

    if (fieldName === "floor_number" || fieldName === "floor") {
      return `${value} ${t("project.floor").toLowerCase()}`;
    }

    if (fieldName === "rooms") {
      const num = Number(value);
      if (Number.isNaN(num)) return "-";
      if (num === 0) return t("apartment.studio");
      return `${num} ${t("apartment.room").toLowerCase()}`;
    }

    if (fieldName === "status") {
      return getStatusLabel(String(value));
    }

    switch (fieldType) {
      case "boolean":
        return value ? t("apartment.yes") : t("apartment.no");
      case "number":
        return typeof value === "number" ? value.toString() : String(value);
      case "select":
        return Array.isArray(value) ? value.join(", ") : String(value);
      default:
        return String(value);
    }
  };

  const goBackToProject = () => {
    if (onClose) {
      onClose();
      return;
    }

    const projectUrl = useId
      ? `/${lang}/project/id/${projectId}`
      : `/${lang}/project/${project?.slug || projectIdentifier}`;
    window.location.href = projectUrl;
  };

  const openApartmentDetails = (apt: Apartment) => {
    if (onClose) {
      setOverrideApartmentId(apt.id);
      return;
    }
    const projectPath = project?.slug
      ? project.slug
      : `id/${project?.id || projectIdentifier}`;
    const url = `/${language}/project/${projectPath}/apartment/${apt.apartment_number}`;
    window.location.href = url;
  };

  const { run: runGeneratePdf, isRunning: isGeneratingPDF } = useAsyncAction(
    generateApartmentPdf,
    {
      onError: (error) => {
        console.error("Error generating PDF:", error);
        toast.error(t("common.error"));
      },
    },
  );

  const handleGeneratePDF = async () => {
    if (!apartment || !project?.id) return;
    await runGeneratePdf({
      apartment,
      project,
      language,
      subProjectSlug: subSlug || undefined,
    });
  };

  const fieldVisibility = useMemo(
    () => getApartmentFieldVisibility(fieldSettings),
    [fieldSettings],
  );
  const priceVisible = fieldVisibility.price;
  const areaVisible = fieldVisibility.area;
  const roomsVisible = fieldVisibility.rooms;
  const floorVisible = fieldVisibility.floor;
  const numberVisible = fieldVisibility.number;

  const loading = dataLoading;

  if (dataError) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="text-center">
          <h1 className="mb-2 text-xl font-bold text-foreground">
            {t("common.error")}
          </h1>
          <p className="text-muted-foreground">{dataError}</p>
        </div>
      </div>
    );
  }

  // Перенаправляем только если проект или квартира не найдены после завершения загрузки
  if (!loading && (!project || !apartment)) {
    console.warn("Project or apartment not found after loading completed:", {
      projectIdentifier,
      apartmentIdentifier,
      project: !!project,
      apartment: !!apartment,
    });
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="text-center">
          <h1 className="mb-2 text-xl font-bold text-foreground">
            {t("apartment.notFound")}
          </h1>
          <p className="text-muted-foreground">{t("apartment.invalidId")}</p>
        </div>
      </div>
    );
  }

  // Если данные еще не загружены, не рендерим основной контент
  if (!apartment || !project || loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <Loader
          size="lg"
          className="mx-auto mb-4"
          color={project?.theme_color || "#000000"}
        />
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <div className="container mx-auto px-0 lg:px-6">
        {/* Mobile Layout */}
        <div className="lg:hidden">
          {/* Header with back button */}
          <div className="relative">
            <div className="absolute left-4 top-4 z-10">
              <Button
                variant="ghost"
                size="icon"
                onClick={goBackToProject}
                className="h-10 w-10 rounded-full bg-black/20 text-white hover:bg-black/30"
                aria-label={t("admin.back")}
              >
                <ArrowLeft className="h-5 w-5" />
              </Button>
            </div>

            {/* Main apartment image */}
            <div className="relative overflow-hidden">
              <ApartmentPhotosViewer preloadedLayoutPhotos={photos} />
            </div>
          </div>

          {/* Content */}
          <div className="relative z-10 -mt-6 border bg-white p-6 pb-32">
            {/* Title and floor */}
            <div className="mb-4">
              <div className="flex items-center justify-between">
                <h1 className="mb-1 text-2xl font-bold text-gray-900">
                  {apartment.type === "apartment"
                    ? subProjectEntityKind === "object"
                      ? `${t("apartment.objectUnit")} ${numberVisible ? `№ ${apartment.apartment_number}` : ""}`
                      : `${t("apartment.apartment")} ${numberVisible ? `№ ${apartment.apartment_number}` : ""}`
                    : `${apartment.type} ${numberVisible ? `№ ${apartment.apartment_number}` : ""}`}
                </h1>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    onClick={handleToggleFavorite}
                    className={`h-15 w-15 rounded-2xl border-2 px-4 py-3 hover:border-gray-300 ${
                      isFavorite(apartment?.id || "")
                        ? "border-red-300 bg-red-50 text-red-600 hover:bg-red-100"
                        : "border-gray-200 hover:border-gray-300"
                    }`}
                  >
                    <Heart
                      className={`!h-5 !w-5 ${isFavorite(apartment?.id || "") ? "fill-current" : ""}`}
                    />
                  </Button>
                  <Button
                    variant="outline"
                    onClick={handleShare}
                    className="h-15 w-15 rounded-2xl border-2 border-gray-200 px-4 py-3 hover:border-gray-300"
                  >
                    <Share2 className="!h-5 !w-5" />
                  </Button>
                </div>
              </div>
              {floorVisible && (
                <p className="text-gray-500">
                  {apartment.floor_number} {t("apartment.floor")}
                </p>
              )}
            </div>

            {/* Room and area info */}
            <div className="mb-6 flex items-center gap-4">
              {roomsVisible && (
                <div className="flex items-center gap-2">
                  <Home className="h-5 w-5 text-gray-400" />
                  <span className="text-gray-700">
                    {apartment.rooms == 0
                      ? t("apartment.studio")
                      : apartment.rooms === "free_layout"
                        ? t("apartment.freeLayout")
                        : `${apartment.rooms} ${!isNaN(Number(apartment.rooms)) ? t("apartment.rooms") : ""}`}
                  </span>
                </div>
              )}
              {areaVisible && (
                <div className="flex items-center gap-2">
                  <Square className="h-5 w-5 text-gray-400" />
                  <span className="text-gray-700">
                    {apartment.area} {t("apartment.sqm")} {t("apartment.area")}
                  </span>
                </div>
              )}
            </div>

            {/* Price */}
            <div className="mb-6">
              {apartment.status === "available" ? (
                <div className="text-3xl font-bold text-gray-900">
                  {apartment.price && priceVisible
                    ? formatPriceWithCurrency(
                        convertPrice(
                          apartment.price,
                          project?.currency || null,
                          selectedCurrency,
                        ),
                        selectedCurrency,
                      )
                    : t("common.priceOnRequest")}
                </div>
              ) : (
                <div className="text-shadow mb-1 font-poppins text-3xl font-bold leading-[1] text-[red]">
                  {t("apartment.sold")}
                </div>
              )}
            </div>

            {/* Дополнительные поля */}
            {getVisibleFields().length > 0 && (
              <div className="mt-6 border-t border-gray-100 pt-6">
                <h3 className="mb-3 text-lg font-semibold text-gray-900">
                  {subProjectEntityKind === "object"
                    ? t("apartment.objectDetails")
                    : t("apartment.details")}
                </h3>

                <div className="space-y-3">
                  {getVisibleFields().map((field) => {
                    let value: unknown = null;
                    if (field.is_custom) {
                      value = getCustomFieldValue(apartment, field.field_name);
                    } else {
                      switch (field.field_name) {
                        case "rooms":
                          if (!isNaN(Number(apartment.rooms))) {
                            value = apartment.rooms;
                          }
                          break;
                        case "area":
                          value = apartment.area;
                          break;
                        case "price":
                          value = apartment.price;
                          break;
                        case "status":
                          value = apartment.status;
                          break;
                        case "floor":
                          value = apartment.floor_number;
                          break;
                        case "number":
                          value = apartment.apartment_number;
                          break;
                        default:
                          value = null;
                      }
                    }

                    if (value === null) return null;

                    return (
                      <div
                        key={field.id}
                        className="flex items-center justify-between py-2"
                      >
                        <span className="text-gray-600">
                          {field.is_custom
                            ? getFieldLabel(field)
                            : t(`project.${field.field_name}`)}
                        </span>
                        <span className="font-medium text-gray-900">
                          {field.field_name === "price"
                            ? formatPriceWithCurrency(
                                convertPrice(
                                  value as number,
                                  project?.currency || null,
                                  selectedCurrency,
                                ),
                                selectedCurrency,
                              )
                            : formatFieldValue(
                                value,
                                field.field_type,
                                field.field_name,
                              )}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Desktop Layout */}
        <div className="hidden py-6 lg:block">
          <div className="mx-auto max-w-7xl px-6">
            {/* Back button and title section */}
            <div className="mb-6 flex items-center justify-between">
              <div className="flex items-center gap-4">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={goBackToProject}
                  className="h-10 w-10 rounded-full border border-gray-200 hover:bg-gray-50"
                  aria-label={t("admin.back")}
                >
                  <ArrowLeft className="h-5 w-5 text-gray-700" />
                </Button>
                <h1 className="font-poppins text-2xl font-semibold text-gray-900">
                  {apartment.type === "apartment"
                    ? subProjectEntityKind === "object"
                      ? `${t("apartment.objectUnit")} ${numberVisible ? `№ ${apartment.apartment_number}` : ""}`
                      : `${t("apartment.apartment")} ${numberVisible ? `№ ${apartment.apartment_number}` : ""}`
                    : `${apartment.type} ${numberVisible ? `№ ${apartment.apartment_number}` : ""}`}
                </h1>
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  onClick={handleToggleFavorite}
                  className={`rounded-lg border px-3 py-2 hover:border-gray-300 ${
                    isFavorite(apartment?.id || "")
                      ? "border-red-300 bg-red-50 text-red-600 hover:bg-red-100"
                      : "border-gray-200"
                  }`}
                  aria-label={t("common.drawer.actions.favorite")}
                >
                  <Heart
                    className={`h-5 w-5 ${isFavorite(apartment?.id || "") ? "fill-current" : ""}`}
                  />
                </Button>
                <Button
                  variant="outline"
                  onClick={handleShare}
                  className="rounded-lg border border-gray-200 px-3 py-2 hover:border-gray-300"
                  aria-label={t("common.drawer.actions.share")}
                >
                  <Share2 className="h-5 w-5" />
                </Button>
              </div>
            </div>

            {/* Main content grid */}
            <div className="flex gap-8">
              {/* Left side - Gallery and details */}
              <div className="flex-1 space-y-4">
                {/* Gallery */}
                <div className="relative">
                  <ApartmentPhotosViewer preloadedLayoutPhotos={photos} />
                  {/* Gallery navigation line */}
                </div>

                <div className="flex h-[70px] items-center justify-center">
                  <div className="h-0.5 w-full rounded-full bg-gray-300"></div>
                </div>

                {/* Additional Information Section */}
                {getVisibleFields().length > 0 && (
                  <div className="space-y-6">
                    <h2 className="font-poppins text-3xl font-medium text-gray-900">
                      {subProjectEntityKind === "object"
                        ? t("apartment.objectDetails")
                        : t("apartment.details")}
                    </h2>

                    <div className="space-y-4">
                      {getVisibleFields().map((field) => {
                        let value: unknown = null;
                        if (field.is_custom) {
                          value = getCustomFieldValue(
                            apartment,
                            field.field_name,
                          );
                        } else {
                          switch (field.field_name) {
                            case "rooms":
                              if (!isNaN(Number(apartment.rooms))) {
                                value = apartment.rooms;
                              }
                              break;
                            case "area":
                              value = apartment.area;
                              break;
                            case "price":
                              value = apartment.price;
                              break;
                            case "status":
                              value = apartment.status;
                              break;
                            case "floor":
                              value = apartment.floor_number;
                              break;
                            case "number":
                              value = apartment.apartment_number;
                              break;
                            default:
                              value = null;
                          }
                        }

                        if (value === null) return null;

                        return (
                          <div
                            key={field.id}
                            className="flex items-center justify-between py-3"
                          >
                            <span className="font-poppins text-gray-600">
                              {field.is_custom
                                ? getFieldLabel(field)
                                : t(`project.${field.field_name}`)}
                            </span>
                            <span className="font-poppins font-medium text-gray-900">
                              {formatFieldValue(
                                value,
                                field.field_type,
                                field.field_name,
                              )}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>

              {/* Right side - Price and actions */}
              <div className="w-[400px]">
                <div className="sticky top-6">
                  <div className="flex min-h-[340px] flex-col justify-between space-y-[24px] rounded-2xl bg-gray-50 p-6">
                    {/* Currency selector */}
                    <div className="space-y-[24px]">
                      <div className="flex items-center justify-between">
                        <div className="font-poppins text-xl font-medium text-gray-900">
                          {apartment.rooms == 0
                            ? t("apartment.studio")
                            : apartment.rooms === "free_layout"
                              ? t("apartment.freeLayout")
                              : `${apartment.rooms} ${!isNaN(Number(apartment.rooms)) ? t("apartment.rooms") : ""}`}{" "}
                          {apartment.area} {t("apartment.sqm")}
                        </div>
                        <div className="font-poppins text-xl font-light text-gray-500">
                          {apartment.floor_number} {t("apartment.floor")}
                        </div>
                      </div>
                      <div className="flex flex-wrap justify-between gap-[15px]">
                        {apartment.status === "available" ? (
                          <>
                            <div className="flex flex-col items-start gap-4 whitespace-nowrap">
                              <div className="mb-1 font-poppins text-4xl font-medium leading-[1] text-gray-900">
                                {apartment.price && priceVisible
                                  ? formatPriceWithCurrency(
                                      convertPrice(
                                        apartment.price,
                                        project?.currency || null,
                                        selectedCurrency,
                                      ),
                                      selectedCurrency,
                                    )
                                  : t("common.priceOnRequest")}
                              </div>

                              {project?.installment_enabled &&
                                apartment.price &&
                                priceVisible && (
                                  <div className="mb-2 font-poppins text-xl font-light text-gray-700">
                                    {t("project.from")}{" "}
                                    {formatPriceWithCurrency(
                                      convertPrice(
                                        calculateMonthlyPayment(
                                          apartment.price,
                                        ),
                                        project?.currency || null,
                                        selectedCurrency,
                                      ),
                                      selectedCurrency,
                                    )}{" "}
                                    / {t("installment.perMonth")}
                                  </div>
                                )}

                              <Badge className="rounded-[10px] bg-green-500 px-[16px] font-poppins text-sm font-medium text-white hover:bg-green-600">
                                {t("installment.low")}
                              </Badge>
                            </div>
                            {priceVisible && (
                              <div className="flex min-w-0 flex-col gap-[10px]">
                                <div className="flex w-full shrink-0 justify-end">
                                  <CurrencyToggle
                                    variant="select"
                                    selectedCurrency={selectedCurrency}
                                    onChange={(c) => setSelectedCurrency(c)}
                                    projectCurrency={project?.currency}
                                    themeColor={
                                      ((
                                        project as unknown as Record<
                                          string,
                                          unknown
                                        >
                                      )?.theme_color as string) || "#000000"
                                    }
                                  />
                                </div>
                                <div>
                                  {project?.installment_enabled &&
                                    project?.max_installment_months &&
                                    priceVisible && (
                                      <>
                                        <div className="font-poppins text-[14px] font-light text-gray-700">
                                          {t("installment.period")}{" "}
                                          {project.max_installment_months}{" "}
                                          {t("installment.months")}
                                        </div>
                                        <div className="font-poppins text-[14px] font-light text-gray-700">
                                          {t("installment.downPaymentFrom")}{" "}
                                          {project?.min_down_payment_percent ??
                                            20}
                                          %
                                        </div>
                                      </>
                                    )}
                                </div>
                              </div>
                            )}
                          </>
                        ) : (
                          <div className="text-shadow mb-1 font-poppins text-4xl font-bold leading-[1] text-[red]">
                            {t("apartment.sold")}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Price */}

                    {/* Action buttons */}
                    {apartment.status === "available" && (
                      <div className="space-y-3">
                        {/* Green installment button */}

                        {/* Main reserve / Bitrix actions */}
                        {bitrixContext.isBitrix ? (
                          <div className="space-y-2">
                            <Button
                              className="w-full rounded-lg py-3 font-poppins text-sm font-medium text-white hover:opacity-90"
                              style={getButtonStyle("available")}
                              onClick={bitrixLinkToDeal}
                              disabled={bitrixBusy}
                            >
                              {bitrixBusy
                                ? "..."
                                : bitrixDealId
                                  ? t(
                                      "bitrix.apartmentDetails.linkDealWithId",
                                      {
                                        dealId: bitrixDealId,
                                      },
                                    )
                                  : t(
                                      "bitrix.apartmentDetails.linkExistingDeal",
                                    )}
                            </Button>
                            <Button
                              variant="outline"
                              className="w-full rounded-lg py-3 font-poppins text-sm"
                              onClick={bitrixCreateDeal}
                              disabled={bitrixBusy}
                            >
                              {bitrixBusy
                                ? "..."
                                : t(
                                    "bitrix.apartmentDetails.createDealInBitrix",
                                  )}
                            </Button>
                            <div className="text-xs text-muted-foreground">
                              {t("bitrix.apartmentDetails.syncHint")}
                            </div>
                          </div>
                        ) : (
                          <Button
                            className="w-full rounded-lg py-3 font-poppins text-sm font-medium text-white hover:opacity-90"
                            style={getButtonStyle("available")}
                            onClick={() => setIsReserveDialogOpen(true)}
                          >
                            {t("common.leaveRequest")}
                          </Button>
                        )}

                        {/* Secondary buttons row */}
                        <div className="flex gap-3">
                          {project?.installment_enabled &&
                            apartment.price &&
                            priceVisible && (
                              <Button
                                variant="outline"
                                className="flex-1 rounded-lg border border-gray-300 bg-white py-3 font-poppins text-sm"
                                onClick={() => setIsCalculatorDialogOpen(true)}
                              >
                                {t("installment.calculator")}
                              </Button>
                            )}

                          <Button
                            variant="outline"
                            onClick={handleGeneratePDF}
                            disabled={isGeneratingPDF}
                            className={`rounded-lg border border-gray-300 bg-white px-6 py-3 font-poppins text-sm ${project?.installment_enabled && apartment.price && priceVisible ? "" : "w-full"}`}
                          >
                            {isGeneratingPDF ? (
                              <div className="flex items-center gap-2">
                                <Loader2 className="h-4 w-4 animate-spin" />
                                <span>{t("apartment.downloadPDF")}</span>
                              </div>
                            ) : (
                              t("apartment.downloadPDF")
                            )}
                          </Button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Recommendations Section */}
            {recommendedApartments.length > 0 && (
              <div className="mt-12 space-y-6 rounded-2xl bg-gray-50 p-10">
                <h2 className="font-poppins text-3xl font-medium text-gray-900">
                  {t("apartment.recommendedApartments")}
                </h2>
                <div className="grid grid-cols-4 gap-6">
                  {recommendedApartments.map((recApartment) => {
                    const cardTitle =
                      recApartment.type === "apartment"
                        ? subProjectEntityKind === "object"
                          ? `${t("apartment.objectUnit")} № ${recApartment.apartment_number}`
                          : `${t("apartment.apartment")} № ${recApartment.apartment_number}`
                        : `${recApartment.type} № ${recApartment.apartment_number}`;

                    const roomText =
                      recApartment.rooms == 0
                        ? t("apartment.studio")
                        : `${recApartment.rooms} ${typeof recApartment.rooms === "number" ? t("apartment.room") : ""}`;

                    const formattedPrice = recApartment.price
                      ? formatPriceWithCurrency(
                          convertPrice(
                            recApartment.price,
                            project?.currency || null,
                            selectedCurrency,
                          ),
                          selectedCurrency,
                        )
                      : t("project.onRequest");

                    return (
                      <RecommendedApartmentCard
                        key={recApartment.id}
                        apartment={recApartment}
                        thumbnailUrl={
                          recommendationThumbnails[recApartment.id] ?? null
                        }
                        onClick={() => openApartmentDetails(recApartment)}
                        title={cardTitle}
                        floorLabel={t("project.floor")}
                        roomText={roomText}
                        fieldSettings={fieldSettings}
                        formattedPrice={formattedPrice}
                        getStatusColor={getStatusColor}
                        getStatusStyle={getStatusStyle}
                        getStatusLabel={getStatusLabel}
                      />
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Fixed Action Buttons - Mobile (bottom) */}
        {apartment.status === "available" && (
          <div className="sticky bottom-0 left-0 right-0 z-50 border-t border-gray-200 bg-white p-4 lg:hidden">
            <div className="mx-auto max-w-sm space-y-3">
              {bitrixContext.isBitrix ? (
                <div className="space-y-2">
                  <Button
                    className="w-full rounded-2xl py-3 text-lg font-semibold text-white hover:opacity-90"
                    style={getButtonStyle("available")}
                    onClick={bitrixLinkToDeal}
                    disabled={bitrixBusy}
                  >
                    {bitrixBusy
                      ? "..."
                      : bitrixDealId
                        ? t("bitrix.apartmentDetails.linkDealWithId", {
                            dealId: bitrixDealId,
                          })
                        : t("bitrix.apartmentDetails.linkDeal")}
                  </Button>
                  <Button
                    variant="outline"
                    className="w-full rounded-2xl border-2 border-gray-200 py-3 hover:border-gray-300"
                    onClick={bitrixCreateDeal}
                    disabled={bitrixBusy}
                  >
                    {bitrixBusy
                      ? "..."
                      : t("bitrix.apartmentDetails.createDeal")}
                  </Button>
                </div>
              ) : (
                <Button
                  className="w-full rounded-2xl py-3 text-lg font-semibold text-white hover:opacity-90"
                  style={getButtonStyle("available")}
                  onClick={() => setIsReserveDialogOpen(true)}
                >
                  {t("common.reserve")}
                </Button>
              )}

              <div className="flex gap-3">
                {project?.installment_enabled &&
                  apartment.price &&
                  priceVisible && (
                    <Button
                      variant="outline"
                      className="flex-1 rounded-2xl border-2 border-gray-200 py-3 hover:border-gray-300"
                      onClick={() => setIsCalculatorDialogOpen(true)}
                    >
                      <Calculator className="mr-2 h-5 w-5" />
                      {t("installment.calculator")}
                    </Button>
                  )}

                <Button
                  variant="outline"
                  onClick={handleGeneratePDF}
                  disabled={isGeneratingPDF}
                  className={`rounded-2xl border-2 border-gray-200 px-4 py-3 hover:border-gray-300 ${project?.installment_enabled && apartment.price && priceVisible ? "" : "w-full"}`}
                >
                  {isGeneratingPDF ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <FileDown className="h-5 w-5" />
                  )}
                  <span className="hidden xs:block">
                    {t("apartment.downloadPDF")}
                  </span>
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Dialogs rendered once (avoid double-open on shared state) */}
        {!bitrixContext.isBitrix && (
          <Dialog
            open={isReserveDialogOpen}
            onOpenChange={setIsReserveDialogOpen}
          >
            <DialogContent className="sm:max-w-[500px]">
              <DialogHeader>
                <DialogTitle>
                  {t("common.reserve")} {t("apartment.apartment")}{" "}
                  {apartment.apartment_number}
                </DialogTitle>
              </DialogHeader>
              <ApartmentReservationForm
                apartmentId={apartment.id}
                projectId={apartment.project_id}
                onCancel={() => setIsReserveDialogOpen(false)}
                themeColor={
                  ((project as unknown as Record<string, unknown>)
                    ?.theme_color as string) || "#000000"
                }
              />
            </DialogContent>
          </Dialog>
        )}

        {project?.installment_enabled && apartment.price && priceVisible && (
          <Dialog
            open={isCalculatorDialogOpen}
            onOpenChange={setIsCalculatorDialogOpen}
          >
            <DialogContent className="sm:max-w-[600px]">
              <DialogHeader>
                <DialogTitle>{t("installment.calculator")}</DialogTitle>
              </DialogHeader>
              <InstallmentCalculator
                applyInstallment={() => {
                  setIsCalculatorDialogOpen(false);
                  if (!bitrixContext.isBitrix) setIsReserveDialogOpen(true);
                }}
                apartmentPrice={apartment.price}
                currency={project.currency}
                minDownPaymentPercent={project.min_down_payment_percent || 20}
                maxInstallmentMonths={project.max_installment_months || 24}
                themeColor={
                  ((project as unknown as Record<string, unknown>)
                    ?.theme_color as string) || "#000000"
                }
              />
            </DialogContent>
          </Dialog>
        )}

        {/* Bitrix deal picker (avoid UI freeze on BX24.selectCRM) */}
        {bitrixContext.isBitrix && (
          <Dialog
            open={isBitrixDealPickerOpen}
            onOpenChange={(open) => {
              setIsBitrixDealPickerOpen(open);
              if (open) void loadBitrixUnlinkedDeals();
              if (!open) setBitrixDealsQuery("");
            }}
          >
            <DialogContent className="sm:max-w-[650px]">
              <DialogHeader>
                <DialogTitle>Выберите сделку Bitrix</DialogTitle>
              </DialogHeader>

              <div className="space-y-3">
                <div className="text-sm text-muted-foreground">
                  Показываем сделки без привязки к квартире (не
                  “зафиксированные” в Gridix).
                </div>

                <div className="flex gap-2">
                  <input
                    value={bitrixDealsQuery}
                    onChange={(e) => setBitrixDealsQuery(e.target.value)}
                    placeholder="Поиск по названию или #ID"
                    className="h-10 flex-1 rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                    disabled={bitrixDealsLoading || bitrixBusy}
                  />
                  <Button
                    variant="outline"
                    onClick={() => void loadBitrixUnlinkedDeals()}
                    disabled={bitrixDealsLoading || bitrixBusy}
                  >
                    Обновить
                  </Button>
                </div>

                <Button
                  variant="outline"
                  className="w-full"
                  onClick={async () => {
                    try {
                      const id = await selectBitrixDealId();
                      setIsBitrixDealPickerOpen(false);
                      await linkApartmentToBitrixDeal(id);
                    } catch (e) {
                      toast.error(
                        e instanceof Error
                          ? e.message
                          : "Не удалось открыть выбор сделки",
                      );
                    }
                  }}
                  disabled={bitrixDealsLoading || bitrixBusy}
                >
                  Выбрать через Bitrix (BX24)
                </Button>

                {bitrixDealsLoading ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader />
                  </div>
                ) : (
                  <div className="max-h-[360px] overflow-auto rounded-md border border-border">
                    {bitrixDeals
                      .filter((d) => {
                        const q = bitrixDealsQuery.trim().toLowerCase();
                        if (!q) return true;
                        return (
                          String(d.id).includes(q) ||
                          d.title.toLowerCase().includes(q)
                        );
                      })
                      .map((d) => (
                        <button
                          key={d.id}
                          type="button"
                          className="w-full border-b px-3 py-2 text-left transition-colors last:border-b-0 hover:bg-muted disabled:opacity-50"
                          onClick={async () => {
                            setIsBitrixDealPickerOpen(false);
                            await linkApartmentToBitrixDeal(d.id);
                          }}
                          disabled={bitrixBusy}
                        >
                          <div className="flex items-center justify-between gap-2">
                            <div className="font-medium">#{d.id}</div>
                            {d.stage_id ? (
                              <div className="text-xs text-muted-foreground">
                                {d.stage_id}
                              </div>
                            ) : null}
                          </div>
                          <div className="break-words text-sm text-muted-foreground">
                            {d.title}
                          </div>
                        </button>
                      ))}

                    {!bitrixDeals.length && (
                      <div className="px-3 py-6 text-sm text-muted-foreground">
                        Не найдено доступных сделок для привязки.
                      </div>
                    )}
                  </div>
                )}
              </div>
            </DialogContent>
          </Dialog>
        )}
      </div>
    </div>
  );
};

export default ApartmentDetailsPage;
