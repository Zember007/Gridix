import { lazy, Suspense } from "react";
import { useParams } from "react-router-dom";
import { LanguageToggle } from "@gridix/ui";
import { useLanguage } from "@gridix/utils/react";
import { FullPageLoaderView } from "@/shared/ui/LoaderView";

// Lazy load heavy map component
const InteractiveProjectsMap = lazy(
  () => import("@/components/visualization/InteractiveProjectsMap"),
);

const EmbedProjectsMap = () => {
  const { userId } = useParams<{ userId: string }>();

  return (
    <div className="relative min-h-screen bg-white">
      {/* Language toggle in top-right corner */}
      <div className="absolute right-4 top-4 z-10">
        <LanguageToggle />
      </div>

      <Suspense fallback={<FullPageLoaderView />}>
        <InteractiveProjectsMap userId={userId} />
      </Suspense>
    </div>
  );
};

export default EmbedProjectsMap;
