import { getDb } from "../api/queries/connection";
import {
  prospects, leads, proposals, workOrders, tasks,
  campaigns, emailTemplates, automationRules,
} from "./schema";

async function seed() {
  const db = getDb();
  console.log("Seeding database...");

  // Seed prospects
  await db.insert(prospects).values([
    { businessName: "Miami Auto Group", phone: "+1 (305) 555-0121", email: "mike@miamiauto.com", city: "Miami", state: "FL", industry: "Automotive", vendorSource: "web_form", googleRating: "4.5", reviewCount: 127, seoScore: 34, estimatedRevenue: "2500000", leadScore: 92, status: "hot", priority: "critical", notes: "Referred by previous client. High intent." },
    { businessName: "NYC Dental", phone: "+1 (212) 555-0198", email: "jen@nycdental.com", city: "New York", state: "NY", industry: "Dental", vendorSource: "referral", googleRating: "4.8", reviewCount: 342, seoScore: 28, estimatedRevenue: "1800000", leadScore: 88, status: "hot", priority: "high", notes: "Interested in full-stack package." },
    { businessName: "Phoenix Roofing", phone: "+1 (602) 555-0145", email: "carlos@phoenixroof.com", city: "Phoenix", state: "AZ", industry: "Construction", vendorSource: "cold_outreach", googleRating: "3.9", reviewCount: 89, seoScore: 45, estimatedRevenue: "950000", leadScore: 74, status: "warm", priority: "medium", notes: "Needs PPC + local SEO." },
    { businessName: "SF Tech Startup", phone: "+1 (415) 555-0176", email: "lisa@sftech.io", city: "San Francisco", state: "CA", industry: "Technology", vendorSource: "web_form", googleRating: "4.2", reviewCount: 56, seoScore: 22, estimatedRevenue: "5000000", leadScore: 95, status: "hot", priority: "critical", notes: "Score spiked after case study view." },
    { businessName: "Chicago Law Firm", phone: "+1 (312) 555-0134", email: "david@chicagolaw.com", city: "Chicago", state: "IL", industry: "Legal", vendorSource: "ad_campaign", googleRating: "4.6", reviewCount: 201, seoScore: 38, estimatedRevenue: "3200000", leadScore: 67, status: "warm", priority: "medium", notes: "Long sales cycle. Nurture sequence." },
    { businessName: "Dallas Realty", phone: "+1 (214) 555-0189", email: "angela@dallasrealty.com", city: "Dallas", state: "TX", industry: "Real Estate", vendorSource: "web_form", googleRating: "4.1", reviewCount: 167, seoScore: 41, estimatedRevenue: "1500000", leadScore: 81, status: "warm", priority: "high", notes: "Wants PPC + Social media." },
    { businessName: "Seattle Coffee Co", phone: "+1 (206) 555-0156", email: "robert@seattlecoffee.com", city: "Seattle", state: "WA", industry: "Food & Beverage", vendorSource: "referral", googleRating: "4.7", reviewCount: 423, seoScore: 19, estimatedRevenue: "1200000", leadScore: 90, status: "hot", priority: "high", notes: "Ready to close. Follow up tomorrow." },
    { businessName: "Austin Fitness", phone: "+1 (512) 555-0167", email: "maria@austinfit.com", city: "Austin", state: "TX", industry: "Fitness", vendorSource: "cold_outreach", googleRating: "3.8", reviewCount: 74, seoScore: 52, estimatedRevenue: "680000", leadScore: 58, status: "cold", priority: "low", notes: "Small budget, start with social." },
  ]);

  // Seed leads (qualified prospects)
  await db.insert(leads).values([
    { prospectId: 1, businessName: "Miami Auto Group", contactName: "Mike Rodriguez", phone: "+1 (305) 555-0121", email: "mike@miamiauto.com", city: "Miami", state: "FL", industry: "Automotive", vendorSource: "web_form", leadScore: 92, status: "hot", stage: "proposal_sent", estimatedValue: "8400", notes: "Referred by previous client. High intent.", tags: "SEO,Premium" },
    { prospectId: 2, businessName: "NYC Dental", contactName: "Dr. Jennifer Walsh", phone: "+1 (212) 555-0198", email: "jen@nycdental.com", city: "New York", state: "NY", industry: "Dental", vendorSource: "referral", leadScore: 88, status: "hot", stage: "interested", estimatedValue: "12200", notes: "Interested in full-stack package.", tags: "Full Stack" },
    { prospectId: 3, businessName: "Phoenix Roofing", contactName: "Carlos Mendez", phone: "+1 (602) 555-0145", email: "carlos@phoenixroof.com", city: "Phoenix", state: "AZ", industry: "Construction", vendorSource: "cold_outreach", leadScore: 74, status: "warm", stage: "contacted", estimatedValue: "5600", notes: "Needs PPC + local SEO.", tags: "PPC" },
    { prospectId: 4, businessName: "SF Tech Startup", contactName: "Lisa Chen", phone: "+1 (415) 555-0176", email: "lisa@sftech.io", city: "San Francisco", state: "CA", industry: "Technology", vendorSource: "web_form", leadScore: 95, status: "hot", stage: "negotiation", estimatedValue: "15000", notes: "Score spiked after case study view.", tags: "SEO,Web Design" },
    { prospectId: 5, businessName: "Chicago Law Firm", contactName: "David Park", phone: "+1 (312) 555-0134", email: "david@chicagolaw.com", city: "Chicago", state: "IL", industry: "Legal", vendorSource: "ad_campaign", leadScore: 67, status: "warm", stage: "new", estimatedValue: "9200", notes: "Long sales cycle. Nurture sequence.", tags: "SEO" },
    { prospectId: 6, businessName: "Dallas Realty", contactName: "Angela Torres", phone: "+1 (214) 555-0189", email: "angela@dallasrealty.com", city: "Dallas", state: "TX", industry: "Real Estate", vendorSource: "web_form", leadScore: 81, status: "warm", stage: "contacted", estimatedValue: "6800", notes: "Wants PPC + Social media.", tags: "PPC,Social" },
    { prospectId: 7, businessName: "Seattle Coffee Co", contactName: "Robert Kim", phone: "+1 (206) 555-0156", email: "robert@seattlecoffee.com", city: "Seattle", state: "WA", industry: "Food & Beverage", vendorSource: "referral", leadScore: 90, status: "hot", stage: "proposal_sent", estimatedValue: "10500", notes: "Ready to close. Follow up tomorrow.", tags: "Full Stack" },
    { prospectId: 8, businessName: "Austin Fitness", contactName: "Maria Gonzalez", phone: "+1 (512) 555-0167", email: "maria@austinfit.com", city: "Austin", state: "TX", industry: "Fitness", vendorSource: "cold_outreach", leadScore: 58, status: "cold", stage: "new", estimatedValue: "4200", notes: "Small budget, start with social.", tags: "SEO" },
  ]);

  // Seed proposals
  await db.insert(proposals).values([
    { leadId: 1, clientName: "Miami Auto Group", clientEmail: "mike@miamiauto.com", services: "SEO Premium Package - Local SEO, Content Strategy, Technical Audit", subtotal: "8400", discountPercent: 0, tax: "0", total: "8400", status: "sent", viewCount: 12, createdBy: 1 },
    { leadId: 2, clientName: "NYC Dental", clientEmail: "jen@nycdental.com", services: "Full Stack Marketing - SEO, PPC, Social, Content", subtotal: "12200", discountPercent: 10, discountAmount: "1220", tax: "0", total: "10980", status: "viewed", viewCount: 8, createdBy: 1 },
    { leadId: 3, clientName: "Phoenix Roofing", clientEmail: "carlos@phoenixroof.com", services: "PPC Management - Google Ads, Landing Pages", subtotal: "5600", discountPercent: 0, tax: "0", total: "5600", status: "signed", viewCount: 15, signedAt: new Date(), signedBy: "Carlos Mendez", createdBy: 1 },
    { leadId: 4, clientName: "SF Tech Startup", clientEmail: "lisa@sftech.io", services: "Web Design + SEO - Full redesign, technical SEO, content", subtotal: "15000", discountPercent: 5, discountAmount: "750", tax: "0", total: "14250", status: "draft", viewCount: 0, createdBy: 1 },
    { leadId: 7, clientName: "Seattle Coffee Co", clientEmail: "robert@seattlecoffee.com", services: "Full Stack - Branding, Web, SEO, Social, PPC", subtotal: "10500", discountPercent: 0, tax: "0", total: "10500", status: "sent", viewCount: 3, createdBy: 1 },
  ]);

  // Seed work orders
  await db.insert(workOrders).values([
    { proposalId: 3, leadId: 3, paymentId: 1, clientName: "Phoenix Roofing", serviceType: "ppc", title: "PPC Campaign Setup", description: "Google Ads account setup, keyword research, ad creation", priority: "high", status: "in_progress", assignedTeam: "ads", progress: 45, slaHours: 72, amount: "5600", dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) },
    { leadId: 1, clientName: "Miami Auto Group", serviceType: "seo", title: "SEO Premium Implementation", description: "Technical audit, content strategy, local SEO optimization", priority: "urgent", status: "ready", assignedTeam: "seo", progress: 0, slaHours: 120, amount: "8400", dueDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000) },
    { leadId: 4, clientName: "SF Tech Startup", serviceType: "web_design", title: "Website Redesign", description: "Full website redesign with modern UI/UX", priority: "high", status: "pending_validation", assignedTeam: "dev", progress: 0, slaHours: 240, amount: "14250", dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) },
    { leadId: 7, clientName: "Seattle Coffee Co", serviceType: "full_stack", title: "Full Marketing Stack", description: "Branding, website, SEO, social media, PPC", priority: "normal", status: "hold_3day", assignedTeam: "seo", progress: 0, slaHours: 360, amount: "10500", dueDate: new Date(Date.now() + 45 * 24 * 60 * 60 * 1000) },
  ]);

  // Seed tasks
  await db.insert(tasks).values([
    { workOrderId: 1, title: "Google Ads Account Setup", description: "Create and configure Google Ads account", status: "done", priority: "high", assignedTo: 1 },
    { workOrderId: 1, title: "Keyword Research", description: "Research and select target keywords", status: "in_progress", priority: "high", assignedTo: 1 },
    { workOrderId: 1, title: "Ad Copy Creation", description: "Write compelling ad copy for all campaigns", status: "todo", priority: "normal", assignedTo: 1 },
    { workOrderId: 1, title: "Landing Page Setup", description: "Create conversion-optimized landing pages", status: "todo", priority: "high", assignedTo: 1 },
    { workOrderId: 2, title: "Technical SEO Audit", description: "Complete technical SEO audit of website", status: "todo", priority: "urgent", assignedTo: 2 },
    { workOrderId: 2, title: "Content Strategy", description: "Develop content calendar and strategy", status: "todo", priority: "high", assignedTo: 2 },
    { workOrderId: 3, title: "Design Mockups", description: "Create Figma design mockups for all pages", status: "todo", priority: "high", assignedTo: 3 },
  ]);

  // Seed email templates
  await db.insert(emailTemplates).values([
    { name: "Initial Outreach", type: "cold_outreach", subject: "Helping {{business_name}} get more customers", body: "Hi {{contact_name}},\n\nI noticed {{business_name}} could benefit from better online visibility. We help businesses like yours get found by more customers through SEO and digital marketing.\n\nWould you be open to a brief 10-minute call to explore how we can help?\n\nBest,\nSTARZ-OS Team", isDefault: true },
    { name: "Follow-Up", type: "follow_up", subject: "Quick follow-up", body: "Hi {{contact_name}},\n\nJust following up on my previous email. I'd love to show you how we've helped similar businesses increase their online presence.\n\nAre you available for a quick call this week?\n\nBest,\nSTARZ-OS Team", isDefault: true },
    { name: "Proposal Reminder", type: "proposal_reminder", subject: "Your proposal is ready", body: "Hi {{contact_name}},\n\nYour customized proposal for {{business_name}} is ready for review. We've put together a package that we believe will deliver great results.\n\nYou can view and sign it here: {{proposal_link}}\n\nLet me know if you have any questions!\n\nBest,\nSTARZ-OS Team", isDefault: true },
  ]);

  // Seed campaigns
  await db.insert(campaigns).values([
    { name: "July Cold Outreach", type: "cold_outreach", status: "running", templateId: 1, subject: "Helping your business grow", fromName: "STARZ-OS", fromEmail: "team@starz-os.com", recipientCount: 250, sentCount: 120, openCount: 45, replyCount: 8, positiveReplyCount: 3, dailyLimit: 50, createdBy: 1 },
    { name: "Follow-Up Sequence", type: "follow_up", status: "running", templateId: 2, subject: "Quick follow-up", fromName: "STARZ-OS", fromEmail: "team@starz-os.com", recipientCount: 80, sentCount: 80, openCount: 32, replyCount: 6, positiveReplyCount: 2, dailyLimit: 30, createdBy: 1 },
    { name: "Proposal Push", type: "proposal_reminder", status: "scheduled", templateId: 3, subject: "Your proposal is waiting", fromName: "STARZ-OS", fromEmail: "team@starz-os.com", recipientCount: 15, dailyLimit: 10, createdBy: 1 },
  ]);

  // Seed automation rules
  await db.insert(automationRules).values([
    { name: "Hot Lead Alert", trigger: "score_changed", condition: "lead_score > 85", action: "alert_manager", actionConfig: '{"channels":["email","sms"]}', isActive: true, runCount: 47 },
    { name: "Proposal Follow-Up", trigger: "proposal_viewed", condition: "view_count >= 3", action: "send_email", actionConfig: '{"template":"discount_offer"}', isActive: true, runCount: 23 },
    { name: "No Activity Warning", trigger: "no_activity", condition: "hours_since_last_touch > 48", action: "alert_manager", actionConfig: '{"escalate":true}', isActive: true, runCount: 12 },
    { name: "Auto-Assign Leads", trigger: "lead_created", condition: "status = new", action: "assign_rep", actionConfig: '{"method":"round_robin"}', isActive: true, runCount: 89 },
    { name: "Payment Failed", trigger: "status_changed", condition: "payment_status = failed", action: "send_email", actionConfig: '{"template":"payment_retry"}', isActive: true, runCount: 8 },
    { name: "Contractor Payout", trigger: "status_changed", condition: "deal_status = closed_won", action: "create_task", actionConfig: '{"type":"payout_calculation"}', isActive: true, runCount: 34 },
  ]);

  console.log("Database seeded successfully!");
}

seed().catch(console.error);
