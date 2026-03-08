import { useState } from "react";
import { toast } from "sonner";
import { addDomainWithAutomation } from "../api/domainAutomationApi";
import type { DNSRecord, DnsProvider } from "./types";

type SetDnsInstructions = (
  value:
    | Record<string, DNSRecord[]>
    | ((prev: Record<string, DNSRecord[]>) => Record<string, DNSRecord[]>),
) => void;

interface UseAddDomainAutomationParams {
  projectId: string;
  newDomain: string;
  setNewDomain: (value: string) => void;
  dnsProvider: DnsProvider;
  dnsApiKey: string;
  setDnsApiKey: (value: string) => void;
  dnsZoneId: string;
  setDnsZoneId: (value: string) => void;
  setDnsInstructions: SetDnsInstructions;
}

export const useAddDomainAutomation = ({
  projectId,
  newDomain,
  setNewDomain,
  dnsProvider,
  dnsApiKey,
  setDnsApiKey,
  dnsZoneId,
  setDnsZoneId,
  setDnsInstructions,
}: UseAddDomainAutomationParams) => {
  const [isAddingDomain, setIsAddingDomain] = useState(false);

  const handleAddDomain = async () => {
    if (!newDomain.trim()) {
      toast.warning("⚠️ Please enter a domain name");
      return;
    }

    setIsAddingDomain(true);

    try {
      const { result, error } = await addDomainWithAutomation({
        domain: newDomain.trim(),
        projectId,
        ...(dnsProvider === "cloudflare" && dnsApiKey && dnsZoneId
          ? {
              dnsProvider: "cloudflare",
              apiKey: dnsApiKey,
              zoneId: dnsZoneId,
            }
          : {}),
      });

      if (error) {
        console.error("Supabase function error:", error);

        if (error.message?.includes("fetch")) {
          toast.error("❌ Network error: Could not connect to server");
        } else if (error.message?.includes("unauthorized")) {
          toast.error("❌ Authorization error: Please check your credentials");
        } else {
          toast.error(`❌ Error: ${error.message || "Unknown error occurred"}`);
        }

        setIsAddingDomain(false);
        return;
      }

      if (result?.success) {
        toast.success(result.message || "✅ Domain added successfully!");

        if (result.automation?.instructions?.dns_records && result.domain) {
          setDnsInstructions((prev) => ({
            ...prev,
            [result.domain as string]:
              result.automation?.instructions?.dns_records ?? [],
          }));
        }

        setNewDomain("");
        setDnsApiKey("");
        setDnsZoneId("");

        if (result.details) {
          const details = result.details;
          if (details.dns_configured) {
            toast.success("✅ DNS records created automatically");
          }
          if (details.hosting_configured) {
            toast.success("✅ Hosting configured automatically");
          }
          if (details.ssl_ready) {
            toast.success("✅ SSL certificate ready");
          }
          if (details.requires_manual_setup) {
            toast.warning("⚠️ Manual setup required - see instructions below", {
              duration: 6000,
            });
          }
        }

        if (result.automation) {
          const automationMessages: string[] = [];
          if (result.automation.dns_created) automationMessages.push("DNS ✓");
          if (result.automation.hosting_added)
            automationMessages.push("Hosting ✓");
          if (result.automation.ssl_ready) automationMessages.push("SSL ✓");

          if (automationMessages.length > 0) {
            toast.info(`🚀 Automation: ${automationMessages.join(", ")}`, {
              duration: 5000,
            });
          }
        }

        setTimeout(() => {
          const url = new URL(window.location.href);
          url.searchParams.set("page", "domains");
          window.location.href = url.toString();
        }, 1500);
      } else {
        const errorMessage =
          result?.error || result?.message || "Failed to add domain";

        if (errorMessage.includes("already exists")) {
          toast.error("❌ This domain is already registered");
        } else if (errorMessage.includes("Invalid domain")) {
          toast.error("❌ Invalid domain format. Please check and try again.");
        } else if (errorMessage.includes("DNS")) {
          toast.error(`❌ DNS Error: ${errorMessage}`);
        } else if (
          errorMessage.includes("webhook") ||
          errorMessage.includes("404")
        ) {
          toast.error(
            "❌ Server configuration error. Please contact administrator.",
            {
              description: "Webhook endpoint not found",
              duration: 6000,
            },
          );
        } else if (
          errorMessage.includes("SSL") ||
          errorMessage.includes("certificate")
        ) {
          toast.error("❌ SSL configuration failed", {
            description: errorMessage,
            duration: 6000,
          });
        } else {
          toast.error(`❌ ${errorMessage}`);
        }

        if (result?.details) {
          console.error("Domain automation error details:", result.details);
        }
      }
    } catch (error) {
      console.error("Domain automation error:", error);

      let errorMessage = "An unexpected error occurred";
      let errorDescription = "";

      if (error && typeof error === "object") {
        if ("message" in error) {
          errorMessage = error.message as string;
        } else if ("error" in error) {
          errorMessage = (error as { error: string }).error;
        }

        if (
          errorMessage.includes("Failed to fetch") ||
          errorMessage.includes("NetworkError")
        ) {
          errorMessage = "Network connection failed";
          errorDescription =
            "Please check your internet connection and try again";
        } else if (errorMessage.includes("timeout")) {
          errorMessage = "Request timed out";
          errorDescription =
            "The server took too long to respond. Please try again.";
        } else if (errorMessage.includes("CORS")) {
          errorMessage = "Configuration error";
          errorDescription = "Please contact administrator";
        }
      }

      toast.error(`❌ ${errorMessage}`, {
        description: errorDescription || undefined,
        duration: 6000,
      });

      console.error("Full error object:", error);
    } finally {
      setIsAddingDomain(false);
    }
  };

  return {
    isAddingDomain,
    handleAddDomain,
  };
};
