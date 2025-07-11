import connectPg from "connect-pg-simple";
import { eq, desc, asc } from "drizzle-orm";
import { 
  User, 
  Goal, 
  Task, 
  CheckIn, 
  TimeOff, 
  ChatMessage, 
  SalesMetrics, 
  CheckInAlert,
  InsertUser, 
  InsertGoal, 
  InsertTask, 
  InsertCheckIn, 
  InsertTimeOff, 
  InsertChatMessage, 
  InsertSalesMetrics,
  InsertCheckInAlert,
  users,
  goals,
  tasks,
  checkIns,
  timeOff,
  chatMessages,
  salesMetrics,
  checkInAlerts
} from "@shared/schema";
import { db } from "./db";
import session from "express-session";
import { pool } from "./db";

const PostgresSessionStore = connectPg(session);

export interface IStorage {
  // Session storage
  sessionStore: session.Store;
  
  // User operations
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  
  // Goal operations
  getGoals(userId: number): Promise<Goal[]>;
  getGoal(id: number): Promise<Goal | undefined>;
  createGoal(goal: InsertGoal): Promise<Goal>;
  updateGoal(id: number, updates: Partial<Goal>): Promise<Goal | undefined>;
  deleteGoal(id: number): Promise<boolean>;
  
  // Task operations
  getTasks(userId: number): Promise<Task[]>;
  getTask(id: number): Promise<Task | undefined>;
  createTask(task: InsertTask): Promise<Task>;
  updateTask(id: number, updates: Partial<Task>): Promise<Task | undefined>;
  deleteTask(id: number): Promise<boolean>;
  
  // Check-in operations
  getCheckIns(userId: number): Promise<CheckIn[]>;
  getCheckIn(id: number): Promise<CheckIn | undefined>;
  createCheckIn(checkIn: InsertCheckIn): Promise<CheckIn>;
  
  // Time off operations
  getTimeOffPeriods(userId: number): Promise<TimeOff[]>;
  createTimeOff(timeOff: InsertTimeOff): Promise<TimeOff>;
  
  // Chat messages operations
  getChatMessages(userId: number): Promise<ChatMessage[]>;
  createChatMessage(message: InsertChatMessage): Promise<ChatMessage>;
  
  // Sales metrics operations
  getSalesMetrics(userId: number): Promise<SalesMetrics | undefined>;
  createSalesMetrics(metrics: InsertSalesMetrics): Promise<SalesMetrics>;
  updateSalesMetrics(userId: number, updates: Partial<SalesMetrics>): Promise<SalesMetrics | undefined>;
  
  // Check-in alerts operations
  getCheckInAlerts(userId: number): Promise<CheckInAlert[]>;
  getCheckInAlert(id: number): Promise<CheckInAlert | undefined>;
  createCheckInAlert(alert: InsertCheckInAlert): Promise<CheckInAlert>;
  updateCheckInAlert(id: number, updates: Partial<CheckInAlert>): Promise<CheckInAlert | undefined>;
  deleteCheckInAlert(id: number): Promise<boolean>;
}

export class DatabaseStorage implements IStorage {
  sessionStore: session.Store;

  constructor() {
    // Initialize the session store with PostgreSQL
    this.sessionStore = new PostgresSessionStore({ 
      pool, 
      createTableIfMissing: true 
    });
  }

