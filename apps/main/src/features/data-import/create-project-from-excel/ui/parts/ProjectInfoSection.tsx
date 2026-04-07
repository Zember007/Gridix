import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@gridix/ui";
import { Input } from "@gridix/ui";
import { Label } from "@gridix/ui";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@gridix/ui";
import type React from "react";

type ProjectData = {
  name: string;
  description: string;
  floors: number;
  type: "building" | "object";
};

export function ProjectInfoSection({
  t,
  projectData,
  setProjectData,
  titleKey = "excel.mapper.projectInfo.title",
  descriptionKey = "excel.mapper.projectInfo.description",
  nameLabelKey = "excel.mapper.project.name",
  typeLabelKey = "excel.mapper.project.type",
  lockNameAndType = false,
}: {
  t: (key: string) => string;
  projectData: ProjectData;
  setProjectData: React.Dispatch<React.SetStateAction<ProjectData>>;
  titleKey?: string;
  descriptionKey?: string;
  nameLabelKey?: string;
  typeLabelKey?: string;
  lockNameAndType?: boolean;
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>{t(titleKey)}</CardTitle>
        <CardDescription>{t(descriptionKey)}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <Label htmlFor="projectName">{t(nameLabelKey)}</Label>
          <Input
            id="projectName"
            value={projectData.name}
            onChange={(e) =>
              setProjectData((prev) => ({ ...prev, name: e.target.value }))
            }
            disabled={lockNameAndType}
            className="excel_project_name_usertour mt-1"
          />
        </div>

        <div>
          <Label htmlFor="projectType">{t(typeLabelKey)}</Label>
          <Select
            value={projectData.type}
            onValueChange={(value: "building" | "object") =>
              setProjectData((prev) => ({ ...prev, type: value }))
            }
            disabled={lockNameAndType}
          >
            <SelectTrigger className="excel_project_type_usertour mt-1">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem
                value="building"
                className="excel_project_type_building_usertour"
              >
                {t("excel.mapper.project.types.building")}
              </SelectItem>
              <SelectItem value="object">
                {t("excel.mapper.project.types.object")}
              </SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label htmlFor="projectDescription">
            {t("excel.mapper.project.description")}
          </Label>
          <Input
            id="projectDescription"
            value={projectData.description}
            onChange={(e) =>
              setProjectData((prev) => ({
                ...prev,
                description: e.target.value,
              }))
            }
            className="excel_project_description_usertour mt-1"
          />
        </div>

        {projectData.type === "building" && (
          <div>
            <Label htmlFor="floors">{t("projectEditor.floors")}</Label>
            <Input
              id="floors"
              type="number"
              value={projectData.floors}
              onChange={(e) =>
                setProjectData((prev) => ({
                  ...prev,
                  floors: parseInt(e.target.value) || 1,
                }))
              }
              min="1"
              max="50"
              className="mt-1"
            />
            <p className="mt-1 text-xs text-gray-500">
              {t("excel.mapper.project.floors.hint")}
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
