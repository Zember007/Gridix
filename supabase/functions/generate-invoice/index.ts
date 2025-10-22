import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { getCorsHeaders, createCorsResponse, createJsonResponse } from '../_shared/cors.ts';
import { createGeorgianInvoiceTemplate } from '../_shared/invoice-template-ka.ts';
import { createEnglishInvoiceTemplate } from '../_shared/invoice-template-en.ts';

const supabase = createClient(Deno.env.get("SUPABASE_URL") ?? "", Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "");

// Import pdfmake dynamically
async function getPdfMake() {
    try {
      const pdfmakeModule = await import("https://esm.sh/pdfmake@0.2.12/build/pdfmake.js");
      const vfsFontsModule = await import("https://esm.sh/pdfmake@0.2.12/build/vfs_fonts.js");
    
      // Получаем объект pdfmake
      const pdfmake = pdfmakeModule.default || pdfmakeModule.pdfMake || pdfmakeModule;

      if (!pdfmake) {
        throw new Error("Failed to load pdfmake module");
    }
    
      // Подключаем встроенные шрифты Roboto
      pdfmake.vfs = vfsFontsModule.default.pdfMake.vfs;
    
      // Настраиваем шрифты — используем Roboto из встроенных
      pdfmake.fonts = {
        Roboto: {
          normal: "Roboto-Regular.ttf",
          bold: "Roboto-Medium.ttf",
          italics: "Roboto-Italic.ttf",
          bolditalics: "Roboto-MediumItalic.ttf"
        }
      };
        
        return pdfmake;
    } catch (error) {
        console.error("Error loading pdfmake:", error);
        throw new Error(`Failed to load pdfmake: ${error.message}`);
    }
}

async function downloadImageAsBase64(url: string): Promise<string | null> {
  try {
    console.log(`Downloading image from: ${url}`);
    const response = await fetch(url);
    if (!response.ok) {
      console.warn(`Failed to download image: ${response.status} ${response.statusText}`);
      return null;
    }
    
    const arrayBuffer = await response.arrayBuffer();
    const base64 = btoa(String.fromCharCode(...new Uint8Array(arrayBuffer)));
    const contentType = response.headers.get('content-type') || 'image/png';
    
    return `data:${contentType};base64,${base64}`;
  } catch (error) {
    console.warn(`Error downloading image from ${url}:`, error);
    return null;
  }
}

async function generateInvoicePDF(invoiceData: any, language: string = 'ka') {
  const pdfmake = await getPdfMake();

  console.log("pdfmake object keys:", Object.keys(pdfmake));
  console.log("pdfmake.createPdf type:", typeof pdfmake.createPdf);

  // Download and convert external images to base64
  let logoDataUrl: string | null = null;
  let stampDataUrl: string | null = null;
  
  if (invoiceData.logoUrl) {
    logoDataUrl = await downloadImageAsBase64(invoiceData.logoUrl);
  }
  
  if (invoiceData.stampUrl) {
    stampDataUrl = await downloadImageAsBase64(invoiceData.stampUrl);
  }

  // Create a copy of invoice data with base64 images
  const processedInvoiceData = {
    ...invoiceData,
    logoUrl: logoDataUrl || undefined,
    stampUrl: stampDataUrl || undefined
  };

  let docDefinition = createEnglishInvoiceTemplate(processedInvoiceData);
 /*  if (language === 'en') {
    docDefinition = createEnglishInvoiceTemplate(processedInvoiceData);
  } else {
    docDefinition = createGeorgianInvoiceTemplate(processedInvoiceData);
  } */

  // Check if createPdf exists and is a function
  if (typeof pdfmake.createPdf === 'function') {
    try {
      console.log("Creating PDF with standard fonts");
      return pdfmake.createPdf(docDefinition);
    } catch (error) {
      console.error("Error creating PDF:", error);
      throw new Error(`Failed to create PDF: ${error.message}`);
    }
  } else {
    throw new Error(`createPdf is not a function. Available methods: ${Object.keys(pdfmake).join(', ')}`);
  }
}

async function uploadToStorage(pdfBuffer: ArrayBuffer, fileName: string): Promise<string> {
  const { data, error } = await supabase.storage
    .from('invoices')
    .upload(fileName, pdfBuffer, {
      contentType: 'application/pdf',
      upsert: true
    });

  if (error) {
    throw new Error(`Failed to upload PDF: ${error.message}`);
  }

  // Get public URL
  const { data: { publicUrl } } = supabase.storage
    .from('invoices')
    .getPublicUrl(fileName);

  return publicUrl;
}

