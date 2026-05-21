// features/sentinel/data/queries.ts
// Sentinel Command Center — Supabase browser client query layer
// All queries hit security schema with admin-only RLS policies.
// Browser client uses authenticated user JWT — no service role.

import { supabaseBrowser } from "@/lib/supabase/browser";

// ── SHARED FILTER TYPE ────────────────────────────────────────────────────────

export interface SentinelFilters {
  tenant_id?: string;
  severity?: string;
  status?: string;
  entity_type?: string;
  agent_name?: string;
  date_from?: string;
  date_to?: string;
}

// ── THREAT CENTER ─────────────────────────────────────────────────────────────
// Used by: ThreatCenterTab
// Tables: sentinel_incidents, sentinel_scan_runs, sentinel_entity_risk_state,
//         sentinel_correlation_runs, sentinel_threat_classifications

export async function getThreatCenter(filters?: SentinelFilters) {
  const supabase = supabaseBrowser();

  let incidentQuery = supabase
    .schema("security")
    .from("sentinel_incidents")
    .select("id, incident_key, title, severity, threat_score, confidence, status, tenant_id, detected_at, updated_at, source, created_by")
    .order("detected_at", { ascending: false })
    .limit(50);

  if (filters?.severity)  incidentQuery = incidentQuery.eq("severity", filters.severity);
  if (filters?.status)    incidentQuery = incidentQuery.eq("status", filters.status);
  if (filters?.tenant_id) incidentQuery = incidentQuery.eq("tenant_id", filters.tenant_id);
  if (filters?.date_from) incidentQuery = incidentQuery.gte("detected_at", filters.date_from);
  if (filters?.date_to)   incidentQuery = incidentQuery.lte("detected_at", filters.date_to);

  const [
    { data: incidents, error: incErr },
    { data: scanRuns, error: scanErr },
    { data: entities, error: entErr },
    { data: correlationRuns, error: corrErr },
  ] = await Promise.all([
    incidentQuery,
    supabase
      .schema("security")
      .from("sentinel_scan_runs")
      .select("id, run_key, action, status, started_at, finished_at, summary")
      .order("started_at", { ascending: false })
      .limit(20),
    supabase
      .schema("security")
      .from("sentinel_entity_risk_state")
      .select("entity_type, entity_id, tenant_id, current_score, score_band, factors, last_scored_at, updated_at")
      .order("current_score", { ascending: false })
      .limit(25),
    supabase
      .schema("security")
      .from("sentinel_correlation_runs")
      .select("id, run_key, status, rules_evaluated, chains_built, incidents_updated, anomalies_detected, abuse_patterns_matched, duration_ms, started_at, finished_at")
      .order("started_at", { ascending: false })
      .limit(10),
  ]);

  if (incErr)  throw new Error(`getThreatCenter incidents: ${incErr.message}`);
  if (scanErr) throw new Error(`getThreatCenter scanRuns: ${scanErr.message}`);
  if (entErr)  throw new Error(`getThreatCenter entities: ${entErr.message}`);
  if (corrErr) throw new Error(`getThreatCenter correlationRuns: ${corrErr.message}`);

  return { incidents, scanRuns, entities, correlationRuns };
}

// ── INCIDENT DETAIL ───────────────────────────────────────────────────────────
// Used by: IncidentViewerTab
// Tables: sentinel_incidents, sentinel_incident_timeline, sentinel_attack_chains,
//         sentinel_threat_narratives, sentinel_threat_classifications

