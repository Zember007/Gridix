import { DEFAULT_CURRENCY, type CurrencyType } from "@/shared/lib/currency-utils";
import { Language, SUPPORTED_LANGUAGES } from "@/shared/lib/language-utils";

export interface ProjectEditorProject {
  id: string;
  name: string;
  description: string;
  address: string;
  floors: number;
  has_parking: boolean;
  has_commercial: boolean;
  building_image_url: string | null;
  latitude: number | null;
  longitude: number | null;
  currency: CurrencyType;
  installment_enabled: boolean;
  min_down_payment_percent: number;
  max_installment_months: number;
  pdf_presentation_url: string | null;
  theme_color: string;
  project_type?: "building" | "object" | null;
  facade_open: boolean;
  available_languages: Language[];
}

export const DEFAULT_PROJECT_EDITOR_PROJECT: ProjectEditorProject = {
  id: "",
  name: "",
  description: "",
  address: "",
  floors: 1,
  has_parking: false,
  has_commercial: false,
  building_image_url: null,
  latitude: null,
  longitude: null,
  currency: DEFAULT_CURRENCY,
  installment_enabled: false,
  min_down_payment_percent: 20,
  max_installment_months: 24,
  pdf_presentation_url: null,
  theme_color: "#000000",
  project_type: "building",
  facade_open: false,
  available_languages: SUPPORTED_LANGUAGES,
};


