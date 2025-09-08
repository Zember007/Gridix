import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useLanguage } from '@/contexts/LanguageContext';

interface ApartmentReservationFormProps {
  apartmentId: string;
  projectId: string;
  onSubmit?: (payload: { name: string; email: string; phone: string; apartmentId: string; projectId: string }) => void;
  onCancel?: () => void;
}

const ApartmentReservationForm = ({ apartmentId, projectId, onSubmit, onCancel }: ApartmentReservationFormProps) => {
  const { t } = useLanguage();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (submitting) return;
    setSubmitting(true);
    try {
      onSubmit?.({ name, email, phone, apartmentId, projectId });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="reservation-name">{t('managerAccounts.fullName')}</Label>
        <Input id="reservation-name" value={name} onChange={(e) => setName(e.target.value)} placeholder={t('managerAccounts.fullNamePlaceholder')} required />
      </div>
      <div className="space-y-2">
        <Label htmlFor="reservation-email">{t('managerAccounts.email')}</Label>
        <Input id="reservation-email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder={t('managerAccounts.emailPlaceholder')} required />
      </div>
      <div className="space-y-2">
        <Label htmlFor="reservation-phone">{t('managerAccounts.phone')}</Label>
        <Input id="reservation-phone" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder={t('managerAccounts.phonePlaceholder')} required />
      </div>
      <div className="flex justify-end gap-2 pt-2">
        <Button type="button" variant="outline" onClick={onCancel}>{t('managerAccounts.cancel')}</Button>
        <Button type="submit" disabled={submitting}>{submitting ? t('project.loading') : t('common.reserve')}</Button>
      </div>
    </form>
  );
};

export default ApartmentReservationForm;


