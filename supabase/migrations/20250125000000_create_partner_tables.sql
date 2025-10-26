-- Create partner_profiles table
CREATE TABLE IF NOT EXISTS "public"."partner_profiles" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "partner_code" "text" NOT NULL,
    "status" "text" DEFAULT 'active'::"text" NOT NULL,
    "total_earned" numeric(10,2) DEFAULT 0,
    "total_withdrawn" numeric(10,2) DEFAULT 0,
    "payout_percentage" numeric(5,2) DEFAULT 10.00,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "partner_profiles_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "partner_profiles_user_id_key" UNIQUE ("user_id"),
    CONSTRAINT "partner_profiles_partner_code_key" UNIQUE ("partner_code"),
    CONSTRAINT "partner_profiles_status_check" CHECK (("status" = ANY (ARRAY['active'::"text", 'suspended'::"text", 'inactive'::"text"])))
);

-- Create partner_links table
CREATE TABLE IF NOT EXISTS "public"."partner_links" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "partner_id" "uuid" NOT NULL,
    "client_id" "uuid" NOT NULL,
    "type" "text" NOT NULL,
    "status" "text" DEFAULT 'active'::"text" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "accepted_at" timestamp with time zone,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "partner_links_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "partner_links_type_check" CHECK (("type" = ANY (ARRAY['referral'::"text", 'managed'::"text"]))),
    CONSTRAINT "partner_links_status_check" CHECK (("status" = ANY (ARRAY['active'::"text", 'inactive'::"text", 'suspended'::"text"])))
);

-- Create partner_invitations table
CREATE TABLE IF NOT EXISTS "public"."partner_invitations" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "partner_id" "uuid" NOT NULL,
    "email" "text" NOT NULL,
    "invitation_code" "text" NOT NULL,
    "type" "text" DEFAULT 'managed'::"text" NOT NULL,
    "status" "text" DEFAULT 'pending'::"text" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "accepted_at" timestamp with time zone,
    "expires_at" timestamp with time zone,
    CONSTRAINT "partner_invitations_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "partner_invitations_invitation_code_key" UNIQUE ("invitation_code"),
    CONSTRAINT "partner_invitations_type_check" CHECK (("type" = ANY (ARRAY['referral'::"text", 'managed'::"text"]))),
    CONSTRAINT "partner_invitations_status_check" CHECK (("status" = ANY (ARRAY['pending'::"text", 'accepted'::"text", 'expired'::"text", 'cancelled'::"text"])))
);

-- Create partner_payouts table
CREATE TABLE IF NOT EXISTS "public"."partner_payouts" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "partner_id" "uuid" NOT NULL,
    "amount" numeric(10,2) NOT NULL,
    "status" "text" DEFAULT 'pending'::"text" NOT NULL,
    "payment_method" "text",
    "payment_details" "jsonb",
    "processed_at" timestamp with time zone,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "partner_payouts_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "partner_payouts_status_check" CHECK (("status" = ANY (ARRAY['pending'::"text", 'processing'::"text", 'completed'::"text", 'failed'::"text", 'cancelled'::"text"])))
);

-- Add foreign key constraints
ALTER TABLE "public"."partner_profiles" ADD CONSTRAINT "partner_profiles_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;

ALTER TABLE "public"."partner_links" ADD CONSTRAINT "partner_links_partner_id_fkey" FOREIGN KEY ("partner_id") REFERENCES "public"."partner_profiles"("id") ON DELETE CASCADE;
ALTER TABLE "public"."partner_links" ADD CONSTRAINT "partner_links_client_id_fkey" FOREIGN KEY ("client_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;

ALTER TABLE "public"."partner_invitations" ADD CONSTRAINT "partner_invitations_partner_id_fkey" FOREIGN KEY ("partner_id") REFERENCES "public"."partner_profiles"("id") ON DELETE CASCADE;

ALTER TABLE "public"."partner_payouts" ADD CONSTRAINT "partner_payouts_partner_id_fkey" FOREIGN KEY ("partner_id") REFERENCES "public"."partner_profiles"("id") ON DELETE CASCADE;

-- Add indexes for better performance
CREATE INDEX "idx_partner_profiles_user_id" ON "public"."partner_profiles" ("user_id");
CREATE INDEX "idx_partner_profiles_partner_code" ON "public"."partner_profiles" ("partner_code");
CREATE INDEX "idx_partner_links_partner_id" ON "public"."partner_links" ("partner_id");
CREATE INDEX "idx_partner_links_client_id" ON "public"."partner_links" ("client_id");
CREATE INDEX "idx_partner_links_type" ON "public"."partner_links" ("type");
CREATE INDEX "idx_partner_invitations_partner_id" ON "public"."partner_invitations" ("partner_id");
CREATE INDEX "idx_partner_invitations_email" ON "public"."partner_invitations" ("email");
CREATE INDEX "idx_partner_invitations_invitation_code" ON "public"."partner_invitations" ("invitation_code");
CREATE INDEX "idx_partner_payouts_partner_id" ON "public"."partner_payouts" ("partner_id");

-- Add RLS policies
ALTER TABLE "public"."partner_profiles" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."partner_links" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."partner_invitations" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."partner_payouts" ENABLE ROW LEVEL SECURITY;

-- Partner profiles policies
CREATE POLICY "Users can view their own partner profile" ON "public"."partner_profiles"
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own partner profile" ON "public"."partner_profiles"
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Superadmins can view all partner profiles" ON "public"."partner_profiles"
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM "public"."user_roles" 
            WHERE "user_id" = auth.uid() AND "role" = 'superadmin'
        )
    );

