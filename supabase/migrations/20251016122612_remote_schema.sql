create type "public"."apartment_type" as enum ('apartment', 'commercial', 'parking');

create type "public"."app_role" as enum ('superadmin', 'admin', 'moderator', 'user');

create type "public"."currency_type" as enum ('RUB', 'USD', 'EUR', 'GEL');

create type "public"."project_type" as enum ('building', 'object');

create table "public"."admin_settings" (
    "id" uuid not null default gen_random_uuid(),
    "company_name" text,
    "company_description" text,
    "contact_name" text,
    "contact_phone" text,
    "contact_email" text,
    "contact_address" text,
    "created_at" timestamp with time zone not null default now(),
    "updated_at" timestamp with time zone not null default now(),
    "user_id" uuid
);


alter table "public"."admin_settings" enable row level security;

create table "public"."amocrm_custom_fields" (
    "id" uuid not null default gen_random_uuid(),
    "project_id" uuid not null,
    "field_id" integer not null,
    "field_name" text not null,
    "field_code" text,
    "field_type" text not null,
    "is_required" boolean default false,
    "is_editable" boolean default true,
    "sort" integer default 0,
    "entity_type" text not null,
    "created_at" timestamp with time zone default now(),
    "updated_at" timestamp with time zone default now()
);


alter table "public"."amocrm_custom_fields" enable row level security;

create table "public"."amocrm_settings" (
    "id" uuid not null default gen_random_uuid(),
    "project_id" uuid not null,
    "subdomain" text not null,
    "pipeline_id" integer not null,
    "status_id" integer,
    "responsible_user_id" integer,
    "created_at" timestamp with time zone default now(),
    "updated_at" timestamp with time zone default now(),
    "client_id" text,
    "client_secret" text,
    "access_token" text,
    "refresh_token" text,
    "token_expires_at" timestamp with time zone,
    "authorization_code" text,
    "redirect_uri" text,
    "pipeline_name" text,
    "status_name" text,
    "user_name" text,
    "account_name" text,
    "base_domain" text
);


alter table "public"."amocrm_settings" enable row level security;

create table "public"."apartment_photos" (
    "id" uuid not null default gen_random_uuid(),
    "apartment_id" uuid not null,
    "image_url" text not null,
    "description" text,
    "order_index" integer not null default 0,
    "created_at" timestamp with time zone not null default now(),
    "updated_at" timestamp with time zone not null default now()
);


alter table "public"."apartment_photos" enable row level security;

create table "public"."apartments" (
    "id" uuid not null default gen_random_uuid(),
    "project_id" uuid not null,
    "floor_plan_id" uuid,
    "apartment_number" text not null,
    "floor_number" integer not null,
    "rooms" text not null,
    "area" numeric(10,2) not null default 0,
    "price" bigint default 0,
    "status" text not null default 'available'::text,
    "polygon" jsonb default '[]'::jsonb,
    "created_at" timestamp with time zone not null default now(),
    "updated_at" timestamp with time zone not null default now(),
    "custom_fields" jsonb default '{}'::jsonb,
    "type" apartment_type default 'apartment'::apartment_type
);


alter table "public"."apartments" enable row level security;

create table "public"."banned_users" (
    "id" uuid not null default gen_random_uuid(),
    "user_id" uuid not null,
    "banned_by" uuid not null,
    "reason" text,
    "banned_at" timestamp with time zone not null default now(),
    "unbanned_at" timestamp with time zone
);


alter table "public"."banned_users" enable row level security;

create table "public"."building_floors" (
    "id" uuid not null default gen_random_uuid(),
    "project_id" uuid not null,
    "floor_number" integer not null,
    "polygon" jsonb not null default '[]'::jsonb,
    "color" text not null default '#3b82f6'::text,
    "created_at" timestamp with time zone not null default now()
);


alter table "public"."building_floors" enable row level security;

create table "public"."floor_plans" (
    "id" uuid not null default gen_random_uuid(),
    "project_id" uuid not null,
    "floor_number" integer not null,
    "image_url" text,
    "floor_polygons" jsonb default '[]'::jsonb,
    "created_at" timestamp with time zone not null default now(),
    "updated_at" timestamp with time zone not null default now(),
    "polygon_settings" jsonb default '{"colors": {"sold": "#ef4444", "reserved": "#f59e0b", "available": "#3b82f6"}, "display": {"showArea": false, "showPrice": false, "showNumbers": true, "showTooltip": false}, "opacity": {"hover": 0.7, "normal": 0.4}, "hoverEffects": {"glow": true, "scale": false, "colorChange": true, "opacityChange": true}}'::jsonb
);


alter table "public"."floor_plans" enable row level security;

create table "public"."layout_photos" (
    "id" uuid not null default gen_random_uuid(),
    "project_id" uuid not null,
    "layout_type" text not null,
    "image_url" text not null,
    "description" text,
    "order_index" integer not null default 0,
    "created_at" timestamp with time zone not null default now(),
    "updated_at" timestamp with time zone not null default now()
);


alter table "public"."layout_photos" enable row level security;

create table "public"."leads" (
    "id" uuid not null default gen_random_uuid(),
    "created_at" timestamp with time zone not null default timezone('utc'::text, now()),
    "updated_at" timestamp with time zone not null default timezone('utc'::text, now()),
    "name" text not null,
    "email" text not null,
    "phone" text not null,
    "project_id" uuid not null,
    "apartment_id" uuid not null,
    "amocrm_lead_id" bigint,
    "amocrm_contact_id" bigint,
    "amocrm_sent_at" timestamp with time zone,
    "amocrm_error" text,
    "amocrm_retries" integer default 0,
    "status" text default 'pending'::text,
    "source" text default 'website'::text,
    "notes" text
);


alter table "public"."leads" enable row level security;

create table "public"."manager_accounts" (
    "id" uuid not null default gen_random_uuid(),
    "developer_id" uuid not null,
    "manager_id" uuid not null,
    "email" text not null,
    "full_name" text not null,
    "phone" text,
    "status" text not null default 'pending'::text,
    "invited_at" timestamp with time zone not null default now(),
    "accepted_at" timestamp with time zone,
    "created_at" timestamp with time zone not null default now(),
    "updated_at" timestamp with time zone not null default now()
);


alter table "public"."manager_accounts" enable row level security;

create table "public"."manager_invitations" (
    "id" uuid not null default gen_random_uuid(),
    "developer_id" uuid not null,
    "email" text not null,
    "full_name" text not null,
    "phone" text,
    "invitation_token" text not null,
    "status" text not null default 'pending'::text,
    "expires_at" timestamp with time zone not null default (now() + '7 days'::interval),
    "created_at" timestamp with time zone not null default now(),
    "updated_at" timestamp with time zone not null default now()
);


alter table "public"."manager_invitations" enable row level security;

create table "public"."manager_permissions" (
    "id" uuid not null default gen_random_uuid(),
    "manager_account_id" uuid not null,
    "permission_type" text not null,
    "allowed" boolean not null default true,
    "created_at" timestamp with time zone not null default now(),
    "updated_at" timestamp with time zone not null default now()
);


alter table "public"."manager_permissions" enable row level security;

create table "public"."manager_project_access" (
    "id" uuid not null default gen_random_uuid(),
    "manager_account_id" uuid not null,
    "project_id" uuid not null,
    "created_at" timestamp with time zone not null default now(),
    "updated_at" timestamp with time zone not null default now()
);


alter table "public"."manager_project_access" enable row level security;

create table "public"."project_custom_fields" (
    "id" uuid not null default gen_random_uuid(),
    "project_id" uuid not null,
    "field_name" text not null,
    "field_label" text not null,
    "field_type" text not null default 'text'::text,
    "is_required" boolean not null default false,
    "field_options" jsonb,
    "created_at" timestamp with time zone not null default now(),
    "updated_at" timestamp with time zone not null default now(),
    "sort_order" integer not null default 0,
    "is_visible" boolean not null default true,
    "field_label_translations" jsonb default '{}'::jsonb
);


alter table "public"."project_custom_fields" enable row level security;

create table "public"."project_domains" (
    "id" uuid not null default gen_random_uuid(),
    "project_id" uuid not null,
    "domain" text not null,
    "is_primary" boolean not null default true,
    "status" text not null default 'active'::text,
    "created_at" timestamp with time zone not null default now(),
    "updated_at" timestamp with time zone not null default now()
);


alter table "public"."project_domains" enable row level security;

create table "public"."project_field_settings" (
    "id" uuid not null default gen_random_uuid(),
    "project_id" uuid not null,
    "field_name" text not null,
    "field_label" text not null,
    "field_type" text not null default 'text'::text,
    "is_custom" boolean not null default false,
    "is_visible" boolean not null default true,
    "sort_order" integer not null default 0,
    "created_at" timestamp with time zone not null default now(),
    "updated_at" timestamp with time zone not null default now()
);


alter table "public"."project_field_settings" enable row level security;

create table "public"."project_sync_settings" (
    "id" uuid not null default gen_random_uuid(),
    "project_id" uuid not null,
    "excel_url" text not null,
    "sync_interval" integer not null default 300,
    "column_mapping" jsonb not null default '{}'::jsonb,
    "is_active" boolean not null default true,
    "status" text not null default 'active'::text,
    "last_sync" timestamp with time zone,
    "next_sync" timestamp with time zone,
    "error_message" text,
    "created_at" timestamp with time zone not null default now(),
    "updated_at" timestamp with time zone not null default now()
);


alter table "public"."project_sync_settings" enable row level security;

create table "public"."project_views" (
    "id" uuid not null default gen_random_uuid(),
    "project_id" uuid not null,
    "user_id" uuid,
    "ip_address" inet,
    "user_agent" text,
    "referrer" text,
    "created_at" timestamp with time zone not null default now()
);


alter table "public"."project_views" enable row level security;