export async function getIncidentDetail(incidentId: string) {
  const supabase = supabaseBrowser();

  const [
    { data: incident, error: incErr },
    { data: timeline, error: tlErr },
    { data: chains, error: chainErr },
    { data: narrative, error: narErr },
    { data: classification, error: classErr },
  ] = await Promise.all([
    supabase
      .schema("security")
      .from("sentinel_incidents")
      .select("*")
      .eq("id", incidentId)
      .single(),
    supabase
      .schema("security")
      .from("sentinel_incident_timeline")
      .select("id, event_type, event_source, actor_type, actor_id, event_payload, created_at")
      .eq("incident_id", incidentId)
      .order("created_at", { ascending: true }),
    supabase
      .schema("security")
      .from("sentinel_attack_chains")
      .select("id, chain_key, signal_chain, entities, attack_vector, inferred_objective, confidence, correlation_rule_key, severity, created_at")
      .eq("incident_id", incidentId)
      .order("created_at", { ascending: true }),
    // maybeSingle: engine upserts one narrative per incident
    supabase
      .schema("security")
      .from("sentinel_threat_narratives")
      .select("id, summary, recommended_response, human_readable_explanation, suspected_attack_chain, affected_entities, confidence_score, created_at")
      .eq("incident_id", incidentId)
      .maybeSingle(),
    supabase
      .schema("security")
      .from("sentinel_threat_classifications")
      .select("id, owasp_category, mitre_tactic, mitre_technique, starz_os_domain, risk_band, recommended_response_mode, final_composite_score, classified_at")
      .eq("incident_id", incidentId)
      .order("classified_at", { ascending: false })
      .limit(1)
      .maybeSingle(),
  ]);

  if (incErr)   throw new Error(`getIncidentDetail incident: ${incErr.message}`);
  if (tlErr)    throw new Error(`getIncidentDetail timeline: ${tlErr.message}`);
  if (chainErr) throw new Error(`getIncidentDetail chains: ${chainErr.message}`);
  if (narErr)   throw new Error(`getIncidentDetail narrative: ${narErr.message}`);
  if (classErr) throw new Error(`getIncidentDetail classification: ${classErr.message}`);

  return { incident, timeline, chains, narrative, classification };
}

// ── AI DEFENSE ────────────────────────────────────────────────────────────────
// Used by: AIDefenseTab
// Tables: sentinel_ai_abuse_incidents, sentinel_agent_abuse_patterns,
//         sentinel_threat_memory

export async function getAIDefense(filters?: Pick<SentinelFilters, "agent_name" | "date_from" | "date_to">) {
  const supabase = supabaseBrowser();

  let abuseQuery = supabase
    .schema("security")
    .from("sentinel_ai_abuse_incidents")
    .select("id, incident_id, pattern_key, agent_name, abuse_type, abuse_narrative, threat_class, risk_score, recommended_response_mode, matched_signals, created_at")
    .order("created_at", { ascending: false })
    .limit(100);

  if (filters?.agent_name) abuseQuery = abuseQuery.eq("agent_name", filters.agent_name);
  if (filters?.date_from)  abuseQuery = abuseQuery.gte("created_at", filters.date_from);
  if (filters?.date_to)    abuseQuery = abuseQuery.lte("created_at", filters.date_to);

  const [
    { data: abuseIncidents, error: abuseErr },
    { data: patterns, error: patErr },
    { data: memory, error: memErr },
  ] = await Promise.all([
    abuseQuery,
    supabase
      .schema("security")
      .from("sentinel_agent_abuse_patterns")
      .select("pattern_key, agent_name, abuse_type, risk_score, match_patterns, mitigation_hint, enabled, updated_at")
      .eq("enabled", true)
      .order("risk_score", { ascending: false }),
    supabase
      .schema("security")
      .from("sentinel_threat_memory")
      .select("memory_key, pattern_type, pattern_signature, times_seen, false_positive_count, confirmed_incident_count, confidence_score, last_seen_at")
      .order("times_seen", { ascending: false })
      .limit(50),
  ]);

  if (abuseErr) throw new Error(`getAIDefense abuse: ${abuseErr.message}`);
  if (patErr)   throw new Error(`getAIDefense patterns: ${patErr.message}`);
  if (memErr)   throw new Error(`getAIDefense memory: ${memErr.message}`);

  return { abuseIncidents, patterns, memory };
}

// ── HEATMAP ───────────────────────────────────────────────────────────────────
// Used by: HeatmapTab
// Tables: sentinel_threat_classifications, sentinel_anomaly_reports,
//         sentinel_entity_risk_state

