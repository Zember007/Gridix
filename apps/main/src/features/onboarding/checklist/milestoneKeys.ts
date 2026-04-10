/** `onceKey` для чеклиста — синхронизировать с docs/usertour-checklist-events.md */
export const ONBOARDING_MILESTONE = {
  projectCreated: "gridix_project_created",
  billingInvoiceRequested: "gridix_billing_invoice_requested",
  billingCheckoutStarted: "gridix_billing_checkout_started",
  billingPlanChanged: "gridix_billing_plan_changed",
  crmConnected: "gridix_crm_connected",
  projectBasicInfoReady: "gridix_project_basic_info_ready",
  projectFacadeConfigured: "gridix_project_facade_configured",
  projectFirstApartmentCreated: "gridix_project_first_apartment_created",
  projectFloorplanUploaded: "gridix_project_floorplan_uploaded",
} as const;
