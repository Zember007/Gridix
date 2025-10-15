import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { getCorsHeaders, createCorsResponse, createJsonResponse } from '../_shared/cors.ts';

const supabase = createClient(
  Deno.env.get("SUPABASE_URL") ?? "",
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
);

interface InvoiceData {
  invoiceNumber: string;
  projectName: string;
  userName: string;
  userEmail: string;
  planName: string;
  durationMonths: number;
  monthlyPrice: number;
  discountPercentage: number;
  totalPrice: number;
  issueDate: string;
}

function generateInvoiceHTML(data: InvoiceData): string {
  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Invoice ${data.invoiceNumber}</title>
  <style>
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
      line-height: 1.6;
      color: #333;
      padding: 40px 20px;
      background: #f5f5f5;
    }
    .invoice-container {
      max-width: 800px;
      margin: 0 auto;
      background: white;
      padding: 60px;
      box-shadow: 0 2px 10px rgba(0,0,0,0.1);
    }
    .invoice-header {
      display: flex;
      justify-content: space-between;
      align-items: start;
      margin-bottom: 50px;
      padding-bottom: 30px;
      border-bottom: 3px solid #4f46e5;
    }
    .company-info h1 {
      color: #4f46e5;
      font-size: 32px;
      font-weight: 700;
      margin-bottom: 10px;
    }
    .company-info p {
      color: #666;
      font-size: 14px;
    }
    .invoice-meta {
      text-align: right;
    }
    .invoice-meta h2 {
      font-size: 28px;
      color: #333;
      margin-bottom: 10px;
    }
    .invoice-meta p {
      color: #666;
      font-size: 14px;
      margin: 5px 0;
    }
    .invoice-meta .invoice-number {
      color: #4f46e5;
      font-weight: 600;
    }
    .billing-info {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 40px;
      margin-bottom: 50px;
    }
    .info-section h3 {
      font-size: 14px;
      text-transform: uppercase;
      color: #666;
      margin-bottom: 15px;
      font-weight: 600;
      letter-spacing: 0.5px;
    }
    .info-section p {
      margin: 8px 0;
      font-size: 15px;
    }
    .info-section .name {
      font-weight: 600;
      color: #333;
      font-size: 16px;
    }
    .invoice-table {
      width: 100%;
      margin-bottom: 40px;
      border-collapse: collapse;
    }
    .invoice-table thead {
      background: #f8f9fa;
    }
    .invoice-table th {
      padding: 15px;
      text-align: left;
      font-size: 13px;
      text-transform: uppercase;
      color: #666;
      font-weight: 600;
      letter-spacing: 0.5px;
      border-bottom: 2px solid #e5e7eb;
    }
    .invoice-table td {
      padding: 20px 15px;
      border-bottom: 1px solid #e5e7eb;
      font-size: 15px;
    }
    .invoice-table tbody tr:last-child td {
      border-bottom: none;
    }
    .text-right {
      text-align: right;
    }
    .invoice-summary {
      margin-left: auto;
      width: 350px;
      margin-bottom: 50px;
    }
    .summary-row {
      display: flex;
      justify-content: space-between;
      padding: 12px 0;
      font-size: 15px;
    }
    .summary-row.subtotal {
      border-top: 1px solid #e5e7eb;
      padding-top: 15px;
    }
    .summary-row.discount {
      color: #16a34a;
    }
    .summary-row.total {
      border-top: 2px solid #333;
      margin-top: 10px;
      padding-top: 15px;
      font-size: 18px;
      font-weight: 700;
      color: #4f46e5;
    }
    .invoice-footer {
      margin-top: 60px;
      padding-top: 30px;
      border-top: 1px solid #e5e7eb;
      color: #666;
      font-size: 13px;
      text-align: center;
    }
    .invoice-footer p {
      margin: 8px 0;
    }
    .payment-info {
      background: #f8f9fa;
      padding: 25px;
      border-radius: 8px;
      margin-bottom: 40px;
    }
    .payment-info h3 {
      font-size: 16px;
      color: #333;
      margin-bottom: 15px;
      font-weight: 600;
    }
    .payment-info p {
      margin: 8px 0;
      font-size: 14px;
      color: #555;
    }
    @media print {
      body {
        background: white;
        padding: 0;
      }
      .invoice-container {
        box-shadow: none;
        padding: 40px;
      }
    }
  </style>