create table "public"."projects" (
    "id" uuid not null default gen_random_uuid(),
    "name" text not null,
    "description" text,
    "floors" integer not null default 1,
    "building_image_url" text,
    "created_at" timestamp with time zone not null default now(),
    "updated_at" timestamp with time zone not null default now(),
    "polygon_settings" jsonb default '{"colors": {"sold": "#ef4444", "reserved": "#f59e0b", "available": "#3b82f6"}, "display": {"showArea": false, "showPrice": false, "showNumbers": true, "showTooltip": false}, "opacity": {"hover": 0.7, "normal": 0.4}, "hoverEffects": {"glow": true, "scale": false, "colorChange": true, "opacityChange": true}}'::jsonb,
    "building_polygon_settings" jsonb default '{"colors": {"sold": "#ef4444", "reserved": "#f59e0b", "available": "#3b82f6"}, "display": {"showArea": false, "showPrice": false, "showNumbers": true, "showTooltip": false}, "opacity": {"hover": 0.7, "normal": 0.4}, "hoverEffects": {"glow": true, "scale": false, "colorChange": true, "opacityChange": true}}'::jsonb,
    "latitude" numeric(10,8),
    "longitude" numeric(11,8),
    "address" text,
    "user_id" uuid,
    "slug" text,
    "is_public" boolean not null default true,
    "is_featured" boolean not null default false,
    "view_count" integer not null default 0,
    "currency" currency_type default 'USD'::currency_type,
    "has_parking" boolean default false,
    "has_commercial" boolean default false,
    "installment_enabled" boolean default false,
    "min_down_payment_percent" integer default 20,
    "max_installment_months" integer default 24,
    "pdf_presentation_url" text,
    "theme_color" text default '#000000'::text,
    "project_type" project_type not null default 'building'::project_type,
    "subscription_status" text default 'trial'::text,
    "subscription_expires_at" timestamp with time zone,
    "is_public_visible" boolean default true
);


alter table "public"."projects" enable row level security;

create table "public"."subscription_discounts" (
    "id" uuid not null default gen_random_uuid(),
    "duration_months" integer not null,
    "discount_percentage" numeric(5,2) not null,
    "is_active" boolean default true,
    "created_at" timestamp with time zone default now()
);


alter table "public"."subscription_discounts" enable row level security;

create table "public"."subscription_history" (
    "id" uuid not null default gen_random_uuid(),
    "user_id" uuid not null,
    "subscription_id" uuid not null,
    "action" character varying(50) not null,
    "old_status" character varying(50),
    "new_status" character varying(50),
    "metadata" jsonb default '{}'::jsonb,
    "created_at" timestamp with time zone default now()
);


alter table "public"."subscription_history" enable row level security;

create table "public"."subscription_plans" (
    "id" uuid not null default gen_random_uuid(),
    "name" character varying(100) not null,
    "slug" character varying(100) not null,
    "description" text,
    "base_price" numeric(10,2) not null,
    "currency" character varying(3) default 'USD'::character varying,
    "features" jsonb default '[]'::jsonb,
    "is_active" boolean default true,
    "created_at" timestamp with time zone default now(),
    "updated_at" timestamp with time zone default now()
);


alter table "public"."subscription_plans" enable row level security;

create table "public"."sync_logs" (
    "id" uuid not null default gen_random_uuid(),
    "project_id" uuid not null,
    "sync_settings_id" uuid not null,
    "status" text not null,
    "records_processed" integer default 0,
    "records_updated" integer default 0,
    "records_added" integer default 0,
    "records_deleted" integer default 0,
    "error_message" text,
    "execution_time_ms" integer,
    "created_at" timestamp with time zone not null default now()
);


alter table "public"."sync_logs" enable row level security;

create table "public"."user_profiles" (
    "id" uuid not null,
    "email" text,
    "full_name" text,
    "avatar_url" text,
    "company_name" text,
    "phone" text,
    "created_at" timestamp with time zone not null default now(),
    "updated_at" timestamp with time zone not null default now()
);


alter table "public"."user_profiles" enable row level security;

create table "public"."user_roles" (
    "id" uuid not null default gen_random_uuid(),
    "user_id" uuid not null,
    "role" app_role not null,
    "created_at" timestamp with time zone not null default now(),
    "updated_at" timestamp with time zone not null default now()
);


alter table "public"."user_roles" enable row level security;

create table "public"."user_subscriptions" (
    "id" uuid not null default gen_random_uuid(),
    "user_id" uuid not null,
    "plan_id" uuid not null,
    "lemon_squeezy_subscription_id" character varying(255),
    "lemon_squeezy_customer_id" character varying(255),
    "status" character varying(50) not null default 'inactive'::character varying,
    "trial_ends_at" timestamp with time zone,
    "current_period_start" timestamp with time zone,
    "current_period_end" timestamp with time zone,
    "cancel_at_period_end" boolean default false,
    "cancelled_at" timestamp with time zone,
    "duration_months" integer default 1,
    "discount_percentage" numeric(5,2) default 0,
    "final_price" numeric(10,2),
    "created_at" timestamp with time zone default now(),
    "updated_at" timestamp with time zone default now(),
    "project_id" uuid,
    "invoice_number" text,
    "invoice_url" text,
    "invoice_requested_at" timestamp with time zone,
    "invoice_paid_at" timestamp with time zone
);


alter table "public"."user_subscriptions" enable row level security;

CREATE UNIQUE INDEX admin_settings_pkey ON public.admin_settings USING btree (id);

CREATE UNIQUE INDEX amocrm_custom_fields_pkey ON public.amocrm_custom_fields USING btree (id);

CREATE UNIQUE INDEX amocrm_custom_fields_project_id_field_id_entity_type_key ON public.amocrm_custom_fields USING btree (project_id, field_id, entity_type);

CREATE UNIQUE INDEX amocrm_settings_pkey ON public.amocrm_settings USING btree (id);

CREATE UNIQUE INDEX apartment_photos_pkey ON public.apartment_photos USING btree (id);

CREATE UNIQUE INDEX apartments_pkey ON public.apartments USING btree (id);

CREATE UNIQUE INDEX apartments_project_id_apartment_number_key ON public.apartments USING btree (project_id, apartment_number);

CREATE UNIQUE INDEX banned_users_pkey ON public.banned_users USING btree (id);

CREATE UNIQUE INDEX banned_users_user_id_key ON public.banned_users USING btree (user_id);

CREATE UNIQUE INDEX building_floors_pkey ON public.building_floors USING btree (id);

CREATE UNIQUE INDEX building_floors_project_id_floor_number_key ON public.building_floors USING btree (project_id, floor_number);

CREATE UNIQUE INDEX floor_plans_pkey ON public.floor_plans USING btree (id);

CREATE UNIQUE INDEX floor_plans_project_id_floor_number_key ON public.floor_plans USING btree (project_id, floor_number);

CREATE INDEX idx_amocrm_custom_fields_entity_type ON public.amocrm_custom_fields USING btree (entity_type);

CREATE INDEX idx_amocrm_custom_fields_project_id ON public.amocrm_custom_fields USING btree (project_id);

CREATE UNIQUE INDEX idx_amocrm_settings_project_id ON public.amocrm_settings USING btree (project_id);

CREATE INDEX idx_amocrm_token_expiration ON public.amocrm_settings USING btree (token_expires_at) WHERE (token_expires_at IS NOT NULL);

CREATE INDEX idx_apartment_photos_apartment_id ON public.apartment_photos USING btree (apartment_id);

CREATE INDEX idx_apartment_photos_order_index ON public.apartment_photos USING btree (apartment_id, order_index);

CREATE INDEX idx_apartments_floor_plan_id ON public.apartments USING btree (floor_plan_id);

CREATE INDEX idx_apartments_project_id ON public.apartments USING btree (project_id);

CREATE INDEX idx_apartments_project_type ON public.apartments USING btree (project_id, type);

CREATE INDEX idx_apartments_type ON public.apartments USING btree (type);

CREATE INDEX idx_building_floors_project_id ON public.building_floors USING btree (project_id);

CREATE INDEX idx_floor_plans_project_id ON public.floor_plans USING btree (project_id);

CREATE INDEX idx_layout_photos_layout_type ON public.layout_photos USING btree (project_id, layout_type);

CREATE INDEX idx_layout_photos_order_index ON public.layout_photos USING btree (project_id, layout_type, order_index);

CREATE INDEX idx_layout_photos_project_id ON public.layout_photos USING btree (project_id);

CREATE INDEX idx_leads_amocrm_sent_at ON public.leads USING btree (amocrm_sent_at);

CREATE INDEX idx_leads_apartment_id ON public.leads USING btree (apartment_id);

CREATE INDEX idx_leads_created_at ON public.leads USING btree (created_at);

CREATE INDEX idx_leads_project_id ON public.leads USING btree (project_id);

CREATE INDEX idx_leads_status ON public.leads USING btree (status);

CREATE INDEX idx_manager_accounts_developer_id ON public.manager_accounts USING btree (developer_id);

CREATE INDEX idx_manager_accounts_manager_id ON public.manager_accounts USING btree (manager_id);

CREATE INDEX idx_manager_accounts_status ON public.manager_accounts USING btree (status);

CREATE INDEX idx_manager_invitations_active ON public.manager_invitations USING btree (developer_id, email, status, expires_at) WHERE (status = 'pending'::text);

CREATE INDEX idx_manager_invitations_developer_id ON public.manager_invitations USING btree (developer_id);

CREATE INDEX idx_manager_invitations_email ON public.manager_invitations USING btree (email);

CREATE INDEX idx_manager_invitations_token ON public.manager_invitations USING btree (invitation_token);

CREATE INDEX idx_manager_permissions_account_id ON public.manager_permissions USING btree (manager_account_id);

CREATE INDEX idx_manager_project_access_manager_id ON public.manager_project_access USING btree (manager_account_id);

CREATE INDEX idx_manager_project_access_project_id ON public.manager_project_access USING btree (project_id);

CREATE INDEX idx_project_custom_fields_sort_order ON public.project_custom_fields USING btree (project_id, sort_order);

CREATE INDEX idx_project_custom_fields_translations ON public.project_custom_fields USING gin (field_label_translations);

CREATE INDEX idx_project_domains_domain ON public.project_domains USING btree (domain);

CREATE INDEX idx_project_domains_project_id ON public.project_domains USING btree (project_id);

CREATE INDEX idx_project_field_settings_sort_order ON public.project_field_settings USING btree (project_id, sort_order);

CREATE INDEX idx_project_sync_settings_active ON public.project_sync_settings USING btree (is_active, status);

CREATE INDEX idx_project_sync_settings_next_sync ON public.project_sync_settings USING btree (next_sync);

