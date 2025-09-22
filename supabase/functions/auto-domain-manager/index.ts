import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface DomainRequest {
  domain: string;
  project_id: string;
  dns_provider?: 'cloudflare' | 'godaddy' | 'namecheap';
  api_key?: string;
  zone_id?: string;
}

interface DNSProvider {
  name: string;
  createARecord(domain: string, ip: string): Promise<boolean>;
  createCNAMERecord(domain: string, target: string): Promise<boolean>;
}

class CloudflareDNS implements DNSProvider {
  name = "cloudflare";
  
  constructor(
    private apiKey: string, 
    private zoneId: string,
    private email?: string
  ) {}
  
  async createARecord(domain: string, ip: string): Promise<boolean> {
    try {
      const response = await fetch(
        `https://api.cloudflare.com/client/v4/zones/${this.zoneId}/dns_records`,
        {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${this.apiKey}`,
            "Content-Type": "application/json",
            ...(this.email && { "X-Auth-Email": this.email }),
          },
          body: JSON.stringify({
            type: "A",
            name: "@",
            content: ip,
            ttl: 3600,
          }),
        }
      );
      
      const result = await response.json();
      return response.ok && result.success;
    } catch (error) {
      console.error('Cloudflare A record creation failed:', error);
      return false;
    }
  }
  
  async createCNAMERecord(domain: string, target: string): Promise<boolean> {
    try {
      const response = await fetch(
        `https://api.cloudflare.com/client/v4/zones/${this.zoneId}/dns_records`,
        {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${this.apiKey}`,
            "Content-Type": "application/json",
            ...(this.email && { "X-Auth-Email": this.email }),
          },
          body: JSON.stringify({
            type: "CNAME",
            name: "www",
            content: target,
            ttl: 3600,
          }),
        }
      );
      
      const result = await response.json();
      return response.ok && result.success;
    } catch (error) {
      console.error('Cloudflare CNAME record creation failed:', error);
      return false;
    }
  }
}

class VercelDomainManager {
  private apiKey: string;
  private projectId: string;
  
  constructor(apiKey: string, projectId: string) {
    this.apiKey = apiKey;
    this.projectId = projectId;
  }
  
  async addDomain(domain: string): Promise<boolean> {
    try {
      const response = await fetch(
        `https://api.vercel.com/v9/projects/${this.projectId}/domains`,
        {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${this.apiKey}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            name: domain,
          }),
        }
      );
      
      const result = await response.json();
      return response.ok;
    } catch (error) {
      console.error('Vercel domain addition failed:', error);
      return false;
    }
  }
  
  async getDomainConfig(domain: string) {
    try {
      const response = await fetch(
        `https://api.vercel.com/v6/domains/${domain}/config`,
        {
          headers: {
            "Authorization": `Bearer ${this.apiKey}`,
          },
        }
      );
      
      return response.ok ? await response.json() : null;
    } catch (error) {
      console.error('Vercel domain config fetch failed:', error);
      return null;
    }
  }
}

function isValidDomain(domain: string): boolean {
  const domainRegex = /^[a-zA-Z0-9][a-zA-Z0-9-]{0,61}[a-zA-Z0-9](?:\.[a-zA-Z0-9][a-zA-Z0-9-]{0,61}[a-zA-Z0-9])*$/;
  return domainRegex.test(domain) && domain.length <= 253;
}

