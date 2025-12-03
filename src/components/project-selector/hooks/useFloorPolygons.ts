import { useEffect, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import type { Apartment } from '@/types/apartment';

export interface UseFloorPolygonsParams {
  // explicit union to work well with exactOptionalPropertyTypes
  projectId: string | undefined;
  viewMode: 'facade' | 'floor-plan' | 'list' | 'map' | 'favorites';
  selectedFloorForPlan: number | null;
  setApartments: React.Dispatch<React.SetStateAction<Apartment[]>>;
}

export const useFloorPolygons = ({
  projectId,
  viewMode,
  selectedFloorForPlan,
  setApartments,
}: UseFloorPolygonsParams) => {
  const loadedPolygonsForFloorsRef = useRef<Map<number, Apartment[]>>(new Map());
  const polygonsLoadingRef = useRef<Set<number>>(new Set());

  useEffect(() => {
    const loadPolygonsForFloor = async (floor: number) => {
      if (!projectId || polygonsLoadingRef.current.has(floor)) return;

      if (loadedPolygonsForFloorsRef.current.has(floor)) {
        const cached = loadedPolygonsForFloorsRef.current.get(floor);
        if (cached && cached.length > 0) {
          setApartments(prev =>
            prev.map(apt => {
              const found = cached.find(d => d.id === apt.id);
              if (!found || apt.floor_number !== floor) return apt;
              return {
                ...apt,
                polygon: Array.isArray(
                  // @ts-expect-error polygon may come from raw supabase type
                  found.polygon,
                )
                  ? // @ts-expect-error polygon may come from raw supabase type
                    (found.polygon as { x: number; y: number }[])
                  : apt.polygon,
              };
            }),
          );
          return;
        }
      }

      polygonsLoadingRef.current.add(floor);

      try {
        const { data, error } = await supabase
          .from('apartments')
          .select('id, polygon')
          .eq('project_id', projectId)
          .eq('floor_number', floor);

        if (error) throw error;

        if (data && data.length > 0) {
          loadedPolygonsForFloorsRef.current.set(floor, data as unknown as Apartment[]);

          setApartments(prev =>
            prev.map(apt => {
              if (apt.floor_number !== floor) return apt;
              const found = data.find(d => d.id === apt.id);
              if (!found) return apt;
              return {
                ...apt,
                polygon: Array.isArray(
                  // @ts-expect-error polygon is from supabase
                  found.polygon,
                )
                  ? // @ts-expect-error polygon is from supabase
                    (found.polygon as { x: number; y: number }[])
                  : [],
              };
            }),
          );
        }
      } catch (e) {
        console.error('Error loading polygons for floor:', e);
      } finally {
        polygonsLoadingRef.current.delete(floor);
      }
    };

    if (projectId && viewMode === 'floor-plan' && selectedFloorForPlan !== null) {
      loadPolygonsForFloor(selectedFloorForPlan);
    }
  }, [projectId, viewMode, selectedFloorForPlan, setApartments]);
};


