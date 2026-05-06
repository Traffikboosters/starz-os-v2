import { z } from "zod";
import { createRouter, publicQuery } from "./middleware";
import { getDb } from "./queries/connection";
import { proposals } from "@db/schema";
import { eq, and, desc } from "drizzle-orm";

export const proposalsRouter = createRouter({
  list: publicQuery
    .input(z.object({ status: z.string().optional(), leadId: z.number().optional(), createdBy: z.number().optional() }).optional())
    .query(async ({ input }) => {
      const db = getDb();
      const filters = [];
      if (input?.status) filters.push(eq(proposals.status, input.status as any));
      if (input?.leadId) filters.push(eq(proposals.leadId, input.leadId));
      if (input?.createdBy) filters.push(eq(proposals.createdBy, input.createdBy));
      const where = filters.length > 0 ? and(...filters) : undefined;
      return db.select().from(proposals).where(where).orderBy(desc(proposals.createdAt));
    }),

  getById: publicQuery.input(z.object({ id: z.number() })).query(async ({ input }) => {
    const db = getDb();
    const result = await db.select().from(proposals).where(eq(proposals.id, input.id));
    return result[0] || null;
  }),

  create: publicQuery
    .input(z.object({
      leadId: z.number(),
      clientName: z.string(),
      clientEmail: z.string().optional(),
      services: z.string(),
      subtotal: z.string(),
      discountPercent: z.number().default(0),
      discountAmount: z.string().optional(),
      tax: z.string().optional(),
      total: z.string(),
      createdBy: z.number().optional(),
      expiresAt: z.string().optional(),
    }))
    .mutation(async ({ input }) => {
      const db = getDb();
      const result = await db.insert(proposals).values({
        ...input,
        subtotal: input.subtotal as any,
        discountAmount: input.discountAmount ? input.discountAmount as any : "0",
        tax: input.tax ? input.tax as any : "0",
        total: input.total as any,
        expiresAt: input.expiresAt ? new Date(input.expiresAt) : undefined,
      } as any);
      return { id: Number(result[0].insertId) };
    }),

  update: publicQuery
    .input(z.object({ id: z.number(), data: z.record(z.any()) }))
    .mutation(async ({ input }) => {
      const db = getDb();
      await db.update(proposals).set(input.data as any).where(eq(proposals.id, input.id));
      return { success: true };
    }),

  updateStatus: publicQuery
    .input(z.object({ id: z.number(), status: z.string() }))
    .mutation(async ({ input }) => {
      const db = getDb();
      const updates: any = { status: input.status };
      if (input.status === "viewed") { updates.viewCount = { $increment: 1 }; updates.lastViewedAt = new Date(); }
      if (input.status === "signed") { updates.signedAt = new Date(); }
      if (input.status === "paid") { /* handled by payment webhook */ }
      await db.update(proposals).set(updates).where(eq(proposals.id, input.id));
      return { success: true };
    }),

  delete: publicQuery.input(z.object({ id: z.number() })).mutation(async ({ input }) => {
    const db = getDb();
    await db.delete(proposals).where(eq(proposals.id, input.id));
    return { success: true };
  }),

  stats: publicQuery.query(async () => {
    const db = getDb();
    const all = await db.select().from(proposals);
    return {
      total: all.length,
      draft: all.filter(p => p.status === "draft").length,
      sent: all.filter(p => p.status === "sent").length,
      viewed: all.filter(p => p.status === "viewed").length,
      signed: all.filter(p => p.status === "signed").length,
      paid: all.filter(p => p.status === "paid").length,
      totalValue: all.reduce((a, p) => a + Number(p.total || 0), 0),
    };
  }),
});
