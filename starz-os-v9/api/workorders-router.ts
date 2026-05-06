import { z } from "zod";
import { createRouter, publicQuery } from "./middleware";
import { getDb } from "./queries/connection";
import { workOrders, tasks } from "@db/schema";
import { eq, and, desc } from "drizzle-orm";

export const workOrdersRouter = createRouter({
  list: publicQuery
    .input(z.object({ status: z.string().optional(), serviceType: z.string().optional(), assignedTeam: z.string().optional(), assignedDevId: z.number().optional() }).optional())
    .query(async ({ input }) => {
      const db = getDb();
      const filters = [];
      if (input?.status) filters.push(eq(workOrders.status, input.status as any));
      if (input?.serviceType) filters.push(eq(workOrders.serviceType, input.serviceType as any));
      if (input?.assignedTeam) filters.push(eq(workOrders.assignedTeam, input.assignedTeam as any));
      if (input?.assignedDevId) filters.push(eq(workOrders.assignedDevId, input.assignedDevId));
      const where = filters.length > 0 ? and(...filters) : undefined;
      return db.select().from(workOrders).where(where).orderBy(desc(workOrders.createdAt));
    }),

  getById: publicQuery.input(z.object({ id: z.number() })).query(async ({ input }) => {
    const db = getDb();
    const wo = await db.select().from(workOrders).where(eq(workOrders.id, input.id));
    const woTasks = await db.select().from(tasks).where(eq(tasks.workOrderId, input.id));
    return { ...wo[0], tasks: woTasks };
  }),

  create: publicQuery
    .input(z.object({
      proposalId: z.number().optional(),
      leadId: z.number().optional(),
      paymentId: z.number().optional(),
      clientName: z.string(),
      serviceType: z.string(),
      title: z.string(),
      description: z.string().optional(),
      priority: z.string().default("normal"),
      status: z.string().default("pending_validation"),
      assignedTeam: z.string().default("seo"),
      assignedDevId: z.number().optional(),
      amount: z.string(),
      slaHours: z.number().default(72),
      dueDate: z.string().optional(),
    }))
    .mutation(async ({ input }) => {
      const db = getDb();
      const result = await db.insert(workOrders).values({
        ...input,
        amount: input.amount as any,
        priority: input.priority as any,
        status: input.status as any,
        assignedTeam: input.assignedTeam as any,
        dueDate: input.dueDate ? new Date(input.dueDate) : undefined,
      } as any);
      return { id: Number(result[0].insertId) };
    }),

  update: publicQuery
    .input(z.object({ id: z.number(), data: z.record(z.any()) }))
    .mutation(async ({ input }) => {
      const db = getDb();
      await db.update(workOrders).set(input.data as any).where(eq(workOrders.id, input.id));
      return { success: true };
    }),

  updateProgress: publicQuery
    .input(z.object({ id: z.number(), progress: z.number() }))
    .mutation(async ({ input }) => {
      const db = getDb();
      const updates: any = { progress: input.progress };
      if (input.progress >= 100) { updates.status = "completed"; updates.completedAt = new Date(); }
      else if (input.progress > 0 && input.progress < 100) { updates.status = "in_progress"; updates.startedAt = new Date(); }
      await db.update(workOrders).set(updates).where(eq(workOrders.id, input.id));
      return { success: true };
    }),

  delete: publicQuery.input(z.object({ id: z.number() })).mutation(async ({ input }) => {
    const db = getDb();
    await db.delete(workOrders).where(eq(workOrders.id, input.id));
    return { success: true };
  }),

  stats: publicQuery.query(async () => {
    const db = getDb();
    const all = await db.select().from(workOrders);
    return {
      total: all.length,
      pendingValidation: all.filter(w => w.status === "pending_validation").length,
      hold3Day: all.filter(w => w.status === "hold_3day").length,
      ready: all.filter(w => w.status === "ready").length,
      inProgress: all.filter(w => w.status === "in_progress").length,
      awaitingClient: all.filter(w => w.status === "awaiting_client").length,
      completed: all.filter(w => w.status === "completed").length,
      escalated: all.filter(w => w.status === "escalated").length,
      totalValue: all.reduce((a, w) => a + Number(w.amount || 0), 0),
    };
  }),
});
