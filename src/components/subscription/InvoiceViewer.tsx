import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/shared/ui/card';
import { Button } from '@/shared/ui/button';
import { Badge } from '@/shared/ui/badge';
import { Alert, AlertDescription } from '@/shared/ui/alert';
import { 
  FileText, 
  Download, 
  ExternalLink, 
  Clock, 
  CheckCircle, 
  AlertCircle,
  Calendar,
  DollarSign
} from 'lucide-react';

interface InvoiceViewerProps {
  invoice: {
    id: string;
    invoice_number: string | null;
    invoice_url: string | null;
    invoice_generated_at: string | null;
    invoice_paid_at: string | null;
    status: string;
    final_price: number | null;
    payment_purpose: string | null;
    duration_months: number | null;
    subscription_plans?: {
      name: string;
    };
    projects?: {
      name: string;
    };
  };
  onDownload?: () => void;
}

export function InvoiceViewer({ invoice, onDownload }: InvoiceViewerProps) {
  const [isDownloading, setIsDownloading] = useState(false);

  const handleDownload = async () => {
    if (!invoice.invoice_url) return;
    
    setIsDownloading(true);
    try {
      // Open PDF in new tab for download
      window.open(invoice.invoice_url, '_blank');
      onDownload?.();
    } catch (error) {
      console.error('Download error:', error);
    } finally {
      setIsDownloading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return (
          <Badge className="bg-green-500 text-white">
            <CheckCircle className="h-3 w-3 mr-1" />
            Оплачен
          </Badge>
        );
      case 'pending_payment':
        return (
          <Badge className="bg-yellow-500 text-white">
            <Clock className="h-3 w-3 mr-1" />
            Ожидает оплаты
          </Badge>
        );
      default:
        return (
          <Badge variant="secondary">
            <AlertCircle className="h-3 w-3 mr-1" />
            {status}
          </Badge>
        );
    }
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return '—';
    return new Date(dateString).toLocaleDateString('ru-RU');
  };

  const formatPrice = (price: number | null) => {
    if (!price) return '—';
    return `${price.toFixed(2)} GEL`;
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Счет на оплату
              </CardTitle>
              <CardDescription>
                {invoice.invoice_number || 'Номер счета не назначен'}
              </CardDescription>
            </div>
            {getStatusBadge(invoice.status)}
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Invoice Details */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <span className="font-medium">Дата создания:</span>
                <span>{formatDate(invoice.invoice_generated_at)}</span>
              </div>
              
              {invoice.invoice_paid_at && (
                <div className="flex items-center gap-2 text-sm">
                  <CheckCircle className="h-4 w-4 text-green-600" />
                  <span className="font-medium">Дата оплаты:</span>
                  <span>{formatDate(invoice.invoice_paid_at)}</span>
                </div>
              )}
            </div>

            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm">
                <DollarSign className="h-4 w-4 text-muted-foreground" />
                <span className="font-medium">Сумма:</span>
                <span className="font-semibold">{formatPrice(invoice.final_price)}</span>
              </div>
              
              {invoice.duration_months && (
                <div className="text-sm text-muted-foreground">
                  Длительность: {invoice.duration_months} мес.
                </div>
              )}
            </div>
          </div>

          {/* Service Details */}
          {(invoice.subscription_plans || invoice.projects) && (
            <div className="border-t pt-4">
              <h4 className="font-medium mb-2">Детали услуги</h4>
              <div className="space-y-1 text-sm">
                {invoice.subscription_plans && (
                  <div>
                    <span className="text-muted-foreground">План:</span> {invoice.subscription_plans.name}
                  </div>
                )}
                {invoice.projects && (
                  <div>
                    <span className="text-muted-foreground">Проект:</span> {invoice.projects.name}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Payment Purpose */}
          {invoice.payment_purpose && (
            <div className="border-t pt-4">
              <h4 className="font-medium mb-2">Назначение платежа</h4>
              <p className="text-sm text-muted-foreground">{invoice.payment_purpose}</p>
            </div>
          )}

          {/* Actions */}
          <div className="border-t pt-4">
            <div className="flex items-center gap-3">
              {invoice.invoice_url ? (
                <Button 
                  onClick={handleDownload}
                  disabled={isDownloading}
                  className="flex items-center gap-2"
                >
                  <Download className="h-4 w-4" />
                  {isDownloading ? 'Скачивание...' : 'Скачать PDF'}
                </Button>
              ) : (
                <Alert>
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    PDF-счет еще не сгенерирован. Обратитесь к администратору.
                  </AlertDescription>
                </Alert>
              )}

              {invoice.invoice_url && (
                <Button 
                  variant="outline" 
                  onClick={() => window.open(invoice.invoice_url!, '_blank')}
                  className="flex items-center gap-2"
                >
                  <ExternalLink className="h-4 w-4" />
                  Открыть
                </Button>
              )}
            </div>
          </div>

          {/* Payment Instructions */}
          {invoice.status === 'pending_payment' && (
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                <div className="space-y-2">
                  <p className="font-medium">Инструкции по оплате:</p>
                  <ol className="list-decimal list-inside space-y-1 text-sm">
                    <li>Скачайте PDF-счет по кнопке выше</li>
                    <li>Оплатите счет через банковский перевод по указанным реквизитам</li>
                    <li>Сохраните подтверждение оплаты</li>
                    <li>Ожидайте активации подписки администратором</li>
                  </ol>
                  <p className="text-sm text-muted-foreground mt-2">
                    При возникновении вопросов обращайтесь в техподдержку.
                  </p>
                </div>
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
