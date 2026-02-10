import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@gridix/utils/api';
import type { Tables } from '@gridix/types/database';
import type { BuildingFloor, FacadeSettings } from '@/features/visualization/buildingFacade/model/types';
import type { ProjectFacade } from '../types';

type BuildingFloorRow = Tables<'building_floors'>;
type ProjectFacadeRow = Tables<'project_facades'>;

// ── Default facade settings ──

const DEFAULT_FACADE_SETTINGS: FacadeSettings = {
  colors: { building: '#3b82f6' },
  opacity: { normal: 0.4, hover: 0.7 },
  hoverEffects: { glow: true, colorChange: true, opacityChange: true },
  display: { showNumbers: true, showTooltip: false },
};

// ── Fetch functions ──

function rowToFacade(row: ProjectFacadeRow): ProjectFacade {
  return {
    id: row.id,
    project_id: row.project_id,
    name: row.name,
    image_url: row.image_url,
    order_index: row.order_index,
  };
}

async function fetchProjectFacades(projectId: string): Promise<ProjectFacade[]> {
  const { data, error } = await supabase
    .from('project_facades')
    .select('*')
    .eq('project_id', projectId)
    .order('order_index');

  if (error) throw error;
  return (data ?? []).map(rowToFacade);
}

function rowToFloor(row: BuildingFloorRow): BuildingFloor & { facade_id: string | null } {
  return {
    id: row.id,
    floor_number: row.floor_number,
    polygon: Array.isArray(row.polygon)
      ? (row.polygon as { x: number; y: number }[])
      : [],
    color: row.color,
    facade_id: row.facade_id,
  };
}

async function fetchBuildingFloors(
  projectId: string,
): Promise<Record<string, BuildingFloor[]>> {
  const { data, error } = await supabase
    .from('building_floors')
    .select('*')
    .eq('project_id', projectId)
    .order('floor_number');

  if (error) throw error;

  const grouped: Record<string, BuildingFloor[]> = {};
  (data ?? []).forEach((raw) => {
    const floor = rowToFloor(raw);
    const key = floor.facade_id ?? '__legacy__';
    if (!grouped[key]) grouped[key] = [];
    grouped[key].push(floor);
  });

  return grouped;
}

function parseFacadeSettings(raw: unknown): FacadeSettings {
  if (!raw || typeof raw !== 'object') return DEFAULT_FACADE_SETTINGS;

  const s = raw as Record<string, unknown>;
  const colors = s.colors as Record<string, unknown> | undefined;
  const opacity = s.opacity as Record<string, unknown> | undefined;
  const hoverEffects = s.hoverEffects as Record<string, unknown> | undefined;
  const display = s.display as Record<string, unknown> | undefined;

  return {
    colors: {
      building: (typeof colors?.building === 'string' ? colors.building : '#3b82f6'),
    },
    opacity: {
      normal: typeof opacity?.normal === 'number' ? opacity.normal : 0.4,
      hover: typeof opacity?.hover === 'number' ? opacity.hover : 0.7,
    },
    hoverEffects: {
      glow: !!hoverEffects?.glow,
      colorChange: !!hoverEffects?.colorChange,
      opacityChange: !!hoverEffects?.opacityChange,
    },
    display: {
      showNumbers: !!display?.showNumbers,
      showTooltip: !!display?.showTooltip,
    },
  };
}

async function fetchFacadeSettings(projectId: string): Promise<FacadeSettings> {
  const { data, error } = await supabase
    .from('projects')
    .select('polygon_settings_facade')
    .eq('id', projectId)
    .single();

  if (error) throw error;

  if (data && 'polygon_settings_facade' in data && data.polygon_settings_facade) {
    return parseFacadeSettings(data.polygon_settings_facade);
  }

  return DEFAULT_FACADE_SETTINGS;
}

// ── Hook ──

interface UseFacadeDataParams {
  projectId: string | undefined;
  /** Only load facade data when the facade view is active. */
  enabled: boolean;
}

interface UseFacadeDataResult {
  facades: ProjectFacade[];
  facadesLoaded: boolean;
  floorsByFacadeId: Record<string, BuildingFloor[]>;
  floorsLoading: boolean;
  floorsLoaded: boolean;
  facadeSettings: FacadeSettings | null;
  settingsLoading: boolean;
  settingsLoaded: boolean;
}

export const useFacadeData = ({
  projectId,
  enabled,
}: UseFacadeDataParams): UseFacadeDataResult => {
  const queryEnabled = !!projectId && enabled;

  // ── Facades ──
  const facadesQuery = useQuery({
    queryKey: ['project-facades', projectId],
    queryFn: () => fetchProjectFacades(projectId!),
    enabled: queryEnabled,
  });

  // ── Building floors ──
  const floorsQuery = useQuery({
    queryKey: ['building-floors', projectId],
    queryFn: () => fetchBuildingFloors(projectId!),
    enabled: queryEnabled,
  });

  // ── Facade settings ──
  const settingsQuery = useQuery({
    queryKey: ['facade-settings', projectId],
    queryFn: () => fetchFacadeSettings(projectId!),
    enabled: queryEnabled,
  });

  return useMemo(
    () => ({
      facades: facadesQuery.data ?? [],
      facadesLoaded: !facadesQuery.isLoading,
      floorsByFacadeId: floorsQuery.data ?? {},
      floorsLoading: floorsQuery.isFetching,
      floorsLoaded: !floorsQuery.isLoading,
      facadeSettings: settingsQuery.data ?? null,
      settingsLoading: settingsQuery.isFetching,
      settingsLoaded: !settingsQuery.isLoading,
    }),
    [
      facadesQuery.data,
      facadesQuery.isLoading,
      floorsQuery.data,
      floorsQuery.isLoading,
      floorsQuery.isFetching,
      settingsQuery.data,
      settingsQuery.isLoading,
      settingsQuery.isFetching,
    ],
  );
};
