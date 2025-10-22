# 🧾 Invoice System Testing Guide

## Overview
This guide covers testing the complete invoice generation and payment tracking system for GRIDIX platform.

## Prerequisites
1. Database migration applied: `20250115000000_add_invoice_system.sql`
2. Supabase Storage bucket `invoices` created
3. Edge functions deployed:
   - `generate-invoice`
   - `subscription-management` (updated)

## Testing Checklist

### 1. Database Schema ✅
- [x] `company_settings` table created
- [x] `system_settings` table created  
- [x] `user_subscriptions` table extended with invoice fields
- [x] RLS policies configured
- [x] Default invoice configuration inserted

### 2. Company Settings (Developer Side)
- [ ] Navigate to admin settings
- [ ] Fill company billing information:
  - Company name
  - Tax ID (Georgian format)
  - Legal address
  - Phone/Email
  - Bank details (IBAN)
  - VAT payer status
- [ ] Save settings
- [ ] Verify settings are stored in `company_settings` table
- [ ] Check validation for required fields

### 3. System Settings (Super Admin)
- [ ] Navigate to SuperAdmin → Settings → Invoices tab
- [ ] Configure GRIDIX billing details:
  - Company name: GRIDIX LLC
  - Tax ID
  - Bank: Bank of Georgia
  - IBAN
  - Currency: GEL
  - Finance email
  - Language: Georgian/English
- [ ] Upload logo and stamp images
- [ ] Save configuration
- [ ] Verify settings stored in `system_settings` table

### 4. Invoice Request Flow
- [ ] Developer selects "Invoice" payment method
- [ ] System checks if company settings are complete
- [ ] If incomplete, shows error and redirects to settings
- [ ] If complete, shows payment preview
- [ ] Developer clicks "Request Invoice"
- [ ] Subscription created with status `pending_payment`
- [ ] `invoice_requested_at` timestamp set

### 5. PDF Generation (Super Admin)
- [ ] Navigate to SuperAdmin → Subscriptions
- [ ] Find pending invoice requests
- [ ] Click "Generate PDF" button
- [ ] Verify PDF generation:
  - Georgian template used (if language = 'ka')
  - English template used (if language = 'en')
  - Company details populated
  - GRIDIX details populated
  - Invoice number format: `INV-YYYYMMDD-XXXXXXXX`
  - Payment purpose auto-generated
- [ ] PDF uploaded to Supabase Storage
- [ ] `invoice_url` updated in subscription
- [ ] `invoice_generated_at` timestamp set

### 6. PDF Content Verification
- [ ] Download and open generated PDF
- [ ] Check header: Logo, Invoice number, Date
- [ ] Verify payer details (from company_settings)
- [ ] Verify payee details (from system_settings)
- [ ] Check payment purpose text
- [ ] Verify amount and currency
- [ ] Check footer: Bank details, stamp, signature
- [ ] Test both Georgian and English templates

### 7. Payment Confirmation (Super Admin)
- [ ] Super Admin reviews invoice details
- [ ] Clicks "Confirm Payment" button
- [ ] Subscription status changes to `active`
- [ ] `invoice_paid_at` timestamp set
- [ ] `current_period_start` and `current_period_end` calculated
- [ ] Subscription activated for user

### 8. Developer Invoice Viewing
- [ ] Developer can view invoice details
- [ ] Download PDF button works
- [ ] Open PDF in new tab works
- [ ] Payment status shows correctly
- [ ] Payment instructions displayed

### 9. Email Notifications (Future)
- [ ] Invoice created notification (manual for now)
- [ ] Payment confirmation notification (manual for now)
- [ ] Reminder notifications (manual for now)

## Test Scenarios

### Scenario 1: Complete Invoice Flow
1. Developer fills company settings
2. Requests invoice for subscription
3. Super Admin generates PDF
4. Super Admin confirms payment
5. Subscription becomes active

### Scenario 2: Incomplete Company Settings
1. Developer tries to request invoice
2. System shows error message
3. Redirects to company settings
4. After filling settings, can request invoice

### Scenario 3: Multiple Languages
1. Super Admin sets invoice language to Georgian
2. Generate PDF → should use Georgian template
3. Change language to English
4. Generate PDF → should use English template

### Scenario 4: File Storage
1. Generate multiple invoices
2. Check Supabase Storage bucket
3. Verify files are properly named
4. Test public URL access

## Error Handling Tests

### Database Errors
- [ ] Test with missing company settings
- [ ] Test with missing system settings
- [ ] Test with invalid subscription ID

### PDF Generation Errors
- [ ] Test with missing logo/stamp
- [ ] Test with invalid template data
- [ ] Test storage upload failures

### Network Errors
- [ ] Test with slow network
- [ ] Test with connection timeout
- [ ] Test with invalid URLs

## Performance Tests

### PDF Generation
- [ ] Measure PDF generation time
- [ ] Test with large company data
- [ ] Test concurrent PDF generation

### File Storage
- [ ] Test file upload speed
- [ ] Test file download speed
- [ ] Test with large PDF files

## Security Tests

### Access Control
- [ ] Test RLS policies
- [ ] Verify users can only access their own data
- [ ] Test Super Admin access restrictions

### File Security
- [ ] Test PDF file access permissions
- [ ] Verify public URLs are secure
- [ ] Test file deletion permissions

## Browser Compatibility
- [ ] Test PDF download in Chrome
- [ ] Test PDF download in Firefox
- [ ] Test PDF download in Safari
- [ ] Test PDF download in Edge

## Mobile Testing
- [ ] Test on mobile devices
- [ ] Test PDF viewing on mobile
- [ ] Test responsive design

## Expected Results

### Successful Flow
1. All database operations complete without errors
2. PDFs generate with correct content and formatting
3. Files upload to storage successfully
4. Users can download and view PDFs
5. Subscription activation works correctly

### Error Handling
1. Appropriate error messages shown to users
2. System gracefully handles missing data
3. Failed operations don't corrupt database
4. Users can retry failed operations

## Troubleshooting

### Common Issues
1. **PDF not generating**: Check edge function logs
2. **File not uploading**: Check Supabase Storage permissions
3. **Template errors**: Verify template data structure
4. **Access denied**: Check RLS policies

### Debug Steps
1. Check browser console for errors
2. Check Supabase function logs
3. Verify database data integrity
4. Test with minimal data first

## Success Criteria
- [ ] All test scenarios pass
- [ ] No critical errors in production
- [ ] PDFs generate correctly in both languages
- [ ] File storage works reliably
- [ ] User experience is smooth
- [ ] Security requirements met
