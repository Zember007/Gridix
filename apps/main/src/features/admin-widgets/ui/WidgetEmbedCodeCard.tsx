import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@gridix/ui";
import { Code } from "lucide-react";

type WidgetEmbedCodeCardProps = {
  title: string;
  description: string;
  embedCode: string;
};

export const WidgetEmbedCodeCard = ({
  title,
  description,
  embedCode,
}: WidgetEmbedCodeCardProps) => {
  return (
    <Card>
      <CardHeader className="px-4 pb-4 pt-4 md:px-6 md:pb-6 md:pt-6">
        <CardTitle className="flex items-center gap-2">
          <Code className="h-5 w-5" />
          {title}
        </CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent className="px-4 pb-4 pt-0 md:px-6 md:pb-6">
        <div className="rounded-lg bg-gray-100 p-4">
          <pre className="overflow-x-auto whitespace-pre-wrap text-sm">
            {embedCode}
          </pre>
        </div>
      </CardContent>
    </Card>
  );
};
