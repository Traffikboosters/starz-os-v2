import { z } from "zod";
import { createRouter, publicQuery } from "./middleware";
import { getDb } from "./queries/connection";
import { automationRules } from "@db/schema";
import { eq, desc } from "drizzle-orm";

export const automationRouter = createRouter({
  list: publicQuery.query(async () => {
    const db = getDb();
    return db.select().from(automationRules).orderBy(desc(automationRules.createdAt));
  }),

  create: publicQuery
    .input(z.object({
      name: z.string(),
      trigger: z.string(),
      condition: z.string().optional(),
      action: z.string(),
      actionConfig: z.string().optional(),
    }))
    .mutation(async ({ input }) => {
      const db = getDb();
      const result = await db.insert(automationRules).values({
        ...input,
        trigger: input.trigger as any,
        action: input.action as any,
      } as any);
      return { id: Number(result[0].insertId) };
    }),

  toggle: publicQuery
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input }) => {
      const db = getDb();
      const rule = await db.select().from(automationRules).where(eq(automationRules.id, input.id));
      const newStatus = !rule[0]?.isActive;
      await db.update(automationRules).set({ isActive: newStatus }).where(eq(automationRules.id, input.id));
      return { isActive: newStatus };
    }),

  triggerNow: publicQuery
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input }) => {
      const db = getDb();
      const rule = await db.select().from(automationRules).where(eq(automationRules.id, input.id));
      await db.update(automationRules).set({
        runCount: (rule[0]?.runCount || 0) + 1,
        lastRunAt: new Date(),
      }).where(eq(automationRules.id, input.id));
      return { success: true };
    }),

  delete: publicQuery.input(z.object({ id: z.number() })).mutation(async ({ input }) => {
    const db = getDb();
    await db.delete(automationRules).where(eq(automationRules.id, input.id));
    return { success: true };
  }),
});
