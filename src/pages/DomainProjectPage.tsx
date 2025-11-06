import { Navigate } from "react-router-dom";
import { DEFAULT_LANGUAGE } from "@/lib/language-utils";
import { useProjectByDomain } from "@/hooks/useProjectByDomain";
import { Loader2, AlertTriangle } from "lucide-react";
import ProjectApartmentSelector from "@/components/ProjectApartmentSelector";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { useAuth } from "@/contexts/AuthContext";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export default function DomainProjectPage() {
  const { project, loading, error, isDomainProject } = useProjectByDomain();
  const { user } = useAuth();

  // Show loading spinner while determining the domain
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  // If there's an error, redirect to main page
  if (error) {
    console.error("Domain resolution error:", error);
    return <Navigate to={`/${DEFAULT_LANGUAGE}`} replace />;
  }

  // If this is not a custom domain or no project found, redirect to main page
  if (!isDomainProject || !project) {
    return <Navigate to={`/${DEFAULT_LANGUAGE}`} replace />;
  }

  // Check subscription status
  const isSubscriptionExpired = project.subscription_expires_at && 
    new Date(project.subscription_expires_at) < new Date();
  const isSubscriptionInactive = !['active', 'trialing', 'trial'].includes(project.subscription_status || '') || isSubscriptionExpired;
  const isOwner = user && project.user_id === user.id;

  // If subscription is inactive and user is not the owner, show blocking message
  if (isSubscriptionInactive && !isOwner) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <div className="max-w-md w-full">
          <Alert className="border-red-500 bg-red-50 dark:bg-red-950">
            <AlertTriangle className="h-5 w-5 text-red-600" />
            <AlertTitle className="text-red-800 dark:text-red-200 text-lg mb-2">
              Project Temporarily Unavailable
            </AlertTitle>
            <AlertDescription className="text-red-700 dark:text-red-300">
              The subscription for this project has expired. Please contact the project owner for more information.
            </AlertDescription>
          </Alert>
        </div>
      </div>
    );
  }



  // If project found via custom domain, render the project directly
  return (
    <div className="min-h-screen bg-background">
      <ProjectApartmentSelector projectId={project.id} />
    </div>
  );
}
