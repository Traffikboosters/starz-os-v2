import { z } from "zod";
import { createRouter, publicQuery } from "./middleware";
import { getDb } from "./queries/connection";
import { payouts } from "@db/schema";
import { eq, and, desc } from "drizzle-orm";

export const payoutsRouter = createRouter({
  list: publicQuery
    .input(z.object({ contractorId: z.number().optional(), status: z.string().optional() }).optional())
    .query(async ({ input }) => {
      const db = getDb();
      const filters = [];
      if (input?.contractorId) filters.push(eq(payouts.contractorId, input.contractorId));
      if (input?.status) filters.push(eq(payouts.status, input.status as any));
      const where = filters.length > 0 ? and(...filters) : undefined;
      return db.select().from(payouts).where(where).orderBy(desc(payouts.createdAt));
    }),

  create: publicQuery
    .input(z.object({
      contractorId: z.number(),
      dealId: z.number().optional(),
      paymentId: z.number().optional(),
      dealAmount: z.string(),
      commissionRate: z.string().default("30.00"),
      commissionAmount: z.string(),
      status: z.string().default("pending"),
      notes: z.string().optional(),
    }))
    .mutation(async ({ input }) => {
      const db = getDb();
      const result = await db.insert(payouts).values({
        ...input,
        dealAmount: input.dealAmount as any,
        commissionRate: input.commissionRate as any,
        commissionAmount: input.commissionAmount as any,
        status: input.status as any,
      } as any);
      return { id: Number(result[0].insertId) };
    }),

  updateStatus: publicQuery
    .input(z.object({ id: z.number(), status: z.string(), paymentMethod: z.string().optional() }))
    .mutation(async ({ input }) => {
      const db = getDb();
      const updates: any = { status: input.status };
      if (input.status === "paid") { updates.paidAt = new Date(); }
      if (input.paymentMethod) { updates.paymentMethod = input.paymentMethod; }
      await db.update(payouts).set(updates).where(eq(payouts.id, input.id));
      return { success: true };
    }),

  stats: publicQuery
    .input(z.object({ contractorId: z.number() }).optional())
    .query(async ({ input }) => {
      const db = getDb();
      const all = input?.contractorId
        ? await db.select().from(payouts).where(eq(payouts.contractorId, input.contractorId))
        : await db.select().from(payouts);
      return {
        total: all.length,
        totalCommission: all.reduce((a, p) => a + Number(p.commissionAmount || 0), 0),
        pending: all.filter(p => p.status === "pending").reduce((a, p) => a + Number(p.commissionAmount || 0), 0),
        paid: all.filter(p => p.status === "paid").reduce((a, p) => a + Number(p.commissionAmount || 0), 0),
        disputed: all.filter(p => p.status === "disputed").length,
      };
    }),
});
