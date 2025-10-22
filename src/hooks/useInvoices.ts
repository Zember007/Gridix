import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export interface Invoice {
  id: string;
  invoice_number: string | null;
  invoice_url: string | null;
  invoice_generated_at: string | null;
  invoice_paid_at: string | null;
  status: string;
  final_price: number | null;
  payment_purpose: string | null;
  duration_months: number | null;
  payment_method: string | null;
  subscription_plans?: {
    name: string;
  };
  projects?: {
    name: string;
  };
}

export function useInvoices(projectId?: string) {
  const { user } = useAuth();
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchInvoices = async (targetProjectId?: string) => {
    if (!user) {
      setLoading(false);
      return;
    }

    const projectIdToUse = targetProjectId || projectId;
    if (!projectIdToUse) {
      setLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('user_subscriptions')
        .select(`
          id,
          invoice_number,
          invoice_url,
          invoice_generated_at,
          invoice_paid_at,
          status,
          final_price,
          payment_purpose,
          duration_months,
          payment_method,
          subscription_plans (name),
          projects (name)
        `)
        .eq('user_id', user.id)
        .eq('project_id', projectIdToUse)
        .eq('payment_method', 'invoice')
        .order('created_at', { ascending: false });

      if (error) {
        throw error;
      }

      setInvoices(data || []);
    } catch (err) {
      console.error('Error fetching invoices:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch invoices');
    } finally {
      setLoading(false);
    }
  };

  const generateInvoice = async (subscriptionId: string) => {
    if (!user) {
      throw new Error('User not authenticated');
    }

    try {
      const { data, error } = await supabase.functions.invoke('subscription-management', {
        body: { 
          action: 'generate-invoice',
          subscription_id: subscriptionId
        },
        headers: {
          'Authorization': `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}`,
        },
      });

      if (error) {
        throw error;
      }

      // Refresh invoices after generation
      await fetchInvoices();
      return data;
    } catch (err) {
      console.error('Error generating invoice:', err);
      throw err;
    }
  };

  const downloadInvoice = async (invoiceUrl: string) => {
    try {
      window.open(invoiceUrl, '_blank');
    } catch (err) {
      console.error('Error downloading invoice:', err);
      throw err;
    }
  };

  const getInvoiceStatus = (invoice: Invoice) => {
    if (invoice.status === 'active' && invoice.invoice_paid_at) {
      return 'paid';
    }
    if (invoice.invoice_url && invoice.status === 'pending_payment') {
      return 'pending';
    }
    return 'draft';
  };

  useEffect(() => {
    if (user && projectId) {
      fetchInvoices();
    }
  }, [user, projectId]);

  return {
    invoices,
    loading,
    error,
    generateInvoice,
    downloadInvoice,
    getInvoiceStatus,
    refreshInvoices: fetchInvoices,
  };
}
