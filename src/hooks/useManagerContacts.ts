import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

interface ManagerContacts {
  contact_name: string;
  contact_phone: string;
  contact_email: string;
  contact_address: string;
  company_name: string;
}

export const useManagerContacts = () => {
  const [contacts, setContacts] = useState<ManagerContacts | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();

  useEffect(() => {
    if (user) {
      loadContacts();
    } else {
      setLoading(false);
    }
  }, [user]);

  const loadContacts = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('admin_settings')
        .select('contact_name, contact_phone, contact_email, contact_address, company_name')
        .eq('user_id', user.id)
        .single();

      if (error && error.code !== 'PGRST116') {
        throw error;
      }

      if (data) {
        setContacts({
          contact_name: data.contact_name || '',
          contact_phone: data.contact_phone || '',
          contact_email: data.contact_email || '',
          contact_address: data.contact_address || '',
          company_name: data.company_name || ''
        });
      } else {
        // Если настроек нет, устанавливаем дефолтные значения
        setContacts({
          contact_name: '',
          contact_phone: '',
          contact_email: '',
          contact_address: '',
          company_name: ''
        });
      }
    } catch (err: any) {
      console.error('Error loading manager contacts:', err);
      setError(err.message || 'Ошибка загрузки контактных данных');
    } finally {
      setLoading(false);
    }
  };

  return {
    contacts,
    loading,
    error,
    refresh: loadContacts
  };
}; 