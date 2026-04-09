import { Navigate, useParams } from "react-router-dom";
import { DEFAULT_LANGUAGE } from "@gridix/utils/lib";
import { useProjectByDomain } from "@/entities/project/queries/useProjectByDomain";
import { Loader2 } from "lucide-react";
import ApartmentDetailsPage from "@/pages/ApartmentDetailsPage";

export default function DomainApartmentPage() {
  const { apartmentNumber } = useParams<{ apartmentNumber: string }>();
  const {
    project: domainProject,
    loading: domainLoading,
    error: domainError,
    isDomainProject,
  } = useProjectByDomain();

  if (domainLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (domainError || !isDomainProject || !domainProject || !apartmentNumber) {
    return <Navigate to={`/${DEFAULT_LANGUAGE}`} replace />;
  }

  return (
    <ApartmentDetailsPage useId={false} projectIdProp={domainProject.id} />
  );
}
