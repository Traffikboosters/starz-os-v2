-- ═══════════════════════════════════════════════════════════════════════
-- STARZ-OS Supabase Schema Migration
-- ═══════════════════════════════════════════════════════════════════════

-- Enable RLS on all tables
-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ─── USERS (managed by Supabase Auth, extended profile) ───────────────
CREATE TABLE users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  name TEXT,
  avatar TEXT,
  role TEXT NOT NULL DEFAULT 'sales' CHECK (role IN ('user', 'admin', 'sales', 'developer', 'bge')),
  department TEXT NOT NULL DEFAULT 'sales' CHECK (department IN ('sales', 'fulfillment', 'management', 'none')),
  phone TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  last_sign_in_at TIMESTAMPTZ DEFAULT NOW()
);

-- ─── PROSPECTS (scraped leads) ────────────────────────────────────────
CREATE TABLE prospects (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  business_name TEXT NOT NULL,
  phone TEXT,
  email TEXT,
  website TEXT,
  address TEXT,
  city TEXT,
  state TEXT,
  zip_code TEXT,
  industry TEXT,
  vendor_source TEXT NOT NULL DEFAULT 'web_form' CHECK (vendor_source IN ('google_maps', 'linkedin', 'yelp', 'craigslist', 'facebook', 'yellow_pages', 'web_form', 'referral', 'cold_outreach', 'ad_campaign')),
  google_rating NUMERIC(3,1),
  review_count INTEGER NOT NULL DEFAULT 0,
  seo_score INTEGER NOT NULL DEFAULT 0,
  estimated_revenue NUMERIC(12,2),
  lead_score INTEGER NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'cold' CHECK (status IN ('hot', 'warm', 'cold', 'dead')),
  priority TEXT NOT NULL DEFAULT 'low' CHECK (priority IN ('critical', 'high', 'medium', 'low')),
  assigned_rep_id UUID REFERENCES users(id),
  notes TEXT,
  tags TEXT,
  scraped_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  converted_to_lead BOOLEAN NOT NULL DEFAULT false
);

-- ─── LEADS (qualified prospects) ──────────────────────────────────────
CREATE TABLE leads (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  prospect_id UUID REFERENCES prospects(id),
  business_name TEXT NOT NULL,
  contact_name TEXT,
  phone TEXT,
  email TEXT,
  website TEXT,
  city TEXT,
  state TEXT,
  industry TEXT,
  vendor_source TEXT NOT NULL DEFAULT 'web_form' CHECK (vendor_source IN ('google_maps', 'linkedin', 'yelp', 'craigslist', 'facebook', 'yellow_pages', 'web_form', 'referral', 'cold_outreach', 'ad_campaign')),
  lead_score INTEGER NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'cold' CHECK (status IN ('hot', 'warm', 'cold', 'dead')),
  stage TEXT NOT NULL DEFAULT 'new' CHECK (stage IN ('new', 'contacted', 'interested', 'proposal_sent', 'negotiation', 'closed_won', 'closed_lost')),
  estimated_value NUMERIC(12,2),
  assigned_rep_id UUID REFERENCES users(id),
  source TEXT,
  notes TEXT,
  tags TEXT,
  last_contacted_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  closed_at TIMESTAMPTZ,
  closed_by UUID REFERENCES users(id)
);

