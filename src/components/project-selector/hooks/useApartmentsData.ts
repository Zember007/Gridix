import { useEffect, useRef, useState } from 'react';
import { supabase } from '@/shared/api/supabase';
import { Apartment, normalizeApartmentData } from '@/entities/apartment/model/types';

interface UseApartmentsDataParams {
  // explicit union to work well with exactOptionalPropertyTypes
  projectId: string | undefined;
}

interface LayoutPhoto {
  id: string;
  image_url: string;
  description?: string;
  order_index: number;
  type: 'layout';
}

export interface UseApartmentsDataResult {
  apartments: Apartment[];
  setApartments: React.Dispatch<React.SetStateAction<Apartment[]>>;
  apartmentsLoaded: boolean;
  preloadedLayoutPhotosByRooms: Record<string, LayoutPhoto[]>;
  preloadLayoutLoaded: boolean;
}

export const useApartmentsData = ({
  projectId,
}: UseApartmentsDataParams): UseApartmentsDataResult => {
  const [apartments, setApartments] = useState<Apartment[]>([]);
  const [apartmentsLoaded, setApartmentsLoaded] = useState(false);
  const [preloadedLayoutPhotosByRooms, setPreloadedLayoutPhotosByRooms] = useState<
    Record<string, LayoutPhoto[]>
  >({});
  const [preloadLayoutLoaded, setPreloadLayoutLoaded] = useState(false);

  useEffect(() => {
    if (!projectId || apartmentsLoaded) return;

    let isCancelled = false;

    const loadDataInParallel = async () => {
      try {
        const apartmentsResult = await supabase
          .from('apartments')
          .select(
            'id, apartment_number, floor_number, rooms, area, price, status, project_id, created_at, updated_at, floor_plan_id, custom_fields, type',
          )
          .eq('project_id', projectId);

        if (isCancelled) return;

        const { data, error } = apartmentsResult;
        if (error) throw error;

        const normalizedApartments = (data || []).map(normalizeApartmentData);
        if (!isCancelled) {
          setApartments(normalizedApartments);
          setApartmentsLoaded(true);

          const uniqueLayouts = new Set<string>(
            normalizedApartments.map(a =>
              a.type === 'apartment'
                ? a.rooms == 0
                  ? 'studio'
                  : a.rooms === 'free_layout'
                    ? 'free_layout'
                    : `${Number(a.rooms)}-room`
                : a.type,
            ),
          );

          if (uniqueLayouts.size > 0 && !isCancelled) {
            (async () => {
              try {
                const { data: layoutData, error: layoutError } = await supabase
                  .from('layout_photos')
                  .select('id, project_id, layout_type, image_url, description, order_index')
                  .eq('project_id', projectId)
                  .in('layout_type', Array.from(uniqueLayouts))
                  .order('order_index', { ascending: true });

                if (layoutError) {
                  console.error('Error loading layout photos:', layoutError);
                  setPreloadLayoutLoaded(true);
                  return;
                }

                const grouped: Record<string, LayoutPhoto[]> = {};

                (layoutData || []).forEach(p => {
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

                setPreloadedLayoutPhotosByRooms(grouped);
                setPreloadLayoutLoaded(true);
              } catch (e: unknown) {
                console.error('Error preloading layout photos:', e);
                setPreloadLayoutLoaded(true);
              }
            })();
          } else {
            setPreloadLayoutLoaded(true);
          }
        }
      } catch (error) {
        if (!isCancelled) {
          console.error('Error loading apartments:', error);
          setApartmentsLoaded(true);
          setPreloadLayoutLoaded(true);
        }
      }
    };

    loadDataInParallel();

    return () => {
      isCancelled = true;
    };
  }, [projectId, apartmentsLoaded]);

  return {
    apartments,
    setApartments,
    apartmentsLoaded,
    preloadedLayoutPhotosByRooms,
    preloadLayoutLoaded,
  };
};


