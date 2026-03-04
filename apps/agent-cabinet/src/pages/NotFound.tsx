import { Link } from "react-router-dom";
import { useLanguage } from "@/shared/lib/language";

export default function NotFound() {
  const { language, t } = useLanguage();
  return (
    <div className="py-16 text-center">
      <div className="text-2xl font-black text-slate-900">404</div>
      <div className="mt-2 text-sm text-slate-500">
        {t("common.notFound.title")}
      </div>
      <Link
        to={`/${language}/`}
        className="mt-6 inline-block font-bold underline"
      >
        {t("common.notFound.goHome")}
      </Link>
    </div>
  );
}
