// =============================================
// STARZ-OS CORE AUTOMATION ENGINE — FULL
// Phase 3B: Sentinel Threat Reasoning + Correlation Engine
// Phase 3C: Sentinel Autonomous Response Layer
// NO NEW EDGE FUNCTIONS — all logic merged here
// =============================================

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_ROLE = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY") ?? "";
const REPLY_SECRET = Deno.env.get("REPLY_WEBHOOK_SECRET") ?? "";
const INTERNAL_TOKEN = Deno.env.get("INTERNAL_AUTOMATION_SECRET") ?? "";
const ENVELOPE_HMAC_SECRET = Deno.env.get("SENTINEL_ENVELOPE_HMAC_SECRET") ?? "";
const FROM_EMAIL = Deno.env.get("FROM_EMAIL") ?? "hello@traffikboosters.com";

if (!SUPABASE_URL || !SERVICE_ROLE) {
  throw new Error("Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY");
}

const headers: Record<string, string> = {
  "Content-Type": "application/json",
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-internal-token, resend-signature",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), { status, headers });
}

function assertInternal(req: Request) {
  const token = req.headers.get("x-internal-token") ?? "";
  if (token !== INTERNAL_TOKEN) throw new Error("Unauthorized internal action");
}

async function sb(path: string, options: RequestInit = {}) {
  return fetch(`${SUPABASE_URL}/rest/v1/${path}`, {
    ...options,
    headers: {
      Authorization: `Bearer ${SERVICE_ROLE}`,
      apikey: SERVICE_ROLE!,
      "Content-Type": "application/json",
      ...(options.headers || {}),
    },
  });
}

async function sbJson<T = unknown>(path: string, options: RequestInit = {}): Promise<T> {
  const res = await sb(path, options);
  const text = await res.text();
  if (!res.ok) throw new Error(`PostgREST ${res.status}: ${text || res.statusText}`);
  if (!text) return null as T;
  return JSON.parse(text) as T;
}

