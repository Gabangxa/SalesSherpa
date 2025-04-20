import { pgTable, text, serial, integer, boolean, timestamp, json } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// User schema
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  name: text("name").notNull(),
  role: text("role").notNull(),
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
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
  deadline: timestamp("deadline").notNull(),
  category: text("category").notNull(),
});

export const insertGoalSchema = createInsertSchema(goals).pick({
  userId: true,
  title: true,
  targetAmount: true,
  currentAmount: true,
  deadline: true,
  category: true,
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
  monthlyTarget: integer("monthly_target").notNull(),
  monthlyCurrent: integer("monthly_current").notNull(),
  newAccountsTarget: integer("new_accounts_target").notNull(),
  newAccountsCurrent: integer("new_accounts_current").notNull(),
  meetingsTarget: integer("meetings_target").notNull(),
  meetingsCurrent: integer("meetings_current").notNull(),
  weeklyActivity: json("weekly_activity").notNull(),
});

export const insertSalesMetricsSchema = createInsertSchema(salesMetrics).pick({
  userId: true,
  date: true,
  monthlyTarget: true,
  monthlyCurrent: true,
  newAccountsTarget: true,
  newAccountsCurrent: true,
  meetingsTarget: true,
  meetingsCurrent: true,
  weeklyActivity: true,
});

export type InsertSalesMetrics = z.infer<typeof insertSalesMetricsSchema>;
export type SalesMetrics = typeof salesMetrics.$inferSelect;
