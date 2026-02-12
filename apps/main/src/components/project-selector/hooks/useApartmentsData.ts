import { useState, useEffect, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@gridix/utils/api';
import { Apartment, normalizeApartmentData } from '@/entities/apartment/model/types';
import type { LayoutPhoto } from '../types';

// ── Pure helpers ──

/** Compute unique layout type keys from a list of apartments. */
export function getUniqueLayoutTypes(apartments: Apartment[]): string[] {
  const set = new Set<string>(
    apartments.map(a =>
      a.type === 'apartment'
        ? a.rooms == 0
          ? 'studio'
          : a.rooms === 'free_layout'
            ? 'free_layout'
            : `${Number(a.rooms)}-room`
        : a.type,
    ),
  );
  return Array.from(set).sort();
}

// ── Fetch functions ──

async function fetchApartments(projectId: string): Promise<Apartment[]> {
  const { data, error } = await supabase
    .from('apartments')
    .select(
      'id, apartment_number, floor_number, rooms, area, price, status, project_id, created_at, updated_at, floor_plan_id, custom_fields, type',
    )
    .eq('project_id', projectId);

  if (error) throw error;
  return (data || []).map(normalizeApartmentData);
}

async function fetchLayoutPhotos(
  projectId: string,
  layoutTypes: string[],
): Promise<Record<string, LayoutPhoto[]>> {
  if (layoutTypes.length === 0) return {};

  const { data, error } = await supabase
    .from('layout_photos')
    .select('id, project_id, layout_type, image_url, description, order_index')
    .eq('project_id', projectId)
    .in('layout_type', layoutTypes)
    .order('order_index', { ascending: true });

  if (error) throw error;

  const grouped: Record<string, LayoutPhoto[]> = {};
  (data || []).forEach(p => {
    const key = p.layout_type;
    if (!grouped[key]) grouped[key] = [];
    const item: LayoutPhoto = {
      id: p.id,
      image_url: p.image_url,
      order_index: p.order_index,
      type: 'layout',
    };
    if (p.description) {
      item.description = p.description;
    }
    grouped[key].push(item);
  });

  return grouped;
}

// ── Hook ──

interface UseApartmentsDataParams {
  projectId: string | undefined;
}

export interface UseApartmentsDataResult {
  apartments: Apartment[];
  /** Allows external mutation (e.g. polygon enrichment from useFloorPolygons). */
  setApartments: React.Dispatch<React.SetStateAction<Apartment[]>>;
  apartmentsLoaded: boolean;
  preloadedLayoutPhotosByRooms: Record<string, LayoutPhoto[]>;
  preloadLayoutLoaded: boolean;
}

export const useApartmentsData = ({
  projectId,
}: UseApartmentsDataParams): UseApartmentsDataResult => {
  // ── Apartments query ──
  const apartmentsQuery = useQuery({
    queryKey: ['project-apartments', projectId],
    queryFn: () => fetchApartments(projectId!),
    enabled: !!projectId,
  });

  // Local mutable copy – allows useFloorPolygons to merge polygon data
  // without touching the query cache.
  const [apartments, setApartments] = useState<Apartment[]>([]);

  // Sync query result → local state on first successful load.
  useEffect(() => {
    if (apartmentsQuery.data) {
      setApartments(apartmentsQuery.data);
    }
  }, [apartmentsQuery.data]);

  // ── Layout photos query (depends on apartments) ──
  const layoutTypes = useMemo(
    () => (apartmentsQuery.data ? getUniqueLayoutTypes(apartmentsQuery.data) : []),
    [apartmentsQuery.data],
  );

  const layoutPhotosQuery = useQuery({
    queryKey: ['project-layout-photos', projectId, layoutTypes],
    queryFn: () => fetchLayoutPhotos(projectId!, layoutTypes),
    enabled: !!projectId && layoutTypes.length > 0,
  });

  return {
    apartments,
    setApartments,
    apartmentsLoaded: !apartmentsQuery.isLoading,
    preloadedLayoutPhotosByRooms: layoutPhotosQuery.data ?? {},
    preloadLayoutLoaded: !layoutPhotosQuery.isLoading,
  };
};
