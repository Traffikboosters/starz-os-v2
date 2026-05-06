import { z } from "zod";
import { createRouter, publicQuery } from "./middleware";
import { getDb } from "./queries/connection";
import { calls, callQueue } from "@db/schema";
import { eq, and, desc } from "drizzle-orm";

export const callsRouter = createRouter({
  list: publicQuery
    .input(z.object({ repId: z.number().optional(), leadId: z.number().optional(), outcome: z.string().optional() }).optional())
    .query(async ({ input }) => {
      const db = getDb();
      const filters = [];
      if (input?.repId) filters.push(eq(calls.repId, input.repId));
      if (input?.leadId) filters.push(eq(calls.leadId, input.leadId));
      if (input?.outcome) filters.push(eq(calls.outcome, input.outcome as any));
      const where = filters.length > 0 ? and(...filters) : undefined;
      return db.select().from(calls).where(where).orderBy(desc(calls.createdAt));
    }),

  create: publicQuery
    .input(z.object({
      leadId: z.number().optional(),
      prospectId: z.number().optional(),
      repId: z.number(),
      phoneNumber: z.string(),
      businessName: z.string().optional(),
      contactName: z.string().optional(),
      duration: z.number().default(0),
      outcome: z.string().default("no_answer"),
      notes: z.string().optional(),
      steveWhisper: z.string().optional(),
      aiSuggestions: z.string().optional(),
    }))
    .mutation(async ({ input }) => {
      const db = getDb();
      const result = await db.insert(calls).values({ ...input, outcome: input.outcome as any } as any);
      return { id: Number(result[0].insertId) };
    }),

  update: publicQuery
    .input(z.object({ id: z.number(), data: z.record(z.any()) }))
    .mutation(async ({ input }) => {
      const db = getDb();
      await db.update(calls).set(input.data as any).where(eq(calls.id, input.id));
      return { success: true };
    }),

  todaySummary: publicQuery.query(async () => {
    const db = getDb();
    const today = new Date(); today.setHours(0,0,0,0);
    const all = await db.select().from(calls);
    return {
      total: all.length,
      interested: all.filter(c => c.outcome === "interested").length,
      callback: all.filter(c => c.outcome === "callback").length,
      voicemail: all.filter(c => c.outcome === "voicemail").length,
      noAnswer: all.filter(c => c.outcome === "no_answer").length,
      closed: all.filter(c => c.outcome === "closed").length,
      avgDuration: all.length > 0 ? Math.round(all.reduce((a, c) => a + (c.duration || 0), 0) / all.length) : 0,
    };
  }),

  queueList: publicQuery
    .input(z.object({ repId: z.number().optional(), status: z.string().optional() }).optional())
    .query(async ({ input }) => {
      const db = getDb();
      const filters = [];
      if (input?.repId) filters.push(eq(callQueue.repId, input.repId));
      if (input?.status) filters.push(eq(callQueue.status, input.status as any));
      const where = filters.length > 0 ? and(...filters) : undefined;
      return db.select().from(callQueue).where(where).orderBy(desc(callQueue.priority));
    }),

  queueCreate: publicQuery
    .input(z.object({ leadId: z.number().optional(), prospectId: z.number().optional(), repId: z.number(), priority: z.string().default("medium") }))
    .mutation(async ({ input }) => {
      const db = getDb();
      const result = await db.insert(callQueue).values({ ...input, priority: input.priority as any } as any);
      return { id: Number(result[0].insertId) };
    }),

  queueUpdate: publicQuery
    .input(z.object({ id: z.number(), status: z.string() }))
    .mutation(async ({ input }) => {
      const db = getDb();
      await db.update(callQueue).set({ status: input.status as any }).where(eq(callQueue.id, input.id));
      return { success: true };
    }),
});
