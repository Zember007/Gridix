import { Card, CardContent } from "@gridix/ui";
import type {
  AgentApplicationSettings,
  SignedContract,
} from "@/entities/agent-contract";
import {
  AgentContractCard,
  AgentSignedContractsSection,
} from "@/entities/agent-contract";
import { AgentSignatureSection } from "@/features/agent-signature-update";

interface AgentSettingsDataSectionProps {
  activeWorkspaceId: string | null;
  contractData: AgentApplicationSettings | null;
  contractError: Error | null;
  contractLoading: boolean;
  contracts: SignedContract[];
  contractsError: Error | null;
  contractsLoading: boolean;
  profileSignatureMethod: string | null;
  profileSignaturePath: string | null;
  refreshContracts: () => void;
  refreshProfile: () => Promise<void>;
  t: (key: string) => string;
  userId: string | null;
}

function EmptyWorkspaceContractState({ t }: { t: (key: string) => string }) {
  return (
    <Card>
      <CardContent className="flex flex-col items-center justify-center py-12 text-center text-[var(--admin-text-muted)]">
        <p className="text-base font-medium">
          {t("common.workspace.noActiveTitle")}
        </p>
        <p className="mt-1 text-sm">{t("common.workspace.pickInSidebar")}</p>
        <p className="mt-4 text-xs">
          {t("common.settings.contractTitle")}{" "}
          {t("common.settings.contractDesc").toLowerCase()}
        </p>
      </CardContent>
    </Card>
  );
}

export function AgentSettingsDataSection(props: AgentSettingsDataSectionProps) {
  return (
    <>
      <AgentSignatureSection
        userId={props.userId}
        existingSignaturePath={props.profileSignaturePath}
        existingMethod={props.profileSignatureMethod}
        onUpdated={props.refreshProfile}
        t={props.t}
      />

      <AgentSignedContractsSection
        applicationId={props.activeWorkspaceId}
        loading={props.contractsLoading}
        error={props.contractsError}
        contracts={props.contracts}
        onRefresh={props.refreshContracts}
        t={props.t}
      />

      {props.activeWorkspaceId ? (
        <AgentContractCard
          data={props.contractData}
          loading={props.contractLoading}
          error={props.contractError}
          t={props.t}
        />
      ) : (
        <EmptyWorkspaceContractState t={props.t} />
      )}
    </>
  );
}
