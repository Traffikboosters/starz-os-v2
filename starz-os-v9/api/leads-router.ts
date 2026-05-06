import { z } from "zod";
import { createRouter, publicQuery } from "./middleware";
import { getDb } from "./queries/connection";
import { leads, prospects } from "@db/schema";
import { eq, and, desc } from "drizzle-orm";

export const leadsRouter = createRouter({
  list: publicQuery
    .input(z.object({
      status: z.string().optional(),
      stage: z.string().optional(),
      assignedRepId: z.number().optional(),
      search: z.string().optional(),
      limit: z.number().default(50),
      offset: z.number().default(0),
    }).optional())
    .query(async ({ input }) => {
      const db = getDb();
      const filters = [];
      if (input?.status) filters.push(eq(leads.status, input.status as any));
      if (input?.stage) filters.push(eq(leads.stage, input.stage as any));
      if (input?.assignedRepId) filters.push(eq(leads.assignedRepId, input.assignedRepId));

      const where = filters.length > 0 ? and(...filters) : undefined;
      const result = await db.select().from(leads).where(where).orderBy(desc(leads.leadScore)).limit(input?.limit || 50).offset(input?.offset || 0);

      if (input?.search) {
        return result.filter(l =>
          l.businessName?.toLowerCase().includes(input.search!.toLowerCase()) ||
          l.contactName?.toLowerCase().includes(input.search!.toLowerCase())
        );
      }
      return result;
    }),

  getById: publicQuery.input(z.object({ id: z.number() })).query(async ({ input }) => {
    const db = getDb();
    const result = await db.select().from(leads).where(eq(leads.id, input.id));
    return result[0] || null;
  }),

  create: publicQuery
    .input(z.object({
      prospectId: z.number().optional(),
      businessName: z.string(),
      contactName: z.string().optional(),
      phone: z.string().optional(),
      email: z.string().optional(),
      website: z.string().optional(),
      city: z.string().optional(),
      state: z.string().optional(),
      industry: z.string().optional(),
      vendorSource: z.string().default("web_form"),
      leadScore: z.number().default(0),
      status: z.string().default("cold"),
      stage: z.string().default("new"),
      estimatedValue: z.string().optional(),
      assignedRepId: z.number().optional(),
      source: z.string().optional(),
      notes: z.string().optional(),
      tags: z.string().optional(),
    }))
    .mutation(async ({ input }) => {
      const db = getDb();
      const result = await db.insert(leads).values({
        ...input,
        estimatedValue: input.estimatedValue ? input.estimatedValue as any : undefined,
      } as any);
      if (input.prospectId) {
        await db.update(prospects).set({ convertedToLead: true }).where(eq(prospects.id, input.prospectId));
      }
      return { id: Number(result[0].insertId) };
    }),

  update: publicQuery
    .input(z.object({ id: z.number(), data: z.record(z.any()) }))
    .mutation(async ({ input }) => {
      const db = getDb();
      await db.update(leads).set(input.data as any).where(eq(leads.id, input.id));
      return { success: true };
    }),

  updateStage: publicQuery
    .input(z.object({ id: z.number(), stage: z.string() }))
    .mutation(async ({ input }) => {
      const db = getDb();
      await db.update(leads).set({ stage: input.stage as any, updatedAt: new Date() }).where(eq(leads.id, input.id));
      return { success: true };
    }),

  delete: publicQuery.input(z.object({ id: z.number() })).mutation(async ({ input }) => {
    const db = getDb();
    await db.delete(leads).where(eq(leads.id, input.id));
    return { success: true };
  }),

  stats: publicQuery.query(async () => {
    const db = getDb();
    const all = await db.select().from(leads);
    return {
      total: all.length,
      hot: all.filter(l => l.status === "hot").length,
      warm: all.filter(l => l.status === "warm").length,
      cold: all.filter(l => l.status === "cold").length,
      pipelineValue: all.reduce((a, l) => a + Number(l.estimatedValue || 0), 0),
      byStage: {
        new: all.filter(l => l.stage === "new").length,
        contacted: all.filter(l => l.stage === "contacted").length,
        interested: all.filter(l => l.stage === "interested").length,
        proposalSent: all.filter(l => l.stage === "proposal_sent").length,
        closedWon: all.filter(l => l.stage === "closed_won").length,
        closedLost: all.filter(l => l.stage === "closed_lost").length,
      },
    };
  }),
});