CREATE INDEX idx_project_sync_settings_project_id ON public.project_sync_settings USING btree (project_id);

CREATE INDEX idx_project_views_created_at ON public.project_views USING btree (created_at);

CREATE INDEX idx_project_views_project_id ON public.project_views USING btree (project_id);

CREATE INDEX idx_projects_coordinates ON public.projects USING btree (latitude, longitude);

CREATE INDEX idx_projects_is_featured ON public.projects USING btree (is_featured);

CREATE INDEX idx_projects_is_public ON public.projects USING btree (is_public);

CREATE INDEX idx_projects_slug ON public.projects USING btree (slug);

CREATE INDEX idx_projects_subscription_expires ON public.projects USING btree (subscription_expires_at);

CREATE INDEX idx_projects_subscription_status ON public.projects USING btree (subscription_status);

CREATE INDEX idx_projects_user_id ON public.projects USING btree (user_id);

CREATE INDEX idx_subscription_history_subscription_id ON public.subscription_history USING btree (subscription_id);

CREATE INDEX idx_subscription_history_user_id ON public.subscription_history USING btree (user_id);

CREATE INDEX idx_sync_logs_created_at ON public.sync_logs USING btree (created_at);

CREATE INDEX idx_sync_logs_project_id ON public.sync_logs USING btree (project_id);

CREATE INDEX idx_user_subscriptions_lemon_squeezy_id ON public.user_subscriptions USING btree (lemon_squeezy_subscription_id);

CREATE INDEX idx_user_subscriptions_project_id ON public.user_subscriptions USING btree (project_id);

CREATE INDEX idx_user_subscriptions_status ON public.user_subscriptions USING btree (status);

CREATE INDEX idx_user_subscriptions_user_id ON public.user_subscriptions USING btree (user_id);

CREATE UNIQUE INDEX layout_photos_pkey ON public.layout_photos USING btree (id);

CREATE UNIQUE INDEX layout_photos_project_id_layout_type_order_index_key ON public.layout_photos USING btree (project_id, layout_type, order_index);

CREATE UNIQUE INDEX leads_pkey ON public.leads USING btree (id);

CREATE UNIQUE INDEX manager_accounts_developer_id_email_key ON public.manager_accounts USING btree (developer_id, email);

CREATE UNIQUE INDEX manager_accounts_developer_id_manager_id_key ON public.manager_accounts USING btree (developer_id, manager_id);

CREATE UNIQUE INDEX manager_accounts_pkey ON public.manager_accounts USING btree (id);

CREATE UNIQUE INDEX manager_invitations_developer_id_email_key ON public.manager_invitations USING btree (developer_id, email);

CREATE UNIQUE INDEX manager_invitations_invitation_token_key ON public.manager_invitations USING btree (invitation_token);

CREATE UNIQUE INDEX manager_invitations_pkey ON public.manager_invitations USING btree (id);

CREATE UNIQUE INDEX manager_permissions_manager_account_id_permission_type_key ON public.manager_permissions USING btree (manager_account_id, permission_type);

CREATE UNIQUE INDEX manager_permissions_pkey ON public.manager_permissions USING btree (id);

CREATE UNIQUE INDEX manager_project_access_manager_account_id_project_id_key ON public.manager_project_access USING btree (manager_account_id, project_id);

CREATE UNIQUE INDEX manager_project_access_pkey ON public.manager_project_access USING btree (id);

CREATE UNIQUE INDEX project_custom_fields_pkey ON public.project_custom_fields USING btree (id);

CREATE UNIQUE INDEX project_custom_fields_project_id_field_name_key ON public.project_custom_fields USING btree (project_id, field_name);

CREATE UNIQUE INDEX project_domains_domain_key ON public.project_domains USING btree (domain);

CREATE UNIQUE INDEX project_domains_pkey ON public.project_domains USING btree (id);

CREATE UNIQUE INDEX project_field_settings_pkey ON public.project_field_settings USING btree (id);

CREATE UNIQUE INDEX project_field_settings_project_id_field_name_key ON public.project_field_settings USING btree (project_id, field_name);

CREATE UNIQUE INDEX project_sync_settings_pkey ON public.project_sync_settings USING btree (id);

CREATE UNIQUE INDEX project_sync_settings_project_id_key ON public.project_sync_settings USING btree (project_id);

CREATE UNIQUE INDEX project_views_pkey ON public.project_views USING btree (id);

CREATE UNIQUE INDEX projects_pkey ON public.projects USING btree (id);

CREATE UNIQUE INDEX projects_slug_key ON public.projects USING btree (slug);

CREATE UNIQUE INDEX subscription_discounts_duration_months_key ON public.subscription_discounts USING btree (duration_months);

CREATE UNIQUE INDEX subscription_discounts_pkey ON public.subscription_discounts USING btree (id);

CREATE UNIQUE INDEX subscription_history_pkey ON public.subscription_history USING btree (id);

CREATE UNIQUE INDEX subscription_plans_pkey ON public.subscription_plans USING btree (id);

CREATE UNIQUE INDEX subscription_plans_slug_key ON public.subscription_plans USING btree (slug);

CREATE UNIQUE INDEX sync_logs_pkey ON public.sync_logs USING btree (id);

CREATE UNIQUE INDEX user_profiles_pkey ON public.user_profiles USING btree (id);

CREATE UNIQUE INDEX user_roles_pkey ON public.user_roles USING btree (id);

CREATE UNIQUE INDEX user_roles_user_id_role_key ON public.user_roles USING btree (user_id, role);

CREATE UNIQUE INDEX user_subscriptions_pkey ON public.user_subscriptions USING btree (id);

CREATE UNIQUE INDEX user_subscriptions_user_project_unique ON public.user_subscriptions USING btree (user_id, project_id);

CREATE UNIQUE INDEX user_subscriptions_user_project_unq ON public.user_subscriptions USING btree (user_id, project_id);

alter table "public"."admin_settings" add constraint "admin_settings_pkey" PRIMARY KEY using index "admin_settings_pkey";

alter table "public"."amocrm_custom_fields" add constraint "amocrm_custom_fields_pkey" PRIMARY KEY using index "amocrm_custom_fields_pkey";

alter table "public"."amocrm_settings" add constraint "amocrm_settings_pkey" PRIMARY KEY using index "amocrm_settings_pkey";

alter table "public"."apartment_photos" add constraint "apartment_photos_pkey" PRIMARY KEY using index "apartment_photos_pkey";

alter table "public"."apartments" add constraint "apartments_pkey" PRIMARY KEY using index "apartments_pkey";

alter table "public"."banned_users" add constraint "banned_users_pkey" PRIMARY KEY using index "banned_users_pkey";

alter table "public"."building_floors" add constraint "building_floors_pkey" PRIMARY KEY using index "building_floors_pkey";

alter table "public"."floor_plans" add constraint "floor_plans_pkey" PRIMARY KEY using index "floor_plans_pkey";

alter table "public"."layout_photos" add constraint "layout_photos_pkey" PRIMARY KEY using index "layout_photos_pkey";

alter table "public"."leads" add constraint "leads_pkey" PRIMARY KEY using index "leads_pkey";

alter table "public"."manager_accounts" add constraint "manager_accounts_pkey" PRIMARY KEY using index "manager_accounts_pkey";

alter table "public"."manager_invitations" add constraint "manager_invitations_pkey" PRIMARY KEY using index "manager_invitations_pkey";

alter table "public"."manager_permissions" add constraint "manager_permissions_pkey" PRIMARY KEY using index "manager_permissions_pkey";

alter table "public"."manager_project_access" add constraint "manager_project_access_pkey" PRIMARY KEY using index "manager_project_access_pkey";

alter table "public"."project_custom_fields" add constraint "project_custom_fields_pkey" PRIMARY KEY using index "project_custom_fields_pkey";

alter table "public"."project_domains" add constraint "project_domains_pkey" PRIMARY KEY using index "project_domains_pkey";

alter table "public"."project_field_settings" add constraint "project_field_settings_pkey" PRIMARY KEY using index "project_field_settings_pkey";

alter table "public"."project_sync_settings" add constraint "project_sync_settings_pkey" PRIMARY KEY using index "project_sync_settings_pkey";

alter table "public"."project_views" add constraint "project_views_pkey" PRIMARY KEY using index "project_views_pkey";

alter table "public"."projects" add constraint "projects_pkey" PRIMARY KEY using index "projects_pkey";

alter table "public"."subscription_discounts" add constraint "subscription_discounts_pkey" PRIMARY KEY using index "subscription_discounts_pkey";

alter table "public"."subscription_history" add constraint "subscription_history_pkey" PRIMARY KEY using index "subscription_history_pkey";

alter table "public"."subscription_plans" add constraint "subscription_plans_pkey" PRIMARY KEY using index "subscription_plans_pkey";

alter table "public"."sync_logs" add constraint "sync_logs_pkey" PRIMARY KEY using index "sync_logs_pkey";

alter table "public"."user_profiles" add constraint "user_profiles_pkey" PRIMARY KEY using index "user_profiles_pkey";

alter table "public"."user_roles" add constraint "user_roles_pkey" PRIMARY KEY using index "user_roles_pkey";

alter table "public"."user_subscriptions" add constraint "user_subscriptions_pkey" PRIMARY KEY using index "user_subscriptions_pkey";

alter table "public"."amocrm_custom_fields" add constraint "amocrm_custom_fields_project_id_field_id_entity_type_key" UNIQUE using index "amocrm_custom_fields_project_id_field_id_entity_type_key";

alter table "public"."amocrm_custom_fields" add constraint "amocrm_custom_fields_project_id_fkey" FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE not valid;

alter table "public"."amocrm_custom_fields" validate constraint "amocrm_custom_fields_project_id_fkey";

alter table "public"."amocrm_settings" add constraint "amocrm_settings_project_id_fkey" FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE not valid;

alter table "public"."amocrm_settings" validate constraint "amocrm_settings_project_id_fkey";

alter table "public"."amocrm_settings" add constraint "check_pipeline_id_positive" CHECK (((pipeline_id IS NULL) OR (pipeline_id > 0))) not valid;

alter table "public"."amocrm_settings" validate constraint "check_pipeline_id_positive";

