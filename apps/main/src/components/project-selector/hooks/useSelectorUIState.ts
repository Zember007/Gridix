import { useReducer, useCallback } from 'react';
import type { Apartment } from '@/entities/apartment/model/types';
import type { SidePanelState } from '../ProjectSidePanel';

// ── State shape ──

interface SelectorUIState {
  isFiltersOpen: boolean;
  selectedApartment: Apartment | null;
  isApartmentModalOpen: boolean;
  isApartmentDetailsOpen: boolean;
  sidePanelOpen: boolean;
  sidePanelState: SidePanelState | null;
  activeFacadeIndex: number;
}

const initialState: SelectorUIState = {
  isFiltersOpen: false,
  selectedApartment: null,
  isApartmentModalOpen: false,
  isApartmentDetailsOpen: false,
  sidePanelOpen: false,
  sidePanelState: null,
  activeFacadeIndex: 0,
};

// ── Actions ──

type SelectorUIAction =
  | { type: 'SET_FILTERS_OPEN'; open: boolean }
  | { type: 'OPEN_APARTMENT_MODAL'; apartment: Apartment }
  | { type: 'CLOSE_APARTMENT_MODAL' }
  | { type: 'OPEN_APARTMENT_DETAILS'; apartment: Apartment }
  | { type: 'CLOSE_APARTMENT_DETAILS' }
  | { type: 'OPEN_SIDE_PANEL'; state: SidePanelState }
  | { type: 'CLOSE_SIDE_PANEL' }
  | { type: 'SET_SIDE_PANEL_OPEN'; open: boolean }
  | { type: 'SET_ACTIVE_FACADE_INDEX'; index: number }
  | { type: 'CLAMP_FACADE_INDEX'; maxLength: number };

function selectorUIReducer(state: SelectorUIState, action: SelectorUIAction): SelectorUIState {
  switch (action.type) {
    case 'SET_FILTERS_OPEN':
      return { ...state, isFiltersOpen: action.open };

    case 'OPEN_APARTMENT_MODAL':
      return {
        ...state,
        selectedApartment: action.apartment,
        isApartmentModalOpen: true,
      };

    case 'CLOSE_APARTMENT_MODAL':
      return {
        ...state,
        isApartmentModalOpen: false,
        selectedApartment: null,
      };

    case 'OPEN_APARTMENT_DETAILS':
      return {
        ...state,
        selectedApartment: action.apartment,
        isApartmentDetailsOpen: true,
      };

    case 'CLOSE_APARTMENT_DETAILS':
      return { ...state, isApartmentDetailsOpen: false };

    case 'OPEN_SIDE_PANEL':
      return {
        ...state,
        sidePanelOpen: true,
        sidePanelState: action.state,
      };

    case 'CLOSE_SIDE_PANEL':
      return {
        ...state,
        sidePanelOpen: false,
        sidePanelState: null,
      };

    case 'SET_SIDE_PANEL_OPEN':
      return {
        ...state,
        sidePanelOpen: action.open,
        sidePanelState: action.open ? state.sidePanelState : null,
      };

    case 'SET_ACTIVE_FACADE_INDEX':
      return { ...state, activeFacadeIndex: action.index };

    case 'CLAMP_FACADE_INDEX':
      if (action.maxLength === 0) return state;
      if (state.activeFacadeIndex < action.maxLength) return state;
      return { ...state, activeFacadeIndex: 0 };

    default:
      return state;
  }
}

// ── Hook ──

export const useSelectorUIState = () => {
  const [state, dispatch] = useReducer(selectorUIReducer, initialState);

  // Convenience action creators

  const setFiltersOpen = useCallback(
    (open: boolean) => dispatch({ type: 'SET_FILTERS_OPEN', open }),
    [],
  );

  const openApartmentModal = useCallback(
    (apartment: Apartment) => dispatch({ type: 'OPEN_APARTMENT_MODAL', apartment }),
    [],
  );

  const closeApartmentModal = useCallback(
    () => dispatch({ type: 'CLOSE_APARTMENT_MODAL' }),
    [],
  );

  const openApartmentDetails = useCallback(
    (apartment: Apartment) => dispatch({ type: 'OPEN_APARTMENT_DETAILS', apartment }),
    [],
  );

  const closeApartmentDetails = useCallback(
    () => dispatch({ type: 'CLOSE_APARTMENT_DETAILS' }),
    [],
  );

  const openSidePanel = useCallback(
    (panelState: SidePanelState) => dispatch({ type: 'OPEN_SIDE_PANEL', state: panelState }),
    [],
  );

  const closeSidePanel = useCallback(
    () => dispatch({ type: 'CLOSE_SIDE_PANEL' }),
    [],
  );

  const setSidePanelOpen = useCallback(
    (open: boolean) => dispatch({ type: 'SET_SIDE_PANEL_OPEN', open }),
    [],
  );

  const setActiveFacadeIndex = useCallback(
    (index: number) => dispatch({ type: 'SET_ACTIVE_FACADE_INDEX', index }),
    [],
  );

  const clampFacadeIndex = useCallback(
    (maxLength: number) => dispatch({ type: 'CLAMP_FACADE_INDEX', maxLength }),
    [],
  );

  return {
    ...state,
    // Actions
    setFiltersOpen,
    openApartmentModal,
    closeApartmentModal,
    openApartmentDetails,
    closeApartmentDetails,
    openSidePanel,
    closeSidePanel,
    setSidePanelOpen,
    setActiveFacadeIndex,
    clampFacadeIndex,
  };
};