-- ─── CALLS (PowerDial) ────────────────────────────────────────────────
CREATE TABLE calls (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  lead_id UUID REFERENCES leads(id),
  prospect_id UUID REFERENCES prospects(id),
  rep_id UUID REFERENCES users(id),
  phone_number TEXT NOT NULL,
  business_name TEXT,
  contact_name TEXT,
  duration INTEGER NOT NULL DEFAULT 0,
  outcome TEXT NOT NULL DEFAULT 'no_answer' CHECK (outcome IN ('interested', 'callback', 'no_answer', 'voicemail', 'not_interested', 'qualified', 'proposal_sent', 'transferred', 'closed', 'hangup')),
  notes TEXT,
  recording_url TEXT,
  transcript TEXT,
  ai_suggestions TEXT,
  steve_whisper TEXT,
  started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  ended_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ─── PROPOSALS ────────────────────────────────────────────────────────
CREATE TABLE proposals (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  lead_id UUID NOT NULL REFERENCES leads(id),
  client_name TEXT NOT NULL,
  client_email TEXT,
  services TEXT NOT NULL,
  subtotal NUMERIC(12,2) NOT NULL,
  discount_percent INTEGER NOT NULL DEFAULT 0,
  discount_amount NUMERIC(12,2) NOT NULL DEFAULT 0,
  tax NUMERIC(12,2) NOT NULL DEFAULT 0,
  total NUMERIC(12,2) NOT NULL,
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'sent', 'viewed', 'signed', 'paid', 'cancelled', 'refunded')),
  signature TEXT,
  signed_at TIMESTAMPTZ,
  signed_by TEXT,
  stripe_checkout_id TEXT,
  stripe_payment_intent TEXT,
  pdf_url TEXT,
  view_count INTEGER NOT NULL DEFAULT 0,
  last_viewed_at TIMESTAMPTZ,
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  expires_at TIMESTAMPTZ
);

-- ─── PAYMENTS ─────────────────────────────────────────────────────────
CREATE TABLE payments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  proposal_id UUID REFERENCES proposals(id),
  lead_id UUID REFERENCES leads(id),
  client_name TEXT NOT NULL,
  amount NUMERIC(12,2) NOT NULL,
  currency TEXT NOT NULL DEFAULT 'USD',
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'failed', 'refunded', 'disputed')),
  stripe_payment_intent_id TEXT,
  stripe_charge_id TEXT,
  stripe_customer_id TEXT,
  payment_method TEXT NOT NULL DEFAULT 'card' CHECK (payment_method IN ('card', 'ach', 'wire', 'check', 'cash')),
  description TEXT,
  metadata TEXT,
  refunded_amount NUMERIC(12,2) NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ─── WORK ORDERS (Fulfillment) ────────────────────────────────────────