alter table "public"."apartment_photos" add constraint "apartment_photos_apartment_id_fkey" FOREIGN KEY (apartment_id) REFERENCES apartments(id) ON DELETE CASCADE not valid;

alter table "public"."apartment_photos" validate constraint "apartment_photos_apartment_id_fkey";

alter table "public"."apartments" add constraint "apartments_floor_plan_id_fkey" FOREIGN KEY (floor_plan_id) REFERENCES floor_plans(id) ON DELETE CASCADE not valid;

alter table "public"."apartments" validate constraint "apartments_floor_plan_id_fkey";

alter table "public"."apartments" add constraint "apartments_project_id_apartment_number_key" UNIQUE using index "apartments_project_id_apartment_number_key";

alter table "public"."apartments" add constraint "apartments_project_id_fkey" FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE not valid;

alter table "public"."apartments" validate constraint "apartments_project_id_fkey";

alter table "public"."apartments" add constraint "apartments_status_check" CHECK ((status = ANY (ARRAY['available'::text, 'sold'::text, 'reserved'::text]))) not valid;

alter table "public"."apartments" validate constraint "apartments_status_check";

alter table "public"."banned_users" add constraint "banned_users_banned_by_fkey" FOREIGN KEY (banned_by) REFERENCES auth.users(id) not valid;

alter table "public"."banned_users" validate constraint "banned_users_banned_by_fkey";

alter table "public"."banned_users" add constraint "banned_users_user_id_fkey" FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE not valid;

alter table "public"."banned_users" validate constraint "banned_users_user_id_fkey";

alter table "public"."banned_users" add constraint "banned_users_user_id_key" UNIQUE using index "banned_users_user_id_key";

alter table "public"."building_floors" add constraint "building_floors_project_id_fkey" FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE not valid;

alter table "public"."building_floors" validate constraint "building_floors_project_id_fkey";

alter table "public"."building_floors" add constraint "building_floors_project_id_floor_number_key" UNIQUE using index "building_floors_project_id_floor_number_key";

alter table "public"."floor_plans" add constraint "floor_plans_project_id_fkey" FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE not valid;

alter table "public"."floor_plans" validate constraint "floor_plans_project_id_fkey";

alter table "public"."floor_plans" add constraint "floor_plans_project_id_floor_number_key" UNIQUE using index "floor_plans_project_id_floor_number_key";

alter table "public"."layout_photos" add constraint "layout_photos_project_id_fkey" FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE not valid;

alter table "public"."layout_photos" validate constraint "layout_photos_project_id_fkey";

alter table "public"."layout_photos" add constraint "layout_photos_project_id_layout_type_order_index_key" UNIQUE using index "layout_photos_project_id_layout_type_order_index_key";

alter table "public"."leads" add constraint "leads_apartment_id_fkey" FOREIGN KEY (apartment_id) REFERENCES apartments(id) ON DELETE CASCADE not valid;

alter table "public"."leads" validate constraint "leads_apartment_id_fkey";

alter table "public"."leads" add constraint "leads_project_id_fkey" FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE not valid;

alter table "public"."leads" validate constraint "leads_project_id_fkey";

alter table "public"."leads" add constraint "leads_status_check" CHECK ((status = ANY (ARRAY['pending'::text, 'sent_to_crm'::text, 'saved_only'::text, 'failed'::text, 'cancelled'::text]))) not valid;

alter table "public"."leads" validate constraint "leads_status_check";

alter table "public"."manager_accounts" add constraint "fk_manager_accounts_developer_profile" FOREIGN KEY (developer_id) REFERENCES user_profiles(id) ON DELETE CASCADE not valid;

alter table "public"."manager_accounts" validate constraint "fk_manager_accounts_developer_profile";

alter table "public"."manager_accounts" add constraint "manager_accounts_developer_id_email_key" UNIQUE using index "manager_accounts_developer_id_email_key";

alter table "public"."manager_accounts" add constraint "manager_accounts_developer_id_fkey" FOREIGN KEY (developer_id) REFERENCES auth.users(id) ON DELETE CASCADE not valid;

alter table "public"."manager_accounts" validate constraint "manager_accounts_developer_id_fkey";

alter table "public"."manager_accounts" add constraint "manager_accounts_developer_id_manager_id_key" UNIQUE using index "manager_accounts_developer_id_manager_id_key";

alter table "public"."manager_accounts" add constraint "manager_accounts_manager_id_fkey" FOREIGN KEY (manager_id) REFERENCES auth.users(id) ON DELETE CASCADE not valid;

alter table "public"."manager_accounts" validate constraint "manager_accounts_manager_id_fkey";

alter table "public"."manager_accounts" add constraint "manager_accounts_status_check" CHECK ((status = ANY (ARRAY['pending'::text, 'active'::text, 'suspended'::text]))) not valid;

alter table "public"."manager_accounts" validate constraint "manager_accounts_status_check";

alter table "public"."manager_invitations" add constraint "manager_invitations_developer_id_email_key" UNIQUE using index "manager_invitations_developer_id_email_key";

alter table "public"."manager_invitations" add constraint "manager_invitations_developer_id_fkey" FOREIGN KEY (developer_id) REFERENCES auth.users(id) ON DELETE CASCADE not valid;

alter table "public"."manager_invitations" validate constraint "manager_invitations_developer_id_fkey";

alter table "public"."manager_invitations" add constraint "manager_invitations_invitation_token_key" UNIQUE using index "manager_invitations_invitation_token_key";

alter table "public"."manager_invitations" add constraint "manager_invitations_status_check" CHECK ((status = ANY (ARRAY['pending'::text, 'accepted'::text, 'expired'::text]))) not valid;

alter table "public"."manager_invitations" validate constraint "manager_invitations_status_check";

alter table "public"."manager_permissions" add constraint "manager_permissions_manager_account_id_fkey" FOREIGN KEY (manager_account_id) REFERENCES manager_accounts(id) ON DELETE CASCADE not valid;

alter table "public"."manager_permissions" validate constraint "manager_permissions_manager_account_id_fkey";

alter table "public"."manager_permissions" add constraint "manager_permissions_manager_account_id_permission_type_key" UNIQUE using index "manager_permissions_manager_account_id_permission_type_key";

alter table "public"."manager_permissions" add constraint "manager_permissions_permission_type_check" CHECK ((permission_type = ANY (ARRAY['view_projects'::text, 'edit_projects'::text, 'create_projects'::text, 'delete_projects'::text, 'view_settings'::text, 'edit_company_settings'::text]))) not valid;

alter table "public"."manager_permissions" validate constraint "manager_permissions_permission_type_check";

alter table "public"."manager_project_access" add constraint "manager_project_access_manager_account_id_fkey" FOREIGN KEY (manager_account_id) REFERENCES manager_accounts(id) ON DELETE CASCADE not valid;

alter table "public"."manager_project_access" validate constraint "manager_project_access_manager_account_id_fkey";

alter table "public"."manager_project_access" add constraint "manager_project_access_manager_account_id_project_id_key" UNIQUE using index "manager_project_access_manager_account_id_project_id_key";

alter table "public"."manager_project_access" add constraint "manager_project_access_project_id_fkey" FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE not valid;

alter table "public"."manager_project_access" validate constraint "manager_project_access_project_id_fkey";

alter table "public"."project_custom_fields" add constraint "project_custom_fields_project_id_field_name_key" UNIQUE using index "project_custom_fields_project_id_field_name_key";

alter table "public"."project_custom_fields" add constraint "project_custom_fields_project_id_fkey" FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE not valid;

alter table "public"."project_custom_fields" validate constraint "project_custom_fields_project_id_fkey";

alter table "public"."project_domains" add constraint "project_domains_domain_key" UNIQUE using index "project_domains_domain_key";

alter table "public"."project_domains" add constraint "project_domains_project_id_fkey" FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE not valid;

alter table "public"."project_domains" validate constraint "project_domains_project_id_fkey";

alter table "public"."project_field_settings" add constraint "project_field_settings_project_id_field_name_key" UNIQUE using index "project_field_settings_project_id_field_name_key";

alter table "public"."project_field_settings" add constraint "project_field_settings_project_id_fkey" FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE not valid;

alter table "public"."project_field_settings" validate constraint "project_field_settings_project_id_fkey";

alter table "public"."project_sync_settings" add constraint "project_sync_settings_project_id_fkey" FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE not valid;

alter table "public"."project_sync_settings" validate constraint "project_sync_settings_project_id_fkey";

alter table "public"."project_sync_settings" add constraint "project_sync_settings_project_id_key" UNIQUE using index "project_sync_settings_project_id_key";

alter table "public"."project_sync_settings" add constraint "project_sync_settings_status_check" CHECK ((status = ANY (ARRAY['active'::text, 'error'::text, 'paused'::text]))) not valid;

alter table "public"."project_sync_settings" validate constraint "project_sync_settings_status_check";

alter table "public"."project_views" add constraint "project_views_project_id_fkey" FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE not valid;

alter table "public"."project_views" validate constraint "project_views_project_id_fkey";

alter table "public"."project_views" add constraint "project_views_user_id_fkey" FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE SET NULL not valid;

alter table "public"."project_views" validate constraint "project_views_user_id_fkey";

alter table "public"."projects" add constraint "fk_projects_user_profile" FOREIGN KEY (user_id) REFERENCES user_profiles(id) ON DELETE CASCADE not valid;

alter table "public"."projects" validate constraint "fk_projects_user_profile";

alter table "public"."projects" add constraint "projects_max_installment_months_check" CHECK ((max_installment_months > 0)) not valid;

alter table "public"."projects" validate constraint "projects_max_installment_months_check";

alter table "public"."projects" add constraint "projects_min_down_payment_percent_check" CHECK (((min_down_payment_percent >= 0) AND (min_down_payment_percent <= 100))) not valid;

alter table "public"."projects" validate constraint "projects_min_down_payment_percent_check";

alter table "public"."projects" add constraint "projects_slug_key" UNIQUE using index "projects_slug_key";

alter table "public"."projects" add constraint "projects_user_id_fkey" FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE not valid;

alter table "public"."projects" validate constraint "projects_user_id_fkey";

alter table "public"."subscription_discounts" add constraint "subscription_discounts_duration_months_key" UNIQUE using index "subscription_discounts_duration_months_key";