export async function getHeatmapData(filters?: Pick<SentinelFilters, "tenant_id" | "date_from" | "date_to">) {
  const supabase = supabaseBrowser();

  let classQuery = supabase
    .schema("security")
    .from("sentinel_threat_classifications")
    .select("id, incident_id, owasp_category, mitre_tactic, mitre_technique, starz_os_domain, risk_band, recommended_response_mode, final_composite_score, classified_at")
    .order("final_composite_score", { ascending: false })
    .limit(200);

  let anomalyQuery = supabase
    .schema("security")
    .from("sentinel_anomaly_reports")
    .select("id, entity_type, entity_id, tenant_id, anomaly_type, severity, deviation_magnitude, explanation, created_at")
    .order("deviation_magnitude", { ascending: false })
    .limit(100);

  if (filters?.tenant_id) {
    anomalyQuery = anomalyQuery.eq("tenant_id", filters.tenant_id);
  }
  if (filters?.date_from) {
    classQuery   = classQuery.gte("classified_at", filters.date_from);
    anomalyQuery = anomalyQuery.gte("created_at", filters.date_from);
  }
  if (filters?.date_to) {
    classQuery   = classQuery.lte("classified_at", filters.date_to);
    anomalyQuery = anomalyQuery.lte("created_at", filters.date_to);
  }

  const [
    { data: classifications, error: classErr },
    { data: anomalies, error: anomErr },
    { data: entityRisk, error: entErr },
  ] = await Promise.all([
    classQuery,
    anomalyQuery,
    supabase
      .schema("security")
      .from("sentinel_entity_risk_state")
      .select("entity_type, entity_id, tenant_id, current_score, score_band, last_scored_at")
      .order("current_score", { ascending: false })
      .limit(100),
  ]);

  if (classErr) throw new Error(`getHeatmapData classifications: ${classErr.message}`);
  if (anomErr)  throw new Error(`getHeatmapData anomalies: ${anomErr.message}`);
  if (entErr)   throw new Error(`getHeatmapData entityRisk: ${entErr.message}`);

  return { classifications, anomalies, entityRisk };
}

// ── PLAYBOOK CONSOLE ──────────────────────────────────────────────────────────
// Used by: PlaybookConsoleTab
// Tables: sentinel_playbooks, sentinel_playbook_runs, sentinel_mitigation_actions

export async function getPlaybookConsole() {
  const supabase = supabaseBrowser();

  const [
    { data: playbooks, error: pbErr },
    { data: runs, error: runErr },
    { data: actions, error: actErr },
  ] = await Promise.all([
    supabase
      .schema("security")
      .from("sentinel_playbooks")
      .select("playbook_key, title, enabled, requires_approval, max_actions_per_run, updated_at")
      .order("updated_at", { ascending: false }),
    supabase
      .schema("security")
      .from("sentinel_playbook_runs")
      // sentinel_playbook_runs uses requested_at, not created_at
      .select("id, run_key, playbook_key, incident_id, tenant_id, status, mode, requested_by, idempotency_key, result_payload, requested_at, finished_at")
      .order("requested_at", { ascending: false })
      .limit(100),
    supabase
      .schema("security")
      .from("sentinel_mitigation_actions")
      .select("id, incident_id, action, target_type, target_id, status, reversible, requested_by, requested_at, executed_at, result_payload")
      .order("requested_at", { ascending: false })
      .limit(100),
  ]);

  if (pbErr)  throw new Error(`getPlaybookConsole playbooks: ${pbErr.message}`);
  if (runErr) throw new Error(`getPlaybookConsole runs: ${runErr.message}`);
  if (actErr) throw new Error(`getPlaybookConsole actions: ${actErr.message}`);

  return { playbooks, runs, actions };
}

// ── LOCKDOWN CENTER ───────────────────────────────────────────────────────────
// Used by: LockdownCenterTab
// Tables: sentinel_lockdown_events, sentinel_quarantines

