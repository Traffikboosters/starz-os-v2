import { z } from "zod";
import { createRouter, publicQuery } from "./middleware";
import { getDb } from "./queries/connection";
import { activityLog } from "@db/schema";
import { desc } from "drizzle-orm";

export const activityRouter = createRouter({
  list: publicQuery
    .input(z.object({ limit: z.number().default(50), type: z.string().optional() }).optional())
    .query(async ({ input }) => {
      const db = getDb();
      const limit = input?.limit || 50;
      return db.select().from(activityLog).orderBy(desc(activityLog.createdAt)).limit(limit);
    }),

  create: publicQuery
    .input(z.object({
      userId: z.number().optional(),
      type: z.string(),
      entityType: z.string().optional(),
      entityId: z.number().optional(),
      description: z.string(),
      metadata: z.string().optional(),
    }))
    .mutation(async ({ input }) => {
      const db = getDb();
      const result = await db.insert(activityLog).values({ ...input, type: input.type as any } as any);
      return { id: Number(result[0].insertId) };
    }),

  realtimeFeed: publicQuery.query(async () => {
    const db = getDb();
    const items = await db.select().from(activityLog).orderBy(desc(activityLog.createdAt)).limit(20);
    return items;
  }),
});
