import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { Link } from "react-router-dom";
import { useLanguage } from "@/contexts/LanguageContext";
export default function NotFound() {
    const { language, t } = useLanguage();
    return (_jsxs("div", { className: "py-16 text-center", children: [_jsx("div", { className: "text-2xl font-black text-slate-900", children: "404" }), _jsx("div", { className: "text-sm text-slate-500 mt-2", children: t("common.notFound.title") }), _jsx(Link, { to: `/${language}/`, className: "inline-block mt-6 font-bold underline", children: t("common.notFound.goHome") })] }));
}
