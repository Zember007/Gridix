import React, { useState, useEffect } from "react";
import {
  X,
  User,
  Phone,
  DollarSign,
  Globe,
  Building2,
  Tag,
  Plus,
  AlertTriangle,
  ArrowRight,
} from "lucide-react";
import { useTranslation } from "react-i18next";
import { LeadSource, ExtendedLead } from "@/entities/crm/model/types";

interface CreateLeadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreate: (lead: Partial<ExtendedLead>) => void;
  leads: ExtendedLead[]; // Passed to check duplicates
  projectOptions: Array<{ id: string; name: string }>;
  defaultProjectId?: string;
}

export const CreateLeadModal: React.FC<CreateLeadModalProps> = ({
  isOpen,
  onClose,
  onCreate,
  leads,
  projectOptions,
  defaultProjectId,
}) => {
  const { t } = useTranslation();
  const [formData, setFormData] = useState({
    name: "",
    phone: "",
    price: "",
    source: "walk_in",
    projectId: defaultProjectId || "",
  });
  const [preferences, setPreferences] = useState({
    locations: "",
    interest: "",
    requirements: "",
    purpose: "",
    budgetMin: "",
    budgetMax: "",
    currency: "USD",
  });
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState("");
  const [duplicateLead, setDuplicateLead] = useState<ExtendedLead | null>(null);

  // Reset when opening
  useEffect(() => {
    if (isOpen) {
      setFormData({
        name: "",
        phone: "",
        price: "",
        source: "walk_in",
        projectId: defaultProjectId || "",
      });
      setTags([]);
      setPreferences({
        locations: "",
        interest: "",
        requirements: "",
        purpose: "",
        budgetMin: "",
        budgetMax: "",
        currency: "USD",
      });
      setDuplicateLead(null);
    }
  }, [defaultProjectId, isOpen]);

  // Duplicate check logic
  useEffect(() => {
    const cleanPhone = formData.phone.replace(/[^0-9]/g, "");
    if (cleanPhone.length > 5) {
      const found = leads.find((l) =>
        l.phone.replace(/[^0-9]/g, "").includes(cleanPhone),
      );
      setDuplicateLead(found || null);
    } else {
      setDuplicateLead(null);
    }
  }, [formData.phone, leads]);

  if (!isOpen) return null;

  const handleAddTag = () => {
    if (tagInput.trim()) {
      setTags([...tags, tagInput.trim()]);
      setTagInput("");
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-sm duration-200 animate-in fade-in">
      <div className="flex max-h-[90vh] w-full max-w-md flex-col overflow-hidden rounded-2xl bg-white shadow-2xl">
        {/* Header */}
        <div className="sticky top-0 z-10 flex items-center justify-between border-b border-slate-100 bg-white px-6 py-5">
          <h3 className="text-lg font-bold text-slate-900">
            {t("leads.createModal.title")}
          </h3>
          <button
            onClick={onClose}
            className="text-slate-400 transition-colors hover:text-slate-600"
          >
            <X size={20} />
          </button>
        </div>

        {/* Body */}
        <div className="custom-scrollbar space-y-5 overflow-y-auto p-6">
          {/* Name */}
          <div className="space-y-1.5">
            <label className="ml-1 text-xs font-bold uppercase tracking-wider text-slate-500">
              {t("leads.createModal.clientLabel")}
            </label>
            <div className="group relative">
              <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 transition-colors group-focus-within:text-blue-500">
                <User size={18} />
              </div>
              <input
                type="text"
                className="w-full rounded-xl border border-slate-200 bg-slate-50 py-3 pl-10 pr-4 text-sm font-medium text-slate-900 outline-none transition-all placeholder:text-slate-400 focus:border-blue-500 focus:bg-white focus:ring-1 focus:ring-blue-500"
                placeholder={t("leads.createModal.namePlaceholder")}
                value={formData.name}
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value })
                }
                autoFocus
              />
            </div>
          </div>

          {!defaultProjectId && (
            <div className="space-y-1.5">
              <label className="ml-1 text-xs font-bold uppercase tracking-wider text-slate-500">
                {t("leads.drawer.project")}
              </label>
              <div className="group relative">
                <div className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 transition-colors group-focus-within:text-blue-500">
                  <Building2 size={18} />
                </div>
                <select
                  className="w-full cursor-pointer appearance-none rounded-xl border border-slate-200 bg-slate-50 py-3 pl-10 pr-4 text-sm font-medium text-slate-900 outline-none transition-all focus:border-blue-500 focus:bg-white focus:ring-1 focus:ring-blue-500"
                  value={formData.projectId}
                  onChange={(e) =>
                    setFormData({ ...formData, projectId: e.target.value })
                  }
                >
                  <option value="">{t("leads.filters.projectless")}</option>
                  {projectOptions.map((project) => (
                    <option key={project.id} value={project.id}>
                      {project.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          )}

          {/* Phone & Duplicate Warning */}
          <div className="space-y-1.5">
            <label className="ml-1 text-xs font-bold uppercase tracking-wider text-slate-500">
              {t("leads.createModal.phone")}
            </label>
            <div className="group relative">
              <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 transition-colors group-focus-within:text-blue-500">
                <Phone size={18} />
              </div>
              <input
                type="tel"
                className={`w-full rounded-xl border bg-slate-50 py-3 pl-10 pr-4 text-sm font-medium text-slate-900 outline-none transition-all placeholder:text-slate-400 ${duplicateLead ? "border-amber-300 bg-amber-50 focus:border-amber-500 focus:ring-1 focus:ring-amber-500" : "border-slate-200 focus:border-blue-500 focus:bg-white focus:ring-1 focus:ring-blue-500"}`}
                placeholder={t("leads.createModal.phonePlaceholder")}
                value={formData.phone}
                onChange={(e) =>
                  setFormData({ ...formData, phone: e.target.value })
                }
              />
            </div>

            {/* Duplicate Alert */}
            {duplicateLead && (
              <div className="mt-2 flex items-start gap-3 rounded-xl border border-amber-200 bg-amber-50 p-3 animate-in slide-in-from-top-1">
                <AlertTriangle
                  size={18}
                  className="mt-0.5 shrink-0 text-amber-600"
                />
                <div className="flex-1">
                  <div className="mb-1 text-xs font-bold uppercase text-amber-800">
                    {t("leads.createModal.duplicateFound")}
                  </div>
                  <p className="text-xs leading-relaxed text-amber-700">
                    {t("leads.createModal.duplicateExists", {
                      name: duplicateLead.name,
                    })}
                  </p>
                  <button className="mt-2 flex items-center gap-1 text-xs font-bold text-amber-700 hover:text-amber-900">
                    {t("leads.createModal.goToCard")} <ArrowRight size={12} />
                  </button>
                </div>
              </div>
            )}
          </div>

          <details className="rounded-xl border border-slate-200 bg-slate-50 p-4">
            <summary className="cursor-pointer text-xs font-bold uppercase tracking-wider text-slate-500">
              {t("leads.preferences.title")}
            </summary>
            <div className="mt-4 grid grid-cols-1 gap-3">
              <input
                type="text"
                value={preferences.locations}
                onChange={(e) =>
                  setPreferences({ ...preferences, locations: e.target.value })
                }
                placeholder={t("leads.preferences.locations")}
                className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-[var(--admin-primary)]"
              />
              <div className="grid grid-cols-2 gap-3">
                <input
                  type="number"
                  value={preferences.budgetMin}
                  onChange={(e) =>
                    setPreferences({
                      ...preferences,
                      budgetMin: e.target.value,
                    })
                  }
                  placeholder={t("leads.preferences.budgetMin")}
                  className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-[var(--admin-primary)]"
                />
                <input
                  type="number"
                  value={preferences.budgetMax}
                  onChange={(e) =>
                    setPreferences({
                      ...preferences,
                      budgetMax: e.target.value,
                    })
                  }
                  placeholder={t("leads.preferences.budgetMax")}
                  className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-[var(--admin-primary)]"
                />
              </div>
              <input
                type="text"
                value={preferences.interest}
                onChange={(e) =>
                  setPreferences({ ...preferences, interest: e.target.value })
                }
                placeholder={t("leads.preferences.interest")}
                className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-[var(--admin-primary)]"
              />
              <textarea
                value={preferences.requirements}
                onChange={(e) =>
                  setPreferences({
                    ...preferences,
                    requirements: e.target.value,
                  })
                }
                placeholder={t("leads.preferences.requirements")}
                className="min-h-20 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-[var(--admin-primary)]"
              />
            </div>
          </details>

          <div className="grid grid-cols-2 gap-4">
            {/* Budget */}
            <div className="space-y-1.5">
              <label className="ml-1 text-xs font-bold uppercase tracking-wider text-slate-500">
                {t("leads.createModal.budgetLabel")}
              </label>
              <div className="group relative">
                <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 transition-colors group-focus-within:text-green-600">
                  <DollarSign size={18} />
                </div>
                <input
                  type="number"
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 py-3 pl-10 pr-4 text-sm font-medium text-slate-900 outline-none transition-all placeholder:text-slate-400 focus:border-green-500 focus:bg-white focus:ring-1 focus:ring-green-500"
                  placeholder="0"
                  value={formData.price}
                  onChange={(e) =>
                    setFormData({ ...formData, price: e.target.value })
                  }
                />
              </div>
            </div>

            {/* Source */}
            <div className="space-y-1.5">
              <label className="ml-1 text-xs font-bold uppercase tracking-wider text-slate-500">
                {t("leads.createModal.sourceLabel")}
              </label>
              <div className="group relative">
                <div className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 transition-colors group-focus-within:text-purple-500">
                  <Globe size={18} />
                </div>
                <select
                  className="w-full cursor-pointer appearance-none rounded-xl border border-slate-200 bg-slate-50 py-3 pl-10 pr-4 text-sm font-medium text-slate-900 outline-none transition-all focus:border-purple-500 focus:bg-white focus:ring-1 focus:ring-purple-500"
                  value={formData.source}
                  onChange={(e) =>
                    setFormData({ ...formData, source: e.target.value })
                  }
                >
                  <option value="walk_in">{t("leads.sources.walk_in")}</option>
                  <option value="instagram">
                    {t("leads.sources.instagram")}
                  </option>
                  <option value="website">{t("leads.sources.website")}</option>
                  <option value="facebook">
                    {t("leads.sources.facebook")}
                  </option>
                  <option value="referral">
                    {t("leads.sources.referral")}
                  </option>
                </select>
              </div>
            </div>
          </div>

          {/* Tags */}
          <div className="space-y-1.5">
            <label className="ml-1 text-xs font-bold uppercase tracking-wider text-slate-500">
              {t("leads.createModal.tagsLabel")}
            </label>
            <div
              className="flex min-h-[50px] cursor-text flex-wrap gap-2 rounded-xl border border-slate-200 bg-slate-50 p-2 transition-all focus-within:border-blue-500 focus-within:bg-white focus-within:ring-1 focus-within:ring-blue-500"
              onClick={() => document.getElementById("tag-input")?.focus()}
            >
              {tags.map((tag, idx) => (
                <span
                  key={idx}
                  className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-2 py-1 text-xs font-semibold text-slate-700 shadow-sm"
                >
                  {tag}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setTags(tags.filter((_, i) => i !== idx));
                    }}
                    className="rounded-full p-0.5 text-slate-400 transition-colors hover:bg-red-50 hover:text-red-500"
                  >
                    <X size={12} />
                  </button>
                </span>
              ))}
              <div className="flex min-w-[100px] flex-1 items-center gap-2 px-1">
                <Tag size={16} className="shrink-0 text-slate-400" />
                <input
                  id="tag-input"
                  type="text"
                  className="h-8 w-full bg-transparent text-sm font-medium text-slate-900 outline-none placeholder:text-slate-400"
                  placeholder={t("leads.createModal.tagPlaceholder")}
                  value={tagInput}
                  onChange={(e) => setTagInput(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleAddTag()}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex shrink-0 gap-3 border-t border-slate-100 bg-slate-50 p-5">
          <button
            onClick={onClose}
            className="flex-1 rounded-xl border border-slate-200 bg-white py-2.5 text-sm font-bold text-slate-700 shadow-sm transition-colors hover:bg-slate-50"
          >
            {t("leads.createModal.cancel")}
          </button>
          <button
            onClick={() => {
              onCreate({
                name: formData.name,
                phone: formData.phone,
                price: Number(formData.price) || 0,
                source: formData.source as LeadSource,
                project_id: defaultProjectId || formData.projectId || null,
                tags: tags,
                preferences: {
                  locations: preferences.locations
                    .split(",")
                    .map((item) => item.trim())
                    .filter(Boolean),
                  interest: preferences.interest.trim(),
                  requirements: preferences.requirements.trim(),
                  purpose: preferences.purpose.trim(),
                  budgetMin: preferences.budgetMin
                    ? Number(preferences.budgetMin)
                    : null,
                  budgetMax: preferences.budgetMax
                    ? Number(preferences.budgetMax)
                    : null,
                  currency: preferences.currency || "USD",
                },
              });
              setFormData({
                name: "",
                phone: "",
                price: "",
                source: "walk_in",
                projectId: defaultProjectId || "",
              });
              setTags([]);
            }}
            disabled={!formData.name.trim() || !!duplicateLead}
            className="flex flex-[2] items-center justify-center gap-2 rounded-xl bg-[var(--admin-primary)] py-2.5 text-sm font-bold text-[var(--admin-text-on-primary)] shadow-md transition-colors hover:bg-[var(--admin-primary-hover)] disabled:cursor-not-allowed disabled:opacity-50"
          >
            <Plus size={18} />
            {duplicateLead
              ? t("leads.createModal.duplicateNotAllowed")
              : t("leads.createModal.createDeal")}
          </button>
        </div>
      </div>
    </div>
  );
};
