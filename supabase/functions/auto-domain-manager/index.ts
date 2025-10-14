// @ts-nocheck
/* eslint-disable */
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

// Helper to ensure webhook base URL is normalized and action endpoint is appended
function buildWebhookUrl(baseUrl: string, hookId: 'nginx-ssl-add' | 'nginx-ssl-remove' | 'nginx-ssl-status'): string {
  const trimmed = baseUrl.endsWith('/') ? baseUrl.slice(0, -1) : baseUrl;
  return `${trimmed}/${hookId}`;
}

async function callWebhook(
  url: string,
  payload: Record<string, unknown>
): Promise<{ ok: boolean; status: number; statusText: string; text: string; json: unknown }> {
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  console.log(res);
  
  const text = await res.text();
  let json: unknown = undefined;
  try {
    json = text ? JSON.parse(text) : undefined;
  } catch (e) {
    json = undefined;
  }
  return { ok: res.ok, status: res.status, statusText: res.statusText, text, json };
}

function delay(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
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

    const body = await req.json();
    const { domain, project_id, dns_provider, api_key, zone_id } = body as DomainRequest & { action?: 'add' | 'status' | 'remove', domain_id?: string };
    const action: 'add' | 'status' | 'remove' = (body.action ?? 'add');
    
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

    if (action === 'status') {
      const nginxWebhookUrl = Deno.env.get("NGINX_WEBHOOK_URL");
      const webhookSecret = Deno.env.get("WEBHOOK_SECRET");
      if (!nginxWebhookUrl || !webhookSecret) {
        return new Response(JSON.stringify({ error: 'Webhook not configured' }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
      }
      const statusUrl = buildWebhookUrl(nginxWebhookUrl, 'nginx-ssl-status');
      const result = await callWebhook(statusUrl, { domain: cleanedDomain, webhook_secret: webhookSecret, action: 'status' });
      if (!result.ok) {
        return new Response(JSON.stringify({ error: `Status check failed (${result.status})`, response: result.text }), { status: 502, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
      }
      
      return new Response(JSON.stringify({ success: true, domain: cleanedDomain, status: result.json ?? result.text }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    if (action === 'remove') {
      const nginxWebhookUrl = Deno.env.get("NGINX_WEBHOOK_URL");
      const webhookSecret = Deno.env.get("WEBHOOK_SECRET");
      if (!nginxWebhookUrl || !webhookSecret) {
        return new Response(JSON.stringify({ error: 'Webhook not configured' }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
      }
      // If domain_id is provided, prefer deleting that row after webhook
      const domainId: string | undefined = (body.domain_id as string | undefined);
      const removeUrl = buildWebhookUrl(nginxWebhookUrl, 'nginx-ssl-remove');
      const removeRes = await callWebhook(removeUrl, { domain: cleanedDomain, webhook_secret: webhookSecret, action: 'remove' });

      // Remove from DB
      if (domainId) {
        await supabase.from('project_domains').delete().eq('id', domainId);
      } else {
        await supabase.from('project_domains').delete().eq('domain', cleanedDomain).eq('project_id', project_id);
      }
      return new Response(JSON.stringify({ success: true, domain: cleanedDomain, message: removeRes.json?.message ?? 'Domain removed' }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    // Check if domain already exists for add
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
    
    const automationResults = {
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
      console.log(`Attempting to configure Nginx + SSL for domain: ${cleanedDomain}`);
      console.log(`Webhook URL: ${nginxWebhookUrl}`);
      
      // Validate webhook URL
      if (!nginxWebhookUrl.startsWith('http://') && !nginxWebhookUrl.startsWith('https://')) {
        console.error('Invalid webhook URL format. Must start with http:// or https://');
        automationResults.hosting_added = false;
        automationResults.ssl_ready = false;
      } else {
        try {
          // Construct the correct webhook endpoint URL for adding domain
          const webhookAddUrl = buildWebhookUrl(nginxWebhookUrl, 'nginx-ssl-add');
          
          console.log('Sending webhook request to:', webhookAddUrl);
          
          const webhookPayload = {
            domain: cleanedDomain,
            webhook_secret: webhookSecret,
            action: 'add'
          };
          
          console.log('Webhook payload:', {
            domain: cleanedDomain,
            action: 'add',
            has_secret: !!webhookSecret
          });
      
          const addRes = await callWebhook(webhookAddUrl, webhookPayload);

          console.log(`Webhook response status: ${addRes.status} ${addRes.statusText}`);
          
          if (!addRes.ok) {
            const errorText = addRes.text;
            
            // Handle specific HTTP errors
              if (addRes.status === 404) {
              console.error(`Webhook endpoint not found (404). Please check if webhook server is running and URL is correct.`);
                console.error(`Webhook URL: ${webhookAddUrl}`);
              console.error('Response body:', errorText);
              } else if (addRes.status === 500) {
              console.error(`Webhook server error (500). Check webhook server logs.`);
              console.error('Response body:', errorText);
              } else if (addRes.status === 401 || addRes.status === 403) {
                console.error(`Webhook authentication failed (${addRes.status}). Check webhook secret.`);
              console.error('Response body:', errorText);
            } else {
                console.error(`Webhook HTTP error: ${addRes.status} ${addRes.statusText}`);
              console.error('Response body:', errorText);
            }
            
            automationResults.hosting_added = false;
            automationResults.ssl_ready = false;
            await supabase
              .from('project_domains')
              .update({ status: 'error', updated_at: new Date().toISOString() })
              .eq('id', domainData.id);
            return new Response(JSON.stringify({
              success: false,
              error: `Webhook add failed (${addRes.status})`,
              details: errorText
            }), { status: 502, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
          } else {
            const contentType = undefined;
            const responseText = addRes.text;
            
            console.log('Webhook response content-type:', contentType);
            console.log('Webhook response body:', responseText);
            
            if (!responseText.trim()) {
              // Treat empty successful response as success
              automationResults.hosting_added = true;
              automationResults.ssl_ready = true;
              console.log('Webhook returned empty response; treating as success');
            } else {
              // Try to parse as JSON, but accept plain text success messages too
              try {
                const webhookResult = addRes.json ?? JSON.parse(responseText);
                console.log('Parsed webhook result:', webhookResult);
                
                if (webhookResult.status === 'success') {
                  automationResults.hosting_added = true;
                  automationResults.ssl_ready = true;
                  console.log(`Nginx + SSL configured successfully for ${cleanedDomain}:`, webhookResult.message);
                } else {
                  console.error('Nginx webhook failed:', {
                    status: webhookResult.status,
                    message: webhookResult.message,
                    error_type: webhookResult.error_type
                  });
                  automationResults.hosting_added = false;
                  automationResults.ssl_ready = false;
                }
              } catch (jsonError) {
                // If not JSON, check if it's a success message in plain text
                if (responseText.includes('success') || responseText.includes('Success') || responseText.includes('OK')) {
                  automationResults.hosting_added = true;
                  automationResults.ssl_ready = true;
                  console.log('Webhook returned success (plain text):', responseText);
                } else {
                  console.error('Failed to parse webhook response:', jsonError);
                  console.error('Response text:', responseText);
                  automationResults.hosting_added = false;
                  automationResults.ssl_ready = false;
                  await supabase
                    .from('project_domains')
                    .update({ status: 'error', updated_at: new Date().toISOString() })
                    .eq('id', domainData.id);
                  return new Response(JSON.stringify({
                    success: false,
                    error: 'Invalid webhook response',
                    details: responseText
                  }), { status: 502, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
                }
              }
            }
          }

          // Poll status every 30s up to 3 attempts (including immediate check)
          try {
            const statusUrl = buildWebhookUrl(nginxWebhookUrl, 'nginx-ssl-status');
            const maxAttempts = 3;
            for (let attempt = 1; attempt <= maxAttempts; attempt++) {
              if (attempt > 1) {
                await delay(30000);
              }
              const statusRes = await callWebhook(statusUrl, { domain: cleanedDomain, webhook_secret: webhookSecret, action: 'status' });
              if (statusRes.ok && statusRes.json && statusRes.json.status === 'success') {
                const overall = statusRes.json.overall_status as string | undefined;
                if (overall === 'active') {
                  automationResults.hosting_added = true;
                  automationResults.ssl_ready = true;
                  break;
                }
              }
            }
            if (!automationResults.hosting_added || !automationResults.ssl_ready) {
              await supabase
                .from('project_domains')
                .update({ status: 'error', updated_at: new Date().toISOString() })
                .eq('id', domainData.id);
              return new Response(JSON.stringify({
                success: false,
                error: 'Domain is not configured (DNS/SSL not ready)',
                message: 'Please verify DNS A and CNAME records and try again.'
              }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
            }
          } catch (pollErr) {
            console.warn('Status polling failed:', pollErr);
            await supabase
              .from('project_domains')
              .update({ status: 'error', updated_at: new Date().toISOString() })
              .eq('id', domainData.id);
            return new Response(JSON.stringify({
              success: false,
              error: 'Status polling failed',
              details: (pollErr as Error)?.message
            }), { status: 502, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
          }
        } catch (error) {
          console.error('Error calling Nginx webhook:', error);
          automationResults.hosting_added = false;
          automationResults.ssl_ready = false;
          await supabase
            .from('project_domains')
            .update({ status: 'error', updated_at: new Date().toISOString() })
            .eq('id', domainData.id);
          return new Response(JSON.stringify({
            success: false,
            error: 'Error calling Nginx webhook',
            details: (error as Error)?.message
          }), { status: 502, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
        }
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

    // Determine final status and message
    let finalStatus = 'active';
    let finalMessage = '';
    
    if (automationResults.dns_created && automationResults.hosting_added) {
      finalStatus = 'active';
      finalMessage = "Domain automated successfully! DNS records created and hosting configured. It may take up to 24 hours for DNS changes to propagate.";
    } else if (automationResults.hosting_added) {
      finalStatus = 'active';
      finalMessage = "Hosting configured successfully! Please configure DNS records manually using the provided instructions.";
    } else if (automationResults.dns_created) {
      finalStatus = 'pending_setup';
      finalMessage = "DNS records created successfully! Please configure hosting manually.";
    } else {
      finalStatus = 'pending_setup';
      finalMessage = "Domain added successfully! Please configure DNS records and hosting manually using the provided instructions.";
    }

    return new Response(JSON.stringify({
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
