import { Button } from "@gridix/ui";
import { MapTrifold } from "@phosphor-icons/react";
import { useLanguage } from "@gridix/utils/react";

interface GenplanActivatePromptProps {
  onActivate: () => void;
}

export function GenplanActivatePrompt({
  onActivate,
}: GenplanActivatePromptProps) {
  const { t } = useLanguage();

  return (
    <div className="flex min-h-[280px] flex-col items-center justify-center rounded-xl border-2 border-dashed border-border bg-muted/20 p-8 text-center">
      <div className="bg-primary/8 mb-4 flex h-16 w-16 items-center justify-center rounded-2xl">
        <MapTrifold size={32} className="text-primary" />
      </div>
      <h3 className="mb-2 text-base font-semibold">
        {t("genplan.activate.title")}
      </h3>
      <p className="mb-6 max-w-sm text-sm text-muted-foreground">
        {t("genplan.activate.description")}
      </p>
      <Button onClick={onActivate} className="gap-2">
        <MapTrifold size={16} />
        {t("genplan.activate.button")}
      </Button>
    </div>
  );
}