alter table "public"."subscription_history" add constraint "subscription_history_subscription_id_fkey" FOREIGN KEY (subscription_id) REFERENCES user_subscriptions(id) ON DELETE CASCADE not valid;

alter table "public"."subscription_history" validate constraint "subscription_history_subscription_id_fkey";

alter table "public"."subscription_history" add constraint "subscription_history_user_id_fkey" FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE not valid;

alter table "public"."subscription_history" validate constraint "subscription_history_user_id_fkey";

alter table "public"."subscription_plans" add constraint "subscription_plans_slug_key" UNIQUE using index "subscription_plans_slug_key";

alter table "public"."sync_logs" add constraint "sync_logs_project_id_fkey" FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE not valid;

alter table "public"."sync_logs" validate constraint "sync_logs_project_id_fkey";

alter table "public"."sync_logs" add constraint "sync_logs_status_check" CHECK ((status = ANY (ARRAY['success'::text, 'error'::text, 'partial'::text]))) not valid;

alter table "public"."sync_logs" validate constraint "sync_logs_status_check";

alter table "public"."sync_logs" add constraint "sync_logs_sync_settings_id_fkey" FOREIGN KEY (sync_settings_id) REFERENCES project_sync_settings(id) ON DELETE CASCADE not valid;

alter table "public"."sync_logs" validate constraint "sync_logs_sync_settings_id_fkey";

alter table "public"."user_profiles" add constraint "user_profiles_id_fkey" FOREIGN KEY (id) REFERENCES auth.users(id) ON DELETE CASCADE not valid;

alter table "public"."user_profiles" validate constraint "user_profiles_id_fkey";

alter table "public"."user_roles" add constraint "user_roles_user_id_fkey" FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE not valid;

alter table "public"."user_roles" validate constraint "user_roles_user_id_fkey";

alter table "public"."user_roles" add constraint "user_roles_user_id_role_key" UNIQUE using index "user_roles_user_id_role_key";

alter table "public"."user_subscriptions" add constraint "user_subscriptions_plan_id_fkey" FOREIGN KEY (plan_id) REFERENCES subscription_plans(id) not valid;

alter table "public"."user_subscriptions" validate constraint "user_subscriptions_plan_id_fkey";

alter table "public"."user_subscriptions" add constraint "user_subscriptions_project_id_fkey" FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE not valid;

alter table "public"."user_subscriptions" validate constraint "user_subscriptions_project_id_fkey";

alter table "public"."user_subscriptions" add constraint "user_subscriptions_user_id_fkey" FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE not valid;

alter table "public"."user_subscriptions" validate constraint "user_subscriptions_user_id_fkey";

alter table "public"."user_subscriptions" add constraint "user_subscriptions_user_project_unique" UNIQUE using index "user_subscriptions_user_project_unique";

set check_function_bodies = off;

CREATE OR REPLACE FUNCTION public.auto_generate_slug()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
BEGIN
  IF NEW.slug IS NULL OR NEW.slug = '' THEN
    NEW.slug := ensure_unique_slug(generate_slug(NEW.name), NEW.id);
  ELSE
    NEW.slug := ensure_unique_slug(NEW.slug, NEW.id);
  END IF;
  NEW.updated_at := now();
  RETURN NEW;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.check_project_subscription()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
BEGIN
  IF NEW.project_id IS NULL AND NEW.status != 'migrated' THEN
    RAISE EXCEPTION 'project_id is required for new subscriptions';
  END IF;
  RETURN NEW;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.cleanup_expired_invitations()
 RETURNS integer
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
DECLARE
  deleted_count INTEGER;
BEGIN
  DELETE FROM public.manager_invitations 
  WHERE status = 'pending' AND expires_at < now();
  
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  RETURN deleted_count;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.create_default_manager_permissions(manager_account_id uuid)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
BEGIN
  INSERT INTO public.manager_permissions (manager_account_id, permission_type, allowed) VALUES
    (manager_account_id, 'view_projects', true),
    (manager_account_id, 'edit_projects', true),
    (manager_account_id, 'create_projects', true),
    (manager_account_id, 'delete_projects', false),
    (manager_account_id, 'view_settings', true),
    (manager_account_id, 'edit_company_settings', false);
END;
$function$
;

CREATE OR REPLACE FUNCTION public.ensure_unique_slug(base_slug text, project_id uuid DEFAULT NULL::uuid)
 RETURNS text
 LANGUAGE plpgsql
AS $function$
DECLARE
  final_slug TEXT := base_slug;
  counter INTEGER := 1;
BEGIN
  WHILE EXISTS (
    SELECT 1 FROM public.projects 
    WHERE slug = final_slug 
    AND (project_id IS NULL OR id != project_id)
  ) LOOP
    final_slug := base_slug || '-' || counter;
    counter := counter + 1;
  END LOOP;
  RETURN final_slug;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.generate_invitation_token()
 RETURNS text
 LANGUAGE plpgsql
AS $function$
BEGIN
  RETURN encode(gen_random_bytes(32), 'base64');
END;
$function$
;

CREATE OR REPLACE FUNCTION public.generate_slug(input_text text)
 RETURNS text
 LANGUAGE plpgsql
AS $function$
BEGIN
  RETURN lower(
    regexp_replace(
      regexp_replace(
        regexp_replace(input_text, '[^a-zA-Zа-яё0-9\s-]', '', 'g'),
        '\s+', '-', 'g'
      ),
      '-+', '-', 'g'
    )
  );
END;
$function$
;

CREATE OR REPLACE FUNCTION public.handle_manager_account_created()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
BEGIN
  -- Обновляем статус соответствующего приглашения на 'accepted' если оно существует
  UPDATE public.manager_invitations 
  SET status = 'accepted', updated_at = now()
  WHERE developer_id = NEW.developer_id 
    AND email = NEW.email 
    AND status = 'pending';
    
  RETURN NEW;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.handle_new_manager_account()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
BEGIN
  PERFORM create_default_manager_permissions(NEW.id);
  RETURN NEW;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.handle_new_user()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'auth'
AS $function$
BEGIN
  BEGIN
    -- Try to insert user profile
    INSERT INTO public.user_profiles (
      id, 
      email, 
      full_name, 
      company_name, 
      phone
    )
    VALUES (
      NEW.id, 
      NEW.email, 
      COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
      COALESCE(NEW.raw_user_meta_data->>'company_name', ''),
      COALESCE(NEW.raw_user_meta_data->>'phone', '')
    )
    ON CONFLICT (id) DO UPDATE SET
      email = EXCLUDED.email,
      full_name = COALESCE(EXCLUDED.full_name, user_profiles.full_name),
      company_name = COALESCE(EXCLUDED.company_name, user_profiles.company_name),
      phone = COALESCE(EXCLUDED.phone, user_profiles.phone),
      updated_at = NOW();
      
  EXCEPTION WHEN OTHERS THEN
    -- Log error but don't fail user registration
    RAISE WARNING 'Failed to create user profile for user %: %', NEW.id, SQLERRM;
  END;
  
  RETURN NEW;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.handle_updated_at()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
BEGIN
  NEW.updated_at = timezone('utc'::text, now());
  RETURN NEW;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role app_role)
 RETURNS boolean
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  )
$function$
;

CREATE OR REPLACE FUNCTION public.increment_view_count(project_id uuid)
 RETURNS void
 LANGUAGE plpgsql
AS $function$
BEGIN
  UPDATE public.projects 
  SET view_count = view_count + 1 
  WHERE id = project_id;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.initialize_default_fields(p_project_id uuid)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
BEGIN
  -- Вставляем стандартные поля, если их еще нет
  INSERT INTO project_field_settings (project_id, field_name, field_label, field_type, is_custom, is_visible, sort_order)
  VALUES 
    (p_project_id, 'number', 'Номер квартиры', 'text', false, true, 0),
    (p_project_id, 'floor', 'Этаж', 'number', false, true, 1),
    (p_project_id, 'rooms', 'Комнаты', 'number', false, true, 2),
    (p_project_id, 'area', 'Площадь (м²)', 'number', false, true, 3),
    (p_project_id, 'price', 'Цена', 'number', false, true, 4),
    (p_project_id, 'status', 'Статус', 'select', false, true, 5)
  ON CONFLICT (project_id, field_name) DO NOTHING;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.is_amocrm_configured(settings_row amocrm_settings)
 RETURNS boolean
 LANGUAGE plpgsql
 IMMUTABLE
AS $function$
BEGIN
    RETURN settings_row.access_token IS NOT NULL 
           AND settings_row.refresh_token IS NOT NULL
           AND settings_row.token_expires_at IS NOT NULL
           AND settings_row.token_expires_at > NOW()
           AND settings_row.pipeline_id IS NOT NULL
           AND settings_row.pipeline_id > 0;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.is_project_owner(_user_id uuid, _project_id uuid)
 RETURNS boolean
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  SELECT EXISTS (
    SELECT 1
    FROM public.projects p
    WHERE p.id = _project_id
      AND (p.user_id = _user_id)
  );
$function$
;

CREATE OR REPLACE FUNCTION public.is_superadmin(_user_id uuid)
 RETURNS boolean
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = 'superadmin'
  )
$function$
;

CREATE OR REPLACE FUNCTION public.needs_token_refresh(settings_id uuid)
 RETURNS boolean
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
DECLARE
    expires_at TIMESTAMP WITH TIME ZONE;
BEGIN
    SELECT token_expires_at INTO expires_at
    FROM amocrm_settings
    WHERE id = settings_id;
    
    -- Return true if token expires within next 5 minutes or already expired
    RETURN expires_at IS NULL OR expires_at <= NOW() + INTERVAL '5 minutes';
END;
$function$
;

CREATE OR REPLACE FUNCTION public.set_initial_next_sync()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
BEGIN
  IF NEW.is_active = true THEN
    NEW.next_sync = now() + (NEW.sync_interval || ' seconds')::INTERVAL;
  END IF;
  RETURN NEW;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.start_trial_subscription()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'auth'
AS $function$
DECLARE
  pro_plan_id UUID;
  new_subscription_id UUID;
