import { useCallback, useEffect, useRef, useState } from "react";
import {
  Button,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@gridix/ui";
import { Plus, Trash2 } from "lucide-react";
import { useLanguage } from "@gridix/utils/react";
import { LoadingProgress } from "@/shared/ui/LoadingProgress";
import ProjectCreationModal from "@/components/projects/ProjectCreationModal";
import { SubProjectList } from "./SubProjectList";
import { SubProjectCreateModal } from "./SubProjectCreateModal";
import { GenplanActivatePrompt } from "./GenplanActivatePrompt";
import BuildingImageEditor from "@/features/visualization/buildingImageEditor/ui/BuildingImageEditor";
import { ActivateGenplanModal } from "./ActivateGenplanModal";
import { DeactivateGenplanModal } from "./DeactivateGenplanModal";
import { MasterplanCreateModal } from "./MasterplanCreateModal";
import { DeleteMasterplanModal } from "./DeleteMasterplanModal";
import { listSubProjects, loadMasterplanEditor } from "../api/genplanApi";
import type {
  SubProject,
  MasterplanArea,
  MasterplanEditorData,
} from "../model/types";
import { supabase } from "@gridix/utils/api";

interface GenplanEditorTabProps {
  projectId: string;
  onMasterplanToggled?: (active: boolean) => void;
}

export default function GenplanEditorTab({
  projectId,
  onMasterplanToggled,
}: GenplanEditorTabProps) {
  const { t } = useLanguage();
  const [subProjects, setSubProjects] = useState<SubProject[]>([]);
  const [masterplanData, setMasterplanData] =
    useState<MasterplanEditorData | null>(null);
  const [hasMasterplan, setHasMasterplan] = useState(false);
  const [loading, setLoading] = useState(true);
  const [showSubProjectHubModal, setShowSubProjectHubModal] = useState(false);
  const [showManualSubProjectModal, setShowManualSubProjectModal] =
    useState(false);
  const [showActivateModal, setShowActivateModal] = useState(false);
  const [showDeactivateModal, setShowDeactivateModal] = useState(false);
  const [showCreateMasterplanModal, setShowCreateMasterplanModal] =
    useState(false);
  const [showDeleteMasterplanModal, setShowDeleteMasterplanModal] =
    useState(false);
  const [selectedMasterplanId, setSelectedMasterplanId] = useState<
    string | null
  >(null);
  const selectedMasterplanIdRef = useRef<string | null>(null);
  // Tracks the previous value to distinguish initial selection from user-driven switch
  const prevMasterplanIdRef = useRef<string | null>(null);

  useEffect(() => {
    selectedMasterplanIdRef.current = selectedMasterplanId;
  }, [selectedMasterplanId]);

  const load = useCallback(
    async (showLoader = true) => {
      if (showLoader) setLoading(true);
      try {
        const [sps, mpData, projectRes] = await Promise.all([
          listSubProjects(projectId),
          loadMasterplanEditor(projectId),
          supabase
            .from("projects")
            .select("has_masterplan")
            .eq("id", projectId)
            .maybeSingle(),
        ]);
        setSubProjects(sps);
        setMasterplanData(mpData);
        setHasMasterplan(Boolean(projectRes.data?.has_masterplan));

        if (mpData.masterplans.length > 0 && !selectedMasterplanIdRef.current) {
          const defaultMp =
            mpData.masterplans.find((mp) => mp.is_default) ??
            mpData.masterplans[0];
          setSelectedMasterplanId(defaultMp?.id ?? null);
        }
      } finally {
        if (showLoader) setLoading(false);
      }
    },
    [projectId],
  );

  useEffect(() => {
    load();
  }, [load]);

  // Silent reload when user switches between masterplans (skip initial null→id transition)
  useEffect(() => {
    if (!selectedMasterplanId) return;
    if (prevMasterplanIdRef.current === null) {
      // First time a masterplan is selected (initial load already covered this)
      prevMasterplanIdRef.current = selectedMasterplanId;
      return;
    }
    if (prevMasterplanIdRef.current === selectedMasterplanId) return;
    prevMasterplanIdRef.current = selectedMasterplanId;
    load(false);
  }, [selectedMasterplanId, load]);

  const handleSubProjectCreated = (sp: SubProject) => {
    setSubProjects((prev) => [...prev, sp]);
  };

  const handleSubProjectDeleted = (id: string) => {
    setSubProjects((prev) => prev.filter((s) => s.id !== id));
  };

  const handleActivated = () => {
    setHasMasterplan(true);
    onMasterplanToggled?.(true);
    load(true);
  };

  const handleDeactivated = () => {
    setHasMasterplan(false);
    onMasterplanToggled?.(false);
    void load(true);
  };

  const handleMasterplanCreated = (masterplanId: string) => {
    selectedMasterplanIdRef.current = masterplanId;
    setSelectedMasterplanId(masterplanId);
    load(true);
  };

  // After deletion: select the next available masterplan then reload
  const handleMasterplanDeleted = () => {
    const remaining = (masterplanData?.masterplans ?? []).filter(
      (mp) => mp.id !== selectedMasterplanId,
    );
    const next = remaining[0] ?? null;
    selectedMasterplanIdRef.current = next?.id ?? null;
    setSelectedMasterplanId(next?.id ?? null);
    load(true);
  };

  if (loading) {
    return <LoadingProgress />;
  }

  const masterplans = masterplanData?.masterplans ?? [];
  const activeMasterplan =
    masterplans.find((mp) => mp.id === selectedMasterplanId) ??
    masterplans[0] ??
    null;
  const areas: MasterplanArea[] =
    activeMasterplan?.project_masterplan_areas ?? [];
  const imageUrl = activeMasterplan?.background_asset_url ?? null;

  return (
    <div className="space-y-6">
      {hasMasterplan && (
        <>
          <SubProjectList
            projectId={projectId}
            subProjects={subProjects}
            onAdd={() => setShowSubProjectHubModal(true)}
            onDeleted={handleSubProjectDeleted}
            maxReached={subProjects.length >= 10}
          />
          <div className="border-t" />
        </>
      )}

      {/* Masterplan section header */}
      <div className="flex items-center justify-between gap-2">
        <h3 className="text-sm font-medium text-muted-foreground">
          {t("genplan.editor.title")}
        </h3>
        <div className="flex items-center gap-2">
          {hasMasterplan && masterplans.length > 1 && (
            <Select
              value={selectedMasterplanId ?? ""}
              onValueChange={(v) => setSelectedMasterplanId(v)}
            >
              <SelectTrigger className="h-8 w-48 text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {masterplans.map((mp) => (
                  <SelectItem key={mp.id} value={mp.id}>
                    {mp.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
          {hasMasterplan && activeMasterplan && masterplans.length > 1 && (
            <Button
              variant="ghost"
              size="sm"
              className="h-8 w-8 p-0 text-muted-foreground hover:text-destructive"
              onClick={() => setShowDeleteMasterplanModal(true)}
              title={t("genplan.editor.deleteMasterplan")}
            >
              <Trash2 size={14} />
            </Button>
          )}
          {hasMasterplan && (
            <Button
              variant="outline"
              size="sm"
              className="h-8 gap-1.5 text-xs"
              onClick={() => setShowCreateMasterplanModal(true)}
            >
              <Plus size={13} />
              {t("genplan.editor.addMasterplan")}
            </Button>
          )}
          {hasMasterplan && (
            <Button
              variant="ghost"
              size="sm"
              className="h-8 text-xs text-muted-foreground hover:text-destructive"
              onClick={() => setShowDeactivateModal(true)}
            >
              {t("genplan.deactivate.button")}
            </Button>
          )}
        </div>
      </div>

      {/* Masterplan content */}
      {hasMasterplan ? (
        <BuildingImageEditor
          key={selectedMasterplanId ?? undefined}
          projectId={projectId}
          subProjectType="genplan"
          currentImageUrl={imageUrl}
          genplan={{
            masterplanId: activeMasterplan?.id,
            masterplanName: activeMasterplan?.name,
            masterplanIsDefault: activeMasterplan?.is_default ?? false,
            areas,
            subProjects,
            infrastructureZones: masterplanData?.infrastructureZones ?? [],
            onMasterplanUpdated: () => load(false),
          }}
        />
      ) : (
        <GenplanActivatePrompt onActivate={() => setShowActivateModal(true)} />
      )}

      {/* Modals */}
      <ProjectCreationModal
        open={showSubProjectHubModal}
        onClose={() => setShowSubProjectHubModal(false)}
        onManualCreate={() => {
          setShowSubProjectHubModal(false);
          setShowManualSubProjectModal(true);
        }}
        parentProjectId={projectId}
        onSubProjectImportSuccess={handleSubProjectCreated}
      />
      <SubProjectCreateModal
        open={showManualSubProjectModal}
        onClose={() => setShowManualSubProjectModal(false)}
        projectId={projectId}
        onCreated={handleSubProjectCreated}
        subProjects={subProjects}
      />
      <ActivateGenplanModal
        open={showActivateModal}
        onClose={() => setShowActivateModal(false)}
        projectId={projectId}
        onActivated={handleActivated}
      />
      <DeactivateGenplanModal
        open={showDeactivateModal}
        onClose={() => setShowDeactivateModal(false)}
        projectId={projectId}
        subProjects={subProjects}
        onDeactivated={handleDeactivated}
      />
      <MasterplanCreateModal
        open={showCreateMasterplanModal}
        onClose={() => setShowCreateMasterplanModal(false)}
        projectId={projectId}
        masterplanCount={masterplans.length}
        onCreated={handleMasterplanCreated}
      />
      {activeMasterplan && (
        <DeleteMasterplanModal
          open={showDeleteMasterplanModal}
          onClose={() => setShowDeleteMasterplanModal(false)}
          masterplanId={activeMasterplan.id}
          masterplanName={activeMasterplan.name}
          onDeleted={handleMasterplanDeleted}
        />
      )}
    </div>
  );
}