export async function getLockdownState(filters?: Pick<SentinelFilters, "tenant_id">) {
  const supabase = supabaseBrowser();

  let lockdownQuery = supabase
    .schema("security")
    .from("sentinel_lockdown_events")
    .select("id, lockdown_key, incident_id, tenant_id, scope, state, reason, enforced_by, metadata, created_at, released_at")
    .order("created_at", { ascending: false })
    .limit(100);

  let quarantineQuery = supabase
    .schema("security")
    .from("sentinel_quarantines")
    .select("id, quarantine_key, incident_id, playbook_run_id, tenant_id, target_type, target_id, state, reason, reversible, ttl_seconds, expires_at, metadata, created_at, released_at")
    .order("created_at", { ascending: false })
    .limit(200);

  if (filters?.tenant_id) {
    lockdownQuery   = lockdownQuery.eq("tenant_id", filters.tenant_id);
    quarantineQuery = quarantineQuery.eq("tenant_id", filters.tenant_id);
  }

  const [
    { data: lockdowns, error: lockErr },
    { data: quarantines, error: quarErr },
  ] = await Promise.all([lockdownQuery, quarantineQuery]);

  if (lockErr) throw new Error(`getLockdownState lockdowns: ${lockErr.message}`);
  if (quarErr) throw new Error(`getLockdownState quarantines: ${quarErr.message}`);

  return { lockdowns, quarantines };
}

// ── ATTACK CHAIN DETAIL ───────────────────────────────────────────────────────
// Used by: AttackChainTab (standalone chain fetch without full incident context)

export async function getAttackChains(filters?: Pick<SentinelFilters, "severity" | "date_from" | "date_to">) {
  const supabase = supabaseBrowser();

  let query = supabase
    .schema("security")
    .from("sentinel_attack_chains")
    .select("id, incident_id, chain_key, signal_chain, entities, attack_vector, inferred_objective, confidence, correlation_rule_key, severity, created_at, updated_at")
    .order("confidence", { ascending: false })
    .limit(50);

  if (filters?.severity)  query = query.eq("severity", filters.severity);
  if (filters?.date_from) query = query.gte("created_at", filters.date_from);
  if (filters?.date_to)   query = query.lte("created_at", filters.date_to);

  const { data, error } = await query;
  if (error) throw new Error(`getAttackChains: ${error.message}`);
  return data;
}

// ── BADGE MAPS ────────────────────────────────────────────────────────────────
// Shared across all tab components for consistent badge rendering

export const SEVERITY_BADGE: Record<string, string> = {
  critical: "bg-red-900/60 text-red-300 border border-red-500/40",
  high:     "bg-orange-900/60 text-orange-300 border border-orange-500/40",
  elevated: "bg-yellow-900/60 text-yellow-300 border border-yellow-500/40",
  medium:   "bg-yellow-900/40 text-yellow-400 border border-yellow-600/30",
  guarded:  "bg-blue-900/60 text-blue-300 border border-blue-500/40",
  low:      "bg-slate-800 text-slate-400 border border-slate-600/40",
};

export const STATUS_BADGE: Record<string, string> = {
  open:       "bg-red-900/50 text-red-300",
  triaged:    "bg-yellow-900/50 text-yellow-300",
  contained:  "bg-blue-900/50 text-blue-300",
  resolved:   "bg-green-900/50 text-green-300",
  dismissed:  "bg-slate-800 text-slate-400",
};

export const PLAYBOOK_RUN_BADGE: Record<string, string> = {
  requested:   "bg-slate-800 text-slate-300",
  running:     "bg-cyan-900/50 text-cyan-300",
  completed:   "bg-green-900/50 text-green-300",
  failed:      "bg-red-900/50 text-red-300",
  rolled_back: "bg-orange-900/50 text-orange-300",
};

export const RESPONSE_MODE_BADGE: Record<string, string> = {
  observe:  "bg-slate-800 text-slate-400",
  triage:   "bg-yellow-900/50 text-yellow-300",
  contain:  "bg-orange-900/50 text-orange-300",
  escalate: "bg-red-900/60 text-red-300",
};
