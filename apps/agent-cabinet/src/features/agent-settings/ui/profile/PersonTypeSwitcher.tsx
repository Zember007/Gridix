import { Label } from "@gridix/ui";
import { Building2, User } from "lucide-react";

type PersonType = "company" | "individual";

type Props = {
  personType: PersonType;
  onChange: (next: PersonType) => void;
  t: (key: string) => string;
};

export function PersonTypeSwitcher({ personType, onChange, t }: Props) {
  return (
    <div className="space-y-2">
      <Label className="text-xs font-bold uppercase tracking-wider text-[var(--admin-text-muted)]">
        {t("adminSettings.accountType")}
      </Label>
      <div className="grid grid-cols-2 gap-2 rounded-lg border border-[var(--admin-border)] bg-[var(--admin-background-secondary)] p-1">
        <button
          type="button"
          onClick={() => onChange("company")}
          className={`flex items-center justify-center gap-2 rounded-md py-2 text-sm font-bold transition-all ${
            personType === "company"
              ? "bg-[var(--admin-card-background)] text-[var(--admin-text-primary)] shadow-sm ring-1 ring-[var(--admin-border)]"
              : "text-[var(--admin-text-muted)] hover:text-[var(--admin-text-secondary)]"
          }`}
        >
          <Building2 size={16} /> {t("adminSettings.company")}
        </button>
        <button
          type="button"
          onClick={() => onChange("individual")}
          className={`flex items-center justify-center gap-2 rounded-md py-2 text-sm font-bold transition-all ${
            personType === "individual"
              ? "bg-[var(--admin-card-background)] text-[var(--admin-text-primary)] shadow-sm ring-1 ring-[var(--admin-border)]"
              : "text-[var(--admin-text-muted)] hover:text-[var(--admin-text-secondary)]"
          }`}
        >
          <User size={16} /> {t("adminSettings.individual")}
        </button>
      </div>
    </div>
  );
}
