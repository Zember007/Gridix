import { useEffect, useRef, useState } from "react";
import type { LeadsFilters } from "@/entities/crm/model/types";

type UseLeadsManagerUiStateParams = {
  filters: LeadsFilters;
  searchTerm: string;
  isFilterPanelOpen: boolean;
  setIsFilterPanelOpen: (value: boolean) => void;
  setIsSettingsOpen: (value: boolean) => void;
};

export const useLeadsManagerUiState = ({
  filters,
  searchTerm,
  isFilterPanelOpen,
  setIsFilterPanelOpen,
  setIsSettingsOpen,
}: UseLeadsManagerUiStateParams) => {
  const settingsRef = useRef<HTMLDivElement>(null);
  const funnelMenuRef = useRef<HTMLDivElement>(null);
  const filterContainerRef = useRef<HTMLDivElement>(null);
  const assignMenuRef = useRef<HTMLDivElement>(null);

  const [isFunnelMenuOpen, setIsFunnelMenuOpen] = useState(false);
  const [isFunnelSetupMode, setIsFunnelSetupMode] = useState(false);
  const [isCardAppearanceModalOpen, setIsCardAppearanceModalOpen] =
    useState(false);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [isDuplicateFinderOpen, setIsDuplicateFinderOpen] = useState(false);
  const [isAssignMenuOpen, setIsAssignMenuOpen] = useState(false);

  const [draftFilters, setDraftFilters] = useState<LeadsFilters>(filters);
  const [draftSearchTerm, setDraftSearchTerm] = useState(searchTerm);
  const [
    isFunnelTriggersWarningDismissed,
    setIsFunnelTriggersWarningDismissed,
  ] = useState(false);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        settingsRef.current &&
        !settingsRef.current.contains(event.target as Node)
      ) {
        setIsSettingsOpen(false);
      }

      if (
        funnelMenuRef.current &&
        !funnelMenuRef.current.contains(event.target as Node)
      ) {
        setIsFunnelMenuOpen(false);
      }

      if (
        isFilterPanelOpen &&
        filterContainerRef.current &&
        !filterContainerRef.current.contains(event.target as Node)
      ) {
        setIsFilterPanelOpen(false);
      }

      if (
        assignMenuRef.current &&
        !assignMenuRef.current.contains(event.target as Node)
      ) {
        setIsAssignMenuOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isFilterPanelOpen, setIsFilterPanelOpen, setIsSettingsOpen]);

  useEffect(() => {
    if (isFilterPanelOpen) {
      setDraftFilters(filters);
      setDraftSearchTerm(searchTerm);
    }
  }, [isFilterPanelOpen, filters, searchTerm]);

  const handleResetDraftFilters = () => {
    setDraftFilters({
      source: "all",
      minBudget: "",
      maxBudget: "",
      dateFrom: "",
      dateTo: "",
      stages: [],
      assignedTo: [],
      projectId: "all",
      projectless: false,
    });
    setDraftSearchTerm("");
  };

  return {
    settingsRef,
    funnelMenuRef,
    filterContainerRef,
    assignMenuRef,
    isFunnelMenuOpen,
    setIsFunnelMenuOpen,
    isFunnelSetupMode,
    setIsFunnelSetupMode,
    isCardAppearanceModalOpen,
    setIsCardAppearanceModalOpen,
    isImportModalOpen,
    setIsImportModalOpen,
    isDuplicateFinderOpen,
    setIsDuplicateFinderOpen,
    isAssignMenuOpen,
    setIsAssignMenuOpen,
    draftFilters,
    setDraftFilters,
    draftSearchTerm,
    setDraftSearchTerm,
    isFunnelTriggersWarningDismissed,
    setIsFunnelTriggersWarningDismissed,
    handleResetDraftFilters,
  };
};
