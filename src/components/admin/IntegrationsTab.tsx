import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/shared/ui/card';
import { Package } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { AmoCRMConnection } from './AmoCRMConnection';
/* import { Bitrix24Connection } from './Bitrix24Connection'; */

export const IntegrationsTab = () => {
    const { t } = useLanguage();

    return (
        <div className="space-y-6">
            <div>
                <h2 className="text-2xl font-bold tracking-tight mb-2">{t('admin.integrations')}</h2>
                <p className="text-muted-foreground">
                    {t('admin.integrationsDescription') || 'Connect external services to your workspace.'}
                </p>
            </div>

            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {/* AmoCRM Card */}
                <AmoCRMConnection />

                {/* Bitrix24 Card */}
                {/* <Bitrix24Connection /> */}

                {/* Coming Soon Card */}
                <Card className="opacity-60 border-dashed">
                    <CardHeader>
                        <CardTitle className="text-xl text-muted-foreground">Salesforce</CardTitle>
                        <CardDescription>{t('admin.common.comingSoon') || 'Coming Soon'}</CardDescription>
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
