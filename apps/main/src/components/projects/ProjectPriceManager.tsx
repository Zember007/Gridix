import { useState } from "react";
import { Button } from "@gridix/ui";
import { Input } from "@gridix/ui";
import { Label } from "@gridix/ui";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@gridix/ui";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@gridix/ui";
import {
  DollarSign,
  Percent,
  TrendingUp,
  TrendingDown,
  AlertCircle,
} from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@gridix/utils/api";
import { useLanguage } from "@/contexts/LanguageContext";

interface ProjectPriceManagerProps {
  projectId: string;
}

export function ProjectPriceManager({ projectId }: ProjectPriceManagerProps) {
  const { t } = useLanguage();
  const [operation, setOperation] = useState<"increase" | "decrease">(
    "increase",
  );
  const [type, setType] = useState<"percentage" | "fixed">("percentage");
  const [value, setValue] = useState<string>("");
  const [loading, setLoading] = useState(false);

  const handleUpdate = async () => {
    if (!value || isNaN(parseFloat(value))) {
      toast.error(t("projectEditor.priceUpdateInvalidValue"));
      return;
    }

    const numValue = parseFloat(value);
    if (numValue < 0) {
      toast.error(t("projectEditor.priceUpdateNegativeValue"));
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase.functions.invoke(
        "update-project-prices",
        {
          body: {
            projectId,
            operation,
            type,
            value: numValue,
          },
        },
      );

      if (error) throw error;

      toast.success(t("projectEditor.priceUpdateSuccess"));
      setValue("");
    } catch (error) {
      console.error("Error updating prices:", error);
      toast.error(t("projectEditor.priceUpdateError"));
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="mt-6 border-l-4 border-l-black">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <DollarSign className="h-5 w-5" />
          {t("projectEditor.priceManagement")}
        </CardTitle>
        <CardDescription>
          {t("projectEditor.priceManagementDesc")}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end">
          <div>
            <Label className="mb-2 block">{t("projectEditor.operation")}</Label>
            <div className="flex flex-wrap gap-2">
              <Button
                type="button"
                variant={operation === "increase" ? "default" : "outline"}
                onClick={() => setOperation("increase")}
                className={`flex-1 ${operation === "increase" ? "bg-green-600 hover:bg-green-700" : ""}`}
              >
                <TrendingUp className="mr-2 h-4 w-4" />
                {t("projectEditor.increase")}
              </Button>
              <Button
                type="button"
                variant={operation === "decrease" ? "default" : "outline"}
                onClick={() => setOperation("decrease")}
                className={`flex-1 ${operation === "decrease" ? "bg-red-600 hover:bg-red-700" : ""}`}
              >
                <TrendingDown className="mr-2 h-4 w-4" />
                {t("projectEditor.decrease")}
              </Button>
            </div>
          </div>

          <div className="min-w-[180px] flex-1">
            <Label className="mb-2 block">{t("projectEditor.type")}</Label>
            <Select
              value={type}
              onValueChange={(v: "percentage" | "fixed") => setType(v)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="percentage">
                  <div className="flex items-center">
                    <Percent className="mr-2 h-4 w-4 text-muted-foreground" />
                    {t("projectEditor.percentage")}
                  </div>
                </SelectItem>
                <SelectItem value="fixed">
                  <div className="flex items-center">
                    <DollarSign className="mr-2 h-4 w-4 text-muted-foreground" />
                    {t("projectEditor.fixedAmount")}
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="min-w-[180px] flex-1">
            <Label htmlFor="price-value" className="mb-2 block">
              {t("projectEditor.value")}
              {type === "percentage" ? " (%)" : ""}
            </Label>
            <div className="relative">
              <Input
                id="price-value"
                type="number"
                min="0"
                step={type === "percentage" ? "0.1" : "1"}
                value={value}
                onChange={(e) => setValue(e.target.value)}
                placeholder={type === "percentage" ? "10" : "1000"}
                className="pl-9"
              />
              <div className="absolute left-3 top-2.5 text-muted-foreground">
                {type === "percentage" ? (
                  <Percent className="h-4 w-4" />
                ) : (
                  <DollarSign className="h-4 w-4" />
                )}
              </div>
            </div>
          </div>

          <div className="min-w-[140px]">
            <Button
              onClick={handleUpdate}
              disabled={loading || !value}
              className="w-full"
            >
              {loading ? t("projectEditor.updating") : t("projectEditor.apply")}
            </Button>
          </div>
        </div>

        <div className="mt-4 flex items-start gap-3 rounded-md bg-muted/50 p-3 text-sm text-muted-foreground">
          <AlertCircle className="mt-0.5 h-5 w-5 flex-shrink-0 text-blue-500" />
          <p>
            {(() => {
              const warningKey =
                operation === "increase"
                  ? "projectEditor.increaseWarning"
                  : "projectEditor.decreaseWarning";
              const warningText = t(warningKey);
              const typeText =
                type === "percentage"
                  ? t("projectEditor.percentage")
                  : t("projectEditor.fixedAmount");
              const displayValue = value || "...";

              return warningText
                .replace("{value}", displayValue)
                .replace("{type}", typeText);
            })()}{" "}
            {t("projectEditor.irreversibleWarning")}
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
