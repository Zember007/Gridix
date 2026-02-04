import { Link } from "react-router-dom";
import { useLanguage } from "@/contexts/LanguageContext";

export default function NotFound() {
  const { language, t } = useLanguage();
  return (
    <div className="py-16 text-center">
      <div className="text-2xl font-black text-slate-900">404</div>
      <div className="text-sm text-slate-500 mt-2">{t("common.notFound.title")}</div>
      <Link to={`/${language}/`} className="inline-block mt-6 font-bold underline">
        {t("common.notFound.goHome")}
      </Link>
    </div>
  );
}

