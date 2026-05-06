-- ═══════════════════════════════════════════════════════════════════════
-- STARZ-OS Seed Data
-- ═══════════════════════════════════════════════════════════════════════

-- Seed prospects
INSERT INTO prospects (business_name, phone, email, website, city, state, industry, vendor_source, google_rating, review_count, seo_score, estimated_revenue, lead_score, status, priority, notes, tags) VALUES
('Miami Auto Group', '+1 (305) 555-0121', 'mike@miamiauto.com', 'miamiauto.com', 'Miami', 'FL', 'Automotive', 'web_form', 4.5, 127, 34, 2500000, 92, 'hot', 'critical', 'Referred by previous client. High intent.', 'SEO,Premium'),
('NYC Dental', '+1 (212) 555-0198', 'jen@nycdental.com', 'nycdental.com', 'New York', 'NY', 'Dental', 'referral', 4.8, 342, 28, 1800000, 88, 'hot', 'high', 'Interested in full-stack package.', 'Full Stack'),
('Phoenix Roofing', '+1 (602) 555-0145', 'carlos@phoenixroof.com', 'phoenixroof.com', 'Phoenix', 'AZ', 'Construction', 'cold_outreach', 3.9, 89, 45, 950000, 74, 'warm', 'medium', 'Needs PPC + local SEO.', 'PPC'),
('SF Tech Startup', '+1 (415) 555-0176', 'lisa@sftech.io', 'sftech.io', 'San Francisco', 'CA', 'Technology', 'web_form', 4.2, 56, 22, 5000000, 95, 'hot', 'critical', 'Score spiked after case study view.', 'SEO,Web Design'),
('Chicago Law Firm', '+1 (312) 555-0134', 'david@chicagolaw.com', 'chicagolaw.com', 'Chicago', 'IL', 'Legal', 'ad_campaign', 4.6, 201, 38, 3200000, 67, 'warm', 'medium', 'Long sales cycle. Nurture sequence.', 'SEO'),
('Dallas Realty', '+1 (214) 555-0189', 'angela@dallasrealty.com', 'dallasrealty.com', 'Dallas', 'TX', 'Real Estate', 'web_form', 4.1, 167, 41, 1500000, 81, 'warm', 'high', 'Wants PPC + Social media.', 'PPC,Social'),
('Seattle Coffee Co', '+1 (206) 555-0156', 'robert@seattlecoffee.com', 'seattlecoffee.com', 'Seattle', 'WA', 'Food & Beverage', 'referral', 4.7, 423, 19, 1200000, 90, 'hot', 'high', 'Ready to close. Follow up tomorrow.', 'Full Stack'),
('Austin Fitness', '+1 (512) 555-0167', 'maria@austinfit.com', 'austinfit.com', 'Austin', 'TX', 'Fitness', 'cold_outreach', 3.8, 74, 52, 680000, 58, 'cold', 'low', 'Small budget, start with social.', 'SEO');

-- Seed leads
INSERT INTO leads (prospect_id, business_name, contact_name, phone, email, city, state, industry, vendor_source, lead_score, status, stage, estimated_value, notes, tags) VALUES
((SELECT id FROM prospects WHERE business_name = 'Miami Auto Group'), 'Miami Auto Group', 'Mike Rodriguez', '+1 (305) 555-0121', 'mike@miamiauto.com', 'Miami', 'FL', 'Automotive', 'web_form', 92, 'hot', 'proposal_sent', 8400, 'Referred by previous client. High intent.', 'SEO,Premium'),
((SELECT id FROM prospects WHERE business_name = 'NYC Dental'), 'NYC Dental', 'Dr. Jennifer Walsh', '+1 (212) 555-0198', 'jen@nycdental.com', 'New York', 'NY', 'Dental', 'referral', 88, 'hot', 'interested', 12200, 'Interested in full-stack package.', 'Full Stack'),
((SELECT id FROM prospects WHERE business_name = 'Phoenix Roofing'), 'Phoenix Roofing', 'Carlos Mendez', '+1 (602) 555-0145', 'carlos@phoenixroof.com', 'Phoenix', 'AZ', 'Construction', 'cold_outreach', 74, 'warm', 'contacted', 5600, 'Needs PPC + local SEO.', 'PPC'),
((SELECT id FROM prospects WHERE business_name = 'SF Tech Startup'), 'SF Tech Startup', 'Lisa Chen', '+1 (415) 555-0176', 'lisa@sftech.io', 'San Francisco', 'CA', 'Technology', 'web_form', 95, 'hot', 'negotiation', 15000, 'Score spiked after case study view.', 'SEO,Web Design'),
((SELECT id FROM prospects WHERE business_name = 'Chicago Law Firm'), 'Chicago Law Firm', 'David Park', '+1 (312) 555-0134', 'david@chicagolaw.com', 'Chicago', 'IL', 'Legal', 'ad_campaign', 67, 'warm', 'new', 9200, 'Long sales cycle. Nurture sequence.', 'SEO'),
((SELECT id FROM prospects WHERE business_name = 'Dallas Realty'), 'Dallas Realty', 'Angela Torres', '+1 (214) 555-0189', 'angela@dallasrealty.com', 'Dallas', 'TX', 'Real Estate', 'web_form', 81, 'warm', 'contacted', 6800, 'Wants PPC + Social media.', 'PPC,Social'),
((SELECT id FROM prospects WHERE business_name = 'Seattle Coffee Co'), 'Seattle Coffee Co', 'Robert Kim', '+1 (206) 555-0156', 'robert@seattlecoffee.com', 'Seattle', 'WA', 'Food & Beverage', 'referral', 90, 'hot', 'proposal_sent', 10500, 'Ready to close. Follow up tomorrow.', 'Full Stack'),
((SELECT id FROM prospects WHERE business_name = 'Austin Fitness'), 'Austin Fitness', 'Maria Gonzalez', '+1 (512) 555-0167', 'maria@austinfit.com', 'Austin', 'TX', 'Fitness', 'cold_outreach', 58, 'cold', 'new', 4200, 'Small budget, start with social.', 'SEO');