</head>
<body>
  <div class="invoice-container">
    <div class="invoice-header">
      <div class="company-info">
        <h1>GRIDIX</h1>
        <p>Real Estate Management Platform</p>
        <p>www.gridix.live</p>
      </div>
      <div class="invoice-meta">
        <h2>INVOICE</h2>
        <p><span class="invoice-number">${data.invoiceNumber}</span></p>
        <p>Date: ${data.issueDate}</p>
      </div>
    </div>

    <div class="billing-info">
      <div class="info-section">
        <h3>Bill To</h3>
        <p class="name">${data.userName}</p>
        <p>${data.userEmail}</p>
        <p>Project: ${data.projectName}</p>
      </div>
      <div class="info-section">
        <h3>From</h3>
        <p class="name">Gridix Platform</p>
        <p>support@gridix.live</p>
      </div>
    </div>

    <table class="invoice-table">
      <thead>
        <tr>
          <th>Description</th>
          <th class="text-right">Quantity</th>
          <th class="text-right">Price</th>
          <th class="text-right">Amount</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td>
            <strong>${data.planName}</strong><br>
            <span style="color: #666; font-size: 13px;">
              Subscription for ${data.durationMonths} month${data.durationMonths > 1 ? 's' : ''}
            </span>
          </td>
          <td class="text-right">${data.durationMonths}</td>
          <td class="text-right">$${data.monthlyPrice.toFixed(2)}</td>
          <td class="text-right">$${(data.monthlyPrice * data.durationMonths).toFixed(2)}</td>
        </tr>
      </tbody>
    </table>

    <div class="invoice-summary">
      <div class="summary-row subtotal">
        <span>Subtotal:</span>
        <span>$${(data.monthlyPrice * data.durationMonths).toFixed(2)}</span>
      </div>
      ${data.discountPercentage > 0 ? `
      <div class="summary-row discount">
        <span>Discount (${data.discountPercentage}%):</span>
        <span>-$${((data.monthlyPrice * data.durationMonths * data.discountPercentage) / 100).toFixed(2)}</span>
      </div>
      ` : ''}
      <div class="summary-row total">
        <span>Total:</span>
        <span>$${data.totalPrice.toFixed(2)}</span>
      </div>
    </div>

    <div class="payment-info">
      <h3>Payment Information</h3>
      <p>This invoice has been generated for your subscription request.</p>
      <p>Our administrator will contact you shortly with payment details.</p>
      <p>For any questions, please contact: support@gridix.live</p>
    </div>

    <div class="invoice-footer">
      <p><strong>Thank you for your business!</strong></p>
      <p>This is a computer-generated invoice. Please contact us if you have any questions.</p>
      <p>© ${new Date().getFullYear()} Gridix. All rights reserved.</p>
    </div>
  </div>
</body>
</html>
  `;
}

Deno.serve(async (req) => {
  const origin = req.headers.get('Origin');
  const corsHeaders = getCorsHeaders(origin);

  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return createCorsResponse(origin);
  }

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

    const body = await req.json();
    const { subscription_id } = body;

    if (!subscription_id) {
      return createJsonResponse({ error: "subscription_id is required" }, 400, origin);
    }

    // Get subscription details
    const { data: subscription, error: subError } = await supabase
      .from('user_subscriptions')
      .select(`
        *,
        subscription_plans (name, base_price),
        projects (name)
      `)
      .eq('id', subscription_id)
      .eq('user_id', user.id)
      .single();

    if (subError || !subscription) {
      return createJsonResponse({ error: "Subscription not found" }, 404, origin);
    }

    // Get user profile
    const { data: profile } = await supabase
      .from('user_profiles')
      .select('email, full_name')
      .eq('user_id', user.id)
      .single();

    // Generate invoice number if not exists
    const invoiceNumber = subscription.invoice_number || 
      `INV-${Date.now()}-${subscription.project_id.substring(0, 8)}`;

    // Update subscription with invoice number if it doesn't exist
    if (!subscription.invoice_number) {
      await supabase
        .from('user_subscriptions')
        .update({ invoice_number: invoiceNumber })
        .eq('id', subscription_id);
    }

    const invoiceData: InvoiceData = {
      invoiceNumber,
      projectName: subscription.projects.name,
      userName: profile?.full_name || user.email || 'Customer',
      userEmail: profile?.email || user.email || '',
      planName: subscription.subscription_plans.name,
      durationMonths: subscription.duration_months || 1,
      monthlyPrice: parseFloat(subscription.subscription_plans.base_price),
      discountPercentage: subscription.discount_percentage || 0,
      totalPrice: subscription.final_price || parseFloat(subscription.subscription_plans.base_price),
      issueDate: new Date().toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      })
    };

    const html = generateInvoiceHTML(invoiceData);

    return new Response(html, {
      headers: {
        'Content-Type': 'text/html; charset=utf-8',
        ...corsHeaders
      }
    });
  } catch (error) {
    console.error("Generate invoice error:", error);
    return createJsonResponse({ error: "Internal server error" }, 500, origin);
  }
});

