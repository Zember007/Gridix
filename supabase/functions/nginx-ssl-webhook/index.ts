import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface WebhookRequest {
  domain: string;
  action: 'add' | 'remove';
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
    const { domain, action }: WebhookRequest = await req.json();
    
    const expectedSecret = Deno.env.get("WEBHOOK_SECRET");

    if (!domain) {
      return new Response(JSON.stringify({ 
        error: "Domain is required" 
      }), { 
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      });
    }

    // Validate domain format
    const domainRegex = /^[a-zA-Z0-9][a-zA-Z0-9-]{0,61}[a-zA-Z0-9](?:\.[a-zA-Z0-9][a-zA-Z0-9-]{0,61}[a-zA-Z0-9])*$/;
    if (!domainRegex.test(domain)) {
      return new Response(JSON.stringify({ 
        error: "Invalid domain format" 
      }), { 
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      });
    }

    let result;
    
    if (action === 'add') {
      // Call the auto-ssl-nginx.sh script
      const process = new Deno.Command("bash", {
        args: ["/path/to/scripts/auto-ssl-nginx.sh", domain],
        stdout: "piped",
        stderr: "piped",
      });

      const { code, stdout, stderr } = await process.output();
      const output = new TextDecoder().decode(stdout);
      const error = new TextDecoder().decode(stderr);

      if (code === 0) {
        result = {
          success: true,
          message: `Domain ${domain} configured successfully`,
          output: output
        };
      } else {
        result = {
          success: false,
          error: `Failed to configure domain ${domain}`,
          output: output,
          stderr: error
        };
      }
    } else if (action === 'remove') {
      // Remove domain configuration
      const removeProcess = new Deno.Command("bash", {
        args: ["-c", `
          # Remove Nginx configuration
          rm -f /etc/nginx/sites-enabled/${domain}
          rm -f /etc/nginx/sites-available/${domain}
          
          # Remove SSL certificate
          certbot delete --cert-name ${domain} --non-interactive || true
          
          # Reload Nginx
          systemctl reload nginx
          
          echo "Domain ${domain} removed successfully"
        `],
        stdout: "piped",
        stderr: "piped",
      });

      const { code, stdout, stderr } = await removeProcess.output();
      const output = new TextDecoder().decode(stdout);
      const error = new TextDecoder().decode(stderr);

      if (code === 0) {
        result = {
          success: true,
          message: `Domain ${domain} removed successfully`,
          output: output
        };
      } else {
        result = {
          success: false,
          error: `Failed to remove domain ${domain}`,
          output: output,
          stderr: error
        };
      }
    } else {
      return new Response(JSON.stringify({ 
        error: "Invalid action. Use 'add' or 'remove'" 
      }), { 
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      });
    }

    const statusCode = result.success ? 200 : 500;
    
    return new Response(JSON.stringify(result), {
      status: statusCode,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (error) {
    console.error('Webhook error:', error);
    
    return new Response(JSON.stringify({ 
      error: "Internal server error",
      details: error.message 
    }), { 
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" }
    });
  }
});
