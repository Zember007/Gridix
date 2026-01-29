import { useState, useEffect } from 'react';
import { supabase } from "@gridix/utils/api";
import { useAuth } from '@/contexts/AuthContext';

export interface CompanySettings {
  id?: string;
  user_id: string;
  company_name: string;
  tax_id?: string | null;
  address?: string | null;
  phone?: string | null;
  email?: string | null;
  bank_name?: string | null;
  iban?: string | null;
  currency: string | null;
  vat_payer: boolean | null;
  created_at?: string | null;
  updated_at?: string | null;
}

export function useCompanySettings() {
  const { user } = useAuth();
  const [settings, setSettings] = useState<CompanySettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchSettings = async () => {
    if (!user) {
      setLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('company_settings')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (error && error.code !== 'PGRST116') { // PGRST116 = no rows returned
        throw error;
      }

      setSettings(data);
    } catch (err) {
      console.error('Error fetching company settings:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch company settings');
    } finally {
      setLoading(false);
    }
  };

  const saveSettings = async (settingsData: Omit<CompanySettings, 'id' | 'user_id' | 'created_at' | 'updated_at'>) => {
    if (!user) {
      throw new Error('User not authenticated');
    }

    try {
      setError(null);
      
      const settingsToSave = {
        ...settingsData,
        user_id: user.id,
      };

      const { data, error } = await supabase
        .from('company_settings')
        .upsert(settingsToSave, {
          onConflict: 'user_id'
        })
        .select()
        .single();

      if (error) {
        throw error;
      }

      setSettings(data);
      return data;
    } catch (err) {
      console.error('Error saving company settings:', err);
      setError(err instanceof Error ? err.message : 'Failed to save company settings');
      throw err;
    }
  };

  const updateSettings = async (updates: Partial<Omit<CompanySettings, 'id' | 'user_id' | 'created_at' | 'updated_at'>>) => {
    if (!user) {
      throw new Error('User not authenticated');
    }

    try {
      setError(null);
      
      const { data, error } = await supabase
        .from('company_settings')
        .update(updates)
        .eq('user_id', user.id)
        .select()
        .single();

      if (error) {
        throw error;
      }

      setSettings(data);
      return data;
    } catch (err) {
      console.error('Error updating company settings:', err);
      setError(err instanceof Error ? err.message : 'Failed to update company settings');
      throw err;
    }
  };

  const deleteSettings = async () => {
    if (!user) {
      throw new Error('User not authenticated');
    }

    try {
      setError(null);
      
      const { error } = await supabase
        .from('company_settings')
        .delete()
        .eq('user_id', user.id);

      if (error) {
        throw error;
      }

      setSettings(null);
    } catch (err) {
      console.error('Error deleting company settings:', err);
      setError(err instanceof Error ? err.message : 'Failed to delete company settings');
      throw err;
    }
  };

  const isSettingsComplete = (): boolean => {
    if (!settings) return false;
    
    return !!(
      settings.company_name &&
      settings.tax_id &&
      settings.address &&
      settings.phone &&
      settings.email &&
      settings.bank_name &&
      settings.iban
    );
  };

  useEffect(() => {
    fetchSettings();
  }, [user]);

  return {
    settings,
    loading,
    error,
    saveSettings,
    updateSettings,
    deleteSettings,
    isSettingsComplete,
    refreshSettings: fetchSettings,
  };
}