-- Seed proposals
INSERT INTO proposals (lead_id, client_name, client_email, services, subtotal, discount_percent, discount_amount, tax, total, status, view_count, created_by, expires_at) VALUES
((SELECT id FROM leads WHERE business_name = 'Miami Auto Group'), 'Miami Auto Group', 'mike@miamiauto.com', 'SEO Premium Package - Local SEO, Content Strategy, Technical Audit', 8400, 0, 0, 0, 8400, 'sent', 12, null, NOW() + INTERVAL '7 days'),
((SELECT id FROM leads WHERE business_name = 'NYC Dental'), 'NYC Dental', 'jen@nycdental.com', 'Full Stack Marketing - SEO, PPC, Social, Content', 12200, 10, 1220, 0, 10980, 'viewed', 8, null, NOW() + INTERVAL '14 days'),
((SELECT id FROM leads WHERE business_name = 'Phoenix Roofing'), 'Phoenix Roofing', 'carlos@phoenixroof.com', 'PPC Management - Google Ads, Landing Pages', 5600, 0, 0, 0, 5600, 'signed', 15, null, NOW() + INTERVAL '30 days'),
((SELECT id FROM leads WHERE business_name = 'SF Tech Startup'), 'SF Tech Startup', 'lisa@sftech.io', 'Web Design + SEO - Full redesign, technical SEO, content', 15000, 5, 750, 0, 14250, 'draft', 0, null, NOW() + INTERVAL '30 days'),
((SELECT id FROM leads WHERE business_name = 'Seattle Coffee Co'), 'Seattle Coffee Co', 'robert@seattlecoffee.com', 'Full Stack - Branding, Web, SEO, Social, PPC', 10500, 0, 0, 0, 10500, 'sent', 3, null, NOW() + INTERVAL '14 days');

-- Seed work orders
INSERT INTO work_orders (proposal_id, lead_id, client_name, service_type, title, description, priority, status, assigned_team, progress, sla_hours, amount, due_date) VALUES
((SELECT id FROM proposals WHERE client_name = 'Phoenix Roofing'), (SELECT id FROM leads WHERE business_name = 'Phoenix Roofing'), 'Phoenix Roofing', 'ppc', 'PPC Campaign Setup', 'Google Ads account setup, keyword research, ad creation', 'high', 'in_progress', 'ads', 45, 72, 5600, NOW() + INTERVAL '7 days'),
((SELECT id FROM leads WHERE business_name = 'Miami Auto Group'), null, 'Miami Auto Group', 'seo', 'SEO Premium Implementation', 'Technical audit, content strategy, local SEO optimization', 'urgent', 'ready', 'seo', 0, 120, 8400, NOW() + INTERVAL '14 days'),
((SELECT id FROM leads WHERE business_name = 'SF Tech Startup'), null, 'SF Tech Startup', 'web_design', 'Website Redesign', 'Full website redesign with modern UI/UX', 'high', 'pending_validation', 'dev', 0, 240, 14250, NOW() + INTERVAL '30 days'),
((SELECT id FROM leads WHERE business_name = 'Seattle Coffee Co'), null, 'Seattle Coffee Co', 'full_stack', 'Full Marketing Stack', 'Branding, website, SEO, social media, PPC', 'normal', 'hold_3day', 'seo', 0, 360, 10500, NOW() + INTERVAL '45 days');

