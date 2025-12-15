import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2";
import { getCorsHeaders, createCorsResponse, createJsonResponse } from '../_shared/cors.ts';
class CloudflareDNS {
  apiKey;
  zoneId;
  email;
  name;
  constructor(apiKey, zoneId, email){
    this.apiKey = apiKey;
    this.zoneId = zoneId;
    this.email = email;
    this.name = "cloudflare";
  }
  async createARecord(domain, ip) {
    try {
      const response = await fetch(`https://api.cloudflare.com/client/v4/zones/${this.zoneId}/dns_records`, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${this.apiKey}`,
          "Content-Type": "application/json",
          ...this.email && {
            "X-Auth-Email": this.email
          }
        },
        body: JSON.stringify({
          type: "A",
          name: "@",
          content: ip,
          ttl: 3600
        })
      });
      const result = await response.json();
      return response.ok && result.success;
    } catch (error) {
      console.error('Cloudflare A record creation failed:', error);
      return false;
    }
  }
  async createCNAMERecord(domain, target) {
    try {
      const response = await fetch(`https://api.cloudflare.com/client/v4/zones/${this.zoneId}/dns_records`, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${this.apiKey}`,
          "Content-Type": "application/json",
          ...this.email && {
            "X-Auth-Email": this.email
          }
        },
        body: JSON.stringify({
          type: "CNAME",
          name: "www",
          content: target,
          ttl: 3600
        })
      });
      const result = await response.json();
      return response.ok && result.success;
    } catch (error) {
      console.error('Cloudflare CNAME record creation failed:', error);
      return false;
    }
  }
}
class VercelDomainManager {
  apiKey;
  projectId;
  constructor(apiKey, projectId){
    this.apiKey = apiKey;
    this.projectId = projectId;
  }
  async addDomain(domain) {
    try {
      const response = await fetch(`https://api.vercel.com/v9/projects/${this.projectId}/domains`, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${this.apiKey}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          name: domain
        })
      });
      const result = await response.json();
      // Vercel may return 200 even if domain already exists, check for errors
      if (!response.ok) {
        console.error('Vercel domain addition failed:', result);
        return false;
      }
      return true;
    } catch (error) {
      console.error('Vercel domain addition failed:', error);
      return false;
    }
  }
  async getDomainConfig(domain) {
    try {
      const response = await fetch(`https://api.vercel.com/v6/domains/${domain}/config`, {
        headers: {
          "Authorization": `Bearer ${this.apiKey}`
        }
      });
      if (!response.ok) {
        return null;
      }
      const data = await response.json();
      console.log('Vercel domain config:', data);
      return data;
    } catch (error) {
      console.error('Vercel domain config fetch failed:', error);
      return null;
    }
  }
  async removeDomain(domain) {
    try {
      const response = await fetch(`https://api.vercel.com/v9/projects/${this.projectId}/domains/${domain}`, {
        method: "DELETE",
        headers: {
          "Authorization": `Bearer ${this.apiKey}`
        }
      });
      return response.ok;
    } catch (error) {
      console.error('Vercel domain removal failed:', error);
      return false;
    }
  }
  async getDomainStatus(domain) {
    try {
      const response = await fetch(`https://api.vercel.com/v9/projects/${this.projectId}/domains/${domain}`, {
        headers: {
          "Authorization": `Bearer ${this.apiKey}`
        }
      });
      if (!response.ok) {
        return null;
      }
      const data = await response.json();
      return {
        verified: data.verified || false,
        configured: data.configured || false,
        nameservers: data.nameservers || [],
        cname: data.cname || null,
        apexName: data.apexName || null
      };
    } catch (error) {
      console.error('Vercel domain status fetch failed:', error);
      return null;
    }
  }
}
function isValidDomain(domain) {
  const domainRegex = /^[a-zA-Z0-9][a-zA-Z0-9-]{0,61}[a-zA-Z0-9](?:\.[a-zA-Z0-9][a-zA-Z0-9-]{0,61}[a-zA-Z0-9])*$/;
  return domainRegex.test(domain) && domain.length <= 253;
}
function cleanDomain(domain) {
  return domain.toLowerCase().trim().replace(/^https?:\/\//, '').replace(/^www\./, '').replace(/\/$/, '');
}
Deno.serve(async (req)=>{
  const origin = req.headers.get('Origin');
  const corsHeaders = getCorsHeaders(origin);
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return createCorsResponse(origin);
  }
  if (req.method !== "POST") {
    return createJsonResponse({
      error: "Method not allowed"
    }, 405, origin);
  }
  try {
    // Validate required environment variables
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    const vercelApiKey = Deno.env.get('VERCEL_API_KEY');
    const vercelProjectId = Deno.env.get('VERCEL_PROJECT_ID');
    if (!supabaseUrl || !supabaseServiceKey) {
      return createJsonResponse({
        error: "Server configuration error: Supabase credentials missing"
      }, 500, origin);
    }
    if (!vercelApiKey || !vercelProjectId) {
      return createJsonResponse({
        error: "Server configuration error: Vercel credentials missing. Please set VERCEL_API_KEY and VERCEL_PROJECT_ID environment variables."
      }, 500, origin);
    }
    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    });
    const body = await req.json();
    const { domain, project_id, dns_provider, api_key, zone_id } = body;
    const action = body.action ?? 'add';
    // Validate input
    if (!domain || !project_id) {
      return createJsonResponse({
        error: "Missing required fields: domain and project_id"
      }, 400, origin);
    }
    const cleanedDomain = cleanDomain(domain);
    if (!isValidDomain(cleanedDomain)) {
      return createJsonResponse({
        error: "Invalid domain format"
      }, 400, origin);
    }
    const vercel = new VercelDomainManager(vercelApiKey, vercelProjectId);
    // Handle status check
    if (action === 'status') {
      const status = await vercel.getDomainStatus(cleanedDomain);
      // Also check database status
      const { data: dbDomain } = await supabase.from('project_domains').select('*').eq('domain', cleanedDomain).eq('project_id', project_id).single();
      // Get DNS instructions from Vercel config
      const vercelConfig = await vercel.getDomainConfig(cleanedDomain);
      // If Vercel reports the domain as configured (misconfigured === false), mark it active in DB
      if (vercelConfig && vercelConfig.misconfigured === false && dbDomain?.id) {
        await supabase.from('project_domains').update({
          status: 'active',
          updated_at: new Date().toISOString()
        }).eq('id', dbDomain.id);
        if (dbDomain) {
          dbDomain.status = 'active';
        }
      }
      // IMPORTANT: Always return DNS records (fallback to Vercel defaults) so UI can show setup instructions
      const dnsRecords = vercelConfig ? [
        {
          type: "A",
          name: "@",
          value: vercelConfig.recommendedIPv4?.[0]?.value?.[0] || "76.76.21.21",
          description: "Points your domain to Vercel"
        },
        {
          type: "CNAME",
          name: "www",
          value: (vercelConfig.recommendedCNAME?.[0]?.value || "cname.vercel-dns.com").replace(/\.$/, ''),
          description: "Points www subdomain to Vercel"
        }
      ] : [
        {
          type: "A",
          name: "@",
          value: "76.76.21.21",
          description: "Points your domain to Vercel"
        },
        {
          type: "CNAME",
          name: "www",
          value: "cname.vercel-dns.com",
          description: "Points www subdomain to Vercel"
        }
      ];
      // If Vercel doesn't know this domain yet, still return instructions + an unverified status object
      const vercelStatus = status ?? {
        verified: false,
        configured: false,
        nameservers: [],
        cname: null,
        apexName: null,
        not_found: true
      };
      return createJsonResponse({
        success: true,
        domain: cleanedDomain,
        vercel: vercelStatus,
        database: dbDomain || null,
        automation: {
          instructions: {
            dns_records: dnsRecords
          }
        }
      }, 200, origin);
    }
    // Handle domain removal
    if (action === 'remove') {
      const domainId = body.domain_id;
      // Remove from Vercel
      const vercelRemoved = await vercel.removeDomain(cleanedDomain);
      const wwwRemoved = await vercel.removeDomain(`www.${cleanedDomain}`);
      // Remove from database
      if (domainId) {
        await supabase.from('project_domains').delete().eq('id', domainId);
      } else {
        await supabase.from('project_domains').delete().eq('domain', cleanedDomain).eq('project_id', project_id);
      }
      return createJsonResponse({
        success: true,
        domain: cleanedDomain,
        vercel_removed: vercelRemoved || wwwRemoved,
        message: 'Domain removed from Vercel and database'
      }, 200, origin);
    }
    // Handle domain addition (default action)
    // Check if domain already exists in database
    const { data: existingDomain } = await supabase.from('project_domains').select('id').eq('domain', cleanedDomain).single();
    if (existingDomain) {
      return createJsonResponse({
        error: "Domain already exists in database"
      }, 409, origin);
    }
    // Add domain to database with initial not_configured status
    const { data: domainData, error: dbError } = await supabase.from('project_domains').insert({
      project_id,
      domain: cleanedDomain,
      status: 'not_configured'
    }).select().single();
    if (dbError) {
      console.error('Database error:', dbError);
      return createJsonResponse({
        error: "Failed to save domain to database",
        details: dbError.message
      }, 500, origin);
    }
    const automationResults = {
      dns_created: false,
      hosting_added: false,
      ssl_ready: false,
      instructions: {
        dns_records: []
      }
    };
    // Try to automate DNS creation if Cloudflare provider info is available
    if (dns_provider === 'cloudflare' && api_key && zone_id) {
      const cloudflare = new CloudflareDNS(api_key, zone_id);
      // Get Vercel DNS configuration first
      const vercelConfig = await vercel.getDomainConfig(cleanedDomain);
      if (vercelConfig) {
        // Use Vercel's DNS configuration
        const aRecordIP = vercelConfig.recommendedIPv4?.[0]?.value?.[0] || '76.76.21.21'; // Vercel default IP
        const cnameTarget = (vercelConfig.recommendedCNAME?.[0]?.value || 'cname.vercel-dns.com').replace(/\.$/, '');
        const aRecordSuccess = await cloudflare.createARecord(cleanedDomain, aRecordIP);
        const cnameSuccess = await cloudflare.createCNAMERecord(cleanedDomain, cnameTarget);
        automationResults.dns_created = aRecordSuccess && cnameSuccess;
      }
    }
    // Add domain to Vercel
    console.log(`Adding domain ${cleanedDomain} to Vercel project ${vercelProjectId}`);
    const domainAdded = await vercel.addDomain(cleanedDomain);
    const wwwDomainAdded = await vercel.addDomain(`www.${cleanedDomain}`);
    automationResults.hosting_added = domainAdded && wwwDomainAdded;
    // Get Vercel domain configuration for DNS instructions
    const vercelConfig = await vercel.getDomainConfig(cleanedDomain);
    if (vercelConfig) {
      automationResults.instructions.dns_records = [
        {
          type: "A",
          name: "@",
          value: vercelConfig.recommendedIPv4?.[0]?.value?.[0] || "76.76.21.21",
          description: "Points your domain to Vercel"
        },
        {
          type: "CNAME",
          name: "www",
          value: (vercelConfig.recommendedCNAME?.[0]?.value || "cname.vercel-dns.com").replace(/\.$/, ''),
          description: "Points www subdomain to Vercel"
        }
      ];
    } else {
      // Fallback instructions if config is not available
      automationResults.instructions.dns_records = [
        {
          type: "A",
          name: "@",
          value: "76.76.21.21",
          description: "Points your domain to Vercel"
        },
        {
          type: "CNAME",
          name: "www",
          value: "cname.vercel-dns.com",
          description: "Points www subdomain to Vercel"
        }
      ];
    }
    // Vercel handles SSL automatically once DNS is configured
    automationResults.ssl_ready = automationResults.hosting_added;
    // Initial status remains not_configured until Vercel reports misconfigured === false
    const finalStatus = 'not_configured';
    const finalMessage = "Domain saved. Configure DNS using the provided instructions and check status to activate.";
    return createJsonResponse({
      success: true,
      domain: cleanedDomain,
      status: finalStatus,
      automation: automationResults,
      message: finalMessage,
      details: {
        dns_configured: automationResults.dns_created,
        hosting_configured: automationResults.hosting_added,
        ssl_ready: automationResults.ssl_ready,
        requires_manual_setup: !automationResults.dns_created && !automationResults.hosting_added
      }
    }, 200, origin);
  } catch (error) {
    console.error('Domain automation error:', error);
    return createJsonResponse({
      error: "Internal server error",
      details: error?.message || 'Unknown error'
    }, 500, origin);
  }
});
