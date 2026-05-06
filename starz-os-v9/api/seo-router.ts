import { z } from "zod";
import { createRouter, publicQuery } from "./middleware";
import { getDb } from "./queries/connection";
import { seoKeywords, backlinks } from "@db/schema";
import { eq, and, desc } from "drizzle-orm";

export const seoRouter = createRouter({
  keywordsList: publicQuery
    .input(z.object({ clientId: z.number().optional(), workOrderId: z.number().optional() }).optional())
    .query(async ({ input }) => {
      const db = getDb();
      const filters = [];
      if (input?.clientId) filters.push(eq(seoKeywords.clientId, input.clientId));
      if (input?.workOrderId) filters.push(eq(seoKeywords.workOrderId, input.workOrderId));
      const where = filters.length > 0 ? and(...filters) : undefined;
      return db.select().from(seoKeywords).where(where).orderBy(seoKeywords.currentRank);
    }),

  keywordCreate: publicQuery
    .input(z.object({
      clientId: z.number().optional(),
      workOrderId: z.number().optional(),
      keyword: z.string(),
      targetUrl: z.string().optional(),
      searchVolume: z.number().optional(),
      difficulty: z.number().optional(),
    }))
    .mutation(async ({ input }) => {
      const db = getDb();
      const result = await db.insert(seoKeywords).values(input as any);
      return { id: Number(result[0].insertId) };
    }),

  keywordUpdateRank: publicQuery
    .input(z.object({ id: z.number(), rank: z.number() }))
    .mutation(async ({ input }) => {
      const db = getDb();
      const kw = await db.select().from(seoKeywords).where(eq(seoKeywords.id, input.id));
      const prev = kw[0]?.currentRank || 0;
      await db.update(seoKeywords).set({
        previousRank: prev,
        currentRank: input.rank,
        change: prev - input.rank,
        lastChecked: new Date(),
      }).where(eq(seoKeywords.id, input.id));
      return { success: true };
    }),

  backlinksList: publicQuery
    .input(z.object({ clientId: z.number().optional(), status: z.string().optional() }).optional())
    .query(async ({ input }) => {
      const db = getDb();
      const filters = [];
      if (input?.clientId) filters.push(eq(backlinks.clientId, input.clientId));
      if (input?.status) filters.push(eq(backlinks.status, input.status as any));
      const where = filters.length > 0 ? and(...filters) : undefined;
      return db.select().from(backlinks).where(where).orderBy(desc(backlinks.createdAt));
    }),

  backlinkCreate: publicQuery
    .input(z.object({
      clientId: z.number().optional(),
      workOrderId: z.number().optional(),
      sourceUrl: z.string(),
      targetUrl: z.string(),
      anchorText: z.string().optional(),
      domainAuthority: z.number().optional(),
    }))
    .mutation(async ({ input }) => {
      const db = getDb();
      const result = await db.insert(backlinks).values(input as any);
      return { id: Number(result[0].insertId) };
    }),

  backlinkUpdateStatus: publicQuery
    .input(z.object({ id: z.number(), status: z.string() }))
    .mutation(async ({ input }) => {
      const db = getDb();
      const updates: any = { status: input.status };
      if (input.status === "live") updates.acquiredAt = new Date();
      await db.update(backlinks).set(updates).where(eq(backlinks.id, input.id));
      return { success: true };
    }),
});