-- Seed tasks
INSERT INTO tasks (work_order_id, title, description, status, priority) VALUES
((SELECT id FROM work_orders WHERE title = 'PPC Campaign Setup'), 'Google Ads Account Setup', 'Create and configure Google Ads account', 'done', 'high'),
((SELECT id FROM work_orders WHERE title = 'PPC Campaign Setup'), 'Keyword Research', 'Research and select target keywords', 'in_progress', 'high'),
((SELECT id FROM work_orders WHERE title = 'PPC Campaign Setup'), 'Ad Copy Creation', 'Write compelling ad copy for all campaigns', 'todo', 'normal'),
((SELECT id FROM work_orders WHERE title = 'PPC Campaign Setup'), 'Landing Page Setup', 'Create conversion-optimized landing pages', 'todo', 'high'),
((SELECT id FROM work_orders WHERE title = 'SEO Premium Implementation'), 'Technical SEO Audit', 'Complete technical SEO audit of website', 'todo', 'urgent'),
((SELECT id FROM work_orders WHERE title = 'SEO Premium Implementation'), 'Content Strategy', 'Develop content calendar and strategy', 'todo', 'high'),
((SELECT id FROM work_orders WHERE title = 'Website Redesign'), 'Design Mockups', 'Create Figma design mockups for all pages', 'todo', 'high');

-- Seed email templates
INSERT INTO email_templates (name, type, subject, body, variables, is_default) VALUES
('Initial Outreach', 'cold_outreach', 'Helping {{business_name}} get more customers', 'Hi {{contact_name}},\n\nI noticed {{business_name}} could benefit from better online visibility. We help businesses like yours get found by more customers through SEO and digital marketing.\n\nWould you be open to a brief 10-minute call to explore how we can help?\n\nBest,\nSTARZ-OS Team', 'business_name,contact_name', true),
('Follow-Up', 'follow_up', 'Quick follow-up', 'Hi {{contact_name}},\n\nJust following up on my previous email. I''d love to show you how we''ve helped similar businesses increase their online presence.\n\nAre you available for a quick call this week?\n\nBest,\nSTARZ-OS Team', 'contact_name', true),
('Proposal Reminder', 'proposal_reminder', 'Your proposal is ready', 'Hi {{contact_name}},\n\nYour customized proposal for {{business_name}} is ready for review. We''ve put together a package that we believe will deliver great results.\n\nYou can view and sign it here: {{proposal_link}}\n\nLet me know if you have any questions!\n\nBest,\nSTARZ-OS Team', 'contact_name,business_name,proposal_link', true);

-- Seed campaigns
INSERT INTO campaigns (name, type, status, template_id, subject, from_name, from_email, recipient_count, sent_count, open_count, reply_count, positive_reply_count, daily_limit) VALUES
('July Cold Outreach', 'cold_outreach', 'running', (SELECT id FROM email_templates WHERE name = 'Initial Outreach'), 'Helping your business grow', 'STARZ-OS', 'team@starz-os.com', 250, 120, 45, 8, 3, 50),
('Follow-Up Sequence', 'follow_up', 'running', (SELECT id FROM email_templates WHERE name = 'Follow-Up'), 'Quick follow-up', 'STARZ-OS', 'team@starz-os.com', 80, 80, 32, 6, 2, 30),
('Proposal Push', 'proposal_reminder', 'scheduled', (SELECT id FROM email_templates WHERE name = 'Proposal Reminder'), 'Your proposal is waiting', 'STARZ-OS', 'team@starz-os.com', 15, 0, 0, 0, 0, 10);

-- Seed automation rules
INSERT INTO automation_rules (name, trigger, condition, action, action_config, is_active, run_count) VALUES
('Hot Lead Alert', 'score_changed', 'lead_score > 85', 'alert_manager', '{"channels":["email","sms"]}', true, 47),
('Proposal Follow-Up', 'proposal_viewed', 'view_count >= 3', 'send_email', '{"template":"discount_offer"}', true, 23),
('No Activity Warning', 'no_activity', 'hours_since_last_touch > 48', 'alert_manager', '{"escalate":true}', true, 12),
('Auto-Assign Leads', 'lead_created', 'status = new', 'assign_rep', '{"method":"round_robin"}', true, 89),
('Payment Failed', 'status_changed', 'payment_status = failed', 'send_email', '{"template":"payment_retry"}', true, 8),
('Contractor Payout', 'status_changed', 'deal_status = closed_won', 'create_task', '{"type":"payout_calculation"}', true, 34);

-- Seed victory feed
INSERT INTO sales_victory_feed (rep_name, rep_role, sale_amount, client_name, city, state, service, tier, org_id) VALUES
('Sarah Chen', 'Senior Closer', 15000, 'SF Tech Startup', 'San Francisco', 'CA', 'web_design', 'enterprise', 'default'),
('Elena Rossi', 'Sales Manager', 12200, 'NYC Dental', 'New York', 'NY', 'full_stack', 'enterprise', 'default'),
('DJ Martinez', 'Business Growth Expert', 8400, 'Miami Auto Group', 'Miami', 'FL', 'seo', 'medium', 'default'),
('Mike Williams', 'Sales Contractor', 7500, 'Williams Plumbing LLC', 'Houston', 'TX', 'seo', 'medium', 'default'),
('Marcus Webb', 'Sales Rep', 5600, 'Phoenix Roofing', 'Phoenix', 'AZ', 'ppc', 'small', 'default');
