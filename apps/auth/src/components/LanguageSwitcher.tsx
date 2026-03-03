import { useState, useRef, useEffect } from "react";
import { useLanguage } from "@gridix/utils/react";
import { LANGUAGE_CONFIG, SUPPORTED_LANGUAGES } from "@gridix/utils";
import { ChevronDown } from "lucide-react";

export function LanguageSwitcher() {
  const { language, setLanguage } = useLanguage();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const current = LANGUAGE_CONFIG[language];
  const options = SUPPORTED_LANGUAGES.filter((code) => code !== language);

  return (
    <div ref={ref} className="relative z-50">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex w-[96px] items-center gap-2 rounded-xl border border-[var(--admin-border)] bg-[var(--admin-card-background)] px-3 py-2 text-xs font-medium text-[var(--admin-text-primary)] shadow-[var(--admin-card-shadow)] transition-colors hover:bg-[var(--admin-background-hover)]"
        aria-expanded={open}
        aria-haspopup="listbox"
        aria-label="Switch language"
      >
        <span>{current?.flag ?? language}</span>
        <span className="truncate uppercase">{language}</span>
        <ChevronDown
          className={`h-4 w-4 transition-transform ${open ? "rotate-180" : ""}`}
        />
      </button>

      {open && (
        <ul
          role="listbox"
          className="absolute left-0 top-full mt-1 min-w-[160px] rounded-xl border border-[var(--admin-border)] bg-[var(--admin-card-background)] py-1 shadow-[var(--admin-card-shadow)]"
        >
          {options.map((code) => {
            const config = LANGUAGE_CONFIG[code];
            return (
              <li key={code} role="option" aria-selected={false}>
                <button
                  type="button"
                  className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-[var(--admin-text-primary)] transition-colors hover:bg-[var(--admin-background-hover)]"
                  onClick={() => {
                    setLanguage(code);
                    setOpen(false);
                  }}
                >
                  <span>{config?.flag ?? code}</span>
                  <span>{config?.name ?? code}</span>
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
