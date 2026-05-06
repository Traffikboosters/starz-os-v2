import { z } from "zod";
import { createRouter, publicQuery } from "./middleware";
import { getDb } from "./queries/connection";
import { prospects } from "@db/schema";
import { eq, and, desc, sql, like } from "drizzle-orm";

export const prospectsRouter = createRouter({
  list: publicQuery
    .input(z.object({
      status: z.string().optional(),
      vendorSource: z.string().optional(),
      industry: z.string().optional(),
      city: z.string().optional(),
      search: z.string().optional(),
      assignedRepId: z.number().optional(),
      limit: z.number().default(50),
      offset: z.number().default(0),
    }).optional())
    .query(async ({ input }) => {
      const db = getDb();
      const filters = [];
      if (input?.status) filters.push(eq(prospects.status, input.status as any));
      if (input?.vendorSource) filters.push(eq(prospects.vendorSource, input.vendorSource as any));
      if (input?.industry) filters.push(eq(prospects.industry, input.industry));
      if (input?.city) filters.push(eq(prospects.city, input.city));
      if (input?.assignedRepId) filters.push(eq(prospects.assignedRepId, input.assignedRepId));

      const where = filters.length > 0 ? and(...filters) : undefined;

      const result = await db.select().from(prospects).where(where).orderBy(desc(prospects.leadScore)).limit(input?.limit || 50).offset(input?.offset || 0);

      if (input?.search) {
        return result.filter(p =>
          p.businessName.toLowerCase().includes(input.search!.toLowerCase()) ||
          p.city?.toLowerCase().includes(input.search!.toLowerCase()) ||
          p.industry?.toLowerCase().includes(input.search!.toLowerCase())
        );
      }
      return result;
    }),

  getById: publicQuery.input(z.object({ id: z.number() })).query(async ({ input }) => {
    const db = getDb();
    const result = await db.select().from(prospects).where(eq(prospects.id, input.id));
    return result[0] || null;
  }),

  create: publicQuery
    .input(z.object({
      businessName: z.string(),
      phone: z.string().optional(),
      email: z.string().optional(),
      website: z.string().optional(),
      address: z.string().optional(),
      city: z.string().optional(),
      state: z.string().optional(),
      zipCode: z.string().optional(),
      industry: z.string().optional(),
      vendorSource: z.string().default("web_form"),
      googleRating: z.string().optional(),
      reviewCount: z.number().optional(),
      seoScore: z.number().optional(),
      estimatedRevenue: z.string().optional(),
      leadScore: z.number().optional(),
      status: z.string().default("cold"),
      notes: z.string().optional(),
      tags: z.string().optional(),
      assignedRepId: z.number().optional(),
    }))
    .mutation(async ({ input }) => {
      const db = getDb();
      const result = await db.insert(prospects).values({
        ...input,
        googleRating: input.googleRating ? input.googleRating as any : undefined,
        estimatedRevenue: input.estimatedRevenue ? input.estimatedRevenue as any : undefined,
      } as any);
      return { id: Number(result[0].insertId) };
    }),

  update: publicQuery
    .input(z.object({
      id: z.number(),
      data: z.record(z.any()),
    }))
    .mutation(async ({ input }) => {
      const db = getDb();
      await db.update(prospects).set(input.data as any).where(eq(prospects.id, input.id));
      return { success: true };
    }),

  delete: publicQuery.input(z.object({ id: z.number() })).mutation(async ({ input }) => {
    const db = getDb();
    await db.delete(prospects).where(eq(prospects.id, input.id));
    return { success: true };
  }),

  stats: publicQuery.query(async () => {
    const db = getDb();
    const all = await db.select().from(prospects);
    return {
      total: all.length,
      hot: all.filter(p => p.status === "hot").length,
      warm: all.filter(p => p.status === "warm").length,
      cold: all.filter(p => p.status === "cold").length,
      avgScore: all.length > 0 ? Math.round(all.reduce((a, p) => a + (p.leadScore || 0), 0) / all.length) : 0,
    };
  }),
});
