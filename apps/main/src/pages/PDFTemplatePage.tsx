import { useParams } from "react-router-dom";
import { useLanguage } from "@/contexts/LanguageContext";
import { formatPriceWithCurrency, convertPrice } from "@gridix/utils/lib";
import { Language } from "@gridix/utils/lib";
import { Loader } from "@gridix/ui";
import { useState, useEffect } from "react";
import { Apartment } from "@/entities/apartment/model/types";
import { Badge } from "@gridix/ui";
import type { Tables } from "@gridix/types/database";
import { loadPdfTemplateData } from "@/features/projectSelector/api/projectSelectorApi";
import { normalizeSubProjectKind } from "@/components/project-selector/lib/subProjectDisplay";

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

const PDFTemplatePage = ({
  useId = false,
  apartmentIdProp = "",
  projectIdProp = "",
}: PDFTemplatePageProps) => {
  const { projectSlug, projectId, apartmentNumber, apartmentId } = useParams<{
    projectSlug?: string;
    projectId?: string;
    apartmentNumber?: string;
    apartmentId?: string;
    lang?: string;
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
      type: "layout" | "apartment";
    }>
  >([]);
  const [floorPlan, setFloorPlan] = useState<{
    id: string;
    image_url: string;
    floor_number: number;
  } | null>(null);
  const [selectedCurrency, setSelectedCurrency] = useState<string>("RUB");
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
        );

        setProject(result.project);
        setSubProjectEntityKind(normalizeSubProjectKind(result.subProjectType));
        setApartment(result.apartment as Apartment | null);
        setFieldSettings(
          (result.fieldSettings ?? []) as unknown as PdfFieldSetting[],
        );
        setProjectDomains(result.projectDomains ?? []);
        setCompanyName(result.companyName);
        setCompanyLogoUrl(result.companyLogoUrl);

        const layoutPhotos = (result.layoutPhotos ?? []).map((photo) => ({
          ...photo,
          type: "layout" as const,
        }));
        const apartmentPhotos = (result.apartmentPhotos ?? []).map((photo) => ({
          ...photo,
          type: "apartment" as const,
        }));
        setPhotos([...layoutPhotos, ...apartmentPhotos]);

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
  }, [projectIdentifier, apartmentIdentifier, t, useId]);

  // Initialize currency from project if available
  useEffect(() => {
    if (project?.currency) {
      setSelectedCurrency(project.currency);
    }
  }, [project?.currency]);

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
        const url = `${baseDomain}/${language}/project/${project.slug}/apartment/${apartment.apartment_number}`;
        const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(url)}`;
        setQrCodeUrl(qrUrl);
      } catch (err) {
        console.error("Error generating QR code:", err);
        setQrCodeUrl("");
      }
    };

    updateQRCode();
  }, [project, apartment, language, projectDomains]);

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
      .sort((a, b) => a.sort_order - b.sort_order)
      .slice(0, 6);
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
        ? formatPriceWithCurrency(value, project?.currency || null)
        : "-";
    }

    if (fieldName === "area") {
      return `${value} м²`;
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

  return (
    <div className="min-h-screen bg-white">
      {/* PDF Template Content */}
      <div className="mx-auto flex max-w-4xl flex-col gap-3 p-8">
        {/* Header Section */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            {companyLogoUrl && (
              <img
                src={companyLogoUrl}
                alt="Company logo"
                className="h-10 w-10 rounded-md object-contain"
              />
            )}
            <span className="text-lg font-semibold text-gray-700">
              {companyName || "Company"}
            </span>
          </div>
          <div className="flex items-center gap-8 text-right">
            <h2 className="text-xl font-semibold text-gray-900">
              {project.name}
            </h2>
            <div className="flex aspect-square w-14 items-center justify-center bg-white">
              <img
                src={qrCodeUrl}
                alt="Telegram QR Code"
                className="h-full w-full object-contain"
              />
            </div>
          </div>
        </div>

        {/* Main Apartment Info Card */}
        <div className="rounded-[40px] bg-gray-50 p-2 px-8">
          <div className="flex items-center justify-between gap-8">
            <div className="flex-1">
              <h2 className="mb-2 text-xl font-semibold text-gray-900">
                {apartment.rooms == 0
                  ? t("apartment.studio")
                  : `${apartment.rooms} ${typeof apartment.rooms === "number" ? t("apartment.rooms") : ""}`}{" "}
                {apartment.area} m²
              </h2>
              <p className="text-gray-600">
                {apartment.type === "apartment"
                  ? subProjectEntityKind === "object"
                    ? `Object ${numberVisible ? `№ ${apartment.apartment_number}` : ""}`
                    : `${t("apartment.apartment")} ${numberVisible ? `№ ${apartment.apartment_number}` : ""}`
                  : `${apartment.type} ${numberVisible ? `№ ${apartment.apartment_number}` : ""}`}
                {floorVisible &&
                  ` • ${apartment.floor_number} ${t("apartment.floor")}`}
              </p>
            </div>
            <div className="text-center">
              <div className="mb-2 text-xl font-semibold text-gray-900">
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
              {project?.installment_enabled && apartment.price && (
                <div className="mb-3 text-lg text-gray-600">
                  {t("project.from")}{" "}
                  {formatPriceWithCurrency(
                    convertPrice(
                      Math.round(
                        apartment.price /
                          (project?.max_installment_months || 24),
                      ),
                      project?.currency || null,
                      selectedCurrency,
                    ),
                    selectedCurrency,
                  )}{" "}
                  / {t("installment.perMonth")}
                </div>
              )}
            </div>
            <div className="flex flex-col items-start">
              <Badge className="mb-1 rounded-[10px] bg-green-500 px-[16px] text-sm font-medium text-white hover:bg-green-600">
                {t("installment.low")}
              </Badge>
              <div className="text-sm text-gray-600">
                {t("installment.period")}{" "}
                {project?.max_installment_months || 12}{" "}
                {t("installment.months")}
              </div>
              <div className="text-sm text-gray-600">
                {t("installment.downPaymentFrom")}{" "}
                {project?.min_down_payment_percent ?? 30}%
              </div>
            </div>
          </div>
        </div>

        {/* Additional Information */}
        {getVisibleFields().length > 0 && (
          <>
            <h3 className="text-xl font-semibold text-gray-900">
              {subProjectEntityKind === "object"
                ? "Object details"
                : t("apartment.details")}
            </h3>
            <div className="grid grid-cols-2 gap-4">
              {getVisibleFields().map((field) => {
                let value: unknown = null;
                if (field.is_custom) {
                  value = getCustomFieldValue(apartment, field.field_name);
                } else {
                  switch (field.field_name) {
                    case "rooms":
                      if (typeof apartment.rooms === "number") {
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
                    className="flex items-center justify-between border-b border-gray-100 py-1"
                  >
                    <span className="text-sm text-gray-600">
                      {field.is_custom
                        ? getFieldLabel(field)
                        : t(`project.${field.field_name}`)}
                    </span>
                    <span className="text-sm font-medium text-gray-900">
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
          </>
        )}

        {/* Photos Section */}
        {photos.length > 0 && (
          <>
            <h3 className="text-xl font-semibold text-gray-900">
              {t("pdf.photos")}
            </h3>
            <div className="grid grid-cols-3 gap-6">
              {photos.slice(0, 3).map((photo, index) => (
                <div key={photo.id} className="relative">
                  <img
                    src={photo.image_url}
                    alt={`${photo.type === "layout" ? t("pdf.layout") : t("pdf.apartmentPhoto")} ${index + 1}`}
                    className="h-auto w-full rounded-lg border border-gray-200 object-cover"
                  />
                  {photo.type === "layout" && (
                    <div className="absolute bottom-2 left-2 rounded bg-black bg-opacity-50 px-2 py-1 text-xs text-white">
                      {t("pdf.layout")}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </>
        )}

        {/* Floor Plan Section */}
        {floorPlan && (
          <>
            <h3 className="text-xl font-semibold text-gray-900">
              {t("pdf.floorPlan")}
            </h3>
            <img
              src={floorPlan.image_url}
              alt={`${t("pdf.floorPlan")} ${floorPlan.floor_number}`}
              className="mx-auto h-full max-h-[400px] w-auto"
            />
          </>
        )}
      </div>
    </div>
  );
};

export default PDFTemplatePage;
