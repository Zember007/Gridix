import type { Tables } from "@gridix/types/database";

export type ProjectDomain = Tables<"project_domains">;

export interface DNSRecord {
  type: string;
  name: string;
  value: string;
  description: string;
}

export interface AutoDomainManagerResponse {
  success?: boolean;
  message?: string;
  error?: string;
  domain?: string;
  automation?: {
    dns_created?: boolean;
    hosting_added?: boolean;
    ssl_ready?: boolean;
    instructions?: {
      dns_records?: DNSRecord[];
    };
  };
  details?: {
    dns_configured?: boolean;
    hosting_configured?: boolean;
    ssl_ready?: boolean;
    requires_manual_setup?: boolean;
    [key: string]: unknown;
  };
  vercel?: {
    verified?: boolean;
    configured?: boolean;
  };
  status?: {
    overall_status?: string;
    nginx?: {
      enabled?: boolean;
    };
    ssl?: {
      certificate_valid?: boolean;
    };
  };
}

export type DnsProvider = "manual" | "cloudflare";
