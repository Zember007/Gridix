import { useState } from 'react';
import { Button } from "@gridix/ui";
import { Input } from "@gridix/ui";
import { Label } from "@gridix/ui";
import { useLanguage } from '@/contexts/LanguageContext';
import { toast } from 'sonner';
import { supabase } from "@gridix/utils/api";
import { SuccessNotification } from "@gridix/ui";

interface ApartmentReservationFormProps {
  apartmentId: string;
  projectId: string;
  onSubmit?: (payload: { name: string; email: string; phone: string; apartmentId: string; projectId: string }) => void;
  onCancel?: () => void;
  themeColor?: string;
}

const ApartmentReservationForm = ({ apartmentId, projectId, onSubmit, onCancel, themeColor = '#000000' }: ApartmentReservationFormProps) => {
  const { t } = useLanguage();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (submitting) return;

    setSubmitting(true);
    try {
      // Call the custom onSubmit if provided (for backward compatibility)
      if (onSubmit) {
        onSubmit({ name, email, phone, apartmentId, projectId });
      }

      // Send lead to CRM(s) via Edge Function
      const { data, error } = await supabase.functions.invoke('crm-create-lead', {
        body: {
          name,
          email,
          phone,
          apartmentId,
          projectId,
          agentId: (new URLSearchParams(window.location.search)).get('agent_id') ||
            JSON.parse(localStorage.getItem(`agent_context:${projectId}`) || '{}')?.agent_id
        }
      });

      if (error) {
        console.error('Error creating lead:', error);
        toast.error('Произошла ошибка при отправке заявки. Попробуйте еще раз.');
        return;
      }

      if (data?.error) {
        console.error('AmoCRM API error:', data.error);
        toast.error(`Ошибка: ${data.error}`);
        return;
      }

      // Show success notification
      setShowSuccess(true);

      // Clear form
      setName('');
      setEmail('');
      setPhone('');

    } catch (error) {
      console.error('Unexpected error:', error);
      toast.error('Произошла неожиданная ошибка. Попробуйте еще раз.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleSuccessClose = () => {
    setShowSuccess(false);
    // Close modal after success notification
    setTimeout(() => {
      onCancel?.();
    }, 300);
  };

  return (
    <>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="reservation-name">{t('managerAccounts.fullName')}</Label>
          <Input
            id="reservation-name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder={t('managerAccounts.fullNamePlaceholder')}
            required
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="reservation-email">{t('auth.email')}</Label>
          <Input
            id="reservation-email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder={t('managerAccounts.emailPlaceholder')}
            required
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="reservation-phone">{t('managerAccounts.phone')}</Label>
          <Input
            id="reservation-phone"
            type="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="+995 (999) 00-00-00"
            required
          />
        </div>
        <div className="flex justify-end gap-2 pt-2">
          <Button type="button" variant="outline" onClick={onCancel}>
            {t('managerAccounts.cancel')}
          </Button>
          <Button
            type="submit"
            disabled={submitting}
            className="text-white hover:opacity-90"
            style={{ backgroundColor: themeColor }}
          >
            {submitting ? t('auth.sending') : t('apartment.sendRequest')}
          </Button>
        </div>
      </form>

      <SuccessNotification
        isVisible={showSuccess}
        onClose={handleSuccessClose}
        message={t('apartment.requestSent')}
        duration={2500}
      />
    </>
  );
};

export default ApartmentReservationForm;


