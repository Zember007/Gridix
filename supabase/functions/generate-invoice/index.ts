import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { getCorsHeaders, createCorsResponse, createJsonResponse } from '../_shared/cors.ts';
import { createGeorgianInvoiceTemplate } from '../_shared/invoice-template-ka.ts';
import { createEnglishInvoiceTemplate } from '../_shared/invoice-template-en.ts';
import { georgianBoldBase64, georgianRegularBase64 } from "../_shared/fonts.ts";

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
    pdfmake.vfs = {
      ...vfsFontsModule.default.pdfMake.vfs,
      'NotoSansGeorgian-Regular.ttf': georgianRegularBase64,
      'NotoSansGeorgian-Bold.ttf': georgianBoldBase64
    };

    // Настраиваем шрифты — используем Roboto из встроенных
    pdfmake.fonts = {
      Roboto: {
        normal: "Roboto-Regular.ttf",
        bold: "Roboto-Medium.ttf",
      },
      Georgian: {  
        normal: 'NotoSansGeorgian-Regular.ttf',
        bold: 'NotoSansGeorgian-Bold.ttf'
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

async function convertCurrencyFromUSD(amountUSD: number, targetCurrency: string): Promise<number> {
  try {
    // If target currency is USD, no conversion needed
    if (targetCurrency.toUpperCase() === 'USD') {
      return amountUSD;
    }

    console.log(`Converting ${amountUSD} USD to ${targetCurrency}`);
    
    // Use ExchangeRate-API (free tier: 1500 requests/month)
    const response = await fetch(`https://api.exchangerate-api.com/v4/latest/USD`);
    
    if (!response.ok) {
      console.warn(`Failed to fetch exchange rates: ${response.status} ${response.statusText}`);
      // Fallback to fixed rates if API fails
      return convertWithFallbackRates(amountUSD, targetCurrency);
    }

    const data = await response.json();
    const exchangeRate = data.rates[targetCurrency.toUpperCase()];
    
    if (!exchangeRate) {
      console.warn(`Exchange rate not found for ${targetCurrency}, using fallback`);
      return convertWithFallbackRates(amountUSD, targetCurrency);
    }

    const convertedAmount = amountUSD * exchangeRate;
    console.log(`Converted ${amountUSD} USD to ${convertedAmount} ${targetCurrency} (rate: ${exchangeRate})`);
    
    return convertedAmount;
  } catch (error) {
    console.warn(`Error converting currency: ${error.message}, using fallback rates`);
    return convertWithFallbackRates(amountUSD, targetCurrency);
  }
}

function convertWithFallbackRates(amountUSD: number, targetCurrency: string): number {
  // Fallback exchange rates (approximate values)
  const fallbackRates: Record<string, number> = {
    'EUR': 0.85,
    'GBP': 0.73,
    'GEL': 2.65,
    'RUB': 90.0,
    'JPY': 110.0,
    'CAD': 1.25,
    'AUD': 1.35,
    'CHF': 0.88,
    'CNY': 6.45,
    'INR': 75.0,
    'BRL': 5.0,
    'MXN': 20.0,
    'KRW': 1200.0,
    'SGD': 1.35,
    'HKD': 7.8,
    'NZD': 1.45,
    'SEK': 8.5,
    'NOK': 8.8,
    'DKK': 6.3,
    'PLN': 3.9,
    'CZK': 21.5,
    'HUF': 300.0,
    'RON': 4.2,
    'BGN': 1.66,
    'HRK': 6.5,
    'RSD': 100.0,
    'UAH': 27.0,
    'BYN': 2.5,
    'KZT': 430.0,
    'UZS': 11000.0,
    'KGS': 85.0,
    'TJS': 10.5,
    'TMT': 3.5,
    'AMD': 400.0,
    'AZN': 1.7,
    'TRY': 8.5,
    'ILS': 3.2,
    'AED': 3.67,
    'SAR': 3.75,
    'QAR': 3.64,
    'KWD': 0.30,
    'BHD': 0.38,
    'OMR': 0.38,
    'JOD': 0.71,
    'LBP': 1500.0,
    'EGP': 15.7,
    'MAD': 9.0,
    'TND': 2.8,
    'DZD': 140.0,
    'ZAR': 15.0,
    'NGN': 410.0,
    'KES': 110.0,
    'GHS': 6.0,
    'ETB': 45.0,
    'UGX': 3500.0,
    'TZS': 2300.0,
    'MWK': 820.0,
    'ZMW': 18.0,
    'BWP': 11.0,
    'SZL': 15.0,
    'LSL': 15.0,
    'NAD': 15.0,
    'AOA': 650.0,
    'MZN': 64.0,
    'BIF': 2000.0,
    'RWF': 1000.0,
    'CDF': 2000.0,
    'XAF': 550.0,
    'XOF': 550.0,
    'KMF': 450.0,
    'DJF': 180.0,
    'SOS': 580.0,
    'ERN': 15.0,
    'MGA': 4000.0,
    'MUR': 45.0,
    'SCR': 13.5,
    'SLL': 10000.0,
    'GMD': 50.0,
    'GNF': 9500.0,
    'LRD': 150.0,
    'CVE': 100.0,
    'STN': 20.0,
    'XPF': 100.0,
    'TOP': 2.2,
    'VUV': 110.0,
    'WST': 2.5,
    'FJD': 2.1,
    'PGK': 3.5,
    'SBD': 8.0,
    'VND': 23000.0,
    'LAK': 9500.0,
    'KHR': 4100.0,
    'MMK': 1800.0,
    'THB': 33.0,
    'MYR': 4.2,
    'PHP': 50.0,
    'IDR': 14000.0,
    'BND': 1.35,
    'LKR': 200.0,
    'MVR': 15.4,
    'NPR': 120.0,
    'PKR': 170.0,
    'AFN': 75.0,
    'BDT': 85.0,
    'BTN': 75.0,
    'MOP': 8.0,
    'MNT': 2850.0,
    'KPW': 900.0,
    'TWD': 28.0,
    'ARS': 100.0,
    'CLP': 800.0,
    'COP': 3800.0,
    'PEN': 3.7,
    'UYU': 42.0,
    'VES': 4.5,
    'BOB': 6.9,
    'PYG': 7000.0,
    'GYD': 210.0,
    'SRD': 20.0,
    'TTD': 6.8,
    'JMD': 150.0,
    'BBD': 2.0,
    'XCD': 2.7,
    'AWG': 1.8,
    'BZD': 2.0,
    'BSD': 1.0,
    'BMD': 1.0,
    'KYD': 0.82,
    'CUP': 25.0,
    'DOP': 56.0,
    'HTG': 100.0,
    'TVD': 1.35
  };

  const rate = fallbackRates[targetCurrency.toUpperCase()] || 1.0;
  const convertedAmount = amountUSD * rate;
  console.log(`Using fallback rate for ${targetCurrency}: ${rate}, converted amount: ${convertedAmount}`);
  
  return convertedAmount;
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

  let docDefinition;
  if (language === 'en') {
    docDefinition = createEnglishInvoiceTemplate(processedInvoiceData);
  } else {
    docDefinition = createGeorgianInvoiceTemplate(processedInvoiceData);
  }

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

async function deleteOldInvoiceFile(oldInvoiceUrl: string): Promise<void> {
  try {
    if (!oldInvoiceUrl) return;

    // Extract filename from URL
    const urlParts = oldInvoiceUrl.split('/');
    const fileName = urlParts[urlParts.length - 1];

    if (!fileName) return;

    console.log(`Deleting old invoice file: ${fileName}`);

    const { error } = await supabase.storage
      .from('invoices')
      .remove([fileName]);

    if (error) {
      console.warn(`Failed to delete old invoice file ${fileName}:`, error);
    } else {
      console.log(`Successfully deleted old invoice file: ${fileName}`);
    }
  } catch (error) {
    console.warn(`Error deleting old invoice file:`, error);
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
        error: "COMPANY_SETTINGS_NOT_FOUND",
        message: "Company settings not found. Please configure your company information before generating invoices.",
        debug: {
          user_id: subscription.user_id,
          company_error: companyError
        }
      }, 400, origin);
    }

    // Validate required company settings fields
    const requiredFields = ['company_name', 'tax_id', 'address', 'phone', 'email', 'bank_name', 'iban'];
    const missingFields = requiredFields.filter(field => !companySettingsData[field] || companySettingsData[field].trim() === '');
    
    if (missingFields.length > 0) {
      return createJsonResponse({
        error: "COMPANY_SETTINGS_INCOMPLETE",
        message: `Missing required company information: ${missingFields.join(', ')}. Please complete your company settings.`,
        missing_fields: missingFields,
        debug: {
          user_id: subscription.user_id,
          company_settings: companySettingsData
        }
      }, 400, origin);
    }

    const companySettings = companySettingsData;

    // Generate invoice number with timestamp for uniqueness
    const now = new Date();
    const dateStr = now.toISOString().slice(0, 10).replace(/-/g, '');
    const timeStr = now.toISOString().slice(11, 19).replace(/:/g, '');
    const projectId = subscription.project_id?.substring(0, 8) || '00000000';
    const invoiceNumber = `INV-${dateStr}-${timeStr}-${projectId}`;

    // Generate payment purpose
    const paymentPurpose = `Payment for ${subscription.duration_months} months of the "${subscription.projects?.name}" project (account ${companySettings.company_name})`;

    // Convert prices from USD to target currency
    const monthlyPriceUSD = parseFloat(subscription.subscription_plans?.base_price || '0');
    const totalPriceUSD = subscription.final_price || 0;
    
    // Convert prices to target currency
    const monthlyPriceConverted = await convertCurrencyFromUSD(monthlyPriceUSD, invoiceConfig.currency);
    const totalPriceConverted = await convertCurrencyFromUSD(totalPriceUSD, invoiceConfig.currency);

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
      monthlyPrice: monthlyPriceConverted,
      discountPercentage: subscription.discount_percentage || 0,
      totalPrice: totalPriceConverted,
      paymentPurpose,
      gridixName: invoiceConfig.company_name,
      gridixTaxId: invoiceConfig.tax_id,
      gridixBank: invoiceConfig.bank_name,
      gridixIban: invoiceConfig.iban,
      gridixCurrency: invoiceConfig.currency,
      logoUrl: invoiceConfig.logo_url,
      stampUrl: invoiceConfig.stamp_url
    };

    // Delete old invoice file if it exists
    if (subscription.invoice_url) {
      await deleteOldInvoiceFile(subscription.invoice_url);
    }

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