import {
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@gridix/ui";
import { Download, FileCheck, FileText } from "lucide-react";
import type { AgentSignedContractsSectionProps } from "./types";

export function AgentSignedContractsSection(
  props: AgentSignedContractsSectionProps,
) {
  if (!props.applicationId) return null;

  return (
    <Card className="overflow-hidden border-[var(--admin-border)] shadow-sm transition-all hover:shadow-md">
      <CardHeader className="border-b border-[var(--admin-border-light)] bg-[var(--admin-background-secondary)] pb-4">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-xl font-bold text-[var(--admin-text-primary)]">
              {props.t("common.settings.signedContractsTitle")}
            </CardTitle>
            <CardDescription className="text-[var(--admin-text-muted)]">
              {props.t("common.settings.signedContractsDesc")}
            </CardDescription>
          </div>
          <FileCheck className="text-[var(--admin-success)]" size={24} />
        </div>
      </CardHeader>
      <CardContent className="space-y-4 pt-6">
        <div className="flex justify-end">
          <Button
            variant="outline"
            size="sm"
            onClick={props.onRefresh}
            className="rounded-lg border-[var(--admin-border)] font-bold hover:bg-[var(--admin-background-secondary)]"
          >
            {props.t("common.settings.refreshContracts")}
          </Button>
        </div>

        {props.loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="h-6 w-6 animate-spin rounded-full border-2 border-[var(--admin-primary)] border-t-transparent" />
          </div>
        ) : props.error ? (
          <div className="rounded-xl border border-[var(--admin-border)] bg-[var(--admin-background-secondary)] p-4 text-center text-sm font-semibold text-[var(--admin-error)]">
            {props.t("common.settings.signedContractsLoadError")}
          </div>
        ) : props.contracts.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-[var(--admin-background-secondary)] text-[var(--admin-text-muted)]">
              <FileText size={20} />
            </div>
            <p className="text-sm font-bold text-[var(--admin-text-primary)]">
              {props.t("common.settings.noSignedContracts")}
            </p>
            <p className="text-xs text-[var(--admin-text-muted)]">
              {props.t("common.settings.noSignedContractsDesc")}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {props.contracts.map((c) => {
              const lang = c.template_lang
                ? c.template_lang.toUpperCase()
                : "\u2014";
              return (
                <div
                  key={c.id}
                  className="group flex items-center gap-4 rounded-2xl border border-[var(--admin-border)] bg-[var(--admin-card-background)] p-4 transition-all hover:border-[var(--admin-primary)] hover:shadow-lg"
                >
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-[var(--admin-background-secondary)] text-[var(--admin-error)] transition-transform group-hover:scale-110 group-hover:bg-[var(--admin-background-hover)]">
                    {c.signed_contract_mime === "application/pdf" ? (
                      <FileText size={24} />
                    ) : (
                      <FileText size={24} />
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-sm font-black text-[var(--admin-text-primary)]">
                      {props.t("common.settings.contractLabel")} {lang}
                    </div>
                    <div className="flex items-center gap-2 text-[10px] font-bold uppercase text-[var(--admin-text-muted)]">
                      <span>{c.signed_at?.split("T")[0] ?? "\u2014"}</span>
                      <span>{"\u2022"}</span>
                      <span>{props.t("common.settings.pdfLabel")}</span>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    asChild
                    disabled={!c.signed_download_url}
                    className="rounded-full hover:bg-[var(--admin-background-hover)] hover:text-[var(--admin-primary)]"
                  >
                    <a
                      href={c.signed_download_url ?? undefined}
                      target="_blank"
                      rel="noreferrer"
                    >
                      <Download size={18} />
                    </a>
                  </Button>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
