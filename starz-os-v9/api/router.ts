import { createRouter } from "./middleware";
import { authRouter } from "./auth-router";
import { prospectsRouter } from "./prospects-router";
import { leadsRouter } from "./leads-router";
import { callsRouter } from "./calls-router";
import { proposalsRouter } from "./proposals-router";
import { paymentsRouter } from "./payments-router";
import { workOrdersRouter } from "./workorders-router";
import { tasksRouter } from "./tasks-router";
import { deliverablesRouter } from "./deliverables-router";
import { campaignsRouter } from "./campaigns-router";
import { seoRouter } from "./seo-router";
import { reportsRouter } from "./reports-router";
import { activityRouter } from "./activity-router";
import { automationRouter } from "./automation-router";
import { payoutsRouter } from "./payouts-router";

export const appRouter = createRouter({
  auth: authRouter,
  prospects: prospectsRouter,
  leads: leadsRouter,
  calls: callsRouter,
  proposals: proposalsRouter,
  payments: paymentsRouter,
  workOrders: workOrdersRouter,
  tasks: tasksRouter,
  deliverables: deliverablesRouter,
  campaigns: campaignsRouter,
  seo: seoRouter,
  reports: reportsRouter,
  activity: activityRouter,
  automation: automationRouter,
  payouts: payoutsRouter,
});

export type AppRouter = typeof appRouter;
