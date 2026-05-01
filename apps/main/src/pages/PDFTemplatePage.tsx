import { useParams } from "react-router-dom";
import { useLanguage } from "@/contexts/LanguageContext";
import {
  formatPriceWithCurrencySpaces,
  convertPrice,
  isValidCurrency,
} from "@gridix/utils/lib";
import { Language } from "@gridix/utils/lib";
import { Loader } from "@gridix/ui";
import { useState, useEffect } from "react";
import type { CSSProperties } from "react";
import { Apartment } from "@/entities/apartment/model/types";
import { Badge } from "@gridix/ui";
import type { Tables } from "@gridix/types/database";
import { loadPdfTemplateData } from "@/features/projectSelector/api/projectSelectorApi";
import { normalizeSubProjectKind } from "@/components/project-selector/lib/subProjectDisplay";
import { useExchangeRatesEpoch } from "@/app/providers";

interface PDFTemplatePageProps {
  useId?: boolean;
  apartmentIdProp?: string;
  projectIdProp?: string;
}

interface PdfFieldSetting {
  id: string;
  field_name: string;
  field_type: string;
  field_label: string;
  is_visible: boolean;
  is_custom: boolean;
  sort_order: number;
  field_label_translations?: Partial<Record<Language, string>>;
}

type PdfAspectMode = "wide" | "square" | "portrait" | "tall";

interface PdfPageMetrics {
  aspectRatio: number;
  mode: PdfAspectMode;
}

const SUMMARY_FIELD_NAMES = new Set([
  "rooms",
  "area",
  "price",
  "number",
  "floor",
]);

function readPositiveSearchNumber(params: URLSearchParams, key: string) {
  const raw = params.get(key);
  if (!raw) return null;
  const value = Number(raw);
  return Number.isFinite(value) && value > 0 ? value : null;
}

function getPdfPageMetrics(): PdfPageMetrics {
  if (typeof window === "undefined") {
    return { aspectRatio: 210 / 297, mode: "portrait" };
  }

  const params = new URLSearchParams(window.location.search);
  const widthPt = readPositiveSearchNumber(params, "pdfWidthPt");
  const heightPt = readPositiveSearchNumber(params, "pdfHeightPt");
  const explicitAspect = readPositiveSearchNumber(params, "pdfAspectRatio");
  const aspectRatio =
    explicitAspect ?? (widthPt && heightPt ? widthPt / heightPt : 210 / 297);

  if (aspectRatio >= 1.18) return { aspectRatio, mode: "wide" };
  if (aspectRatio >= 0.88) return { aspectRatio, mode: "square" };
  if (aspectRatio <= 0.62) return { aspectRatio, mode: "tall" };
  return { aspectRatio, mode: "portrait" };
}