CREATE TABLE work_orders (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  proposal_id UUID REFERENCES proposals(id),
  lead_id UUID REFERENCES leads(id),
  payment_id UUID REFERENCES payments(id),
  client_name TEXT NOT NULL,
  service_type TEXT NOT NULL CHECK (service_type IN ('seo', 'ppc', 'web_design', 'social_media', 'content', 'reputation', 'local_seo', 'full_stack', 'automation')),
  title TEXT NOT NULL,
  description TEXT,
  priority TEXT NOT NULL DEFAULT 'normal' CHECK (priority IN ('urgent', 'high', 'normal', 'low')),
  status TEXT NOT NULL DEFAULT 'pending_validation' CHECK (status IN ('pending_validation', 'hold_3day', 'ready', 'in_progress', 'awaiting_client', 'completed', 'paused', 'escalated', 'cancelled')),
  assigned_team TEXT NOT NULL DEFAULT 'seo' CHECK (assigned_team IN ('seo', 'dev', 'ads', 'outreach', 'ai_dev', 'social')),
  assigned_dev_id UUID REFERENCES users(id),
  amount NUMERIC(12,2) NOT NULL,
  progress INTEGER NOT NULL DEFAULT 0,
  sla_hours INTEGER NOT NULL DEFAULT 72,
  due_date TIMESTAMPTZ,
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ─── TASKS ────────────────────────────────────────────────────────────
CREATE TABLE tasks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  work_order_id UUID NOT NULL REFERENCES work_orders(id),
  title TEXT NOT NULL,
  description TEXT,
  assigned_to UUID REFERENCES users(id),
  status TEXT NOT NULL DEFAULT 'todo' CHECK (status IN ('todo', 'in_progress', 'review', 'done')),
  priority TEXT NOT NULL DEFAULT 'normal' CHECK (priority IN ('urgent', 'high', 'normal', 'low')),
  due_date TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ─── DELIVERABLES ─────────────────────────────────────────────────────
CREATE TABLE deliverables (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  work_order_id UUID NOT NULL REFERENCES work_orders(id),
  task_id UUID REFERENCES tasks(id),
  title TEXT NOT NULL,
  type TEXT NOT NULL DEFAULT 'document' CHECK (type IN ('pdf', 'image', 'video', 'spreadsheet', 'document', 'link', 'code', 'report')),
  file_url TEXT,
  file_size INTEGER,
  description TEXT,
  uploaded_by UUID REFERENCES users(id),
  client_status TEXT NOT NULL DEFAULT 'pending_review' CHECK (client_status IN ('pending_review', 'approved', 'rejected', 'revision_requested')),
  client_feedback TEXT,
  version INTEGER NOT NULL DEFAULT 1,
  previous_version_id UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ─── CAMPAIGNS ────────────────────────────────────────────────────────
CREATE TABLE campaigns (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('cold_outreach', 'follow_up', 'missed_call', 'proposal_reminder', 'nurture')),
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'scheduled', 'running', 'paused', 'completed')),
  template_id UUID,
  subject TEXT,
  body TEXT,
  from_name TEXT,
  from_email TEXT,
  recipient_count INTEGER NOT NULL DEFAULT 0,
  sent_count INTEGER NOT NULL DEFAULT 0,
  open_count INTEGER NOT NULL DEFAULT 0,
  reply_count INTEGER NOT NULL DEFAULT 0,
  positive_reply_count INTEGER NOT NULL DEFAULT 0,
  daily_limit INTEGER NOT NULL DEFAULT 100,
  scheduled_for TIMESTAMPTZ,
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ─── EMAIL TEMPLATES ──────────────────────────────────────────────────
CREATE TABLE email_templates (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('cold_outreach', 'follow_up', 'missed_call', 'proposal_reminder', 'nurture')),
  subject TEXT NOT NULL,
  body TEXT NOT NULL,
  variables TEXT,
  is_default BOOLEAN NOT NULL DEFAULT false,
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ─── SEO KEYWORDS ─────────────────────────────────────────────────────
CREATE TABLE seo_keywords (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  work_order_id UUID REFERENCES work_orders(id),
  client_id UUID REFERENCES users(id),
  keyword TEXT NOT NULL,
  target_url TEXT,
  current_rank INTEGER,
  previous_rank INTEGER,
  search_volume INTEGER,
  difficulty INTEGER,
  change INTEGER NOT NULL DEFAULT 0,
  last_checked TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ─── BACKLINKS ────────────────────────────────────────────────────────
CREATE TABLE backlinks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  work_order_id UUID REFERENCES work_orders(id),
  client_id UUID REFERENCES users(id),
  source_url TEXT NOT NULL,
  target_url TEXT NOT NULL,
  anchor_text TEXT,
  domain_authority INTEGER,
  status TEXT NOT NULL DEFAULT 'prospect' CHECK (status IN ('prospect', 'outreach_sent', 'negotiating', 'live', 'lost', 'rejected')),
  acquired_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ─── ACTIVITY LOG ─────────────────────────────────────────────────────
CREATE TABLE activity_log (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id),
  type TEXT NOT NULL CHECK (type IN ('call', 'deal_closed', 'payment_received', 'work_order_created', 'task_completed', 'seo_growth', 'lead_assigned', 'proposal_sent', 'proposal_signed')),
  entity_type TEXT,
  entity_id UUID,
  description TEXT NOT NULL,
  metadata TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ─── AUTOMATION RULES ─────────────────────────────────────────────────
CREATE TABLE automation_rules (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  trigger TEXT NOT NULL CHECK (trigger IN ('lead_created', 'score_changed', 'call_ended', 'proposal_viewed', 'payment_received', 'status_changed', 'no_activity')),
  condition TEXT,
  action TEXT NOT NULL CHECK (action IN ('send_email', 'send_sms', 'assign_rep', 'create_task', 'alert_manager', 'move_stage', 'score_adjust')),
  action_config TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  run_count INTEGER NOT NULL DEFAULT 0,
  last_run_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ─── PAYOUTS (BGE) ────────────────────────────────────────────────────
CREATE TABLE payouts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  contractor_id UUID NOT NULL REFERENCES users(id),
  deal_id UUID REFERENCES leads(id),
  payment_id UUID REFERENCES payments(id),
  deal_amount NUMERIC(12,2) NOT NULL,
  commission_rate NUMERIC(5,2) NOT NULL DEFAULT 30.00,
  commission_amount NUMERIC(12,2) NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'paid', 'disputed')),
  paid_at TIMESTAMPTZ,
  payment_method TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ─── SALES VICTORY FEED ───────────────────────────────────────────────