async function handleGenerateInvoice(req: Request, body: any) {
  const origin = req.headers.get('Origin');

  try {
    // Get user from JWT
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return createJsonResponse({ error: "Missing authorization header" }, 401, origin);
    }

    const jwt = authHeader.replace("Bearer ", "");
    const { data: { user }, error: userError } = await supabase.auth.getUser(jwt);
    if (userError || !user) {
      return createJsonResponse({ error: "Invalid token" }, 401, origin);
    }

    const { subscription_id } = body;
    if (!subscription_id) {
      return createJsonResponse({ error: "Missing subscription_id" }, 400, origin);
    }

    console.log("generate-invoice: Looking for subscription with ID:", subscription_id);

    // Get subscription details with simplified query
    const { data: subscription, error: subError } = await supabase
      .from('user_subscriptions')
      .select(`
        *,
        subscription_plans(name, base_price),
        projects(name),
        user_profiles(full_name, company_name)
      `)
      .eq('id', subscription_id)
      .single();

    console.log("generate-invoice: Subscription query result:", { subscription, subError });

    if (subError || !subscription) {
      console.error("generate-invoice: Subscription not found. Error:", subError);

      // Try to find any subscription for this user to help debug
      const { data: userSubscriptions } = await supabase
        .from('user_subscriptions')
        .select('id, user_id, project_id, status')
        .eq('user_id', user.id)
        .limit(5);

      console.log("generate-invoice: User's subscriptions for debugging:", userSubscriptions);

      return createJsonResponse({
        error: "Subscription not found",
        debug: {
          requested_id: subscription_id,
          user_id: user.id,
          user_subscriptions: userSubscriptions
        }
      }, 404, origin);
    }

    // Get system invoice configuration
    const { data: systemConfig, error: configError } = await supabase
      .from('system_settings')
      .select('setting_value')
      .eq('setting_key', 'invoice_config')
      .single();

    if (configError || !systemConfig) {
      return createJsonResponse({ error: "Invoice configuration not found" }, 500, origin);
    }

    const invoiceConfig = systemConfig.setting_value;

    // Fetch company settings separately since it's not in the main query
    const { data: companySettingsData, error: companyError } = await supabase
      .from('company_settings')
      .select('company_name, tax_id, address, phone, email, bank_name, iban')
      .eq('user_id', subscription.user_id)
      .single();

    console.log("generate-invoice: Company settings query result:", { companySettingsData, companyError });

    if (companyError || !companySettingsData) {
      return createJsonResponse({
        error: "Company settings not found",
        debug: {
          user_id: subscription.user_id,
          company_error: companyError
        }
      }, 400, origin);
    }

    const companySettings = companySettingsData;

    // Generate invoice number
    const now = new Date();
    const dateStr = now.toISOString().slice(0, 10).replace(/-/g, '');
    const projectId = subscription.project_id?.substring(0, 8) || '00000000';
    const invoiceNumber = `INV-${dateStr}-${projectId}`;

    // Generate payment purpose
    const paymentPurpose = `Payment for ${subscription.duration_months} months of the "${subscription.projects?.name}" project (account ${companySettings.company_name})`;

    // Prepare invoice data
    const invoiceData = {
      invoiceNumber,
      date: now.toLocaleDateString('ka-GE'),
      companyName: companySettings.company_name,
      companyTaxId: companySettings.tax_id,
      companyAddress: companySettings.address,
      companyPhone: companySettings.phone,
      companyEmail: companySettings.email,
      companyBank: companySettings.bank_name,
      companyIban: companySettings.iban,
      projectName: subscription.projects?.name,
      planName: subscription.subscription_plans?.name,
      durationMonths: subscription.duration_months,
      monthlyPrice: parseFloat(subscription.subscription_plans?.base_price || '0'),
      discountPercentage: subscription.discount_percentage || 0,
      totalPrice: subscription.final_price || 0,
      paymentPurpose,
      gridixName: invoiceConfig.company_name,
      gridixTaxId: invoiceConfig.tax_id,
      gridixBank: invoiceConfig.bank_name,
      gridixIban: invoiceConfig.iban,
      gridixCurrency: invoiceConfig.currency,
      logoUrl: invoiceConfig.logo_url,
      stampUrl: invoiceConfig.stamp_url
    };

    // Generate PDF
    const pdfDoc = await generateInvoicePDF(invoiceData, invoiceConfig.language);

    // Handle async getBuffer with callback
    const pdfBuffer = await new Promise<ArrayBuffer>((resolve, reject) => {
      pdfDoc.getBuffer((buffer: ArrayBuffer) => {
        resolve(buffer);
      });
    });

    // Upload to storage
    const fileName = `invoice-${invoiceNumber}.pdf`;
    const publicUrl = await uploadToStorage(pdfBuffer, fileName);

    // Update subscription with invoice details
    const { error: updateError } = await supabase
      .from('user_subscriptions')
      .update({
        invoice_number: invoiceNumber,
        invoice_url: publicUrl,
        invoice_generated_at: now.toISOString(),
        payment_purpose: paymentPurpose,
        payment_method: 'invoice'
      })
      .eq('id', subscription_id);

    if (updateError) {
      console.error('Error updating subscription:', updateError);
      return createJsonResponse({ error: "Failed to update subscription" }, 500, origin);
    }

    return createJsonResponse({
      success: true,
      invoice: {
        number: invoiceNumber,
        url: publicUrl,
        generated_at: now.toISOString()
      }
    }, 200, origin);

  } catch (error) {
    console.error("Generate invoice error:", error);
    return createJsonResponse({ error: "Internal server error" }, 500, origin);
  }
}

Deno.serve(async (req) => {
  const origin = req.headers.get('Origin');
  const corsHeaders = getCorsHeaders(origin);

  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return createCorsResponse(origin);
  }

  try {
    const body = await req.json();
    return await handleGenerateInvoice(req, body);
  } catch (error) {
    console.error("Handler error:", error);
    return createJsonResponse({ error: error.message }, 500, origin);
  }
});