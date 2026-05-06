import { z } from "zod";
import { createRouter, publicQuery } from "./middleware";
import { getDb } from "./queries/connection";
import { reports } from "@db/schema";
import { eq, desc } from "drizzle-orm";

export const reportsRouter = createRouter({
  list: publicQuery
    .input(z.object({ clientId: z.number().optional(), type: z.string().optional() }).optional())
    .query(async ({ input }) => {
      const db = getDb();
      const conditions = [];
      if (input?.clientId) conditions.push(eq(reports.clientId, input.clientId));
      if (input?.type) conditions.push(eq(reports.type, input.type as any));
      const where = conditions.length > 0 ? conditions.reduce((a, b) => a && b) : undefined;
      return db.select().from(reports).where(where as any).orderBy(desc(reports.createdAt));
    }),

  create: publicQuery
    .input(z.object({
      workOrderId: z.number().optional(),
      clientId: z.number().optional(),
      title: z.string(),
      type: z.string(),
      period: z.string().default("monthly"),
      data: z.string().optional(),
      pdfUrl: z.string().optional(),
      generatedBy: z.number().optional(),
    }))
    .mutation(async ({ input }) => {
      const db = getDb();
      const result = await db.insert(reports).values({
        ...input,
        type: input.type as any,
        period: input.period as any,
      } as any);
      return { id: Number(result[0].insertId) };
    }),

  sendToClient: publicQuery
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input }) => {
      const db = getDb();
      await db.update(reports).set({ sentToClient: true }).where(eq(reports.id, input.id));
      return { success: true };
    }),

  delete: publicQuery.input(z.object({ id: z.number() })).mutation(async ({ input }) => {
    const db = getDb();
    await db.delete(reports).where(eq(reports.id, input.id));
    return { success: true };
  }),
});