function cleanDomain(domain: string): string {
  return domain.toLowerCase().trim().replace(/^https?:\/\//, '').replace(/^www\./, '').replace(/\/$/, '');
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return new Response("Method not allowed", { 
      status: 405,
      headers: corsHeaders 
    });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const { domain, project_id, dns_provider, api_key, zone_id }: DomainRequest = await req.json();
    
    // Validate input
    if (!domain || !project_id) {
      return new Response(JSON.stringify({ 
        error: "Missing required fields: domain and project_id" 
      }), { 
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      });
    }

    const cleanedDomain = cleanDomain(domain);
    
    if (!isValidDomain(cleanedDomain)) {
      return new Response(JSON.stringify({ 
        error: "Invalid domain format" 
      }), { 
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      });
    }

    // Check if domain already exists
    const { data: existingDomain } = await supabase
      .from('project_domains')
      .select('id')
      .eq('domain', cleanedDomain)
      .single();

    if (existingDomain) {
      return new Response(JSON.stringify({ 
        error: "Domain already exists" 
      }), { 
        status: 409,
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      });
    }

    // Add domain to database with pending status
    const { data: domainData, error: dbError } = await supabase
      .from('project_domains')
      .insert({
        project_id,
        domain: cleanedDomain,
        status: 'pending'
      })
      .select()
      .single();

    if (dbError) {
      console.error('Database error:', dbError);
      return new Response(JSON.stringify({ 
        error: "Failed to save domain to database" 
      }), { 
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      });
    }

    const serverIP = Deno.env.get("SERVER_IP") || "YOUR_SERVER_IP";
    const serverDomain = Deno.env.get("SERVER_DOMAIN") || "your-domain.com";
    const vercelApiKey = Deno.env.get("VERCEL_API_KEY");
    const vercelProjectId = Deno.env.get("VERCEL_PROJECT_ID");
    
    let automationResults = {
      dns_created: false,
      hosting_added: false,
      ssl_ready: false,
      instructions: {
        dns_records: [
          {
            type: "A",
            name: "@",
            value: serverIP,
            description: "Points your domain to our server"
          },
          {
            type: "CNAME", 
            name: "www",
            value: serverDomain,
            description: "Points www subdomain to main domain"
          }
        ]
      }
    };

    // Try to automate DNS creation if provider info is available
    if (dns_provider === 'cloudflare' && api_key && zone_id) {
      const cloudflare = new CloudflareDNS(api_key, zone_id);
      
      const aRecordSuccess = await cloudflare.createARecord(cleanedDomain, serverIP);
      const cnameSuccess = await cloudflare.createCNAMERecord(cleanedDomain, serverDomain);
      
      automationResults.dns_created = aRecordSuccess && cnameSuccess;
    }

    // Try to automate Vercel domain addition if configured
    if (vercelApiKey && vercelProjectId) {
      const vercel = new VercelDomainManager(vercelApiKey, vercelProjectId);
      
      const domainAdded = await vercel.addDomain(cleanedDomain);
      const wwwDomainAdded = await vercel.addDomain(`www.${cleanedDomain}`);
      
      automationResults.hosting_added = domainAdded && wwwDomainAdded;
      automationResults.ssl_ready = true; // Vercel handles SSL automatically
      
      // Update DNS instructions for Vercel
      if (domainAdded) {
        const config = await vercel.getDomainConfig(cleanedDomain);
        if (config) {
          automationResults.instructions.dns_records = [
            {
              type: "A",
              name: "@",
              value: "76.76.21.21", // Vercel IP
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
      }
    }

    // Try to automate Nginx + SSL setup if webhook is configured
    const nginxWebhookUrl = Deno.env.get("NGINX_WEBHOOK_URL");
    const webhookSecret = Deno.env.get("WEBHOOK_SECRET");
    
    if (nginxWebhookUrl && !vercelApiKey) { // Only use Nginx if not using Vercel
      try {
        const webhookResponse = await fetch(nginxWebhookUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            domain: cleanedDomain,
            action: 'add',
            webhook_secret: webhookSecret,
          }),
        });

        const webhookResult = await webhookResponse.json();
        
        if (webhookResult.success) {
          automationResults.hosting_added = true;
          automationResults.ssl_ready = true;
          console.log('Nginx + SSL configured successfully for', cleanedDomain);
        } else {
          console.error('Nginx webhook failed:', webhookResult.error);
        }
      } catch (error) {
        console.error('Error calling Nginx webhook:', error);
      }
    }

    // Update domain status based on automation results
    let newStatus = 'active';
    if (!automationResults.dns_created && !automationResults.hosting_added) {
      newStatus = 'pending_setup';
    } else if (automationResults.dns_created || automationResults.hosting_added) {
      newStatus = 'active';
    }

    await supabase
      .from('project_domains')
      .update({ 
        status: newStatus,
        updated_at: new Date().toISOString()
      })
      .eq('id', domainData.id);

    return new Response(JSON.stringify({
      success: true,
      domain: cleanedDomain,
      automation: automationResults,
      message: automationResults.dns_created || automationResults.hosting_added
        ? "Domain automated successfully! It may take up to 24 hours for DNS changes to propagate."
        : "Domain added successfully! Please configure DNS records manually using the provided instructions."
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (error) {
    console.error('Domain automation error:', error);
    
    return new Response(JSON.stringify({ 
      error: "Internal server error",
      details: error.message 
    }), { 
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" }
    });
  }
});