-- Partner links policies
CREATE POLICY "Partners can view their own links" ON "public"."partner_links"
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM "public"."partner_profiles" 
            WHERE "id" = partner_id AND "user_id" = auth.uid()
        )
    );

CREATE POLICY "Clients can view their own links" ON "public"."partner_links"
    FOR SELECT USING (auth.uid() = client_id);

CREATE POLICY "Superadmins can view all partner links" ON "public"."partner_links"
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM "public"."user_roles" 
            WHERE "user_id" = auth.uid() AND "role" = 'superadmin'
        )
    );

-- Partner invitations policies
CREATE POLICY "Partners can manage their own invitations" ON "public"."partner_invitations"
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM "public"."partner_profiles" 
            WHERE "id" = partner_id AND "user_id" = auth.uid()
        )
    );

CREATE POLICY "Superadmins can view all invitations" ON "public"."partner_invitations"
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM "public"."user_roles" 
            WHERE "user_id" = auth.uid() AND "role" = 'superadmin'
        )
    );

-- Partner payouts policies
CREATE POLICY "Partners can view their own payouts" ON "public"."partner_payouts"
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM "public"."partner_profiles" 
            WHERE "id" = partner_id AND "user_id" = auth.uid()
        )
    );

CREATE POLICY "Partners can create their own payout requests" ON "public"."partner_payouts"
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM "public"."partner_profiles" 
            WHERE "id" = partner_id AND "user_id" = auth.uid()
        )
    );

CREATE POLICY "Superadmins can manage all payouts" ON "public"."partner_payouts"
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM "public"."user_roles" 
            WHERE "user_id" = auth.uid() AND "role" = 'superadmin'
        )
    );

-- Create function to generate unique partner code
CREATE OR REPLACE FUNCTION generate_partner_code(user_id_param uuid)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    code text;
    counter integer := 0;
BEGIN
    LOOP
        -- Generate a random 8-character code
        code := upper(substring(md5(random()::text) from 1 for 8));
        
        -- Check if code already exists
        IF NOT EXISTS (SELECT 1 FROM partner_profiles WHERE partner_code = code) THEN
            RETURN code;
        END IF;
        
        counter := counter + 1;
        -- Prevent infinite loop
        IF counter > 100 THEN
            RAISE EXCEPTION 'Unable to generate unique partner code';
        END IF;
    END LOOP;
END;
$$;

-- Add partner_id and commission fields to user_subscriptions if they don't exist
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'user_subscriptions' AND column_name = 'partner_id') THEN
        ALTER TABLE "public"."user_subscriptions" ADD COLUMN "partner_id" "uuid";
        ALTER TABLE "public"."user_subscriptions" ADD CONSTRAINT "user_subscriptions_partner_id_fkey" FOREIGN KEY ("partner_id") REFERENCES "public"."partner_profiles"("id") ON DELETE SET NULL;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'user_subscriptions' AND column_name = 'partner_commission_amount') THEN
        ALTER TABLE "public"."user_subscriptions" ADD COLUMN "partner_commission_amount" numeric(10,2) DEFAULT 0;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'user_subscriptions' AND column_name = 'partner_commission_paid') THEN
        ALTER TABLE "public"."user_subscriptions" ADD COLUMN "partner_commission_paid" boolean DEFAULT false;
    END IF;
END $$;