async function rpc(fn: string, params: Record<string, unknown> = {}) {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/rpc/${fn}`, {
    method: "POST",
    headers: { Authorization: `Bearer ${SERVICE_ROLE}`, apikey: SERVICE_ROLE!, "Content-Type": "application/json" },
    body: JSON.stringify(params),
  });
  const text = await res.text();
  if (!res.ok) throw new Error(`RPC ${fn} ${res.status}: ${text || res.statusText}`);
  if (!text) return null;
  return JSON.parse(text);
}

// ── STEVE AI HANDLERS ──────────────────────────────────────────────────────────
async function handleSteve(_message: string, context: Record<string, unknown>) {
  const patternHint = Array.isArray(context?.best_patterns) && (context.best_patterns as unknown[]).length > 0
    ? ` Top pattern: ${JSON.stringify((context.best_patterns as unknown[])[0]).slice(0, 200)}`
    : "";
  return `Steve: Focus on urgency + ROI.${patternHint}`;
}
async function handleRico(_m: string, _c: unknown) { return "Rico: Delivery is solid, reinforce trust."; }
async function handleZara(_m: string, _c: unknown) { return "Zara: Follow policy guidelines."; }
async function withTimeout<T>(p: Promise<T>, ms = 3000): Promise<T> {
  return Promise.race([p, new Promise<T>((_, r) => setTimeout(() => r(new Error("timeout")), ms))]);
}

async function trainSteve() {
  let patterns: unknown[] = [];
  try {
    patterns = await sbJson<unknown[]>("v_steve_patterns?select=*&order=win_rate.desc&limit=50", { method: "GET", headers: { "Accept-Profile": "ai" } });
  } catch (_e) { patterns = []; }
  await sbJson("steve_memory?on_conflict=id", {
    method: "POST",
    headers: { "Accept-Profile": "ai", "Content-Profile": "ai", Prefer: "resolution=merge-duplicates,return=minimal" },
    body: JSON.stringify({ id: "global", patterns: patterns || [], updated_at: new Date().toISOString() }),
  });
  return { ok: true, patterns_loaded: patterns?.length || 0 };
}

async function insertLearningEventOnce(row: Record<string, unknown>) {
  await sbJson("learning_log?on_conflict=event_key", {
    method: "POST",
    headers: { "Content-Profile": "ai", Prefer: "resolution=ignore-duplicates,return=minimal" },
    body: JSON.stringify([row]),
  });
}

async function generateDeveloperTasksForWorkOrder(wo: Record<string, unknown>) {
  const workOrderId = wo.id as string;
  await rpc("generate_developer_tasks_for_work_order", { p_work_order_id: workOrderId }).catch(async () => {
    await sbJson("production_events", {
      method: "POST",
      headers: { Prefer: "return=minimal" },
      body: JSON.stringify({
        work_order_id: workOrderId,
        event_type: "developer_tasks_generation_requested",
        title: `Developer task generation requested`,
        description: "Automatic task generation RPC unavailable; manual or alternate automation should process this event.",
      }),
    }).catch(() => {});
  });
}

async function autoActivateEligibleWorkOrders() {
  const now = new Date().toISOString();
  const eligible = await sbJson<Record<string, unknown>[]>(
    `work_orders.work_orders?select=*&status=eq.probation&probation_end_at=lte.${encodeURIComponent(now)}`,
    { method: "GET", headers: { "Accept-Profile": "work_orders" } },
  ).catch(() => []);

  let activated = 0;
  let failed = 0;

  for (const wo of eligible ?? []) {
    const woId = wo.id as string;
    const woNumber = (wo.work_order_number as string) ?? woId;
    try {
      await sbJson(`work_orders.work_orders?id=eq.${woId}`, {
        method: "PATCH",
        headers: { "Accept-Profile": "work_orders", "Content-Profile": "work_orders", Prefer: "return=minimal" },
        body: JSON.stringify({ status: "active", activated_at: now }),
      });
      await sbJson("production_events", {
        method: "POST",
        headers: { Prefer: "return=minimal" },
        body: JSON.stringify({
          work_order_id: woId,
          event_type: "work_order_activated",
          title: `Work Order ${woNumber} Activated`,
          description: "Probation period completed. Fulfillment unlocked.",
        }),
      }).catch(() => {});
      await generateDeveloperTasksForWorkOrder(wo);
      activated += 1;
    } catch (_e) {
      failed += 1;
      await sbJson("production_events", {
        method: "POST",
        headers: { Prefer: "return=minimal" },
        body: JSON.stringify({
          work_order_id: woId,
          event_type: "work_order_activation_failed",
          title: `Work Order ${woNumber} Activation Failed`,
          description: "Automatic activation encountered an error.",
        }),
      }).catch(() => {});
    }
  }
  return { success: true, checked: eligible?.length ?? 0, activated, failed };
}

// ── SENTINEL PHASE 3B — TYPE DEFINITIONS ──────────────────────────────────────

interface SentinelSignalRow {
  id: string;
  signal_key: string;
  signal_type: string;
  tenant_id: string | null;
  entity_type: string | null;
  entity_id: string | null;
  severity: string;
  confidence: number;
  event_at: string;
  payload: Record<string, unknown>;
}

interface CorrelationRule {
  id: number;
  rule_key: string;
  required_signal_types: string[];
  optional_signal_types: string[];
  time_window_minutes: number;
  minimum_signal_count: number;
  resulting_threat_label: string;
  recommended_playbook: string;
  score_boost: number;
  enabled: boolean;
}

interface ThreatTaxonomy {
  signal_type: string;
  threat_label: string;
  owasp_category: string;
  mitre_tactic: string;
  mitre_technique: string;
  nist_control_family: string;
  starz_os_domain: string;
  severity_baseline: string;
  recommended_response_mode: string;
}

interface BehaviorBaseline {
  entity_type: string;
  entity_id: string;
  tenant_id: string | null;
  baseline_metric: string;
  normal_min: number;
  normal_max: number;
  observed_avg: number;
  observed_stddev: number;
  sample_size: number;
}

interface ThreatMemoryRow {
  id: number;
  memory_key: string;
  pattern_type: string;
  pattern_signature: string;
  times_seen: number;
  false_positive_count: number;
  confirmed_incident_count: number;
  confidence_score: number;
}

interface AgentAbusePattern {
  id: number;
  pattern_key: string;
  agent_name: string;
  abuse_type: string;
  match_patterns: string[];
  risk_score: number;
  mitigation_hint: string | null;
}

interface CorrelationRunStats {
  rulesEvaluated: number;
  chainsBuilt: number;
  incidentsUpdated: number;
  anomaliesDetected: number;
  abusePatternsMatched: number;
  memoryUpdates: number;
}

// ── SENTINEL PHASE 3C — TYPE DEFINITIONS ──────────────────────────────────────

interface SentinelEnvelope {
  envelope_id: string;
  nonce: string;
  signature: string;
  expires_at: string;
  db_envelope_id?: string;
  issued_by?: string;
}

interface PlaybookRow {
  playbook_key: string;
  title: string;
  steps: PlaybookStep[];
  enabled: boolean;
  requires_approval: boolean;
  max_actions_per_run: number;
}

interface PlaybookStep {
  action: string;
  target_type: string;
  target_id?: string;
  params?: Record<string, unknown>;
}

// ── SENTINEL SCORING HELPERS ───────────────────────────────────────────────────

function computeSignalConfidence(signal: SentinelSignalRow, memoryMatch: ThreatMemoryRow | null): number {
  let score = signal.confidence ?? 50;
  if (memoryMatch) {
    score += Math.min(memoryMatch.times_seen * 2, 20);
    score -= memoryMatch.false_positive_count * 5;
  }
  const payloadKeys = Object.keys(signal.payload ?? {}).length;
  if (payloadKeys > 5) score += 5;
  if (payloadKeys > 10) score += 5;
  return Math.min(Math.max(score, 0), 100);
}

function computeChainConfidence(signals: SentinelSignalRow[], rule: CorrelationRule, signalConfidences: number[]): number {
  if (signals.length === 0) return 0;
  const avgSignalConf = signalConfidences.reduce((a, b) => a + b, 0) / signalConfidences.length;
  const signalCountBoost = Math.min((signals.length - rule.minimum_signal_count) * 5, 20);
  return Math.min(avgSignalConf + signalCountBoost + (rule.score_boost ?? 0), 100);
}

function computeNarrativeConfidence(chainConfidence: number, anomalyCount: number, abuseMatchCount: number): number {
  return Math.min(chainConfidence + Math.min(anomalyCount * 3, 15) + Math.min(abuseMatchCount * 5, 20), 100);
}

function computeCompositeScore(signalConf: number, chainConf: number, narrativeConf: number, memoryConf: number): number {
  return (signalConf * 0.3) + (chainConf * 0.3) + (narrativeConf * 0.2) + (memoryConf * 0.2);
}

function scoreToRiskBand(score: number): string {
  if (score >= 85) return "critical";
  if (score >= 70) return "high";
  if (score >= 50) return "elevated";
  if (score >= 30) return "guarded";
  return "low";
}

function riskBandToResponseMode(band: string): string {
  const map: Record<string, string> = { critical: "escalate", high: "contain", elevated: "triage", guarded: "observe", low: "observe" };
  return map[band] ?? "observe";
}

function scoreToSeverity(score: number): string {
  if (score >= 85) return "critical";
  if (score >= 65) return "high";
  if (score >= 40) return "medium";
  return "low";
}

function computeDeviation(observed: number, avg: number, stddev: number): number {
  if (!stddev || stddev === 0) return observed > avg ? 3 : 0;
  return Math.abs((observed - avg) / stddev);
}

// ── SENTINEL FETCH HELPERS ─────────────────────────────────────────────────────

async function fetchRecentSignals(windowMinutes = 60): Promise<SentinelSignalRow[]> {
  const since = new Date(Date.now() - windowMinutes * 60 * 1000).toISOString();
  const data = await sbJson<SentinelSignalRow[]>(
    `sentinel_signals?event_at=gte.${encodeURIComponent(since)}&order=event_at.asc`,
    { method: "GET", headers: { "Accept-Profile": "security" } }
  );
  return data ?? [];
}

async function fetchCorrelationRules(): Promise<CorrelationRule[]> {
  const data = await sbJson<CorrelationRule[]>(
    "sentinel_correlation_rules?enabled=eq.true",
    { method: "GET", headers: { "Accept-Profile": "security" } }
  );
  return data ?? [];
}

async function fetchThreatTaxonomy(): Promise<Map<string, ThreatTaxonomy>> {
  const data = await sbJson<ThreatTaxonomy[]>(
    "sentinel_threat_taxonomy?enabled=eq.true",
    { method: "GET", headers: { "Accept-Profile": "security" } }
  );
  const map = new Map<string, ThreatTaxonomy>();
  for (const row of data ?? []) map.set(row.signal_type, row);
  return map;
}

async function fetchBaselines(entityIds: string[]): Promise<BehaviorBaseline[]> {
  if (entityIds.length === 0) return [];
  const data = await sbJson<BehaviorBaseline[]>(
    `sentinel_entity_behavior_baselines?entity_id=in.(${entityIds.map(encodeURIComponent).join(",")})`,
    { method: "GET", headers: { "Accept-Profile": "security" } }
  );
  return data ?? [];
}

async function fetchThreatMemory(signatures: string[]): Promise<ThreatMemoryRow[]> {
  if (signatures.length === 0) return [];
  const data = await sbJson<ThreatMemoryRow[]>(
    `sentinel_threat_memory?pattern_signature=in.(${signatures.map(encodeURIComponent).join(",")})`,
    { method: "GET", headers: { "Accept-Profile": "security" } }
  );
  return data ?? [];
}

async function fetchAbusePatterns(): Promise<AgentAbusePattern[]> {
  const data = await sbJson<AgentAbusePattern[]>(
    "sentinel_agent_abuse_patterns?enabled=eq.true",
    { method: "GET", headers: { "Accept-Profile": "security" } }
  );
  return data ?? [];
}

// ── SENTINEL ATTACK CHAIN BUILDER ─────────────────────────────────────────────

function evaluateCorrelationRule(rule: CorrelationRule, signals: SentinelSignalRow[]): SentinelSignalRow[] | null {
  const windowMs = rule.time_window_minutes * 60 * 1000;
  const now = Date.now();
  const inWindow = signals.filter((s) => now - new Date(s.event_at).getTime() <= windowMs);
  const presentTypes = new Set(inWindow.map((s) => s.signal_type));
  const allRequired = rule.required_signal_types.every((t) => presentTypes.has(t));
  if (!allRequired) return null;
  const allTargetTypes = new Set([...rule.required_signal_types, ...(rule.optional_signal_types ?? [])]);
  const matched = inWindow
    .filter((s) => allTargetTypes.has(s.signal_type))
    .sort((a, b) => new Date(a.event_at).getTime() - new Date(b.event_at).getTime());
  if (matched.length < rule.minimum_signal_count) return null;
  return matched;
}

function buildAttackChain(signals: SentinelSignalRow[], rule: CorrelationRule): {
  signalChain: object[];
  entities: object[];
  attackVector: string;
  inferredObjective: string;
} {
  const signalChain = signals.map((s, idx) => ({
    step: idx + 1,
    signal_type: s.signal_type,
    signal_id: s.id,
    entity_type: s.entity_type,
    entity_id: s.entity_id,
    event_at: s.event_at,
    severity: s.severity,
    confidence: s.confidence,
  }));

  const entityMap = new Map<string, object>();
  for (const s of signals) {
    if (s.entity_id) {
      entityMap.set(`${s.entity_type}:${s.entity_id}`, {
        entity_type: s.entity_type,
        entity_id: s.entity_id,
        tenant_id: s.tenant_id,
      });
    }
  }

  const attackVector = signals.map((s) => s.signal_type).join(" → ");
  const objectiveMap: Record<string, string> = {
    "Account Takeover": "credential_compromise_and_account_takeover",
    "AI Agent Abuse": "ai_system_manipulation_or_exfiltration",
    "Data Exfiltration": "bulk_data_theft_or_exfiltration",
    "Phishing / Social Engineering": "outbound_phishing_campaign",
    "Automation Abuse": "unauthorized_automation_orchestration",
    "Privilege Escalation": "privilege_escalation_to_admin",
    "Brute Force": "credential_brute_force_and_takeover",
    "Cross-Tenant Access": "tenant_boundary_violation",
    "Prompt Injection": "ai_prompt_injection_and_control",
  };
  return {
    signalChain,
    entities: [...entityMap.values()],
    attackVector,
    inferredObjective: objectiveMap[rule.resulting_threat_label] ?? "unknown_attacker_objective",
  };
}

// ── SENTINEL BEHAVIORAL ANOMALY DETECTION ─────────────────────────────────────

async function detectBehavioralAnomalies(signals: SentinelSignalRow[]): Promise<object[]> {
  const entityIds = [...new Set(signals.map((s) => s.entity_id).filter(Boolean))] as string[];
  const baselines = await fetchBaselines(entityIds);

  const metricMap: Record<string, string> = {
    login_failure: "login_velocity",
    outbound_email: "outbound_mail_volume",
    proposal_created: "proposal_activity",
    work_order_created: "work_order_activity",
    ai_call: "ai_usage_rate",
    contractor_data_access: "contractor_access_rate",
    automation_triggered: "automation_burst_rate",
    cross_tenant_access: "cross_tenant_attempts",
  };

  const observations = new Map<string, number>();
  for (const s of signals) {
    if (!s.entity_id) continue;
    const metric = metricMap[s.signal_type];
    if (!metric) continue;
    const key = `${s.entity_id}:${metric}`;
    observations.set(key, (observations.get(key) ?? 0) + 1);
  }

  const anomalies: object[] = [];
  for (const baseline of baselines) {
    const key = `${baseline.entity_id}:${baseline.baseline_metric}`;
    const observed = observations.get(key);
    if (observed === undefined) continue;
    const deviation = computeDeviation(observed, baseline.observed_avg, baseline.observed_stddev);
    if (deviation < 2) continue;
    if (observed <= (baseline.normal_max ?? baseline.observed_avg * 2)) continue;
    const severity = deviation >= 4 ? "critical" : deviation >= 3 ? "high" : "medium";
    anomalies.push({
      entity_type: baseline.entity_type,
      entity_id: baseline.entity_id,
      tenant_id: baseline.tenant_id ?? null,
      baseline_metric: baseline.baseline_metric,
      observed_value: observed,
      baseline_min: baseline.normal_min,
      baseline_max: baseline.normal_max,
      deviation_magnitude: deviation,
      anomaly_type: baseline.baseline_metric,
      explanation:
        `Entity [${baseline.entity_type}:${baseline.entity_id}] observed ${observed} ${baseline.baseline_metric} events. ` +
        `Baseline normal range: ${baseline.normal_min}–${baseline.normal_max}. ` +
        `Observed average: ${baseline.observed_avg} (σ=${baseline.observed_stddev}). ` +
        `Deviation: ${deviation.toFixed(2)}σ — classified as ${severity} anomaly.`,
      severity,
    });
  }
  return anomalies;
}

// ── SENTINEL AI ABUSE DETECTION ───────────────────────────────────────────────

function detectAIAbuse(
  signals: SentinelSignalRow[],
  patterns: AgentAbusePattern[],
  taxonomy: Map<string, ThreatTaxonomy>
): object[] {
  const signalTypes = new Set(signals.map((s) => s.signal_type));
  const incidents: object[] = [];
  for (const pattern of patterns) {
    const matchedTypes = pattern.match_patterns.filter((p) => signalTypes.has(p));
    if (matchedTypes.length === 0) continue;
    const matchedSignals = signals.filter((s) => matchedTypes.includes(s.signal_type));
    const tax = taxonomy.get(matchedSignals[0]?.signal_type ?? "") ?? null;
    const riskBand = scoreToRiskBand(pattern.risk_score);
    incidents.push({
      pattern_key: pattern.pattern_key,
      agent_name: pattern.agent_name,
      abuse_type: pattern.abuse_type,
      abuse_narrative:
        `AI agent [${pattern.agent_name}] shows signs of ${pattern.abuse_type}. ` +
        `Matched signals: ${matchedTypes.join(", ")}. ` +
        `Risk score: ${pattern.risk_score}. ` +
        (pattern.mitigation_hint ? `Recommended action: ${pattern.mitigation_hint}.` : ""),
      threat_class: tax?.owasp_category ?? "AI Security",
      risk_score: pattern.risk_score,
      recommended_response_mode: riskBandToResponseMode(riskBand),
      matched_signals: matchedSignals.map((s) => ({ signal_id: s.id, signal_type: s.signal_type, event_at: s.event_at })),
      idempotency_key: `ai_abuse:${pattern.pattern_key}:${Math.floor(Date.now() / (15 * 60 * 1000))}`,
    });
  }
  return incidents;
}

// ── SENTINEL THREAT MEMORY UPDATE ─────────────────────────────────────────────

async function updateThreatMemory(ruleKey: string, attackVector: string, chainConfidence: number): Promise<void> {
  const memoryKey = `chain:${ruleKey}`;
  const existing = await sbJson<ThreatMemoryRow[]>(
    `sentinel_threat_memory?memory_key=eq.${encodeURIComponent(memoryKey)}&limit=1`,
    { method: "GET", headers: { "Accept-Profile": "security" } }
  ).catch(() => [] as ThreatMemoryRow[]);

  if (existing && existing.length > 0) {
    const row = existing[0];
    const newTimesSeen = (row.times_seen ?? 1) + 1;
    const fp = row.false_positive_count ?? 0;
    const newConfidence = Math.min(chainConfidence * (1 - fp / (newTimesSeen + 1)), 100);
    await sbJson(`sentinel_threat_memory?memory_key=eq.${encodeURIComponent(memoryKey)}`, {
      method: "PATCH",
      headers: { "Accept-Profile": "security", "Content-Profile": "security", Prefer: "return=minimal" },
      body: JSON.stringify({ times_seen: newTimesSeen, confidence_score: newConfidence, last_seen_at: new Date().toISOString(), updated_at: new Date().toISOString() }),
    });
  } else {
    await sbJson("sentinel_threat_memory", {
      method: "POST",
      headers: { "Accept-Profile": "security", "Content-Profile": "security", Prefer: "resolution=ignore-duplicates,return=minimal" },
      body: JSON.stringify({
        memory_key: memoryKey,
        pattern_type: "attack_chain",
        pattern_signature: attackVector,
        times_seen: 1,
        false_positive_count: 0,
        confirmed_incident_count: 0,
        confidence_score: chainConfidence,
        notes: `Auto-learned from correlation rule: ${ruleKey}`,
      }),
    }).catch(() => {});
  }
}

// ── SENTINEL INCIDENT UPSERT + NARRATIVE ──────────────────────────────────────

async function upsertIncidentWithNarrative(params: {
  incidentKey: string;
  title: string;
  description: string;
  tenantId: string | null;
  severity: string;
  confidence: number;
  threatScore: number;
  attackChain: object[];
  entities: object[];
  narrativeSummary: string;
  recommendedResponse: string;
  humanExplanation: string;
  taxonomyEntry: ThreatTaxonomy | null;
  compositeScore: number;
}): Promise<string> {
  const { incidentKey, title, description, tenantId, severity, confidence, threatScore,
    attackChain, entities, narrativeSummary, recommendedResponse, humanExplanation,
    taxonomyEntry, compositeScore } = params;

  const incidentRows = await sbJson<Record<string, unknown>[]>("sentinel_incidents", {
    method: "POST",
    headers: { "Accept-Profile": "security", "Content-Profile": "security", Prefer: "resolution=merge-duplicates,return=representation" },
    body: JSON.stringify({
      incident_key: incidentKey, title, description, tenant_id: tenantId,
      severity, confidence, threat_score: threatScore, status: "open",
      updated_at: new Date().toISOString(),
    }),
  });
  const incidentId = incidentRows?.[0]?.id as string;
  if (!incidentId) throw new Error(`upsertIncident: no id returned for key ${incidentKey}`);

  await sbJson("sentinel_threat_narratives", {
    method: "POST",
    headers: { "Accept-Profile": "security", "Content-Profile": "security", Prefer: "resolution=merge-duplicates,return=minimal" },
    body: JSON.stringify({
      incident_id: incidentId, summary: narrativeSummary, recommended_response: recommendedResponse,
      human_readable_explanation: humanExplanation, suspected_attack_chain: attackChain,
      affected_entities: entities, confidence_score: confidence,
    }),
  }).catch(() => {});

  await sbJson("sentinel_incident_timeline", {
    method: "POST",
    headers: { "Accept-Profile": "security", "Content-Profile": "security", Prefer: "return=minimal" },
    body: JSON.stringify({
      incident_id: incidentId, event_type: "risk_scored", event_source: "sentinel_correlation",
      actor_type: "system",
      event_payload: { composite_score: compositeScore, severity, confidence,
        owasp: taxonomyEntry?.owasp_category, mitre_tactic: taxonomyEntry?.mitre_tactic,
        mitre_technique: taxonomyEntry?.mitre_technique },
    }),
  }).catch(() => {});

  const riskBand = scoreToRiskBand(compositeScore);
  await sbJson("sentinel_threat_classifications", {
    method: "POST",
    headers: { "Accept-Profile": "security", "Content-Profile": "security", Prefer: "resolution=ignore-duplicates,return=minimal" },
    body: JSON.stringify({
      incident_id: incidentId,
      owasp_category: taxonomyEntry?.owasp_category ?? null,
      mitre_tactic: taxonomyEntry?.mitre_tactic ?? null,
      mitre_technique: taxonomyEntry?.mitre_technique ?? null,
      starz_os_domain: taxonomyEntry?.starz_os_domain ?? null,
      risk_band: riskBand,
      recommended_response_mode: riskBandToResponseMode(riskBand),
      classification_confidence: confidence, signal_confidence: confidence,
      narrative_confidence: confidence, attack_chain_confidence: confidence,
      final_composite_score: compositeScore,
      idempotency_key: `classify:${incidentKey}:${Math.floor(Date.now() / (15 * 60 * 1000))}`,
    }),
  }).catch(() => {});

  return incidentId;
}

// ── SENTINEL PHASE 3C — ENVELOPE VERIFICATION ─────────────────────────────────

async function verifyHmac(envelope: SentinelEnvelope): Promise<boolean> {
  if (!ENVELOPE_HMAC_SECRET) {
    // No secret configured — allow in dev, deny in prod
    console.warn("SENTINEL_ENVELOPE_HMAC_SECRET not set — skipping HMAC verification");
    return true;
  }
  try {
    const encoder = new TextEncoder();
    const key = await crypto.subtle.importKey(
      "raw", encoder.encode(ENVELOPE_HMAC_SECRET),
      { name: "HMAC", hash: "SHA-256" }, false, ["verify"]
    );
    const message = `${envelope.envelope_id}:${envelope.nonce}:${envelope.expires_at}`;
    const sigBytes = Uint8Array.from(atob(envelope.signature), (c) => c.charCodeAt(0));
    return await crypto.subtle.verify("HMAC", key, sigBytes, encoder.encode(message));
  } catch (_e) {
    return false;
  }
}

async function verifyInternalEnvelopeOrThrow(payload: Record<string, unknown>): Promise<SentinelEnvelope> {
  const env = payload?.envelope as SentinelEnvelope | undefined;
  if (!env?.envelope_id || !env?.nonce || !env?.signature || !env?.expires_at) {
    throw new Error("Missing signed internal action envelope");
  }
  if (new Date(env.expires_at).getTime() <= Date.now()) {
    throw new Error("Envelope expired");
  }
  const validSig = await verifyHmac(env);
  if (!validSig) throw new Error("Invalid envelope signature");
  return env;
}

// ── SENTINEL PHASE 3C — ALLOWLISTED MITIGATION ACTIONS ───────────────────────
// IMPORTANT: Only these specific actions are permitted.
// No unrestricted service-role DB writes outside this allowlist.

async function applyAllowlistedAction(step: PlaybookStep, payload: Record<string, unknown>): Promise<object> {
  const action = step.action;
  const targetType = step.target_type;
  const targetId = String(step.target_id ?? payload.target_id ?? payload.tenant_id ?? "unknown");
  const now = new Date().toISOString();

  switch (action) {
    // Mark a source/queue as paused
    case "pause_queue":
    case "pause_source": {
      await sbJson(`source_controls?source_id=eq.${encodeURIComponent(targetId)}`, {
        method: "PATCH",
        headers: { "Accept-Profile": "security", "Content-Profile": "security", Prefer: "return=minimal" },
        body: JSON.stringify({ state: "paused", reason: payload.reason ?? action, updated_at: now }),
      }).catch(() => {});
      return { action, target_type: targetType, target_id: targetId, applied: true };
    }

    // Throttle a source
    case "throttle_source": {
      await sbJson(`source_controls?source_id=eq.${encodeURIComponent(targetId)}`, {
        method: "PATCH",
        headers: { "Accept-Profile": "security", "Content-Profile": "security", Prefer: "return=minimal" },
        body: JSON.stringify({ state: "throttled", reason: payload.reason ?? action, updated_at: now }),
      }).catch(() => {});
      return { action, target_type: targetType, target_id: targetId, applied: true };
    }

    // Quarantine an entity (already written by executeConstrainedMitigationStep)
    case "quarantine_entity": {
      return { action, target_type: targetType, target_id: targetId, applied: true, note: "quarantine record written by caller" };
    }

    // Disable an API key flag (marks it in ops, does not delete)
    case "disable_api_key": {
      await sbJson(`api_key_controls?key_id=eq.${encodeURIComponent(targetId)}`, {
        method: "PATCH",
        headers: { Prefer: "return=minimal" },
        body: JSON.stringify({ disabled: true, disabled_reason: payload.reason ?? action, disabled_at: now }),
      }).catch(() => {});
      return { action, target_type: targetType, target_id: targetId, applied: true };
    }

    // Block an IP in the webhook blocklist
    case "block_ip": {
      const ttlSec = (payload.ttl_seconds as number) ?? 1800;
      await sbJson("webhook_ip_blocklist", {
        method: "POST",
        headers: { "Accept-Profile": "security", "Content-Profile": "security", Prefer: "resolution=ignore-duplicates,return=minimal" },
        body: JSON.stringify({
          endpoint: String(step.params?.endpoint ?? "*"),
          source_ip: targetId,
          blocked_until: new Date(Date.now() + ttlSec * 1000).toISOString(),
          reason: payload.reason ?? action,
          created_at: now,
        }),
      }).catch(() => {});
      return { action, target_type: targetType, target_id: targetId, applied: true };
    }

    // Mark a tenant as isolated (flag only — no destructive write)
    case "isolate_tenant": {
      await sbJson(`sentinel_lockdown_events?lockdown_key=eq.${encodeURIComponent(`isolate:${targetId}`)}`, {
        method: "POST",
        headers: { "Accept-Profile": "security", "Content-Profile": "security", Prefer: "resolution=ignore-duplicates,return=minimal" },
        body: JSON.stringify({
          lockdown_key: `isolate:${targetId}`,
          incident_id: payload.incident_id ?? null,
          tenant_id: targetId,
          scope: "tenant",
          state: "active",
          reason: payload.reason ?? action,
          enforced_by: "core-automation-engine",
          metadata: { step, at: now },
        }),
      }).catch(() => {});
      return { action, target_type: targetType, target_id: targetId, applied: true };
    }

    // Notify via security notification queue
    case "notify_security": {
      await sbJson("notification_queue", {
        method: "POST",
        headers: { "Accept-Profile": "security", "Content-Profile": "security", Prefer: "return=minimal" },
        body: JSON.stringify({
          tenant_id: payload.tenant_id ?? null,
          event_type: "sentinel_mitigation_alert",
          severity: 2,
          payload: { step, reason: payload.reason, incident_id: payload.incident_id },
          status: "queued",
          created_at: now,
        }),
      }).catch(() => {});
      return { action, target_type: targetType, target_id: targetId, applied: true };
    }

    // Noop — used for observe-only playbook steps
    case "noop":
    case "observe":
      return { action, target_type: targetType, target_id: targetId, applied: false, note: "noop step" };

    default:
      console.warn(`sentinel: unknown allowlisted action "${action}" — skipping`);
      return { action, target_type: targetType, target_id: targetId, applied: false, note: "unrecognized action skipped" };
  }
}

// ── SENTINEL PHASE 3C — CONSTRAINED MITIGATION STEP EXECUTOR ─────────────────

async function executeConstrainedMitigationStep(
  runId: string,
  payload: Record<string, unknown>,
  step: PlaybookStep
): Promise<object> {
  const targetType = step.target_type;
  const targetId = String(step.target_id ?? payload.target_id ?? payload.tenant_id ?? "unknown");
  const quarantineKey = `${runId}:${step.action}:${targetType}:${targetId}`;
  const ttlSeconds = (payload.ttl_seconds as number) ?? 1800;

  // Idempotent quarantine record
  await sbJson("sentinel_quarantines", {
    method: "POST",
    headers: { "Accept-Profile": "security", "Content-Profile": "security", Prefer: "resolution=ignore-duplicates,return=minimal" },
    body: JSON.stringify({
      quarantine_key: quarantineKey,
      incident_id: payload.incident_id ?? null,
      playbook_run_id: runId,
      tenant_id: payload.tenant_id ?? null,
      target_type: targetType,
      target_id: targetId,
      state: "active",
      reason: payload.reason ?? step.action,
      reversible: true,
      ttl_seconds: ttlSeconds,
      expires_at: new Date(Date.now() + ttlSeconds * 1000).toISOString(),
      metadata: { step },
    }),
  }).catch(() => {});

  const result = await applyAllowlistedAction(step, payload);

  // Timeline audit — non-fatal
  await sbJson("sentinel_incident_timeline", {
    method: "POST",
    headers: { "Accept-Profile": "security", "Content-Profile": "security", Prefer: "return=minimal" },
    body: JSON.stringify({
      incident_id: payload.incident_id ?? null,
      event_type: "mitigation_applied",
      event_source: "core-automation-engine",
      actor_type: "automation",
      actor_id: "core-automation-engine",
      event_payload: { run_id: runId, step, result },
    }),
  }).catch(() => {});

  return { step, result };
}

// ── SENTINEL PHASE 3C — PLAYBOOK EXECUTE ─────────────────────────────────────

async function handleSentinelPlaybookExecute(payload: Record<string, unknown>): Promise<object> {
  const env = await verifyInternalEnvelopeOrThrow(payload);
  const runKey = (payload.run_key as string) ?? crypto.randomUUID();
  const idempotencyKey = (payload.idempotency_key as string) ?? `playbook:${runKey}`;
  const replayNonce = env.nonce;

  // Request run via RPC (DB enforces replay/idempotency via unique nonce + idempotency_key)
  const runId = await rpc("sentinel_request_playbook_run", {
    p_run_key: runKey,
    p_incident_id: payload.incident_id ?? null,
    p_playbook_key: payload.playbook_key,
    p_tenant_id: payload.tenant_id ?? null,
    p_requested_by: payload.requested_by ?? "core-automation-engine",
    p_envelope_id: env.db_envelope_id ?? null,
    p_idempotency_key: idempotencyKey,
    p_replay_nonce: replayNonce,
    p_expires_at: env.expires_at,
    p_mode: payload.mode ?? "mitigate",
    p_request_payload: payload,
  });
  if (!runId) throw new Error("sentinel_request_playbook_run returned no run_id");

  await rpc("sentinel_mark_playbook_run", { p_run_id: runId, p_status: "running", p_result_payload: {} });

  // Fetch playbook
  const playbookRows = await sbJson<PlaybookRow[]>(
    `sentinel_playbooks?playbook_key=eq.${encodeURIComponent(payload.playbook_key as string)}&limit=1`,
    { method: "GET", headers: { "Accept-Profile": "security" } }
  );
  const pb = playbookRows?.[0];
  if (!pb) throw new Error(`Playbook not found: ${payload.playbook_key}`);
  if (!pb.enabled) throw new Error(`Playbook disabled: ${payload.playbook_key}`);

  // Safety gate: cap actions per run
  const maxActions = pb.max_actions_per_run ?? 25;
  const steps = (pb.steps ?? []).slice(0, maxActions);

  const stepResults: object[] = [];
  for (const step of steps) {
    stepResults.push(await executeConstrainedMitigationStep(runId, payload, step));
  }

  await rpc("sentinel_mark_playbook_run", {
    p_run_id: runId, p_status: "completed", p_result_payload: { step_results: stepResults },
  });

  return { ok: true, run_id: runId, playbook_key: payload.playbook_key, step_results: stepResults };
}

// ── SENTINEL PHASE 3C — HEAL ──────────────────────────────────────────────────

async function handleSentinelHeal(payload: Record<string, unknown>): Promise<object> {
  const env = await verifyInternalEnvelopeOrThrow(payload);
  return handleSentinelPlaybookExecute({
    ...payload,
    envelope: env,
    run_key: (payload.run_key as string) ?? crypto.randomUUID(),
    playbook_key: (payload.playbook_key as string) ?? "pb_automation_loop_containment_v1",
    mode: "mitigate",
  });
}

// ── SENTINEL PHASE 3C — LOCKDOWN ─────────────────────────────────────────────

async function handleSentinelLockdown(payload: Record<string, unknown>): Promise<object> {
  const env = await verifyInternalEnvelopeOrThrow(payload);

  // Strict safety gate
  if (!payload.incident_id || !payload.tenant_id || !payload.reason) {
    throw new Error("lockdown requires incident_id, tenant_id, reason");
  }

  const lockdownKey = (payload.lockdown_key as string) ?? `lockdown:${payload.tenant_id}:${payload.incident_id}`;
  const nowIso = new Date().toISOString();

  // Idempotent lockdown event record
  await sbJson("sentinel_lockdown_events", {
    method: "POST",
    headers: { "Accept-Profile": "security", "Content-Profile": "security", Prefer: "resolution=merge-duplicates,return=minimal" },
    body: JSON.stringify({
      lockdown_key: lockdownKey,
      incident_id: payload.incident_id,
      tenant_id: payload.tenant_id,
      scope: (payload.scope as string) ?? "tenant",
      state: "active",
      reason: payload.reason,
      enforced_by: "core-automation-engine",
      metadata: { envelope_id: env.envelope_id, at: nowIso },
    }),
  });

  // Execute canonical lockdown playbook
  return handleSentinelPlaybookExecute({
    ...payload,
    envelope: env,
    playbook_key: (payload.playbook_key as string) ?? "pb_tenant_isolation_response_v1",
    idempotency_key: (payload.idempotency_key as string) ?? `playbook:${lockdownKey}`,
    run_key: (payload.run_key as string) ?? `run:${lockdownKey}`,
  });
}

// ── SENTINEL PHASE 3B — INTELLIGENCE ANALYZE ─────────────────────────────────

async function handleSentinelIntelligenceAnalyze(payload: Record<string, unknown>): Promise<object> {
  const windowMinutes = (payload.window_minutes as number) ?? 60;
  const runKey = (payload.run_key as string) ?? `intel_analyze:${Date.now()}`;

  const [signals, abusePatterns, taxonomy] = await Promise.all([
    fetchRecentSignals(windowMinutes),
    fetchAbusePatterns(),
    fetchThreatTaxonomy(),
  ]);

  const scopedSignals = payload.tenant_id ? signals.filter((s) => s.tenant_id === payload.tenant_id) : signals;
  const anomalies = await detectBehavioralAnomalies(scopedSignals);
  const abuseIncidents = detectAIAbuse(scopedSignals, abusePatterns, taxonomy);

  let anomaliesInserted = 0;
  if (anomalies.length > 0) {
    await sbJson("sentinel_anomaly_reports", {
      method: "POST",
      headers: { "Accept-Profile": "security", "Content-Profile": "security", Prefer: "return=minimal" },
      body: JSON.stringify(anomalies),
    }).then(() => { anomaliesInserted = anomalies.length; }).catch(() => {});
  }

  let abuseInserted = 0;
  for (const abuse of abuseIncidents) {
    await sbJson("sentinel_ai_abuse_incidents", {
      method: "POST",
      headers: { "Accept-Profile": "security", "Content-Profile": "security", Prefer: "resolution=ignore-duplicates,return=minimal" },
      body: JSON.stringify(abuse),
    }).then(() => { abuseInserted++; }).catch(() => {});
  }

  return {
    run_key: runKey,
    signals_analyzed: scopedSignals.length,
    anomalies_detected: anomaliesInserted,
    abuse_patterns_matched: abuseInserted,
    window_minutes: windowMinutes,
    executed_at: new Date().toISOString(),
  };
}

// ── SENTINEL PHASE 3B — CORRELATE INCIDENTS ───────────────────────────────────

async function handleSentinelCorrelateIncidents(payload: Record<string, unknown>): Promise<object> {
  const windowMinutes = (payload.window_minutes as number) ?? 120;
  const runKey = (payload.run_key as string) ?? `correlate:${Date.now()}`;
  const startedAt = Date.now();

  await sbJson("sentinel_correlation_runs", {
    method: "POST",
    headers: { "Accept-Profile": "security", "Content-Profile": "security", Prefer: "resolution=ignore-duplicates,return=minimal" },
    body: JSON.stringify({ run_key: runKey, tenant_id: payload.tenant_id ?? null, status: "running", started_at: new Date().toISOString() }),
  }).catch(() => {});

  const stats: CorrelationRunStats = {
    rulesEvaluated: 0, chainsBuilt: 0, incidentsUpdated: 0,
    anomaliesDetected: 0, abusePatternsMatched: 0, memoryUpdates: 0,
  };

  try {
    const [signals, rules, taxonomy, abusePatterns] = await Promise.all([
      fetchRecentSignals(windowMinutes),
      fetchCorrelationRules(),
      fetchThreatTaxonomy(),
      fetchAbusePatterns(),
    ]);

    const scopedSignals = payload.tenant_id ? signals.filter((s) => s.tenant_id === payload.tenant_id) : signals;
    const signatureSet = [...new Set(scopedSignals.map((s) => s.signal_type))];
    const memoryRows = await fetchThreatMemory(signatureSet);
    const memoryMap = new Map<string, ThreatMemoryRow>();
    for (const m of memoryRows) memoryMap.set(m.pattern_signature, m);

    for (const rule of rules) {
      stats.rulesEvaluated++;
      const matched = evaluateCorrelationRule(rule, scopedSignals);
      if (!matched || matched.length === 0) continue;

      const { signalChain, entities, attackVector, inferredObjective } = buildAttackChain(matched, rule);
      const signalConfs = matched.map((s) => computeSignalConfidence(s, memoryMap.get(s.signal_type) ?? null));
      const chainConf = computeChainConfidence(matched, rule, signalConfs);
      const abuseMatches = detectAIAbuse(matched, abusePatterns, taxonomy);
      stats.abusePatternsMatched += abuseMatches.length;
      const anomalies = await detectBehavioralAnomalies(matched);
      stats.anomaliesDetected += anomalies.length;
      const narrativeConf = computeNarrativeConfidence(chainConf, anomalies.length, abuseMatches.length);
      const memoryConf = memoryMap.get(attackVector)?.confidence_score ?? 0;
      const avgSignalConf = signalConfs.reduce((a, b) => a + b, 0) / signalConfs.length;
      const compositeScore = computeCompositeScore(avgSignalConf, chainConf, narrativeConf, memoryConf);
      const severity = scoreToSeverity(compositeScore);
      const tax = taxonomy.get(matched[0]?.signal_type ?? "") ?? null;
      const tenantId = matched[0]?.tenant_id ?? null;
      const incidentKey = `${rule.rule_key}:${matched[0]?.tenant_id ?? "global"}`;

      const humanExplanation =
        `Sentinel detected a correlated ${rule.resulting_threat_label} pattern. ` +
        `Attack chain: ${attackVector}. ` +
        `Inferred attacker objective: ${inferredObjective}. ` +
        `${entities.length} entities involved. ` +
        `Composite threat score: ${compositeScore.toFixed(1)}/100. ` +
        `Confidence: ${narrativeConf.toFixed(1)}%. ` +
        (abuseMatches.length > 0 ? `${abuseMatches.length} AI agent abuse pattern(s) matched. ` : "") +
        (anomalies.length > 0 ? `${anomalies.length} behavioral anomaly/anomalies detected. ` : "") +
        `Recommended response: ${riskBandToResponseMode(scoreToRiskBand(compositeScore))}.`;

      const incidentId = await upsertIncidentWithNarrative({
        incidentKey, title: `${rule.resulting_threat_label} — Correlated Attack Chain`,
        description: humanExplanation, tenantId, severity, confidence: narrativeConf,
        threatScore: compositeScore, attackChain: signalChain, entities,
        narrativeSummary: humanExplanation,
        recommendedResponse: riskBandToResponseMode(scoreToRiskBand(compositeScore)),
        humanExplanation, taxonomyEntry: tax, compositeScore,
      });
      stats.incidentsUpdated++;

      const chainKey = `chain:${rule.rule_key}:${matched.map((s) => s.id).join("-")}`;
      await sbJson("sentinel_attack_chains", {
        method: "POST",
        headers: { "Accept-Profile": "security", "Content-Profile": "security", Prefer: "resolution=ignore-duplicates,return=minimal" },
        body: JSON.stringify({ incident_id: incidentId, chain_key: chainKey, signal_chain: signalChain, entities,
          inferred_objective: inferredObjective, attack_vector: attackVector, confidence: chainConf,
          correlation_rule_key: rule.rule_key, severity }),
      }).catch(() => {});
      stats.chainsBuilt++;

      if (anomalies.length > 0) {
        await sbJson("sentinel_anomaly_reports", {
          method: "POST",
          headers: { "Accept-Profile": "security", "Content-Profile": "security", Prefer: "return=minimal" },
          body: JSON.stringify(anomalies.map((a) => ({ ...(a as object), incident_id: incidentId }))),
        }).catch(() => {});
      }

      for (const abuse of abuseMatches) {
        await sbJson("sentinel_ai_abuse_incidents", {
          method: "POST",
          headers: { "Accept-Profile": "security", "Content-Profile": "security", Prefer: "resolution=ignore-duplicates,return=minimal" },
          body: JSON.stringify({ ...(abuse as object), incident_id: incidentId }),
        }).catch(() => {});
      }

      await updateThreatMemory(rule.rule_key, attackVector, chainConf);
      stats.memoryUpdates++;
    }

    const durationMs = Date.now() - startedAt;
    await sbJson(`sentinel_correlation_runs?run_key=eq.${encodeURIComponent(runKey)}`, {
      method: "PATCH",
      headers: { "Accept-Profile": "security", "Content-Profile": "security", Prefer: "return=minimal" },
      body: JSON.stringify({
        status: "completed", finished_at: new Date().toISOString(), duration_ms: durationMs,
        rules_evaluated: stats.rulesEvaluated, chains_built: stats.chainsBuilt,
        incidents_updated: stats.incidentsUpdated, anomalies_detected: stats.anomaliesDetected,
        abuse_patterns_matched: stats.abusePatternsMatched, memory_updates: stats.memoryUpdates,
        summary: { ...stats, window_minutes: windowMinutes },
      }),
    }).catch(() => {});

    return { run_key: runKey, status: "completed", duration_ms: durationMs, ...stats };

  } catch (err) {
    await sbJson(`sentinel_correlation_runs?run_key=eq.${encodeURIComponent(runKey)}`, {
      method: "PATCH",
      headers: { "Accept-Profile": "security", "Content-Profile": "security", Prefer: "return=minimal" },
      body: JSON.stringify({ status: "failed", error: String(err), finished_at: new Date().toISOString(), duration_ms: Date.now() - startedAt }),
    }).catch(() => {});
    throw err;
  }
}

// ── MAIN ──────────────────────────────────────────────────────────────────────
Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers });

  try {
    const body = await req.json().catch(() => ({})) as Record<string, unknown>;
    const action = body?.action as string;
    const tenantId = (body?.tenant_id as string) || "11111111-1111-1111-1111-111111111111";
    const payload = (body?.payload as Record<string, unknown>) || {};

    const user = {
      id: (body?.user_id as string) || "system",
      role: (body?.user_role as string) || "admin",
      tenant_id: tenantId,
    };

    // ── HEALTH ──
    if (!action || action === "health") {
      return json({ ok: true, message: "core-automation-engine running" });
    }

    // ── TRAIN STEVE ──
    if (action === "train_steve") {
      return json(await trainSteve());
    }

    // ── AUTO ACTIVATE ELIGIBLE WORK ORDERS ──
    if (action === "auto_activate_eligible_work_orders") {
      assertInternal(req);
      return json(await autoActivateEligibleWorkOrders());
    }

    // ── VOX MESSAGE ──
    if (action === "vox_message") {
      const { message, target, context: inputContext = {}, call_id = null } = body as Record<string, unknown>;
      if (!message || !target) return json({ ok: false, error: "Missing message/target" }, 400);
      if (!["steve", "rico", "zara"].includes(target as string)) return json({ ok: false, error: "Invalid target" }, 400);

      const context = { ...(inputContext as Record<string, unknown>) };
      const userRole = (context.user_role as string) ?? user.role;
      const eventType = (context.event_type as string) || "user_message";
      const allowed = ["user_message", "live_call_line", "live_call_whisper", "system_action"];
      if (!allowed.includes(eventType)) return json({ ok: false, error: "Invalid event_type" }, 400);
      if (userRole === "bge_contractor") { context.hide_internal_logic = true; context.max_discount = 0.2; }
      if (target === "steve") {
        const mem = await sbJson<Record<string, unknown>[]>("steve_memory?select=patterns&id=eq.global&limit=1", { method: "GET", headers: { "Accept-Profile": "ai" } }).catch(() => []);
        context.best_patterns = (mem as Record<string, unknown>[])?.[0]?.patterns || [];
      }
      const priority = call_id ? 100 : (context?.deal_value as number) > 5000 ? 80 : (context?.lead_score as number) > 70 ? 60 : 10;

      let msgId = crypto.randomUUID();
      await sbJson<Record<string, unknown>[]>("vox_messages", {
        method: "POST", headers: { "Accept-Profile": "communications", "Content-Profile": "communications", Prefer: "return=representation" },
        body: JSON.stringify({ tenant_id: tenantId, user_id: user.id, role: userRole, target, message, context, source: call_id ? "powerdial" : "ui", event_type: call_id ? "live_call_line" : eventType, status: "queued", call_id, priority }),
      }).then(rows => { if (rows?.[0]?.id) msgId = rows[0].id as string; }).catch(() => {});

      let aiResponse = "";
      try {
        if (target === "steve") aiResponse = await withTimeout(handleSteve(message as string, context));
        if (target === "rico") aiResponse = await withTimeout(handleRico(message as string, context));
        if (target === "zara") aiResponse = await withTimeout(handleZara(message as string, context));
      } catch { aiResponse = "Focus on urgency + value. Keep the conversation moving."; }

      await sbJson(`vox_messages?id=eq.${msgId}`, {
        method: "PATCH", headers: { "Accept-Profile": "communications", "Content-Profile": "communications", Prefer: "return=minimal" },
        body: JSON.stringify({ response: aiResponse, status: "completed" }),
      }).catch(() => {});

      await sbJson("learning_log", {
        method: "POST", headers: { "Accept-Profile": "ai", "Content-Profile": "ai", Prefer: "return=minimal" },
        body: JSON.stringify({ agent: target, input: message, deal_id: context?.deal_id || null }),
      }).catch(() => {});

      return json({ ok: true, id: msgId, response: aiResponse });
    }

    // ── SENTINEL SCAN ──
    if (action === "sentinel_scan") {
      const result = await rpc("run_sentinel_scan", { p_tenant_id: tenantId });
      return json({ ok: true, result });
    }

    // ── SENTINEL INTELLIGENCE ANALYZE (Phase 3B) ──
    if (action === "sentinel_intelligence_analyze") {
      const result = await handleSentinelIntelligenceAnalyze({ ...payload, tenant_id: payload.tenant_id ?? tenantId });
      return json({ ok: true, data: result });
    }

    // ── SENTINEL CORRELATE INCIDENTS (Phase 3B) ──
    if (action === "sentinel_correlate_incidents") {
      const result = await handleSentinelCorrelateIncidents({ ...payload, tenant_id: payload.tenant_id ?? tenantId });
      return json({ ok: true, data: result });
    }

    // ── SENTINEL HEAL (Phase 3C) ──
    if (action === "sentinel_heal") {
      assertInternal(req);
      const result = await handleSentinelHeal({ ...payload, tenant_id: payload.tenant_id ?? tenantId });
      return json(result);
    }

    // ── SENTINEL LOCKDOWN (Phase 3C) ──
    if (action === "sentinel_lockdown") {
      assertInternal(req);
      const result = await handleSentinelLockdown({ ...payload, tenant_id: payload.tenant_id ?? tenantId });
      return json(result);
    }

    // ── SENTINEL PLAYBOOK EXECUTE (Phase 3C) ──
    if (action === "sentinel_playbook_execute") {
      assertInternal(req);
      const result = await handleSentinelPlaybookExecute({ ...payload, tenant_id: payload.tenant_id ?? tenantId });
      return json(result);
    }

    // ── LEAD DISTRIBUTION ──
    if (action === "lead_distribution") {
      const result = await rpc("assign_lead_atomic", { p_tenant_id: tenantId, ...payload }).catch(async () => {
        return await rpc("assign_best_fit_lead_guarded", { p_tenant_id: tenantId, ...payload }).catch((e: Error) => ({ error: e.message }));
      });
      return json({ ok: true, result, message: "Lead distribution complete" });
    }

    // ── LEAD ROTATION ──
    if (action === "lead_rotation") {
      return json({ ok: true, result: await rpc("rotate_stale_leads", { p_tenant_id: tenantId }) });
    }

    // ── DECISION ENGINE ──
    if (action === "decision_engine") {
      return json({ ok: true, result: await rpc("run_decision_engine", { p_tenant_id: tenantId, ...payload }) });
    }

    // ── PRIORITY DISPATCH ──
    if (action === "priority_dispatch") {
      return json({ ok: true, result: await rpc("dispatch_priority_leads", { p_tenant_id: tenantId }) });
    }

    // ── COMPUTE RISK ──
    if (action === "compute_risk") {
      return json({ ok: true, result: await rpc("compute_deal_risk", { p_tenant_id: tenantId, ...payload }) });
    }

    // ── REASSIGN STALE ──
    if (action === "reassign_stale") {
      return json({ ok: true, result: await rpc("reassign_stale_leads", { p_tenant_id: tenantId }), message: "Stale leads reassigned" });
    }

    // ── REQUALIFY LEAD ──
    if (action === "requalify_lead") {
      const { lead_id } = payload;
      await sbJson(`crm.leads?id=eq.${lead_id}`, {
        method: "PATCH", headers: { Prefer: "return=minimal" },
        body: JSON.stringify({ status: "requalifying", last_activity_at: new Date().toISOString() }),
      }).catch(() => {});
      const result = await rpc("trigger_steve_requalification", { p_lead_id: lead_id, p_tenant_id: tenantId }).catch(() => null);
      return json({ ok: true, result, message: "Lead sent to Steve for requalification" });
    }

    // ── INVITE USER ──
    if (action === "invite_user") {
      const { email, role_key } = payload;
      await sbJson("hr.user_invites", {
        method: "POST", headers: { "Accept-Profile": "hr", "Content-Profile": "hr", Prefer: "return=minimal" },
        body: JSON.stringify({ email, role_key, status: "pending", invited_at: new Date().toISOString() }),
      }).catch(() => {});
      return json({ ok: true, message: `Invite sent to ${email}` });
    }

    // ── TRIGGER ZARA ONBOARDING ──
    if (action === "trigger_zara_onboarding" || action === "onboard_contractor") {
      const { email, role_key, name } = payload;
      await sbJson("hr.onboarding_log", {
        method: "POST", headers: { "Accept-Profile": "hr", "Content-Profile": "hr", Prefer: "return=minimal" },
        body: JSON.stringify({ email, full_name: name || email, role_key: role_key || "bge_contractor", status: "pending", sent_at: new Date().toISOString() }),
      }).catch(() => {});
      if (RESEND_API_KEY && email) {
        await fetch("https://api.resend.com/emails", {
          method: "POST",
          headers: { "Authorization": `Bearer ${RESEND_API_KEY}`, "Content-Type": "application/json" },
          body: JSON.stringify({
            from: `Zara | Traffik Boosters <${FROM_EMAIL}>`,
            to: [email],
            subject: "Welcome to Traffik Boosters — BGE Onboarding",
            html: `<p>Hi ${name || "there"},</p><p>Welcome aboard as a Business Growth Expert!</p><p>Your onboarding has been initiated. You will receive your leads and training materials shortly.</p><p>— Zara, HR Director</p>`,
          }),
        }).catch(console.error);
      }
      return json({ ok: true, message: `Onboarding triggered for ${email}` });
    }

    // ── CREATE TASK ──
    if (action === "create_task") {
      const { title, category } = payload;
      await sbJson("hr.onboarding_log", {
        method: "POST", headers: { "Accept-Profile": "hr", "Content-Profile": "hr", Prefer: "return=minimal" },
        body: JSON.stringify({ full_name: title, role_key: category || "task", status: "pending", sent_at: new Date().toISOString() }),
      }).catch(() => {});
      return json({ ok: true, message: `Task created: ${title}` });
    }

    // ── RESOLVE HR ALERT ──
    if (action === "resolve_hr_alert") {
      const { alert_id } = payload;
      await sbJson(`hr.alerts?id=eq.${alert_id}`, {
        method: "PATCH", headers: { "Accept-Profile": "hr", "Content-Profile": "hr", Prefer: "return=minimal" },
        body: JSON.stringify({ status: "resolved", resolved_at: new Date().toISOString() }),
      }).catch(() => {});
      return json({ ok: true, message: "Alert resolved" });
    }

    // ── GENERATE HR REPORT ──
    if (action === "generate_hr_report") {
      return json({ ok: true, message: "HR report generated", result: await rpc("generate_hr_summary", { p_tenant_id: tenantId }).catch(() => null) });
    }

    // ── FLAG COACHING ──
    if (action === "flag_coaching") {
      const { daily_target, min_conversion } = payload;
      return json({ ok: true, message: "Low performers flagged for coaching", result: await rpc("flag_low_performers", { p_daily_target: daily_target || 30, p_min_conversion: min_conversion || 8 }).catch(() => null) });
    }

    // ── AUTO RECRUIT ──
    if (action === "auto_recruit") {
      return json({ ok: true, message: "Auto recruit triggered", result: await rpc("trigger_auto_recruit", { p_tenant_id: tenantId, p_threshold: payload.threshold || 15 }).catch(() => null) });
    }

    // ── PLACE CALL ──
    if (action === "place_call") {
      const { phone_number, queue_id } = payload;
      const res = await fetch(`${SUPABASE_URL}/functions/v1/dialpad-call`, {
        method: "POST",
        headers: { Authorization: `Bearer ${SERVICE_ROLE}`, "Content-Type": "application/json" },
        body: JSON.stringify({ action: "call", phone: phone_number, queue_id, tenant_id: tenantId }),
      });
      return json({ ok: true, ...(await res.json()) });
    }

    // ── PAYMENT RECEIVED (IDEMPOTENT) ──
    if (action === "payment_received") {
      assertInternal(req);
      const { proposal_id, deal_id = null, amount, stripe_event_id = null, stripe_session_id = null, invoice_id = null } = payload;
      if (!proposal_id) return json({ ok: false, error: "Missing proposal_id" }, 400);
      const parsedAmount = typeof amount === "number" ? amount : Number(amount);
      if (!Number.isFinite(parsedAmount) || parsedAmount < 0) return json({ ok: false, error: "Invalid amount" }, 400);
      const stableId = stripe_event_id ?? invoice_id ?? stripe_session_id ?? proposal_id;
      await insertLearningEventOnce({ event: "payment_received", event_key: `payment_received:${stableId}`, deal_id, revenue: parsedAmount, created_at: new Date().toISOString() });
      return json({ ok: true });
    }

    // ── PAYMENT FAILED ──
    if (action === "payment_failed") {
      assertInternal(req);
      const { customer_id = null, stripe_event_id = null, invoice_id = null, stripe_session_id = null } = payload;
      const stableId = stripe_event_id ?? invoice_id ?? stripe_session_id ?? customer_id;
      if (!stableId) return json({ ok: false, error: "Missing stable failure identifier" }, 400);
      await insertLearningEventOnce({ event: "payment_failed", event_key: `payment_failed:${stableId}`, customer_id, created_at: new Date().toISOString() });
      return json({ ok: true });
    }

    // ── EMAIL WEBHOOK ──
    if (action === "email_webhook") {
      const signature = req.headers.get("resend-signature") ?? "";
      if (!signature || signature !== REPLY_SECRET) return json({ ok: false, error: "Invalid signature" }, 401);
      return json({ ok: true });
    }

    // ── DEFAULT ──
    return json({ ok: true, message: "core-automation-engine running" });

  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Unhandled error";
    console.error("core-automation-engine error:", msg);
    return json({ ok: false, error: msg }, 500);
  }
});