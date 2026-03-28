import { CustomFieldsManager } from "@/features/project-custom-fields";

export function CustomFieldsSection({
  onFieldsChange,
}: {
  onFieldsChange: (fields: any[]) => void;
}) {
  return (
    <CustomFieldsManager projectId={null} onFieldsChange={onFieldsChange} />
  );
}