BEGIN
  -- Get Pro plan ID
  SELECT id INTO pro_plan_id FROM subscription_plans WHERE slug = 'pro';
  
  -- If no pro plan exists, skip trial creation (don't fail user registration)
  IF pro_plan_id IS NULL THEN
    RAISE WARNING 'No pro plan found, skipping trial subscription creation for user %', NEW.id;
    RETURN NEW;
  END IF;
  
  -- Create trial subscription for new user
  BEGIN
    INSERT INTO user_subscriptions (
      user_id,
      plan_id,
      status,
      trial_ends_at,
      current_period_start,
      current_period_end,
      final_price
    ) VALUES (
      NEW.id,
      pro_plan_id,
      'trialing',
      NOW() + INTERVAL '14 days',
      NOW(),
      NOW() + INTERVAL '14 days',
      0
    )
    RETURNING id INTO new_subscription_id;
    
    -- Log the trial start
    INSERT INTO subscription_history (
      user_id, 
      subscription_id, 
      action, 
      new_status
    ) VALUES (
      NEW.id,
      new_subscription_id,
      'trial_started',
      'trialing'
    );
    
  EXCEPTION WHEN OTHERS THEN
    -- Log error but don't fail user registration
    RAISE WARNING 'Failed to create trial subscription for user %: %', NEW.id, SQLERRM;
  END;
  
  RETURN NEW;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.sync_project_subscription_status()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
BEGIN
  -- Update the project's subscription status when subscription changes
  IF NEW.project_id IS NOT NULL THEN
    UPDATE public.projects
    SET 
      subscription_status = NEW.status,
      subscription_expires_at = NEW.current_period_end,
      is_public_visible = CASE 
        WHEN NEW.status IN ('active', 'trialing') THEN true
        ELSE is_public_visible -- Keep current value if not active
      END
    WHERE id = NEW.project_id;
  END IF;
  
  RETURN NEW;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.trigger_initialize_default_fields()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
BEGIN
  -- Вызываем функцию инициализации полей для нового проекта
  PERFORM initialize_default_fields(NEW.id);
  RETURN NEW;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.update_amocrm_custom_fields_updated_at()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.update_layout_photos_updated_at()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.update_next_sync()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
BEGIN
  -- Если изменился интервал синхронизации, пересчитываем next_sync
  IF NEW.sync_interval != OLD.sync_interval OR NEW.is_active != OLD.is_active THEN
    IF NEW.is_active = true THEN
      NEW.next_sync = now() + (NEW.sync_interval || ' seconds')::INTERVAL;
    ELSE
      NEW.next_sync = NULL;
    END IF;
  END IF;
  
  NEW.updated_at = now();
  RETURN NEW;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.update_project_domains_updated_at()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
begin
  new.updated_at = now();
  return new;
end;
$function$
;

CREATE OR REPLACE FUNCTION public.update_updated_at_column()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.validate_amocrm_settings()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
BEGIN
    -- Validate subdomain is not empty and doesn't contain .amocrm.ru
    IF NEW.subdomain IS NULL OR trim(NEW.subdomain) = '' THEN
        RAISE EXCEPTION 'Subdomain cannot be empty';
    END IF;
    
    IF NEW.subdomain LIKE '%.amocrm.ru%' THEN
        RAISE EXCEPTION 'Subdomain should not contain .amocrm.ru - use only the subdomain part';
    END IF;
    
    -- Normalize subdomain (remove any protocol or trailing slashes)
    NEW.subdomain = trim(lower(regexp_replace(NEW.subdomain, '^https?://', '')));
    NEW.subdomain = trim(NEW.subdomain, '/');
    
    -- Only validate pipeline_id if it's being set (not 0 or null)
    IF NEW.pipeline_id IS NOT NULL AND NEW.pipeline_id <= 0 THEN
        NEW.pipeline_id = NULL; -- Reset invalid pipeline_id
    END IF;
    
    RETURN NEW;
END;
$function$
;

create policy "Enable all operations for admin_settings"
on "public"."admin_settings"
as permissive
for all
to public
using (true)
with check (true);


create policy "Users can manage amocrm custom fields for their projects"
on "public"."amocrm_custom_fields"
as permissive
for all
to public
using ((project_id IN ( SELECT projects.id
   FROM projects
  WHERE ((projects.user_id = auth.uid()) OR (projects.id IN ( SELECT amocrm_custom_fields.project_id
           FROM manager_accounts
          WHERE (projects.user_id = auth.uid())))))));


create policy "Users can view amocrm custom fields for their projects"
on "public"."amocrm_custom_fields"
as permissive
for select
to public
using ((project_id IN ( SELECT projects.id
   FROM projects
  WHERE ((projects.user_id = auth.uid()) OR (projects.id IN ( SELECT amocrm_custom_fields.project_id
           FROM manager_accounts
          WHERE (projects.user_id = auth.uid())))))));


create policy "Users can delete their own AmoCRM settings"
on "public"."amocrm_settings"
as permissive
for delete
to public
using ((project_id IN ( SELECT projects.id
   FROM projects
  WHERE (projects.user_id = auth.uid()))));


create policy "Users can insert AmoCRM settings for their projects"
on "public"."amocrm_settings"
as permissive
for insert
to public
with check ((project_id IN ( SELECT projects.id
   FROM projects
  WHERE (projects.user_id = auth.uid()))));


create policy "Users can update their own AmoCRM settings"
on "public"."amocrm_settings"
as permissive
for update
to public
using ((project_id IN ( SELECT projects.id
   FROM projects
  WHERE (projects.user_id = auth.uid()))));


create policy "Users can view their own AmoCRM settings"
on "public"."amocrm_settings"
as permissive
for select
to public
using ((project_id IN ( SELECT projects.id
   FROM projects
  WHERE (projects.user_id = auth.uid()))));


create policy "Anyone can view apartment photos from public projects"
on "public"."apartment_photos"
as permissive
for select
to public
using ((apartment_id IN ( SELECT a.id
   FROM (apartments a
     JOIN projects p ON ((a.project_id = p.id)))
  WHERE ((p.is_public = true) OR (p.user_id = auth.uid())))));


create policy "Project owners can delete apartment photos"
on "public"."apartment_photos"
as permissive
for delete
to public
using ((apartment_id IN ( SELECT a.id
   FROM (apartments a
     JOIN projects p ON ((a.project_id = p.id)))
  WHERE (p.user_id = auth.uid()))));


create policy "Project owners can update apartment photos"
on "public"."apartment_photos"
as permissive
for update
to public
using ((apartment_id IN ( SELECT a.id
   FROM (apartments a
     JOIN projects p ON ((a.project_id = p.id)))
  WHERE (p.user_id = auth.uid()))));


create policy "Project owners can upload apartment photos"
on "public"."apartment_photos"
as permissive
for insert
to public
with check ((apartment_id IN ( SELECT a.id
   FROM (apartments a
     JOIN projects p ON ((a.project_id = p.id)))
  WHERE (p.user_id = auth.uid()))));


create policy "Anyone can view apartments from public projects"
on "public"."apartments"
as permissive
for select
to public
using ((project_id IN ( SELECT projects.id
   FROM projects
  WHERE ((projects.is_public = true) OR (projects.user_id = auth.uid())))));


create policy "Enable delete access for all users"
on "public"."apartments"
as permissive
for delete
to public
using (true);


create policy "Enable insert access for all users"
on "public"."apartments"
as permissive
for insert
to public
with check (true);


create policy "Enable read access for all users"
on "public"."apartments"
as permissive
for select
to public
using (true);


create policy "Enable update access for all users"
on "public"."apartments"
as permissive
for update
to public
using (true);


create policy "Project owners can create apartments"
on "public"."apartments"
as permissive
for insert
to public
with check ((project_id IN ( SELECT projects.id
   FROM projects
  WHERE (projects.user_id = auth.uid()))));


create policy "Project owners can delete apartments"
on "public"."apartments"
as permissive
for delete
to public
using ((project_id IN ( SELECT projects.id
   FROM projects
  WHERE (projects.user_id = auth.uid()))));


create policy "Project owners can update apartments"
on "public"."apartments"
as permissive
for update
to public
using ((project_id IN ( SELECT projects.id
   FROM projects
  WHERE (projects.user_id = auth.uid()))));


create policy "Superadmins can manage banned users"
on "public"."banned_users"
as permissive
for all
to authenticated
using (is_superadmin(auth.uid()))
with check (is_superadmin(auth.uid()));


create policy "Superadmins can view banned users"
on "public"."banned_users"
as permissive
for select
to authenticated
using (is_superadmin(auth.uid()));


create policy "Enable delete access for all users"
on "public"."building_floors"
as permissive
for delete
to public
using (true);


create policy "Enable insert access for all users"
on "public"."building_floors"
as permissive
for insert
to public
with check (true);


create policy "Enable read access for all users"
on "public"."building_floors"
as permissive
for select
to public
using (true);


create policy "Enable update access for all users"
on "public"."building_floors"
as permissive
for update
to public
using (true);


create policy "Anyone can view floor plans from public projects"
on "public"."floor_plans"
as permissive
for select
to public
using ((project_id IN ( SELECT projects.id
   FROM projects
  WHERE ((projects.is_public = true) OR (projects.user_id = auth.uid())))));


create policy "Enable delete access for all users"
on "public"."floor_plans"
as permissive
for delete
to public
using (true);


create policy "Enable insert access for all users"
on "public"."floor_plans"
as permissive
for insert
to public
with check (true);


create policy "Enable read access for all users"
on "public"."floor_plans"
as permissive
for select
to public
using (true);


create policy "Enable update access for all users"
on "public"."floor_plans"
as permissive
for update
to public
using (true);


create policy "Project owners can create floor plans"
on "public"."floor_plans"
as permissive
for insert
to public
with check ((project_id IN ( SELECT projects.id
   FROM projects
  WHERE (projects.user_id = auth.uid()))));


create policy "Project owners can delete floor plans"
on "public"."floor_plans"
as permissive
for delete
to public
using ((project_id IN ( SELECT projects.id
   FROM projects
  WHERE (projects.user_id = auth.uid()))));


create policy "Project owners can update floor plans"
on "public"."floor_plans"
as permissive
for update
to public
using ((project_id IN ( SELECT projects.id
   FROM projects
  WHERE (projects.user_id = auth.uid()))));


create policy "Anyone can view layout photos"
on "public"."layout_photos"
as permissive
for select
to public
using (true);


create policy "Authenticated users can manage layout photos"
on "public"."layout_photos"
as permissive
for all
to public
using ((auth.uid() IS NOT NULL))
with check ((auth.uid() IS NOT NULL));


create policy "Service role can access all leads"
on "public"."leads"
as permissive
for all
to public
using ((auth.role() = 'service_role'::text));


create policy "Users can create leads for their projects"
on "public"."leads"
as permissive
for insert
to public
with check ((EXISTS ( SELECT 1
   FROM projects p
  WHERE ((p.id = leads.project_id) AND (p.user_id = auth.uid())))));


create policy "Users can update leads for their projects"
on "public"."leads"
as permissive
for update
to public
using ((EXISTS ( SELECT 1
   FROM projects p
  WHERE ((p.id = leads.project_id) AND (p.user_id = auth.uid())))));


create policy "Users can view leads for their projects"
on "public"."leads"
as permissive
for select
to public
using ((EXISTS ( SELECT 1
   FROM projects p
  WHERE ((p.id = leads.project_id) AND (p.user_id = auth.uid())))));


create policy "Allow invited user to create manager account"
on "public"."manager_accounts"
as permissive
for insert
to authenticated
with check (((auth.uid() = manager_id) AND (email IN ( SELECT mi.email
   FROM manager_invitations mi
  WHERE ((mi.developer_id = manager_accounts.developer_id) AND (mi.status = 'pending'::text) AND (mi.expires_at > now()))))));


create policy "Developers can create manager accounts"
on "public"."manager_accounts"
as permissive
for insert
to authenticated
with check ((auth.uid() = developer_id));


create policy "Developers can delete their manager accounts"
on "public"."manager_accounts"
as permissive
for delete
to public
using ((auth.uid() = developer_id));


create policy "Developers can update their manager accounts"
on "public"."manager_accounts"
as permissive
for update
to public
using ((auth.uid() = developer_id));


create policy "Developers can view their manager accounts"
on "public"."manager_accounts"
as permissive
for select
to public
using ((auth.uid() = developer_id));


create policy "Managers can view their own account"
on "public"."manager_accounts"
as permissive
for select
to public
using ((auth.uid() = manager_id));


create policy "TEMP_ALLOW_ALL_INSERT"
on "public"."manager_accounts"
as permissive
for insert
to authenticated
with check (true);


create policy "allow_invited_user_insert_manager_account"
on "public"."manager_accounts"
as permissive
for insert
to authenticated
with check (((manager_id = auth.uid()) AND (email = (auth.jwt() ->> 'email'::text)) AND (EXISTS ( SELECT 1
   FROM manager_invitations mi
  WHERE ((mi.developer_id = manager_accounts.developer_id) AND (mi.email = (auth.jwt() ->> 'email'::text)) AND (mi.status = 'pending'::text) AND (mi.expires_at > now()))))));


create policy "Allow anon to read pending invitations"
on "public"."manager_invitations"
as permissive
for select
to anon
using (((status = 'pending'::text) AND (expires_at > now())));


create policy "Allow anon to update invitation status"
on "public"."manager_invitations"
as permissive
for update
to anon
using ((status = 'pending'::text))
with check ((status = ANY (ARRAY['accepted'::text, 'expired'::text])));


create policy "Allow invited user to update invitation status"
on "public"."manager_invitations"
as permissive
for update
to authenticated
using (((email IN ( SELECT users.email
   FROM auth.users
  WHERE (users.id = auth.uid()))) AND (status = 'pending'::text)))
with check ((email IN ( SELECT users.email
   FROM auth.users
  WHERE (users.id = auth.uid()))));


create policy "Developers can create invitations"
on "public"."manager_invitations"
as permissive
for insert
to public
with check ((auth.uid() = developer_id));


create policy "Developers can delete their invitations"
on "public"."manager_invitations"
as permissive
for delete
to public
using ((auth.uid() = developer_id));


create policy "Developers can update their invitations"
on "public"."manager_invitations"
as permissive
for update
to public
using ((auth.uid() = developer_id));


create policy "Developers can view their invitations"
on "public"."manager_invitations"
as permissive
for select
to public
using ((auth.uid() = developer_id));


create policy "allow_invited_user_update_own_invitation"
on "public"."manager_invitations"
as permissive
for update
to authenticated
using (((email = (auth.jwt() ->> 'email'::text)) AND (status = 'pending'::text)))
with check ((email = (auth.jwt() ->> 'email'::text)));


create policy "invitation_public_read_pending"
on "public"."manager_invitations"
as permissive
for select
to anon
using (((status = 'pending'::text) AND (expires_at > now())));


create policy "Developers can create permissions for their managers"
on "public"."manager_permissions"
as permissive
for insert
to public
with check ((manager_account_id IN ( SELECT manager_accounts.id
   FROM manager_accounts
  WHERE (manager_accounts.developer_id = auth.uid()))));


create policy "Developers can delete permissions for their managers"
on "public"."manager_permissions"
as permissive
for delete
to public
using ((manager_account_id IN ( SELECT manager_accounts.id
   FROM manager_accounts
  WHERE (manager_accounts.developer_id = auth.uid()))));


create policy "Developers can update permissions for their managers"
on "public"."manager_permissions"
as permissive
for update
to public
using ((manager_account_id IN ( SELECT manager_accounts.id
   FROM manager_accounts
  WHERE (manager_accounts.developer_id = auth.uid()))));


create policy "Developers can view permissions for their managers"
on "public"."manager_permissions"
as permissive
for select
to public
using ((manager_account_id IN ( SELECT manager_accounts.id
   FROM manager_accounts
  WHERE (manager_accounts.developer_id = auth.uid()))));


create policy "Managers can view their own permissions"
on "public"."manager_permissions"
as permissive
for select
to public
using ((manager_account_id IN ( SELECT manager_accounts.id
   FROM manager_accounts
  WHERE (manager_accounts.manager_id = auth.uid()))));


create policy "Developers can manage their managers' project access"
on "public"."manager_project_access"
as permissive
for all
to authenticated
using ((EXISTS ( SELECT 1
   FROM manager_accounts ma
  WHERE ((ma.id = manager_project_access.manager_account_id) AND (ma.developer_id = auth.uid())))))
with check ((EXISTS ( SELECT 1
   FROM manager_accounts ma
  WHERE ((ma.id = manager_project_access.manager_account_id) AND (ma.developer_id = auth.uid())))));


create policy "Developers can view their managers' project access"
on "public"."manager_project_access"
as permissive
for select
to authenticated
using ((EXISTS ( SELECT 1
   FROM manager_accounts ma
  WHERE ((ma.id = manager_project_access.manager_account_id) AND (ma.developer_id = auth.uid())))));


create policy "Managers can view their own project access"
on "public"."manager_project_access"
as permissive
for select
to authenticated
using ((EXISTS ( SELECT 1
   FROM manager_accounts ma
  WHERE ((ma.id = manager_project_access.manager_account_id) AND (ma.manager_id = auth.uid())))));


create policy "Anyone can view custom fields"
on "public"."project_custom_fields"
as permissive
for select
to public
using (true);


create policy "Authenticated users can manage custom fields"
on "public"."project_custom_fields"
as permissive
for all
to public
using ((auth.uid() IS NOT NULL))
with check ((auth.uid() IS NOT NULL));


create policy "Public can view custom fields for public projects"
on "public"."project_custom_fields"
as permissive
for select
to public
using ((project_id IN ( SELECT projects.id
   FROM projects
  WHERE ((projects.is_public = true) OR (projects.user_id = auth.uid())))));


create policy "allow_read_domains"
on "public"."project_domains"
as permissive
for select
to public
using (true);


create policy "owner_manage_domains"
on "public"."project_domains"
as permissive
for all
to authenticated
using ((EXISTS ( SELECT 1
   FROM projects p
  WHERE ((p.id = project_domains.project_id) AND (p.user_id = auth.uid())))))
with check ((EXISTS ( SELECT 1
   FROM projects p
  WHERE ((p.id = project_domains.project_id) AND (p.user_id = auth.uid())))));


create policy "Anyone can view field settings"
on "public"."project_field_settings"
as permissive
for select
to public
using (true);


create policy "Authenticated users can manage field settings"
on "public"."project_field_settings"
as permissive
for all
to public
using ((auth.uid() IS NOT NULL))
with check ((auth.uid() IS NOT NULL));


create policy "Public can view field settings for public projects"
on "public"."project_field_settings"
as permissive
for select
to public
using ((project_id IN ( SELECT projects.id
   FROM projects
  WHERE ((projects.is_public = true) OR (projects.user_id = auth.uid())))));


create policy "Users can insert sync settings for their projects"
on "public"."project_sync_settings"
as permissive
for insert
to public
with check ((project_id IN ( SELECT projects.id
   FROM projects
  WHERE (projects.id = project_sync_settings.project_id))));


create policy "Users can update sync settings for their projects"
on "public"."project_sync_settings"
as permissive
for update
to public
using ((project_id IN ( SELECT projects.id
   FROM projects
  WHERE (projects.id = project_sync_settings.project_id))))
with check ((project_id IN ( SELECT projects.id
   FROM projects
  WHERE (projects.id = project_sync_settings.project_id))));


create policy "Users can view their project sync settings"
on "public"."project_sync_settings"
as permissive
for select
to public
using ((project_id IN ( SELECT projects.id
   FROM projects
  WHERE (projects.id = project_sync_settings.project_id))));


create policy "Anyone can insert project views"
on "public"."project_views"
as permissive
for insert
to public
with check (true);


create policy "Project owners can view their project analytics"
on "public"."project_views"
as permissive
for select
to public
using ((project_id IN ( SELECT projects.id
   FROM projects
  WHERE (projects.user_id = auth.uid()))));


create policy "Managers can create projects for their developers"
on "public"."projects"
as permissive
for insert
to public
with check ((user_id IN ( SELECT manager_accounts.developer_id
   FROM manager_accounts
  WHERE ((manager_accounts.manager_id = auth.uid()) AND (manager_accounts.status = 'active'::text) AND (manager_accounts.id IN ( SELECT manager_permissions.manager_account_id
           FROM manager_permissions
          WHERE ((manager_permissions.permission_type = 'create_projects'::text) AND (manager_permissions.allowed = true))))))));


create policy "Only project owners can delete projects"
on "public"."projects"
as permissive
for delete
to public
using ((auth.uid() = user_id));


create policy "Public can view public projects"
on "public"."projects"
as permissive
for select
to anon, authenticated
using ((is_public = true));


create policy "Public visible projects are viewable"
on "public"."projects"
as permissive
for select
to public
using (((is_public = true) AND (is_public_visible = true)));


create policy "Superadmins can update all projects"
on "public"."projects"
as permissive
for update
to authenticated
using (is_superadmin(auth.uid()));


create policy "Superadmins can view all projects"
on "public"."projects"
as permissive
for select
to authenticated
using (is_superadmin(auth.uid()));


create policy "Users and managers can update projects"
on "public"."projects"
as permissive
for update
to public
using (((auth.uid() = user_id) OR (auth.uid() IN ( SELECT ma.manager_id
   FROM (manager_accounts ma
     JOIN manager_permissions mp ON ((ma.id = mp.manager_account_id)))
  WHERE ((ma.developer_id = projects.user_id) AND (ma.status = 'active'::text) AND (mp.permission_type = 'edit_projects'::text) AND (mp.allowed = true))))));


create policy "Users and managers can view projects"
on "public"."projects"
as permissive
for select
to public
using (((auth.uid() = user_id) OR (auth.uid() IN ( SELECT manager_accounts.manager_id
   FROM manager_accounts
  WHERE ((manager_accounts.developer_id = projects.user_id) AND (manager_accounts.status = 'active'::text))))));


create policy "Users can create own projects"
on "public"."projects"
as permissive
for insert
to public
with check ((auth.uid() = user_id));


create policy "Users can view their own projects"
on "public"."projects"
as permissive
for select
to authenticated
using ((user_id = auth.uid()));


create policy "Subscription discounts are viewable by everyone"
on "public"."subscription_discounts"
as permissive
for select
to public
using (true);


create policy "Users can view their own subscription history"
on "public"."subscription_history"
as permissive
for select
to public
using ((auth.uid() = user_id));


create policy "Subscription plans are viewable by everyone"
on "public"."subscription_plans"
as permissive
for select
to public
using (true);


create policy "Allow anon to read developer profiles for invitations"
on "public"."user_profiles"
as permissive
for select
to anon
using ((id IN ( SELECT manager_invitations.developer_id
   FROM manager_invitations
  WHERE ((manager_invitations.status = 'pending'::text) AND (manager_invitations.expires_at > now())))));


create policy "Managers can view related developer profiles"
on "public"."user_profiles"
as permissive
for select
to public
using ((EXISTS ( SELECT 1
   FROM manager_accounts
  WHERE ((manager_accounts.developer_id = user_profiles.id) AND (manager_accounts.manager_id = auth.uid())))));


create policy "Superadmins can update all profiles"
on "public"."user_profiles"
as permissive
for update
to authenticated
using (is_superadmin(auth.uid()));


create policy "Superadmins can view all profiles"
on "public"."user_profiles"
as permissive
for select
to authenticated
using (is_superadmin(auth.uid()));


create policy "Users can insert own profile"
on "public"."user_profiles"
as permissive
for insert
to public
with check ((auth.uid() = id));


create policy "Users can update own profile"
on "public"."user_profiles"
as permissive
for update
to public
using ((auth.uid() = id));


create policy "Users can view own profile"
on "public"."user_profiles"
as permissive
for select
to public
using ((auth.uid() = id));


create policy "developer_public_read_for_invitations"
on "public"."user_profiles"
as permissive
for select
to anon
using ((id IN ( SELECT manager_invitations.developer_id
   FROM manager_invitations
  WHERE ((manager_invitations.status = 'pending'::text) AND (manager_invitations.expires_at > now())))));


create policy "Superadmins can delete roles"
on "public"."user_roles"
as permissive
for delete
to authenticated
using (is_superadmin(auth.uid()));


create policy "Superadmins can insert roles"
on "public"."user_roles"
as permissive
for insert
to authenticated
with check (is_superadmin(auth.uid()));


create policy "Superadmins can update roles"
on "public"."user_roles"
as permissive
for update
to authenticated
using (is_superadmin(auth.uid()));


create policy "Superadmins can view all roles"
on "public"."user_roles"
as permissive
for select
to authenticated
using (is_superadmin(auth.uid()));


create policy "Project owners can manage project subscriptions"
on "public"."user_subscriptions"
as permissive
for update
to authenticated
using (((project_id IS NOT NULL) AND is_project_owner(auth.uid(), project_id)))
with check (((project_id IS NOT NULL) AND is_project_owner(auth.uid(), project_id)));


create policy "Project owners can view project subscriptions"
on "public"."user_subscriptions"
as permissive
for select
to authenticated
using (((project_id IS NOT NULL) AND is_project_owner(auth.uid(), project_id)));


create policy "Superadmins can manage all subscriptions"
on "public"."user_subscriptions"
as permissive
for all
to authenticated
using (is_superadmin(auth.uid()))
with check (is_superadmin(auth.uid()));


create policy "Superadmins can view all subscriptions"
on "public"."user_subscriptions"
as permissive
for select
to authenticated
using (is_superadmin(auth.uid()));


create policy "Users can view their project subscriptions"
on "public"."user_subscriptions"
as permissive
for select
to authenticated
using (((user_id = auth.uid()) OR (project_id IN ( SELECT projects.id
   FROM projects
  WHERE (projects.user_id = auth.uid())))));


CREATE TRIGGER update_amocrm_custom_fields_updated_at BEFORE UPDATE ON public.amocrm_custom_fields FOR EACH ROW EXECUTE FUNCTION update_amocrm_custom_fields_updated_at();

CREATE TRIGGER update_amocrm_settings_updated_at BEFORE UPDATE ON public.amocrm_settings FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trigger_update_layout_photos_updated_at BEFORE UPDATE ON public.layout_photos FOR EACH ROW EXECUTE FUNCTION update_layout_photos_updated_at();

CREATE TRIGGER handle_leads_updated_at BEFORE UPDATE ON public.leads FOR EACH ROW EXECUTE FUNCTION handle_updated_at();

CREATE TRIGGER on_manager_account_created AFTER INSERT ON public.manager_accounts FOR EACH ROW EXECUTE FUNCTION handle_new_manager_account();

CREATE TRIGGER on_manager_account_created_update_invitation AFTER INSERT ON public.manager_accounts FOR EACH ROW EXECUTE FUNCTION handle_manager_account_created();

CREATE TRIGGER update_manager_project_access_updated_at BEFORE UPDATE ON public.manager_project_access FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trigger_project_domains_updated_at BEFORE UPDATE ON public.project_domains FOR EACH ROW EXECUTE FUNCTION update_project_domains_updated_at();

CREATE TRIGGER trigger_set_initial_next_sync BEFORE INSERT ON public.project_sync_settings FOR EACH ROW EXECUTE FUNCTION set_initial_next_sync();

CREATE TRIGGER trigger_update_next_sync BEFORE UPDATE ON public.project_sync_settings FOR EACH ROW EXECUTE FUNCTION update_next_sync();

CREATE TRIGGER auto_initialize_project_fields AFTER INSERT ON public.projects FOR EACH ROW EXECUTE FUNCTION trigger_initialize_default_fields();

CREATE TRIGGER trigger_auto_generate_slug BEFORE INSERT OR UPDATE ON public.projects FOR EACH ROW EXECUTE FUNCTION auto_generate_slug();

CREATE TRIGGER update_subscription_plans_updated_at BEFORE UPDATE ON public.subscription_plans FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_roles_updated_at BEFORE UPDATE ON public.user_roles FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER ensure_project_subscription BEFORE INSERT ON public.user_subscriptions FOR EACH ROW EXECUTE FUNCTION check_project_subscription();

CREATE TRIGGER sync_subscription_status AFTER INSERT OR UPDATE ON public.user_subscriptions FOR EACH ROW EXECUTE FUNCTION sync_project_subscription_status();

CREATE TRIGGER update_user_subscriptions_updated_at BEFORE UPDATE ON public.user_subscriptions FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();


CREATE TRIGGER on_auth_user_created AFTER INSERT ON auth.users FOR EACH ROW EXECUTE FUNCTION handle_new_user();

CREATE TRIGGER start_trial_on_signup AFTER INSERT ON auth.users FOR EACH ROW EXECUTE FUNCTION start_trial_subscription();


  create policy "Anyone can view project images"
  on "storage"."objects"
  as permissive
  for select
  to public
using ((bucket_id = 'project-images'::text));



  create policy "Authenticated users can delete project images"
  on "storage"."objects"
  as permissive
  for delete
  to public
using (((bucket_id = 'project-images'::text) AND (auth.role() = 'authenticated'::text)));



  create policy "Authenticated users can update project images"
  on "storage"."objects"
  as permissive
  for update
  to public
using (((bucket_id = 'project-images'::text) AND (auth.role() = 'authenticated'::text)));



  create policy "Authenticated users can upload project images"
  on "storage"."objects"
  as permissive
  for insert
  to public
with check (((bucket_id = 'project-images'::text) AND (auth.role() = 'authenticated'::text)));



  create policy "Users can delete their PDF files"
  on "storage"."objects"
  as permissive
  for delete
  to public
using (((bucket_id = 'project-files'::text) AND (auth.uid() IS NOT NULL) AND ((storage.foldername(name))[1] = (auth.uid())::text)));



  create policy "Users can update their PDF files"
  on "storage"."objects"
  as permissive
  for update
  to public
using (((bucket_id = 'project-files'::text) AND (auth.uid() IS NOT NULL) AND ((storage.foldername(name))[1] = (auth.uid())::text)));



  create policy "Users can upload PDF files"
  on "storage"."objects"
  as permissive
  for insert
  to public
with check (((bucket_id = 'project-files'::text) AND (auth.uid() IS NOT NULL) AND ((storage.foldername(name))[1] = (auth.uid())::text)));



  create policy "Users can view their PDF files"
  on "storage"."objects"
  as permissive
  for select
  to public
using (((bucket_id = 'project-files'::text) AND (auth.uid() IS NOT NULL) AND ((storage.foldername(name))[1] = (auth.uid())::text)));