  // User operations
  async getUser(id: number): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user || undefined;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user || undefined;
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.email, email));
    return user || undefined;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(insertUser)
      .returning();
    return user;
  }

  // Goal operations
  async getGoals(userId: number): Promise<Goal[]> {
    return db.select().from(goals).where(eq(goals.userId, userId)).orderBy(desc(goals.id));
  }

  async getGoal(id: number): Promise<Goal | undefined> {
    const [goal] = await db.select().from(goals).where(eq(goals.id, id));
    return goal || undefined;
  }

  async createGoal(insertGoal: InsertGoal): Promise<Goal> {
    const [goal] = await db
      .insert(goals)
      .values(insertGoal)
      .returning();
    return goal;
  }

  async updateGoal(id: number, updates: Partial<Goal>): Promise<Goal | undefined> {
    const [updatedGoal] = await db
      .update(goals)
      .set(updates)
      .where(eq(goals.id, id))
      .returning();
    return updatedGoal || undefined;
  }

  async deleteGoal(id: number): Promise<boolean> {
    const result = await db
      .delete(goals)
      .where(eq(goals.id, id));
    return result.rowCount > 0;
  }

  // Task operations
  async getTasks(userId: number): Promise<Task[]> {
    return db.select().from(tasks).where(eq(tasks.userId, userId)).orderBy(asc(tasks.dueDate));
  }

  async getTask(id: number): Promise<Task | undefined> {
    const [task] = await db.select().from(tasks).where(eq(tasks.id, id));
    return task || undefined;
  }

  async createTask(insertTask: InsertTask): Promise<Task> {
    const [task] = await db
      .insert(tasks)
      .values(insertTask)
      .returning();
    return task;
  }

  async updateTask(id: number, updates: Partial<Task>): Promise<Task | undefined> {
    const [updatedTask] = await db
      .update(tasks)
      .set(updates)
      .where(eq(tasks.id, id))
      .returning();
    return updatedTask || undefined;
  }

  async deleteTask(id: number): Promise<boolean> {
    const result = await db
      .delete(tasks)
      .where(eq(tasks.id, id));
    return result.rowCount > 0;
  }

  // Check-in operations
  async getCheckIns(userId: number): Promise<CheckIn[]> {
    return db.select().from(checkIns).where(eq(checkIns.userId, userId)).orderBy(desc(checkIns.date));
  }

  async getCheckIn(id: number): Promise<CheckIn | undefined> {
    const [checkIn] = await db.select().from(checkIns).where(eq(checkIns.id, id));
    return checkIn || undefined;
  }

  async createCheckIn(insertCheckIn: InsertCheckIn): Promise<CheckIn> {
    const [checkIn] = await db
      .insert(checkIns)
      .values(insertCheckIn)
      .returning();
    return checkIn;
  }

  // Time off operations
  async getTimeOffPeriods(userId: number): Promise<TimeOff[]> {
    return db.select().from(timeOff).where(eq(timeOff.userId, userId)).orderBy(desc(timeOff.startDate));
  }

  async createTimeOff(insertTimeOff: InsertTimeOff): Promise<TimeOff> {
    const [timeOffEntry] = await db
      .insert(timeOff)
      .values(insertTimeOff)
      .returning();
    return timeOffEntry;
  }

  // Chat messages operations
  async getChatMessages(userId: number): Promise<ChatMessage[]> {
    return db.select().from(chatMessages).where(eq(chatMessages.userId, userId)).orderBy(asc(chatMessages.timestamp));
  }

  async createChatMessage(insertChatMessage: InsertChatMessage): Promise<ChatMessage> {
    const [chatMessage] = await db
      .insert(chatMessages)
      .values(insertChatMessage)
      .returning();
    return chatMessage;
  }

  // Sales metrics operations
  async getSalesMetrics(userId: number): Promise<SalesMetrics | undefined> {
    const [metrics] = await db.select().from(salesMetrics).where(eq(salesMetrics.userId, userId)).orderBy(desc(salesMetrics.date));
    return metrics || undefined;
  }

  async createSalesMetrics(insertSalesMetrics: InsertSalesMetrics): Promise<SalesMetrics> {
    const [metrics] = await db
      .insert(salesMetrics)
      .values(insertSalesMetrics)
      .returning();
    return metrics;
  }

  async updateSalesMetrics(userId: number, updates: Partial<SalesMetrics>): Promise<SalesMetrics | undefined> {
    const [updatedMetrics] = await db
      .update(salesMetrics)
      .set(updates)
      .where(eq(salesMetrics.userId, userId))
      .returning();
    return updatedMetrics || undefined;
  }

  // Check-in alerts operations
  async getCheckInAlerts(userId: number): Promise<CheckInAlert[]> {
    return db.select().from(checkInAlerts).where(eq(checkInAlerts.userId, userId)).orderBy(desc(checkInAlerts.id));
  }

  async getCheckInAlert(id: number): Promise<CheckInAlert | undefined> {
    const [alert] = await db.select().from(checkInAlerts).where(eq(checkInAlerts.id, id));
    return alert || undefined;
  }

  async createCheckInAlert(insertCheckInAlert: InsertCheckInAlert): Promise<CheckInAlert> {
    const [alert] = await db
      .insert(checkInAlerts)
      .values(insertCheckInAlert)
      .returning();
    return alert;
  }

  async updateCheckInAlert(id: number, updates: Partial<CheckInAlert>): Promise<CheckInAlert | undefined> {
    const [updatedAlert] = await db
      .update(checkInAlerts)
      .set(updates)
      .where(eq(checkInAlerts.id, id))
      .returning();
    return updatedAlert || undefined;
  }

  async deleteCheckInAlert(id: number): Promise<boolean> {
    const result = await db
      .delete(checkInAlerts)
      .where(eq(checkInAlerts.id, id));
    return result.rowCount > 0;
  }

  // Setup initial demo data
  async setupInitialData() {
    console.log("Setting up initial demo data...");
    try {
      // Check if demo user already exists
      const existingUser = await this.getUserByUsername("demo");
      if (existingUser) {
        console.log("Demo user already exists, skipping setup");
        return;
      }

      // Create demo user
      const demoUser = await this.createUser({
        username: "demo",
        email: "demo@example.com",
        password: "demo",
        name: "Jordan Doe",
        role: "Fintech Sales Manager"
      });

      console.log("Demo user created:", demoUser.id);
      console.log("Demo data setup complete");
    } catch (error) {
      console.error("Error setting up demo data:", error);
    }
  }
}

// Export the database storage instance
export const storage = new DatabaseStorage();