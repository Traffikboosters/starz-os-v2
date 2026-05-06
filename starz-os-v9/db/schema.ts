import {
  mysqlTable,
  mysqlEnum,
  serial,
  varchar,
  text,
  timestamp,
  int,
  decimal,
  boolean,
  bigint,
  json,
} from "drizzle-orm/mysql-core";

// ─── USERS (Auth) ──────────────────────────────────────────────────
export const users = mysqlTable("users", {
  id: serial("id").primaryKey(),
  unionId: varchar("unionId", { length: 255 }).notNull().unique(),
  name: varchar("name", { length: 255 }),
  email: varchar("email", { length: 320 }),
  avatar: text("avatar"),
  role: mysqlEnum("role", ["user", "admin", "sales", "developer", "bge"]).default("user").notNull(),
  department: mysqlEnum("department", ["sales", "fulfillment", "management", "none"]).default("none").notNull(),
  phone: varchar("phone", { length: 50 }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull().$onUpdate(() => new Date()),
  lastSignInAt: timestamp("lastSignInAt").defaultNow().notNull(),
  isActive: boolean("isActive").default(true).notNull(),
});

// ─── PROSPECTS (Scraped Leads) ─────────────────────────────────────
export const prospects = mysqlTable("prospects", {
  id: serial("id").primaryKey(),
  businessName: varchar("business_name", { length: 255 }).notNull(),
  phone: varchar("phone", { length: 50 }),
  email: varchar("email", { length: 320 }),
  website: varchar("website", { length: 500 }),
  address: text("address"),
  city: varchar("city", { length: 100 }),
  state: varchar("state", { length: 50 }),
  zipCode: varchar("zip_code", { length: 20 }),
  industry: varchar("industry", { length: 100 }),
  vendorSource: mysqlEnum("vendor_source", ["google_maps", "linkedin", "yelp", "craigslist", "facebook", "yellow_pages", "web_form", "referral", "cold_outreach", "ad_campaign"]).default("web_form").notNull(),
  googleRating: decimal("google_rating", { precision: 3, scale: 1 }),
  reviewCount: int("review_count").default(0),
  seoScore: int("seo_score").default(0),
  estimatedRevenue: decimal("estimated_revenue", { precision: 12, scale: 2 }),
  leadScore: int("lead_score").default(0),
  status: mysqlEnum("status", ["hot", "warm", "cold", "dead"]).default("cold").notNull(),
  priority: mysqlEnum("priority", ["critical", "high", "medium", "low"]).default("low").notNull(),
  assignedRepId: bigint("assigned_rep_id", { mode: "number", unsigned: true }),
  notes: text("notes"),
  tags: text("tags"),
  scrapedAt: timestamp("scraped_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull().$onUpdate(() => new Date()),
  convertedToLead: boolean("converted_to_lead").default(false).notNull(),
});

// ─── LEADS (Qualified Prospects) ────────────────────────────────────
export const leads = mysqlTable("leads", {
  id: serial("id").primaryKey(),
  prospectId: bigint("prospect_id", { mode: "number", unsigned: true }),
  businessName: varchar("business_name", { length: 255 }).notNull(),
  contactName: varchar("contact_name", { length: 255 }),
  phone: varchar("phone", { length: 50 }),
  email: varchar("email", { length: 320 }),
  website: varchar("website", { length: 500 }),
  city: varchar("city", { length: 100 }),
  state: varchar("state", { length: 50 }),
  industry: varchar("industry", { length: 100 }),
  vendorSource: mysqlEnum("vendor_source", ["google_maps", "linkedin", "yelp", "craigslist", "facebook", "yellow_pages", "web_form", "referral", "cold_outreach", "ad_campaign"]).default("web_form").notNull(),
  leadScore: int("lead_score").default(0),
  status: mysqlEnum("status", ["hot", "warm", "cold", "dead"]).default("cold").notNull(),
  stage: mysqlEnum("stage", ["new", "contacted", "interested", "proposal_sent", "negotiation", "closed_won", "closed_lost"]).default("new").notNull(),
  estimatedValue: decimal("estimated_value", { precision: 12, scale: 2 }).default("0"),
  assignedRepId: bigint("assigned_rep_id", { mode: "number", unsigned: true }),
  source: varchar("source", { length: 100 }),
  notes: text("notes"),
  tags: text("tags"),
  lastContactedAt: timestamp("last_contacted_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull().$onUpdate(() => new Date()),
  closedAt: timestamp("closed_at"),
  closedBy: bigint("closed_by", { mode: "number", unsigned: true }),
});

// ─── CALLS (PowerDial) ──────────────────────────────────────────────
export const calls = mysqlTable("calls", {
  id: serial("id").primaryKey(),
  leadId: bigint("lead_id", { mode: "number", unsigned: true }),
  prospectId: bigint("prospect_id", { mode: "number", unsigned: true }),
  repId: bigint("rep_id", { mode: "number", unsigned: true }),
  phoneNumber: varchar("phone_number", { length: 50 }).notNull(),
  businessName: varchar("business_name", { length: 255 }),
  contactName: varchar("contact_name", { length: 255 }),
  duration: int("duration").default(0),
  outcome: mysqlEnum("outcome", ["interested", "callback", "no_answer", "voicemail", "not_interested", "qualified", "proposal_sent", "transferred", "closed", "hangup"]).default("no_answer").notNull(),
  notes: text("notes"),
  recordingUrl: text("recording_url"),
  transcript: text("transcript"),
  aiSuggestions: text("ai_suggestions"),
  steveWhisper: text("steve_whisper"),
  startedAt: timestamp("started_at").defaultNow().notNull(),
  endedAt: timestamp("ended_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// ─── CALL QUEUE ────────────────────────────────────────────────────
export const callQueue = mysqlTable("call_queue", {
  id: serial("id").primaryKey(),
  leadId: bigint("lead_id", { mode: "number", unsigned: true }),
  prospectId: bigint("prospect_id", { mode: "number", unsigned: true }),
  repId: bigint("rep_id", { mode: "number", unsigned: true }),
  priority: mysqlEnum("priority", ["critical", "high", "medium", "low"]).default("medium").notNull(),
  status: mysqlEnum("status", ["pending", "in_progress", "completed", "skipped"]).default("pending").notNull(),
  scheduledFor: timestamp("scheduled_for"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// ─── PROPOSALS ─────────────────────────────────────────────────────
export const proposals = mysqlTable("proposals", {
  id: serial("id").primaryKey(),
  leadId: bigint("lead_id", { mode: "number", unsigned: true }).notNull(),
  clientName: varchar("client_name", { length: 255 }).notNull(),
  clientEmail: varchar("client_email", { length: 320 }),
  services: text("services").notNull(),
  subtotal: decimal("subtotal", { precision: 12, scale: 2 }).notNull(),
  discountPercent: int("discount_percent").default(0),
  discountAmount: decimal("discount_amount", { precision: 12, scale: 2 }).default("0"),
  tax: decimal("tax", { precision: 12, scale: 2 }).default("0"),
  total: decimal("total", { precision: 12, scale: 2 }).notNull(),
  status: mysqlEnum("status", ["draft", "sent", "viewed", "signed", "paid", "cancelled", "refunded"]).default("draft").notNull(),
  signature: text("signature"),
  signedAt: timestamp("signed_at"),
  signedBy: varchar("signed_by", { length: 255 }),
  stripeCheckoutId: varchar("stripe_checkout_id", { length: 255 }),
  stripePaymentIntent: varchar("stripe_payment_intent", { length: 255 }),
  pdfUrl: text("pdf_url"),
  viewCount: int("view_count").default(0),
  lastViewedAt: timestamp("last_viewed_at"),
  createdBy: bigint("created_by", { mode: "number", unsigned: true }),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull().$onUpdate(() => new Date()),
  expiresAt: timestamp("expires_at"),
});

// ─── BILLING / PAYMENTS ────────────────────────────────────────────
export const payments = mysqlTable("payments", {
  id: serial("id").primaryKey(),
  proposalId: bigint("proposal_id", { mode: "number", unsigned: true }),
  leadId: bigint("lead_id", { mode: "number", unsigned: true }),
  clientName: varchar("client_name", { length: 255 }).notNull(),
  amount: decimal("amount", { precision: 12, scale: 2 }).notNull(),
  currency: varchar("currency", { length: 10 }).default("USD").notNull(),
  status: mysqlEnum("status", ["pending", "completed", "failed", "refunded", "disputed"]).default("pending").notNull(),
  stripePaymentIntentId: varchar("stripe_payment_intent_id", { length: 255 }),
  stripeChargeId: varchar("stripe_charge_id", { length: 255 }),
  stripeCustomerId: varchar("stripe_customer_id", { length: 255 }),
  paymentMethod: mysqlEnum("payment_method", ["card", "ach", "wire", "check", "cash"]).default("card").notNull(),
  description: text("description"),
  metadata: text("metadata"),
  refundedAmount: decimal("refunded_amount", { precision: 12, scale: 2 }).default("0"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// ─── WORK ORDERS (Fulfillment) ─────────────────────────────────────
export const workOrders = mysqlTable("work_orders", {
  id: serial("id").primaryKey(),
  proposalId: bigint("proposal_id", { mode: "number", unsigned: true }),
  leadId: bigint("lead_id", { mode: "number", unsigned: true }),
  paymentId: bigint("payment_id", { mode: "number", unsigned: true }),
  clientName: varchar("client_name", { length: 255 }).notNull(),
  serviceType: mysqlEnum("service_type", ["seo", "ppc", "web_design", "social_media", "content", "reputation", "local_seo", "full_stack", "automation"]).notNull(),
  title: varchar("title", { length: 255 }).notNull(),
  description: text("description"),
  priority: mysqlEnum("priority", ["urgent", "high", "normal", "low"]).default("normal").notNull(),
  status: mysqlEnum("status", ["pending_validation", "hold_3day", "ready", "in_progress", "awaiting_client", "completed", "paused", "escalated", "cancelled"]).default("pending_validation").notNull(),
  assignedTeam: mysqlEnum("assigned_team", ["seo", "dev", "ads", "outreach", "ai_dev", "social"]).default("seo").notNull(),
  assignedDevId: bigint("assigned_dev_id", { mode: "number", unsigned: true }),
  amount: decimal("amount", { precision: 12, scale: 2 }).notNull(),
  progress: int("progress").default(0).notNull(),
  slaHours: int("sla_hours").default(72).notNull(),
  dueDate: timestamp("due_date"),
  startedAt: timestamp("started_at"),
  completedAt: timestamp("completed_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull().$onUpdate(() => new Date()),
});

// ─── TASKS (Developer Workspace) ────────────────────────────────────
export const tasks = mysqlTable("tasks", {
  id: serial("id").primaryKey(),
  workOrderId: bigint("work_order_id", { mode: "number", unsigned: true }),
  title: varchar("title", { length: 255 }).notNull(),
  description: text("description"),
  assignedTo: bigint("assigned_to", { mode: "number", unsigned: true }),
  status: mysqlEnum("status", ["todo", "in_progress", "review", "done"]).default("todo").notNull(),
  priority: mysqlEnum("priority", ["urgent", "high", "normal", "low"]).default("normal").notNull(),
  dueDate: timestamp("due_date"),
  completedAt: timestamp("completed_at"),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull().$onUpdate(() => new Date()),
});

// ─── DELIVERABLES ──────────────────────────────────────────────────
export const deliverables = mysqlTable("deliverables", {
  id: serial("id").primaryKey(),
  workOrderId: bigint("work_order_id", { mode: "number", unsigned: true }).notNull(),
  taskId: bigint("task_id", { mode: "number", unsigned: true }),
  title: varchar("title", { length: 255 }).notNull(),
  type: mysqlEnum("type", ["pdf", "image", "video", "spreadsheet", "document", "link", "code", "report"]).default("document").notNull(),
  fileUrl: text("file_url"),
  fileSize: int("file_size"),
  description: text("description"),
  uploadedBy: bigint("uploaded_by", { mode: "number", unsigned: true }),
  clientStatus: mysqlEnum("client_status", ["pending_review", "approved", "rejected", "revision_requested"]).default("pending_review").notNull(),
  clientFeedback: text("client_feedback"),
  version: int("version").default(1),
  previousVersionId: bigint("previous_version_id", { mode: "number", unsigned: true }),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull().$onUpdate(() => new Date()),
});

// ─── CAMPAIGNS (Email Outreach) ────────────────────────────────────
export const campaigns = mysqlTable("campaigns", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  type: mysqlEnum("type", ["cold_outreach", "follow_up", "missed_call", "proposal_reminder", "nurture"]).notNull(),
  status: mysqlEnum("status", ["draft", "scheduled", "running", "paused", "completed"]).default("draft").notNull(),
  templateId: bigint("template_id", { mode: "number", unsigned: true }),
  subject: varchar("subject", { length: 500 }),
  body: text("body"),
  fromName: varchar("from_name", { length: 255 }),
  fromEmail: varchar("from_email", { length: 320 }),
  recipientCount: int("recipient_count").default(0),
  sentCount: int("sent_count").default(0),
  openCount: int("open_count").default(0),
  replyCount: int("reply_count").default(0),
  positiveReplyCount: int("positive_reply_count").default(0),
  dailyLimit: int("daily_limit").default(100),
  scheduledFor: timestamp("scheduled_for"),
  createdBy: bigint("created_by", { mode: "number", unsigned: true }),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull().$onUpdate(() => new Date()),
});

// ─── EMAIL TEMPLATES ───────────────────────────────────────────────
export const emailTemplates = mysqlTable("email_templates", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  type: mysqlEnum("type", ["cold_outreach", "follow_up", "missed_call", "proposal_reminder", "nurture"]).notNull(),
  subject: varchar("subject", { length: 500 }).notNull(),
  body: text("body").notNull(),
  variables: text("variables"),
  isDefault: boolean("is_default").default(false),
  createdBy: bigint("created_by", { mode: "number", unsigned: true }),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// ─── SEO TRACKING ──────────────────────────────────────────────────
export const seoKeywords = mysqlTable("seo_keywords", {
  id: serial("id").primaryKey(),
  workOrderId: bigint("work_order_id", { mode: "number", unsigned: true }),
  clientId: bigint("client_id", { mode: "number", unsigned: true }),
  keyword: varchar("keyword", { length: 255 }).notNull(),
  targetUrl: varchar("target_url", { length: 500 }),
  currentRank: int("current_rank"),
  previousRank: int("previous_rank"),
  searchVolume: int("search_volume"),
  difficulty: int("difficulty"),
  change: int("change").default(0),
  lastChecked: timestamp("last_checked"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const backlinks = mysqlTable("backlinks", {
  id: serial("id").primaryKey(),
  workOrderId: bigint("work_order_id", { mode: "number", unsigned: true }),
  clientId: bigint("client_id", { mode: "number", unsigned: true }),
  sourceUrl: varchar("source_url", { length: 500 }).notNull(),
  targetUrl: varchar("target_url", { length: 500 }).notNull(),
  anchorText: varchar("anchor_text", { length: 255 }),
  domainAuthority: int("domain_authority"),
  status: mysqlEnum("status", ["prospect", "outreach_sent", "negotiating", "live", "lost", "rejected"]).default("prospect").notNull(),
  acquiredAt: timestamp("acquired_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// ─── REPORTS ───────────────────────────────────────────────────────
export const reports = mysqlTable("reports", {
  id: serial("id").primaryKey(),
  workOrderId: bigint("work_order_id", { mode: "number", unsigned: true }),
  clientId: bigint("client_id", { mode: "number", unsigned: true }),
  title: varchar("title", { length: 255 }).notNull(),
  type: mysqlEnum("type", ["seo", "ads", "authority", "performance", "summary"]).notNull(),
  period: mysqlEnum("period", ["weekly", "monthly", "quarterly", "custom"]).default("monthly").notNull(),
  data: text("data"),
  pdfUrl: text("pdf_url"),
  generatedBy: bigint("generated_by", { mode: "number", unsigned: true }),
  sentToClient: boolean("sent_to_client").default(false),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// ─── ACTIVITY LOG (Real-time) ──────────────────────────────────────
export const activityLog = mysqlTable("activity_log", {
  id: serial("id").primaryKey(),
  userId: bigint("user_id", { mode: "number", unsigned: true }),
  type: mysqlEnum("type", ["call", "deal_closed", "payment_received", "work_order_created", "task_completed", "seo_growth", "lead_assigned", "proposal_sent", "proposal_signed"]).notNull(),
  entityType: varchar("entity_type", { length: 50 }),
  entityId: bigint("entity_id", { mode: "number", unsigned: true }),
  description: text("description").notNull(),
  metadata: text("metadata"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// ─── AUTOMATION RULES ──────────────────────────────────────────────
export const automationRules = mysqlTable("automation_rules", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  trigger: mysqlEnum("trigger", ["lead_created", "score_changed", "call_ended", "proposal_viewed", "payment_received", "status_changed", "no_activity"]).notNull(),
  condition: text("condition"),
  action: mysqlEnum("action", ["send_email", "send_sms", "assign_rep", "create_task", "alert_manager", "move_stage", "score_adjust"]).notNull(),
  actionConfig: text("action_config"),
  isActive: boolean("is_active").default(true).notNull(),
  runCount: int("run_count").default(0),
  lastRunAt: timestamp("last_run_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// ─── CONTRACTOR PAYOUTS (BGE) ──────────────────────────────────────
export const payouts = mysqlTable("payouts", {
  id: serial("id").primaryKey(),
  contractorId: bigint("contractor_id", { mode: "number", unsigned: true }).notNull(),
  dealId: bigint("deal_id", { mode: "number", unsigned: true }),
  paymentId: bigint("payment_id", { mode: "number", unsigned: true }),
  dealAmount: decimal("deal_amount", { precision: 12, scale: 2 }).notNull(),
  commissionRate: decimal("commission_rate", { precision: 5, scale: 2 }).default("30.00"),
  commissionAmount: decimal("commission_amount", { precision: 12, scale: 2 }).notNull(),
  status: mysqlEnum("status", ["pending", "approved", "paid", "disputed"]).default("pending").notNull(),
  paidAt: timestamp("paid_at"),
  paymentMethod: varchar("payment_method", { length: 50 }),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// ─── API KEYS ──────────────────────────────────────────────────────
export const apiKeys = mysqlTable("api_keys", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  keyHash: varchar("key_hash", { length: 500 }).notNull(),
  keyPrefix: varchar("key_prefix", { length: 20 }),
  permissions: text("permissions"),
  lastUsedAt: timestamp("last_used_at"),
  expiresAt: timestamp("expires_at"),
  isActive: boolean("is_active").default(true).notNull(),
  createdBy: bigint("created_by", { mode: "number", unsigned: true }),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// ─── WEBHOOKS ──────────────────────────────────────────────────────
export const webhooks = mysqlTable("webhooks", {
  id: serial("id").primaryKey(),
  url: varchar("url", { length: 500 }).notNull(),
  events: text("events"),
  secret: varchar("secret", { length: 255 }),
  status: mysqlEnum("status", ["active", "inactive"]).default("active").notNull(),
  lastDeliveryAt: timestamp("last_delivery_at"),
  lastDeliveryStatus: mysqlEnum("last_delivery_status", ["success", "failed"]),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// ─── Type Exports ──────────────────────────────────────────────────
export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;
export type Prospect = typeof prospects.$inferSelect;
export type Lead = typeof leads.$inferSelect;
export type Call = typeof calls.$inferSelect;
export type CallQueue = typeof callQueue.$inferSelect;
export type Proposal = typeof proposals.$inferSelect;
export type Payment = typeof payments.$inferSelect;
export type WorkOrder = typeof workOrders.$inferSelect;
export type Task = typeof tasks.$inferSelect;
export type Deliverable = typeof deliverables.$inferSelect;
export type Campaign = typeof campaigns.$inferSelect;
export type EmailTemplate = typeof emailTemplates.$inferSelect;
export type SeoKeyword = typeof seoKeywords.$inferSelect;
export type Backlink = typeof backlinks.$inferSelect;
export type Report = typeof reports.$inferSelect;
export type ActivityLog = typeof activityLog.$inferSelect;
export type AutomationRule = typeof automationRules.$inferSelect;
export type Payout = typeof payouts.$inferSelect;
export type ApiKey = typeof apiKeys.$inferSelect;
export type Webhook = typeof webhooks.$inferSelect;
