import { z } from "zod";
import { createRouter, publicQuery } from "./middleware";
import { getDb } from "./queries/connection";
import { deliverables } from "@db/schema";
import { eq, and, desc } from "drizzle-orm";

export const deliverablesRouter = createRouter({
  list: publicQuery
    .input(z.object({ workOrderId: z.number().optional(), clientStatus: z.string().optional() }).optional())
    .query(async ({ input }) => {
      const db = getDb();
      const filters = [];
      if (input?.workOrderId) filters.push(eq(deliverables.workOrderId, input.workOrderId));
      if (input?.clientStatus) filters.push(eq(deliverables.clientStatus, input.clientStatus as any));
      const where = filters.length > 0 ? and(...filters) : undefined;
      return db.select().from(deliverables).where(where).orderBy(desc(deliverables.createdAt));
    }),

  create: publicQuery
    .input(z.object({
      workOrderId: z.number(),
      taskId: z.number().optional(),
      title: z.string(),
      type: z.string().default("document"),
      fileUrl: z.string().optional(),
      fileSize: z.number().optional(),
      description: z.string().optional(),
      uploadedBy: z.number().optional(),
      version: z.number().default(1),
    }))
    .mutation(async ({ input }) => {
      const db = getDb();
      const result = await db.insert(deliverables).values({ ...input, type: input.type as any } as any);
      return { id: Number(result[0].insertId) };
    }),

  updateStatus: publicQuery
    .input(z.object({ id: z.number(), clientStatus: z.string(), clientFeedback: z.string().optional() }))
    .mutation(async ({ input }) => {
      const db = getDb();
      await db.update(deliverables).set({
        clientStatus: input.clientStatus as any,
        clientFeedback: input.clientFeedback,
        updatedAt: new Date(),
      }).where(eq(deliverables.id, input.id));
      return { success: true };
    }),

  delete: publicQuery.input(z.object({ id: z.number() })).mutation(async ({ input }) => {
    const db = getDb();
    await db.delete(deliverables).where(eq(deliverables.id, input.id));
    return { success: true };
  }),
});