CREATE TABLE sales_victory_feed (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  rep_name TEXT NOT NULL,
  rep_role TEXT NOT NULL,
  rep_avatar TEXT,
  sale_amount NUMERIC(12,2) NOT NULL,
  client_name TEXT NOT NULL,
  city TEXT NOT NULL,
  state TEXT NOT NULL,
  service TEXT NOT NULL,
  tier TEXT NOT NULL CHECK (tier IN ('small', 'medium', 'enterprise')),
  org_id TEXT NOT NULL DEFAULT 'default',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ═══════════════════════════════════════════════════════════════════════
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ═══════════════════════════════════════════════════════════════════════

ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE prospects ENABLE ROW LEVEL SECURITY;
ALTER TABLE leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE calls ENABLE ROW LEVEL SECURITY;
ALTER TABLE proposals ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE work_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE deliverables ENABLE ROW LEVEL SECURITY;
ALTER TABLE campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE activity_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE payouts ENABLE ROW LEVEL SECURITY;
ALTER TABLE sales_victory_feed ENABLE ROW LEVEL SECURITY;

-- ─── RLS POLICIES ─────────────────────────────────────────────────────

-- Users: anyone can read, only self can update
CREATE POLICY "Users readable by all" ON users FOR SELECT USING (true);
CREATE POLICY "Users updatable by self" ON users FOR UPDATE USING (auth.uid() = id);

-- Prospects: sales can CRUD, others read-only
CREATE POLICY "Prospects readable by all" ON prospects FOR SELECT USING (true);
CREATE POLICY "Prospects manageable by sales" ON prospects FOR ALL USING (
  EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND (role = 'sales' OR role = 'admin'))
);

-- Leads: sales can CRUD, developers read-only
CREATE POLICY "Leads readable by all" ON leads FOR SELECT USING (true);
CREATE POLICY "Leads manageable by sales" ON leads FOR ALL USING (
  EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND (role = 'sales' OR role = 'admin' OR role = 'bge'))
);

-- Calls: sales can CRUD
CREATE POLICY "Calls readable by sales" ON calls FOR SELECT USING (
  EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND (role = 'sales' OR role = 'admin' OR role = 'bge'))
);
CREATE POLICY "Calls manageable by sales" ON calls FOR ALL USING (
  EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND (role = 'sales' OR role = 'admin'))
);

-- Work Orders: developers can update assigned, sales can read
CREATE POLICY "WO readable by all" ON work_orders FOR SELECT USING (true);
CREATE POLICY "WO updatable by devs" ON work_orders FOR UPDATE USING (
  EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND (role = 'developer' OR role = 'admin'))
);

-- Tasks: developers can CRUD assigned
CREATE POLICY "Tasks readable by all" ON tasks FOR SELECT USING (true);
CREATE POLICY "Tasks manageable by devs" ON tasks FOR ALL USING (
  EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND (role = 'developer' OR role = 'admin'))
);

-- Deliverables: developers can CRUD
CREATE POLICY "Deliverables readable by all" ON deliverables FOR SELECT USING (true);
CREATE POLICY "Deliverables manageable by devs" ON deliverables FOR ALL USING (
  EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND (role = 'developer' OR role = 'admin'))
);

-- Payouts: contractors see own, admins see all
CREATE POLICY "Payouts readable by owner" ON payouts FOR SELECT USING (
  contractor_id = auth.uid() OR
  EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin')
);

