import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@gridix/ui";
import { Package } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import { AmoCRMConnection } from "./AmoCRMConnection";
import { Bitrix24Connection } from "./Bitrix24Connection";

export const IntegrationsTab = () => {
  const { t } = useLanguage();

  return (
    <div className="space-y-6">
      <div>
        <h2 className="mb-2 text-2xl font-bold tracking-tight">
          {t("admin.integrations")}
        </h2>
        <p className="text-muted-foreground">
          {t("admin.integrationsDescription")}
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {/* AmoCRM Card */}
        <AmoCRMConnection />

        {/* Bitrix24 Card */}
        {/* <Bitrix24Connection /> */}

        <Card className="border-dashed opacity-60">
          <CardHeader>
            <CardTitle className="text-xl text-muted-foreground">
              Bitrix24
            </CardTitle>
            <CardDescription>{t("admin.common.comingSoon")}</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-center py-8">
              <Package className="h-12 w-12 text-muted-foreground opacity-20" />
            </div>
          </CardContent>
        </Card>

        {/* Coming Soon Card */}
        <Card className="border-dashed opacity-60">
          <CardHeader>
            <CardTitle className="text-xl text-muted-foreground">
              Salesforce
            </CardTitle>
            <CardDescription>{t("admin.common.comingSoon")}</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-center py-8">
              <Package className="h-12 w-12 text-muted-foreground opacity-20" />
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
