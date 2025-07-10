import { pgTable, text, serial, integer, boolean, timestamp, json, time, primaryKey, foreignKey } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
import { relations } from "drizzle-orm";

// User schema
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  email: text("email").notNull().unique(),
  password: text("password").notNull(),
  name: text("name").notNull(),
  role: text("role").notNull(),
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  email: true,
  password: true,
  name: true,
  role: true,
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;

// Goals schema
export const goals = pgTable("goals", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  title: text("title").notNull(),
  targetAmount: integer("target_amount").notNull(),
  currentAmount: integer("current_amount").notNull().default(0),
  startingAmount: integer("starting_amount").notNull().default(0),
  deadline: timestamp("deadline").notNull(),
  category: text("category").notNull(),
  valueType: text("value_type").notNull().default("number"), // "monetary", "number", or "percentage"
});

// Create base schema
const baseGoalSchema = createInsertSchema(goals).pick({
  userId: true,
  title: true,
  targetAmount: true,
  currentAmount: true,
  startingAmount: true,
  deadline: true,
  category: true,
  valueType: true,
});

// Modified schema with custom deadline validation
export const insertGoalSchema = baseGoalSchema.extend({
  // Override deadline validation to support ISO string dates
  deadline: z.preprocess(
    (arg) => {
      if (typeof arg === 'string' || arg instanceof Date) return new Date(arg);
      return arg;
    },
    z.date()
  )
});

export type InsertGoal = z.infer<typeof insertGoalSchema>;
export type Goal = typeof goals.$inferSelect;

// Tasks schema
export const tasks = pgTable("tasks", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  title: text("title").notNull(),
  description: text("description"),
  priority: text("priority").notNull(),
  completed: boolean("completed").notNull().default(false),
  dueDate: timestamp("due_date"),
});

export const insertTaskSchema = createInsertSchema(tasks).pick({
  userId: true,
  title: true,
  description: true,
  priority: true,
  completed: true,
  dueDate: true,
});

export type InsertTask = z.infer<typeof insertTaskSchema>;
export type Task = typeof tasks.$inferSelect;

// Check-in schema
export const checkIns = pgTable("check_ins", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  date: timestamp("date").notNull(),
  achievements: text("achievements"),
  challenges: text("challenges"),
  goals: text("goals"),
  reflection: text("reflection"),
});

export const insertCheckInSchema = createInsertSchema(checkIns).pick({
  userId: true,
  date: true,
  achievements: true,
  challenges: true,
  goals: true,
  reflection: true,
});

export type InsertCheckIn = z.infer<typeof insertCheckInSchema>;
export type CheckIn = typeof checkIns.$inferSelect;

// Time Off schema
export const timeOff = pgTable("time_off", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  startDate: timestamp("start_date").notNull(),
  endDate: timestamp("end_date").notNull(),
  notes: text("notes"),
});

export const insertTimeOffSchema = createInsertSchema(timeOff).pick({
  userId: true,
  startDate: true,
  endDate: true,
  notes: true,
});

export type InsertTimeOff = z.infer<typeof insertTimeOffSchema>;
export type TimeOff = typeof timeOff.$inferSelect;

// Chat messages schema
export const chatMessages = pgTable("chat_messages", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  message: text("message").notNull(),
  sender: text("sender").notNull(), // 'user' or 'assistant'
  timestamp: timestamp("timestamp").notNull(),
});

export const insertChatMessageSchema = createInsertSchema(chatMessages).pick({
  userId: true,
  message: true,
  sender: true,
  timestamp: true,
});

export type InsertChatMessage = z.infer<typeof insertChatMessageSchema>;
export type ChatMessage = typeof chatMessages.$inferSelect;

// Sales Metrics schema
export const salesMetrics = pgTable("sales_metrics", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  date: timestamp("date").notNull(),
  newAccountsTarget: integer("new_accounts_target").notNull(),
  newAccountsCurrent: integer("new_accounts_current").notNull(),
  meetingsTarget: integer("meetings_target").notNull(),
  meetingsCurrent: integer("meetings_current").notNull(),
  tripsTarget: integer("trips_target").notNull().default(10),
  tripsCurrent: integer("trips_current").notNull().default(6),
  crmUpdatePercentage: integer("crm_update_percentage").notNull().default(75),
  weeklyActivity: json("weekly_activity").notNull(),
});

export const insertSalesMetricsSchema = createInsertSchema(salesMetrics).pick({
  userId: true,
  date: true,
  newAccountsTarget: true,
  newAccountsCurrent: true,
  meetingsTarget: true,
  meetingsCurrent: true,
  tripsTarget: true,
  tripsCurrent: true,
  crmUpdatePercentage: true,
  weeklyActivity: true,
});

export type InsertSalesMetrics = z.infer<typeof insertSalesMetricsSchema>;
export type SalesMetrics = typeof salesMetrics.$inferSelect;

// Check-in Alerts schema
export const checkInAlerts = pgTable("check_in_alerts", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  time: time("time").notNull(),
  days: text("days").array().notNull(), // Array of days: ['monday', 'tuesday', etc]
  timezone: text("timezone").notNull().default('UTC'),
  enabled: boolean("enabled").notNull().default(true),
  title: text("title").notNull().default('Daily Check-in'),
  message: text("message").notNull().default('Time to complete your daily check-in'),
});

export const insertCheckInAlertSchema = createInsertSchema(checkInAlerts).pick({
  userId: true,
  time: true,
  days: true,
  timezone: true,
  enabled: true,
  title: true,
  message: true,
});

export type InsertCheckInAlert = z.infer<typeof insertCheckInAlertSchema>;
export type CheckInAlert = typeof checkInAlerts.$inferSelect;

// Relations
export const usersRelations = relations(users, ({ many }) => ({
  goals: many(goals),
  tasks: many(tasks),
  checkIns: many(checkIns),
  timeOffs: many(timeOff),
  chatMessages: many(chatMessages),
  salesMetrics: many(salesMetrics),
  checkInAlerts: many(checkInAlerts),
}));

export const goalsRelations = relations(goals, ({ one }) => ({
  user: one(users, {
    fields: [goals.userId],
    references: [users.id],
  }),
}));

export const tasksRelations = relations(tasks, ({ one }) => ({
  user: one(users, {
    fields: [tasks.userId],
    references: [users.id],
  }),
}));

export const checkInsRelations = relations(checkIns, ({ one }) => ({
  user: one(users, {
    fields: [checkIns.userId],
    references: [users.id],
  }),
}));

export const timeOffRelations = relations(timeOff, ({ one }) => ({
  user: one(users, {
    fields: [timeOff.userId],
    references: [users.id],
  }),
}));

export const chatMessagesRelations = relations(chatMessages, ({ one }) => ({
  user: one(users, {
    fields: [chatMessages.userId],
    references: [users.id],
  }),
}));

export const salesMetricsRelations = relations(salesMetrics, ({ one }) => ({
  user: one(users, {
    fields: [salesMetrics.userId],
    references: [users.id],
  }),
}));

export const checkInAlertsRelations = relations(checkInAlerts, ({ one }) => ({
  user: one(users, {
    fields: [checkInAlerts.userId],
    references: [users.id],
  }),
}));
