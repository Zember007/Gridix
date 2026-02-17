import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { supabase } from "@gridix/utils/api";
import { FullPageLoaderView } from "@/shared/ui/LoaderView";
import { hasUserPassword } from "@gridix/utils";
import { getLanguageFromPath, addLanguageToPath } from "@gridix/utils/lib";

export default function InvitationHandlerPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [status, setStatus] = useState<"processing" | "success" | "error">(
    "processing",
  );
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    if (!user) return;

    const processInvitation = async () => {
      try {
        const ref = searchParams.get("ref");
        const invite = searchParams.get("invite");
        const type = searchParams.get("type");

        if (!ref || !invite || !type) {
          setErrorMessage("Invalid invitation parameters");
          setStatus("error");
          return;
        }

        const { data, error } = await supabase.functions.invoke(
          "partner-program",
          {
            body: {
              action: "track_referral",
              partner_code: ref,
              invitation_code: invite,
              invitation_type: type,
            },
          },
        );

        if (error) {
          throw new Error(error.message);
        }

        if (data.success) {
          setStatus("success");
          // If user still has no password, redirect to set-password.
          try {
            const hasPassword = await hasUserPassword(supabase as any);
            if (!hasPassword) {
              const lang =
                getLanguageFromPath(window.location.pathname) || "en";
              const setPasswordPath = addLanguageToPath("/set-password", lang);
              setTimeout(() => navigate(setPasswordPath), 500);
            }
          } catch {
            // Best effort; do not block.
          }
        } else {
          setErrorMessage(data.error || "Failed to process invitation");
          setStatus("error");
        }
      } catch (error) {
        console.error("Error processing invitation:", error);
        setErrorMessage("An error occurred while processing the invitation");
        setStatus("error");
      }
    };

    processInvitation();
  }, [searchParams, user, navigate]);

  if (status === "processing") {
    return <FullPageLoaderView label="Processing invitation..." />;
  }

  if (status === "success") {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="mb-4 text-6xl text-green-600">✓</div>
          <h2 className="mb-2 text-2xl font-bold text-gray-900">
            Invitation Accepted!
          </h2>
          <p className="text-gray-600">Redirecting to your dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50">
      <div className="text-center">
        <div className="mb-4 text-6xl text-red-600">✗</div>
        <h2 className="mb-2 text-2xl font-bold text-gray-900">Error</h2>
        <p className="mb-4 text-gray-600">{errorMessage}</p>
        <button
          onClick={() => navigate("/en/admin")}
          className="rounded-lg bg-blue-600 px-6 py-2 text-white hover:bg-blue-700"
        >
          Go to Dashboard
        </button>
      </div>
    </div>
  );
}
