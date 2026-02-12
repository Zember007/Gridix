import { useState, useEffect } from 'react';
import { supabase } from "@gridix/utils/api";
import type { PartnerProfile } from '../model/types';

export function usePartner() {
  const [isPartner, setIsPartner] = useState(false);
  const [partnerProfile, setPartnerProfile] = useState<PartnerProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkPartnerStatus();
  }, []);

  const checkPartnerStatus = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        setIsPartner(false);
        setPartnerProfile(null);
        setLoading(false);
        return;
      }

      const { data: profile, error } = await supabase
        .from('partner_profiles' as any)
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (error && error.code !== 'PGRST116') {
        console.error('Error fetching partner profile:', error);
        setIsPartner(false);
        setPartnerProfile(null);
      } else if (profile) {
        setIsPartner(true);
        setPartnerProfile(profile as any);
      } else {
        setIsPartner(false);
        setPartnerProfile(null);
      }
    } catch (error) {
      console.error('Error checking partner status:', error);
      setIsPartner(false);
      setPartnerProfile(null);
    } finally {
      setLoading(false);
    }
  };

  const createPartnerProfile = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        throw new Error('User not authenticated');
      }

      // Генерируем партнёрский код
      const { data: codeData, error: codeError } = await supabase
        .rpc('generate_partner_code' as any, { user_id_param: user.id });

      if (codeError) {
        throw new Error('Failed to generate partner code');
      }

      const { data: profile, error: profileError } = await supabase
        .from('partner_profiles' as any)
        .insert({
          user_id: user.id,
          partner_code: codeData
        })
        .select()
        .single();

      if (profileError) {
        throw new Error('Failed to create partner profile');
      }

      setPartnerProfile(profile as any);
      setIsPartner(true);
      
      return profile;
    } catch (error) {
      console.error('Error creating partner profile:', error);
      throw error;
    }
  };

  return {
    isPartner,
    partnerProfile,
    loading,
    createPartnerProfile,
    refetch: checkPartnerStatus
  };
}
