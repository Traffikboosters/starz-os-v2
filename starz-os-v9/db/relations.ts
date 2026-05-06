import { relations } from "drizzle-orm";
import {
  users, prospects, leads, calls, callQueue, proposals,
  payments, workOrders, tasks, deliverables, campaigns,
  seoKeywords, backlinks, reports, activityLog, payouts,
} from "./schema";

export const usersRelations = relations(users, ({ many }) => ({
  assignedProspects: many(prospects),
  assignedLeads: many(leads),
  tasks: many(tasks),
  payouts: many(payouts),
}));

export const prospectsRelations = relations(prospects, ({ one }) => ({
  assignedRep: one(users, { fields: [prospects.assignedRepId], references: [users.id] }),
}));

export const leadsRelations = relations(leads, ({ one, many }) => ({
  prospect: one(prospects, { fields: [leads.prospectId], references: [prospects.id] }),
  assignedRep: one(users, { fields: [leads.assignedRepId], references: [users.id] }),
  calls: many(calls),
  proposals: many(proposals),
}));

export const callsRelations = relations(calls, ({ one }) => ({
  lead: one(leads, { fields: [calls.leadId], references: [leads.id] }),
  rep: one(users, { fields: [calls.repId], references: [users.id] }),
}));

export const proposalsRelations = relations(proposals, ({ one, many }) => ({
  lead: one(leads, { fields: [proposals.leadId], references: [leads.id] }),
  payments: many(payments),
  workOrders: many(workOrders),
}));

export const paymentsRelations = relations(payments, ({ one }) => ({
  proposal: one(proposals, { fields: [payments.proposalId], references: [proposals.id] }),
}));

export const workOrdersRelations = relations(workOrders, ({ one, many }) => ({
  proposal: one(proposals, { fields: [workOrders.proposalId], references: [proposals.id] }),
  assignedDev: one(users, { fields: [workOrders.assignedDevId], references: [users.id] }),
  tasks: many(tasks),
  deliverables: many(deliverables),
}));

export const tasksRelations = relations(tasks, ({ one, many }) => ({
  workOrder: one(workOrders, { fields: [tasks.workOrderId], references: [workOrders.id] }),
  assignedTo: one(users, { fields: [tasks.assignedTo], references: [users.id] }),
  deliverables: many(deliverables),
}));

export const deliverablesRelations = relations(deliverables, ({ one }) => ({
  workOrder: one(workOrders, { fields: [deliverables.workOrderId], references: [workOrders.id] }),
  task: one(tasks, { fields: [deliverables.taskId], references: [tasks.id] }),
}));

export const payoutsRelations = relations(payouts, ({ one }) => ({
  contractor: one(users, { fields: [payouts.contractorId], references: [users.id] }),
}));