const PDFTemplatePage = ({
  useId = false,
  apartmentIdProp = "",
  projectIdProp = "",
}: PDFTemplatePageProps) => {
  useExchangeRatesEpoch();
  const { projectSlug, projectId, apartmentNumber, apartmentId, subSlug } =
    useParams<{
      projectSlug?: string;
      projectId?: string;
      apartmentNumber?: string;
      apartmentId?: string;
      lang?: string;
      subSlug?: string;
    }>();

  // Определяем идентификаторы в зависимости от типа маршрута
  const projectIdentifier = useId ? projectIdProp : projectSlug || projectId;
  const apartmentIdentifier = useId
    ? apartmentIdProp
    : apartmentNumber || apartmentId;

  const { t, language } = useLanguage();
  const [project, setProject] = useState<Tables<"projects"> | null>(null);
  const [apartment, setApartment] = useState<Apartment | null>(null);
  const [fieldSettings, setFieldSettings] = useState<PdfFieldSetting[]>([]);
  const [projectDomains, setProjectDomains] = useState<
    { domain: string; is_primary: boolean }[]
  >([]);
  const [companyName, setCompanyName] = useState<string | null>(null);
  const [companyLogoUrl, setCompanyLogoUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const [photos, setPhotos] = useState<
    Array<{
      id: string;
      image_url: string;
      description?: string | null;
      order_index: number;
    }>
  >([]);
  const [floorPlan, setFloorPlan] = useState<{
    id: string;
    image_url: string;
    floor_number: number;
  } | null>(null);
  const [qrCodeUrl, setQrCodeUrl] = useState<string>("");
  const [subProjectEntityKind, setSubProjectEntityKind] = useState<
    "building" | "object"
  >("building");

  useEffect(() => {
    const loadData = async () => {
      if (!projectIdentifier || !apartmentIdentifier) {
        setLoading(false);
        setError(t("apartment.invalidId"));
        return;
      }

      setLoading(true);
      setError(null);

      try {
        const result = await loadPdfTemplateData(
          projectIdentifier,
          apartmentIdentifier,
          useId,
          subSlug,
        );

        setProject(result.project);
        setSubProjectEntityKind(normalizeSubProjectKind(result.subProjectType));
        setApartment(result.apartment as Apartment | null);
        setFieldSettings([
          ...((result.fieldSettings ?? []) as unknown as PdfFieldSetting[]),
          ...((result.customFields ?? []).map((field) => ({
            id: field.id,
            field_name: field.field_name,
            field_type: field.field_type,
            field_label: field.field_label,
            is_visible: field.is_visible !== false,
            is_custom: true,
            sort_order: Number(field.sort_order) || 999,
            field_label_translations: field.field_label_translations as Partial<
              Record<Language, string>
            >,
          })) satisfies PdfFieldSetting[]),
        ]);
        setProjectDomains(result.projectDomains ?? []);
        setCompanyName(result.companyName);
        setCompanyLogoUrl(result.companyLogoUrl);

        const apartmentSorted = [...(result.apartmentPhotos ?? [])].sort(
          (a, b) => a.order_index - b.order_index,
        );
        setPhotos([...apartmentSorted.slice(0, 3)]);

        if (
          result.floorPlan?.image_url &&
          result.apartment?.floor_number !== undefined
        ) {
          setFloorPlan({
            id: `floor-plan-${String(result.apartment.floor_number)}`,
            image_url: result.floorPlan.image_url,
            floor_number: Number(result.apartment.floor_number),
          });
        } else {
          setFloorPlan(null);
        }
      } catch (err) {
        console.error("Error loading PDF template data:", err);
        setError(err instanceof Error ? err.message : t("common.error"));
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [projectIdentifier, apartmentIdentifier, t, useId, subSlug]);

  /** Синхронно из проекта — иначе headless /pdf снимает кадр до useEffect и валюта/конверсия неверны. */
  const pdfCurrency: string =
    project?.currency && isValidCurrency(project.currency)
      ? project.currency
      : "RUB";

  // Generate QR code when data is ready
  useEffect(() => {
    const updateQRCode = () => {
      if (!project || !apartment) return;

      try {
        const currentHostname = window.location.hostname;
        const isProjectDomain = projectDomains.some(
          (pd) => pd.domain.toLowerCase() === currentHostname.toLowerCase(),
        );
        const primaryDomain = projectDomains.find(
          (pd) => pd.is_primary,
        )?.domain;
        const fallbackDomain = import.meta.env.VITE_SERVER_DOMAIN
          ? `https://${import.meta.env.VITE_SERVER_DOMAIN}`
          : "https://app.gridix.live";
        const baseDomain = isProjectDomain
          ? window.location.origin
          : primaryDomain
            ? "https://" + primaryDomain
            : fallbackDomain;
        const projectPath = project.slug || `id/${project.id}`;
        const aptSeg = encodeURIComponent(String(apartment.apartment_number));
        const subSeg =
          subSlug != null && subSlug !== ""
            ? `p/${encodeURIComponent(subSlug)}/`
            : "";
        const url = `${baseDomain}/${language}/project/${projectPath}/${subSeg}apartment/${aptSeg}`;
        const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(url)}`;
        setQrCodeUrl(qrUrl);
      } catch (err) {
        console.error("Error generating QR code:", err);
        setQrCodeUrl("");
      }
    };

    updateQRCode();
  }, [project, apartment, language, projectDomains, subSlug]);

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
    return customFields[fieldName] ?? null;
  };

  const getPdfFieldValue = (apt: Apartment, field: PdfFieldSetting) => {
    if (field.is_custom) {
      return getCustomFieldValue(apt, field.field_name);
    }

    switch (field.field_name) {
      case "rooms":
        return typeof apt.rooms === "number" ? apt.rooms : null;
      case "area":
        return apt.area;
      case "price":
        return apt.price;
      case "status":
        return apt.status;
      case "floor":
        return apt.floor_number;
      case "number":
        return apt.apartment_number;
      default:
        return null;
    }
  };

  const formatFieldValue = (
    value: unknown,
    fieldType: string,
    fieldName: string,
  ): string => {
    if (value === null || value === undefined) return "-";

    if (fieldName === "price") {
      return typeof value === "number"
        ? formatPriceWithCurrencySpaces(
            convertPrice(value, project?.currency || null, pdfCurrency),
            pdfCurrency,
          )
        : "-";
    }

    if (fieldName === "area") {
      return `${value} ${t("apartment.sqm")}`;
    }

    if (fieldName === "status") {
      const s = String(value);
      if (s === "available" || s === "sold" || s === "reserved") {
        return t(`apartment.${s}`);
      }
      return s;
    }

    if (fieldName === "floor_number" || fieldName === "floor") {
      return `${value} ${t("project.floor").toLowerCase()}`;
    }

    if (fieldName === "rooms") {
      if (Number.isNaN(value)) return "-";
      if (value === 0) {
        return t("apartment.studio");
      }
      return `${value} ${t("apartment.room").toLowerCase()}`;
    }

    switch (fieldType) {
      case "boolean":
        return value ? "Да" : "Нет";
      case "number":
        return typeof value === "number" ? value.toString() : String(value);
      case "select":
        return Array.isArray(value) ? value.join(", ") : String(value);
      default:
        return String(value);
    }
  };

  const priceVisible = fieldSettings.find(
    (field) => field.field_name === "price",
  )?.is_visible;
  const floorVisible = fieldSettings.find(
    (field) => field.field_name === "floor",
  )?.is_visible;
  const numberVisible = fieldSettings.find(
    (field) => field.field_name === "number",
  )?.is_visible;

  if (loading) {
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

  if (error) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="text-center">
          <h1 className="mb-2 text-xl font-bold text-foreground">
            {t("common.error")}
          </h1>
          <p className="text-muted-foreground">{error}</p>
        </div>
      </div>
    );
  }

  if (!loading && (!project || !apartment)) {
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

  if (!apartment || !project) {
    return null;
  }

  const installmentMonths = project.max_installment_months;
  const downPaymentPercent = project.min_down_payment_percent;
  const installmentActive = project.installment_enabled === true;
  const showInstallmentTermsBlock =
    installmentActive &&
    ((installmentMonths != null && installmentMonths > 0) ||
      downPaymentPercent != null);
  const showMonthlyInstallmentEstimate =
    installmentActive &&
    Boolean(apartment.price) &&
    installmentMonths != null &&
    installmentMonths > 0;

  const formatConvertedPdfPrice = (amount: number) =>
    formatPriceWithCurrencySpaces(
      convertPrice(amount, project.currency || null, pdfCurrency),
      pdfCurrency,
    );

  const pdfMetrics = getPdfPageMetrics();
  const isWidePdf = pdfMetrics.mode === "wide";
  const isSquarePdf = pdfMetrics.mode === "square";
  const isTallPdf = pdfMetrics.mode === "tall";
  const visibleFields = getVisibleFields();
  const detailFields = visibleFields.filter(
    (field) => !SUMMARY_FIELD_NAMES.has(field.field_name),
  );
  const detailFieldCount = detailFields.length;
  const detailsAreCompact = detailFieldCount > 8 && detailFieldCount <= 16;
  const detailsAreDense = detailFieldCount > 16;
  const fieldHeavyThreshold = isWidePdf
    ? 8
    : isSquarePdf
      ? 12
      : isTallPdf
        ? 8
        : 14;
  const fieldHeavyMode = detailFieldCount > fieldHeavyThreshold;
  const fieldOverflowMode = detailFieldCount > 16;
  const displayPhotos = fieldHeavyMode
    ? photos.slice(0, isWidePdf ? 2 : 1)
    : photos;
  const shouldRenderMedia = !fieldHeavyMode;
  const hasPhotos = shouldRenderMedia && displayPhotos.length > 0;
  const hasFloorPlan = shouldRenderMedia && Boolean(floorPlan);
  const hasMedia = hasPhotos || hasFloorPlan;
  const useWideSplit = isWidePdf && hasMedia;
  const pdfStyle = {
    "--pdf-page-padding": isWidePdf
      ? "clamp(18px, 3.2vw, 38px) clamp(24px, 4vw, 52px)"
      : isSquarePdf
        ? "clamp(24px, 4.4vw, 46px)"
        : isTallPdf
          ? "clamp(20px, 4.4vw, 42px) clamp(18px, 4vw, 34px)"
          : "clamp(28px, 4.6vw, 54px)",
    "--pdf-gap": fieldHeavyMode
      ? "clamp(5px, 0.8vh, 10px)"
      : isWidePdf
        ? "clamp(8px, 1.4vh, 16px)"
        : isSquarePdf
          ? "clamp(10px, 1.5vh, 18px)"
          : "clamp(12px, 1.7vh, 22px)",
    "--pdf-column-gap": isWidePdf
      ? "clamp(20px, 3vw, 46px)"
      : "clamp(14px, 2.4vw, 28px)",
    "--pdf-card-padding-x": isWidePdf
      ? "clamp(20px, 2.6vw, 36px)"
      : "clamp(20px, 4vw, 32px)",
    "--pdf-card-padding-y": fieldHeavyMode
      ? "clamp(8px, 1.2vh, 14px)"
      : isWidePdf
        ? "clamp(14px, 2vh, 22px)"
        : "clamp(14px, 2.2vh, 22px)",
    "--pdf-title-size": isWidePdf
      ? "clamp(18px, 2.1vw, 24px)"
      : "clamp(19px, 2.6vw, 25px)",
    "--pdf-heading-size": isWidePdf
      ? "clamp(15px, 1.8vw, 20px)"
      : "clamp(17px, 2.3vw, 22px)",
    "--pdf-body-size": isWidePdf ? "clamp(12px, 1.35vw, 15px)" : "14px",
    "--pdf-image-gap": isWidePdf
      ? "clamp(8px, 1.2vw, 14px)"
      : "clamp(10px, 1.8vw, 16px)",
    "--pdf-field-row-py": detailsAreDense
      ? "0px"
      : detailsAreCompact
        ? "1px"
        : "4px",
    "--pdf-field-gap-y": detailsAreDense
      ? "0px"
      : detailsAreCompact
        ? "2px"
        : "4px",
    "--pdf-field-font-size": detailsAreDense
      ? "clamp(9px, 0.95vw, 11px)"
      : detailsAreCompact
        ? "clamp(11px, 1.1vw, 13px)"
        : "14px",
    "--pdf-photo-height": fieldHeavyMode
      ? isWidePdf
        ? "clamp(72px, 13vh, 128px)"
        : isSquarePdf
          ? "clamp(72px, 11vh, 112px)"
          : isTallPdf
            ? "clamp(52px, 6vh, 82px)"
            : "clamp(72px, 9vh, 108px)"
      : isWidePdf
        ? "clamp(92px, 18vh, 178px)"
        : isSquarePdf
          ? "clamp(96px, 17vh, 170px)"
          : isTallPdf
            ? "clamp(68px, 8.6vh, 118px)"
            : "clamp(110px, 16vh, 190px)",
    "--pdf-plan-height": fieldHeavyMode
      ? isWidePdf
        ? "clamp(150px, 32vh, 280px)"
        : isSquarePdf
          ? "clamp(120px, 17vh, 190px)"
          : isTallPdf
            ? "clamp(92px, 12vh, 160px)"
            : "clamp(120px, 18vh, 220px)"
      : isWidePdf
        ? "clamp(190px, 44vh, 380px)"
        : isSquarePdf
          ? "clamp(170px, 25vh, 260px)"
          : isTallPdf
            ? "clamp(120px, 18vh, 240px)"
            : "clamp(180px, 26vh, 320px)",
  } as CSSProperties;
  const shellClassName = [
    "mx-auto flex h-screen w-full flex-col gap-[var(--pdf-gap)] overflow-hidden p-[var(--pdf-page-padding)]",
    useWideSplit ? "max-w-none" : "max-w-[min(100%,920px)]",
  ].join(" ");
  const pageContentClassName = [
    "min-h-0 flex-1",
    useWideSplit
      ? "grid grid-cols-[minmax(0,0.86fr)_minmax(0,1.14fr)] items-stretch gap-[var(--pdf-column-gap)]"
      : "flex flex-col gap-[var(--pdf-gap)]",
  ].join(" ");
  const infoColumnClassName =
    "flex min-h-0 min-w-0 flex-col gap-[var(--pdf-gap)] overflow-hidden";
  const headerClassName = [
    "flex shrink-0 gap-[var(--pdf-column-gap)]",
    useWideSplit || isTallPdf
      ? "flex-col items-start"
      : "items-center justify-between",
  ].join(" ");
  const headerProjectClassName = [
    "flex min-w-0 items-center gap-4",
    useWideSplit || isTallPdf ? "text-left" : "text-right",
  ].join(" ");
  const heroClassName = [
    "shrink-0 rounded-[24px] bg-gray-50 px-[var(--pdf-card-padding-x)] py-[var(--pdf-card-padding-y)]",
  ].join(" ");
  const heroInnerClassName = [
    "flex gap-[var(--pdf-column-gap)]",
    useWideSplit || isTallPdf
      ? "flex-col items-start"
      : "flex-wrap items-center justify-between",
  ].join(" ");
  const fieldsGridClassName = [
    "grid min-h-0 gap-x-[var(--pdf-column-gap)] gap-y-[var(--pdf-field-gap-y)]",
    fieldOverflowMode
      ? isTallPdf
        ? "grid-cols-2"
        : "grid-cols-3"
      : isTallPdf
        ? "grid-cols-1"
        : isWidePdf
          ? detailFieldCount > 8
            ? "grid-cols-2"
            : "grid-cols-1"
          : isSquarePdf
            ? detailFieldCount > 12
              ? "grid-cols-3"
              : "grid-cols-2"
            : detailFieldCount > 14
              ? "grid-cols-3"
              : "grid-cols-2",
  ].join(" ");
  const mediaGridClassName = [
    "grid min-h-0 min-w-0 gap-[var(--pdf-gap)]",
    useWideSplit
      ? "content-center"
      : isSquarePdf && hasPhotos && hasFloorPlan
        ? "grid-cols-[minmax(0,1fr)_minmax(0,0.95fr)] items-start"
        : "grid-cols-1",
  ].join(" ");
  const photosGridClassName = [
    "grid gap-[var(--pdf-image-gap)]",
    isTallPdf ? "grid-cols-1" : "grid-cols-3",
  ].join(" ");
  const mediaSectionTitleClassName =
    "mb-2 text-[var(--pdf-heading-size)] font-semibold text-gray-900";
  const sectionTitleClassName =
    "shrink-0 text-[var(--pdf-heading-size)] font-semibold text-gray-900";

  const headerSection = (
    <div className={headerClassName}>
      <div className="flex min-w-0 items-center gap-3">
        {companyLogoUrl && (
          <img
            src={companyLogoUrl}
            alt="Company logo"
            className="h-10 w-10 shrink-0 rounded-md object-contain"
          />
        )}
        <span className="truncate text-xl font-semibold text-gray-900">
          {companyName || "Company"}
        </span>
      </div>
      <div className={headerProjectClassName}>
        <h2 className="min-w-0 text-xl font-semibold text-gray-900">
          {project.name}
        </h2>
        <div className="flex aspect-square w-14 shrink-0 items-center justify-center bg-white">
          <img
            src={qrCodeUrl}
            alt="Telegram QR Code"
            className="h-full w-full object-contain"
          />
        </div>
      </div>
    </div>
  );

  const summarySection = (
    <div className={heroClassName}>
      <div className={heroInnerClassName}>
        <div className="min-w-0 flex-1">
          <h2 className="mb-2 font-semibold text-[var(--pdf-title-size)] text-gray-900">
            {apartment.rooms == 0
              ? t("apartment.studio")
              : `${apartment.rooms} ${!isNaN(Number(apartment.rooms)) ? t("apartment.rooms") : ""}`}{" "}
            {apartment.area} {t("apartment.sqm")}
          </h2>
          <p className="text-[var(--pdf-body-size)] text-gray-600">
            {apartment.type === "apartment"
              ? subProjectEntityKind === "object"
                ? `Object ${numberVisible ? `№ ${apartment.apartment_number}` : ""}`
                : `${t("apartment.apartment")} ${numberVisible ? `№ ${apartment.apartment_number}` : ""}`
              : `${apartment.type} ${numberVisible ? `№ ${apartment.apartment_number}` : ""}`}
            {floorVisible &&
              ` • ${apartment.floor_number} ${t("apartment.floor")}`}
          </p>
        </div>
        <div
          className={useWideSplit || isTallPdf ? "text-left" : "text-center"}
        >
          <div className="mb-2 font-semibold text-[var(--pdf-heading-size)] text-gray-900">
            {apartment.price && priceVisible
              ? formatConvertedPdfPrice(apartment.price)
              : t("common.priceOnRequest")}
          </div>
          {showMonthlyInstallmentEstimate &&
            apartment.price != null &&
            installmentMonths != null && (
              <div className="mb-3 text-[var(--pdf-body-size)] text-gray-600">
                {t("project.from")}{" "}
                {formatConvertedPdfPrice(
                  Math.round(apartment.price / installmentMonths),
                )}{" "}
                / {t("installment.perMonth")}
              </div>
            )}
        </div>
        {showInstallmentTermsBlock && (
          <div className="flex flex-col items-start">
            <Badge className="mb-1 rounded-[10px] bg-green-500 px-[16px] text-sm font-medium text-white hover:bg-green-600">
              {t("installment.low")}
            </Badge>
            {installmentMonths != null && installmentMonths > 0 && (
              <div className="text-sm text-gray-600">
                {t("installment.period")} {installmentMonths}{" "}
                {t("installment.months")}
              </div>
            )}
            {downPaymentPercent != null && (
              <div className="text-sm text-gray-600">
                {t("installment.downPaymentFrom")} {downPaymentPercent}%
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );

  const detailsSection = detailFields.length > 0 && (
    <section className="flex min-h-0 flex-1 flex-col gap-2 overflow-hidden">
      <h3 className={sectionTitleClassName}>
        {subProjectEntityKind === "object"
          ? "Object details"
          : t("apartment.details")}
      </h3>
      <div className={fieldsGridClassName}>
        {detailFields.map((field) => {
          const value = getPdfFieldValue(apartment, field);

          if (value === null) return null;

          return (
            <div
              key={field.id}
              className="flex min-w-0 items-center justify-between gap-3 border-b border-gray-100 py-[var(--pdf-field-row-py)]"
            >
              <span className="min-w-0 truncate text-[var(--pdf-field-font-size)] text-gray-600">
                {field.is_custom
                  ? getFieldLabel(field)
                  : t(`project.${field.field_name}`)}
              </span>
              <span className="min-w-0 truncate text-right font-medium text-[var(--pdf-field-font-size)] text-gray-900">
                {field.field_name === "price"
                  ? formatPriceWithCurrencySpaces(
                      convertPrice(
                        value as number,
                        project?.currency || null,
                        pdfCurrency,
                      ),
                      pdfCurrency,
                    )
                  : formatFieldValue(value, field.field_type, field.field_name)}
              </span>
            </div>
          );
        })}
      </div>
    </section>
  );

  const mediaSection = hasMedia && (
    <div className={mediaGridClassName}>
      {hasPhotos && (
        <section className="min-w-0">
          <h3 className={mediaSectionTitleClassName}>{t("pdf.photos")}</h3>
          <div className={photosGridClassName}>
            {displayPhotos.map((photo) => (
              <div key={photo.id} className="relative min-w-0">
                <img
                  src={photo.image_url}
                  alt={t("pdf.apartmentPhoto")}
                  className="h-[var(--pdf-photo-height)] w-full rounded-lg border border-gray-200 object-cover"
                />
              </div>
            ))}
          </div>
        </section>
      )}

      {floorPlan && (
        <section className="min-w-0">
          <h3 className={mediaSectionTitleClassName}>{t("pdf.floorPlan")}</h3>
          <img
            src={floorPlan.image_url}
            alt={`${t("pdf.floorPlan")} ${floorPlan.floor_number}`}
            className="mx-auto h-[var(--pdf-plan-height)] max-w-full rounded-lg object-contain"
          />
        </section>
      )}
    </div>
  );

  return (
    <div
      className="h-screen overflow-hidden bg-[#fbfaf8] text-gray-900"
      style={pdfStyle}
    >
      {/* PDF Template Content */}
      <div className={shellClassName}>
        <div className={pageContentClassName}>
          <div className={infoColumnClassName}>
            {headerSection}
            {summarySection}
            {detailsSection}
          </div>
          {mediaSection}
        </div>
      </div>
    </div>
  );
};

export default PDFTemplatePage;