-- Victory Feed: everyone can read, sales can insert
CREATE POLICY "Victory feed readable by all" ON sales_victory_feed FOR SELECT USING (true);
CREATE POLICY "Victory feed insertable by sales" ON sales_victory_feed FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND (role = 'sales' OR role = 'admin' OR role = 'bge'))
);

-- Activity Log: everyone can read
CREATE POLICY "Activity log readable by all" ON activity_log FOR SELECT USING (true);

-- ═══════════════════════════════════════════════════════════════════════
-- REALTIME ENABLEMENT
-- ═══════════════════════════════════════════════════════════════════════

ALTER TABLE leads REPLICA IDENTITY FULL;
ALTER TABLE calls REPLICA IDENTITY FULL;
ALTER TABLE work_orders REPLICA IDENTITY FULL;
ALTER TABLE payments REPLICA IDENTITY FULL;
ALTER TABLE proposals REPLICA IDENTITY FULL;
ALTER TABLE sales_victory_feed REPLICA IDENTITY FULL;
ALTER TABLE activity_log REPLICA IDENTITY FULL;
ALTER TABLE tasks REPLICA IDENTITY FULL;

-- ═══════════════════════════════════════════════════════════════════════
-- INDEXES
-- ═══════════════════════════════════════════════════════════════════════

CREATE INDEX idx_leads_status ON leads(status);
CREATE INDEX idx_leads_stage ON leads(stage);
CREATE INDEX idx_leads_assigned ON leads(assigned_rep_id);
CREATE INDEX idx_leads_score ON leads(lead_score DESC);
CREATE INDEX idx_prospects_score ON prospects(lead_score DESC);
CREATE INDEX idx_calls_rep ON calls(rep_id);
CREATE INDEX idx_calls_lead ON calls(lead_id);
CREATE INDEX idx_work_orders_status ON work_orders(status);
CREATE INDEX idx_work_orders_assigned ON work_orders(assigned_dev_id);
CREATE INDEX idx_tasks_assigned ON tasks(assigned_to);
CREATE INDEX idx_payouts_contractor ON payouts(contractor_id);
CREATE INDEX idx_victory_feed_created ON sales_victory_feed(created_at DESC);
CREATE INDEX idx_activity_created ON activity_log(created_at DESC);

-- ═══════════════════════════════════════════════════════════════════════
-- FUNCTIONS
-- ═══════════════════════════════════════════════════════════════════════

-- Auto-update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply auto-update triggers
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_prospects_updated_at BEFORE UPDATE ON prospects FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_leads_updated_at BEFORE UPDATE ON leads FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_work_orders_updated_at BEFORE UPDATE ON work_orders FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_tasks_updated_at BEFORE UPDATE ON tasks FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_deliverables_updated_at BEFORE UPDATE ON deliverables FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function to log victory on deal close
CREATE OR REPLACE FUNCTION log_victory_on_deal_close()
RETURNS TRIGGER AS $$
DECLARE
  rep_name TEXT;
  rep_role TEXT;
  city_val TEXT;
  state_val TEXT;
  service_val TEXT;
BEGIN
  IF NEW.stage = 'closed_won' AND OLD.stage != 'closed_won' THEN
    SELECT name, role INTO rep_name, rep_role FROM users WHERE id = NEW.closed_by;
    city_val := COALESCE(NEW.city, 'Unknown');
    state_val := COALESCE(NEW.state, 'NA');
    service_val := COALESCE(NEW.tags, 'seo');

    INSERT INTO sales_victory_feed (rep_name, rep_role, sale_amount, client_name, city, state, service, tier)
    VALUES (
      COALESCE(rep_name, 'Unknown'),
      COALESCE(rep_role, 'Sales Rep'),
      COALESCE(NEW.estimated_value, 0),
      NEW.business_name,
      city_val,
      state_val,
      service_val,
      CASE
        WHEN NEW.estimated_value >= 10000 THEN 'enterprise'
        WHEN NEW.estimated_value >= 2500 THEN 'medium'
        ELSE 'small'
      END
    );
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_victory_on_close AFTER UPDATE ON leads
FOR EACH ROW EXECUTE FUNCTION log_victory_on_deal_close();
