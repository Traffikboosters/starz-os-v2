import { z } from "zod";
import { createRouter, publicQuery } from "./middleware";
import { getDb } from "./queries/connection";
import { payments } from "@db/schema";
import { eq, and, desc, sql } from "drizzle-orm";

export const paymentsRouter = createRouter({
  list: publicQuery
    .input(z.object({ status: z.string().optional(), leadId: z.number().optional() }).optional())
    .query(async ({ input }) => {
      const db = getDb();
      const filters = [];
      if (input?.status) filters.push(eq(payments.status, input.status as any));
      if (input?.leadId) filters.push(eq(payments.leadId, input.leadId));
      const where = filters.length > 0 ? and(...filters) : undefined;
      return db.select().from(payments).where(where).orderBy(desc(payments.createdAt));
    }),

  create: publicQuery
    .input(z.object({
      proposalId: z.number().optional(),
      leadId: z.number().optional(),
      clientName: z.string(),
      amount: z.string(),
      currency: z.string().default("USD"),
      status: z.string().default("pending"),
      stripePaymentIntentId: z.string().optional(),
      paymentMethod: z.string().default("card"),
      description: z.string().optional(),
    }))
    .mutation(async ({ input }) => {
      const db = getDb();
      const result = await db.insert(payments).values({
        ...input,
        amount: input.amount as any,
        status: input.status as any,
        paymentMethod: input.paymentMethod as any,
      } as any);
      return { id: Number(result[0].insertId) };
    }),

  updateStatus: publicQuery
    .input(z.object({ id: z.number(), status: z.string(), stripeData: z.record(z.string()).optional() }))
    .mutation(async ({ input }) => {
      const db = getDb();
      const updates: any = { status: input.status };
      if (input.stripeData) { Object.assign(updates, input.stripeData); }
      await db.update(payments).set(updates).where(eq(payments.id, input.id));
      return { success: true };
    }),

  stats: publicQuery.query(async () => {
    const db = getDb();
    const all = await db.select().from(payments);
    return {
      total: all.length,
      completed: all.filter(p => p.status === "completed").reduce((a, p) => a + Number(p.amount || 0), 0),
      pending: all.filter(p => p.status === "pending").reduce((a, p) => a + Number(p.amount || 0), 0),
      refunded: all.filter(p => p.status === "refunded").reduce((a, p) => a + Number(p.refundedAmount || 0), 0),
      failed: all.filter(p => p.status === "failed").length,
      disputed: all.filter(p => p.status === "disputed").length,
    };
  }),
});
