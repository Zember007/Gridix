import {
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Input,
  Label,
} from "@gridix/ui";
import { ExternalLink } from "lucide-react";

type WidgetLinksCardProps = {
  title: string;
  description: string;
  selectedProject: string;
  selectedProjectLabel: string;
  selectedProjectEmbedIdentifier: string;
};

export const WidgetLinksCard = ({
  title,
  description,
  selectedProject,
  selectedProjectLabel,
  selectedProjectEmbedIdentifier,
}: WidgetLinksCardProps) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {selectedProject !== "all" && (
          <div className="space-y-2">
            <Label>{selectedProjectLabel}</Label>
            <div className="flex items-center gap-2">
              <Input
                value={`${window.location.origin}/embed/project/${selectedProjectEmbedIdentifier}`}
                readOnly
                className="bg-gray-50"
              />
              <Button
                variant="outline"
                size="sm"
                onClick={() =>
                  window.open(
                    `${window.location.origin}/embed/project/${selectedProjectEmbedIdentifier}`,
                    "_blank",
                  )
                }
              >
                <ExternalLink className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
