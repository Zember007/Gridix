import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useLanguage } from '@/contexts/LanguageContext';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (submitting) return;
    
    setSubmitting(true);
    try {
      // Call the custom onSubmit if provided (for backward compatibility)
      if (onSubmit) {
        onSubmit({ name, email, phone, apartmentId, projectId });
      }

      // Send lead to AmoCRM via Edge Function
      const { data, error } = await supabase.functions.invoke('create-amocrm-lead', {
        body: {
          name,
          email,
          phone,
          apartmentId,
          projectId
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

      toast.success('Заявка успешно отправлена! Мы свяжемся с вами в ближайшее время.');
      
      // Clear form
      setName('');
      setEmail('');
      setPhone('');
      
      // Close modal if onCancel is provided (typically used to close modal)
      setTimeout(() => {
        onCancel?.();
      }, 1500);

    } catch (error) {
      console.error('Unexpected error:', error);
      toast.error('Произошла неожиданная ошибка. Попробуйте еще раз.');
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
        <Button 
          type="submit" 
          disabled={submitting}
          className="text-white hover:opacity-90"
          style={{ backgroundColor: themeColor }}
        >
          {submitting ? 'Отправка...' : 'Отправить заявку'}
        </Button>
      </div>
    </form>
  );
};

export default ApartmentReservationForm;


