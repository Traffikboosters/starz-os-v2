import { z } from "zod";
import { createRouter, publicQuery } from "./middleware";
import { getDb } from "./queries/connection";
import { tasks } from "@db/schema";
import { eq, and, desc } from "drizzle-orm";

export const tasksRouter = createRouter({
  list: publicQuery
    .input(z.object({ workOrderId: z.number().optional(), assignedTo: z.number().optional(), status: z.string().optional() }).optional())
    .query(async ({ input }) => {
      const db = getDb();
      const filters = [];
      if (input?.workOrderId) filters.push(eq(tasks.workOrderId, input.workOrderId));
      if (input?.assignedTo) filters.push(eq(tasks.assignedTo, input.assignedTo));
      if (input?.status) filters.push(eq(tasks.status, input.status as any));
      const where = filters.length > 0 ? and(...filters) : undefined;
      return db.select().from(tasks).where(where).orderBy(desc(tasks.priority));
    }),

  create: publicQuery
    .input(z.object({
      workOrderId: z.number(),
      title: z.string(),
      description: z.string().optional(),
      assignedTo: z.number().optional(),
      priority: z.string().default("normal"),
      status: z.string().default("todo"),
      dueDate: z.string().optional(),
      notes: z.string().optional(),
    }))
    .mutation(async ({ input }) => {
      const db = getDb();
      const result = await db.insert(tasks).values({
        ...input,
        priority: input.priority as any,
        status: input.status as any,
        dueDate: input.dueDate ? new Date(input.dueDate) : undefined,
      } as any);
      return { id: Number(result[0].insertId) };
    }),

  update: publicQuery
    .input(z.object({ id: z.number(), data: z.record(z.any()) }))
    .mutation(async ({ input }) => {
      const db = getDb();
      const updates = { ...input.data, updatedAt: new Date() };
      if (input.data.status === "done") updates.completedAt = new Date();
      await db.update(tasks).set(updates as any).where(eq(tasks.id, input.id));
      return { success: true };
    }),

  delete: publicQuery.input(z.object({ id: z.number() })).mutation(async ({ input }) => {
    const db = getDb();
    await db.delete(tasks).where(eq(tasks.id, input.id));
    return { success: true };
  }),

  myTasks: publicQuery.input(z.object({ userId: z.number() })).query(async ({ input }) => {
    const db = getDb();
    return db.select().from(tasks).where(eq(tasks.assignedTo, input.userId)).orderBy(desc(tasks.createdAt));
  }),

  stats: publicQuery.query(async () => {
    const db = getDb();
    const all = await db.select().from(tasks);
    return {
      total: all.length,
      todo: all.filter(t => t.status === "todo").length,
      inProgress: all.filter(t => t.status === "in_progress").length,
      review: all.filter(t => t.status === "review").length,
      done: all.filter(t => t.status === "done").length,
      overdue: all.filter(t => t.dueDate && new Date(t.dueDate) < new Date() && t.status !== "done").length,
    };
  }),
});
