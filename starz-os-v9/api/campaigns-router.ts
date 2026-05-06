import { z } from "zod";
import { createRouter, publicQuery } from "./middleware";
import { getDb } from "./queries/connection";
import { campaigns, emailTemplates } from "@db/schema";
import { eq, and, desc } from "drizzle-orm";

export const campaignsRouter = createRouter({
  list: publicQuery
    .input(z.object({ status: z.string().optional(), type: z.string().optional() }).optional())
    .query(async ({ input }) => {
      const db = getDb();
      const filters = [];
      if (input?.status) filters.push(eq(campaigns.status, input.status as any));
      if (input?.type) filters.push(eq(campaigns.type, input.type as any));
      const where = filters.length > 0 ? and(...filters) : undefined;
      return db.select().from(campaigns).where(where).orderBy(desc(campaigns.createdAt));
    }),

  create: publicQuery
    .input(z.object({
      name: z.string(),
      type: z.string(),
      templateId: z.number().optional(),
      subject: z.string().optional(),
      body: z.string().optional(),
      fromName: z.string().optional(),
      fromEmail: z.string().optional(),
      dailyLimit: z.number().default(100),
      scheduledFor: z.string().optional(),
      createdBy: z.number().optional(),
    }))
    .mutation(async ({ input }) => {
      const db = getDb();
      const result = await db.insert(campaigns).values({
        ...input,
        type: input.type as any,
        scheduledFor: input.scheduledFor ? new Date(input.scheduledFor) : undefined,
      } as any);
      return { id: Number(result[0].insertId) };
    }),

  update: publicQuery
    .input(z.object({ id: z.number(), data: z.record(z.any()) }))
    .mutation(async ({ input }) => {
      const db = getDb();
      await db.update(campaigns).set(input.data as any).where(eq(campaigns.id, input.id));
      return { success: true };
    }),

  delete: publicQuery.input(z.object({ id: z.number() })).mutation(async ({ input }) => {
    const db = getDb();
    await db.delete(campaigns).where(eq(campaigns.id, input.id));
    return { success: true };
  }),

  templatesList: publicQuery.query(async () => {
    const db = getDb();
    return db.select().from(emailTemplates).orderBy(desc(emailTemplates.createdAt));
  }),

  templateCreate: publicQuery
    .input(z.object({
      name: z.string(),
      type: z.string(),
      subject: z.string(),
      body: z.string(),
      variables: z.string().optional(),
      isDefault: z.boolean().default(false),
      createdBy: z.number().optional(),
    }))
    .mutation(async ({ input }) => {
      const db = getDb();
      const result = await db.insert(emailTemplates).values({ ...input, type: input.type as any } as any);
      return { id: Number(result[0].insertId) };
    }),
});
