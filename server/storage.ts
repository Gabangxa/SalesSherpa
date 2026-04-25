import connectPg from "connect-pg-simple";
import { scrypt, randomBytes } from "crypto";
import { promisify } from "util";

const scryptAsync = promisify(scrypt);
import { eq, desc, asc, gt } from "drizzle-orm";
import { 
  User, 
  Goal, 
  Task, 
  CheckIn, 
  TimeOff, 
  ChatMessage, 
  CheckInAlert,
  Team,
  TeamMembership,
  SharedGoal,
  TeamActivity,
  InsertUser, 
  InsertGoal, 
  InsertTask, 
  InsertCheckIn, 
  InsertTimeOff, 
  InsertChatMessage, 
  InsertCheckInAlert,
  InsertTeam,
  InsertTeamMembership,
  InsertSharedGoal,
  InsertTeamActivity,
  UserInsight,
  InsertUserInsight,
  users,
  goals,
  tasks,
  checkIns,
  timeOff,
  chatMessages,
  checkInAlerts,
  userInsights,
  teams,
  teamMemberships,
  sharedGoals,
  teamActivities
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
  getUserByGoogleId(googleId: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: number, updates: Partial<User>): Promise<User | undefined>;
  getUserByVerificationToken(token: string): Promise<User | undefined>;
  updateUserVerification(id: number, updates: { emailVerified?: boolean; verificationToken?: string | null; verificationTokenExpiry?: Date | null }): Promise<User | undefined>;
  
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
  getCheckIns(userId: number, limit?: number): Promise<CheckIn[]>;
  getCheckIn(id: number): Promise<CheckIn | undefined>;
  createCheckIn(checkIn: InsertCheckIn): Promise<CheckIn>;
  
  // Time off operations
  getTimeOffPeriods(userId: number): Promise<TimeOff[]>;
  createTimeOff(timeOff: InsertTimeOff): Promise<TimeOff>;
  
  // Chat messages operations
  getChatMessages(userId: number): Promise<ChatMessage[]>;
  createChatMessage(message: InsertChatMessage): Promise<ChatMessage>;

  // User insights operations
  getInsights(userId: number): Promise<UserInsight[]>;
  createInsight(insight: InsertUserInsight): Promise<UserInsight>;
  
  // Check-in alerts operations
  getCheckInAlerts(userId: number): Promise<CheckInAlert[]>;
  getCheckInAlert(id: number): Promise<CheckInAlert | undefined>;
  createCheckInAlert(alert: InsertCheckInAlert): Promise<CheckInAlert>;
  updateCheckInAlert(id: number, updates: Partial<CheckInAlert>): Promise<CheckInAlert | undefined>;
  deleteCheckInAlert(id: number): Promise<boolean>;
  getAllUsersWithAlerts(): Promise<User[]>;
  
  // Team collaboration operations
  // Team operations
  getTeam(id: number): Promise<Team | undefined>;
  getTeamByInviteCode(inviteCode: string): Promise<Team | undefined>;
  getUserTeams(userId: number): Promise<Team[]>;
  createTeam(team: InsertTeam): Promise<Team>;
  updateTeam(id: number, updates: Partial<Team>): Promise<Team | undefined>;
  deleteTeam(id: number): Promise<boolean>;
  
  // Team membership operations
  getTeamMemberships(teamId: number): Promise<TeamMembership[]>;
  getUserTeamMembership(userId: number, teamId: number): Promise<TeamMembership | undefined>;
  createTeamMembership(membership: InsertTeamMembership): Promise<TeamMembership>;
  updateTeamMembership(id: number, updates: Partial<TeamMembership>): Promise<TeamMembership | undefined>;
  deleteTeamMembership(id: number): Promise<boolean>;
  
  // Shared goals operations
  getSharedGoals(teamId: number): Promise<SharedGoal[]>;
  getUserSharedGoals(userId: number): Promise<SharedGoal[]>;
  createSharedGoal(sharedGoal: InsertSharedGoal): Promise<SharedGoal>;
  deleteSharedGoal(id: number): Promise<boolean>;
  
  // Team activity operations
  getTeamActivities(teamId: number, limit?: number): Promise<TeamActivity[]>;
  createTeamActivity(activity: InsertTeamActivity): Promise<TeamActivity>;
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

  async getUserByGoogleId(googleId: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.googleId, googleId));
    return user || undefined;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(insertUser)
      .returning();
    return user;
  }

  async updateUser(id: number, updates: Partial<User>): Promise<User | undefined> {
    const [updatedUser] = await db
      .update(users)
      .set(updates)
      .where(eq(users.id, id))
      .returning();
    return updatedUser || undefined;
  }

  async getUserByVerificationToken(token: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.verificationToken, token));
    return user || undefined;
  }

  async updateUserVerification(id: number, updates: { emailVerified?: boolean; verificationToken?: string | null; verificationTokenExpiry?: Date | null }): Promise<User | undefined> {
    const [updatedUser] = await db
      .update(users)
      .set(updates)
      .where(eq(users.id, id))
      .returning();
    return updatedUser || undefined;
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
  async getCheckIns(userId: number, limit?: number): Promise<CheckIn[]> {
    const query = db.select().from(checkIns).where(eq(checkIns.userId, userId)).orderBy(desc(checkIns.date));
    return limit ? query.limit(limit) : query;
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

  // User insights operations
  async getInsights(userId: number): Promise<UserInsight[]> {
    return db
      .select()
      .from(userInsights)
      .where(eq(userInsights.userId, userId))
      .where(gt(userInsights.expiresAt, new Date()))
      .orderBy(desc(userInsights.createdAt));
  }

  async createInsight(insight: InsertUserInsight): Promise<UserInsight> {
    const [row] = await db.insert(userInsights).values(insight).returning();
    return row;
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
    return (result.rowCount ?? 0) > 0;
  }

  async getAllUsersWithAlerts(): Promise<User[]> {
    // Get all users who have at least one enabled check-in alert
    const usersWithAlerts = await db
      .select({
        id: users.id,
        username: users.username,
        email: users.email,
        name: users.name,
        role: users.role,
        emailVerified: users.emailVerified,
        verificationToken: users.verificationToken,
        verificationTokenExpiry: users.verificationTokenExpiry,
        password: users.password,
        authProvider: users.authProvider,
        googleId: users.googleId
      })
      .from(users)
      .innerJoin(checkInAlerts, eq(users.id, checkInAlerts.userId))
      .where(eq(checkInAlerts.enabled, true))
      .groupBy(users.id);
    
    return usersWithAlerts;
  }
  
  // Team collaboration operations implementation
  // Team operations
  async getTeam(id: number): Promise<Team | undefined> {
    const [team] = await db.select().from(teams).where(eq(teams.id, id));
    return team || undefined;
  }
  
  async getTeamByInviteCode(inviteCode: string): Promise<Team | undefined> {
    const [team] = await db.select().from(teams).where(eq(teams.inviteCode, inviteCode));
    return team || undefined;
  }
  
  async getUserTeams(userId: number): Promise<Team[]> {
    const userTeams = await db
      .select({
        id: teams.id,
        name: teams.name,
        description: teams.description,
        ownerId: teams.ownerId,
        inviteCode: teams.inviteCode,
        createdAt: teams.createdAt
      })
      .from(teams)
      .innerJoin(teamMemberships, eq(teams.id, teamMemberships.teamId))
      .where(eq(teamMemberships.userId, userId));
    return userTeams;
  }
  
  async createTeam(team: InsertTeam): Promise<Team> {
    // Generate unique invite code
    const inviteCode = Math.random().toString(36).substring(2, 10).toUpperCase();
    
    const [newTeam] = await db
      .insert(teams)
      .values({ ...team, inviteCode })
      .returning();
      
    // Automatically add the owner as a team member
    await this.createTeamMembership({
      teamId: newTeam.id,
      userId: team.ownerId,
      role: 'owner'
    });
    
    return newTeam;
  }
  
  async updateTeam(id: number, updates: Partial<Team>): Promise<Team | undefined> {
    const [updatedTeam] = await db
      .update(teams)
      .set(updates)
      .where(eq(teams.id, id))
      .returning();
    return updatedTeam || undefined;
  }
  
  async deleteTeam(id: number): Promise<boolean> {
    // Delete team memberships first (foreign key constraint)
    await db.delete(teamMemberships).where(eq(teamMemberships.teamId, id));
    // Delete shared goals for this team
    await db.delete(sharedGoals).where(eq(sharedGoals.teamId, id));
    // Delete team activities
    await db.delete(teamActivities).where(eq(teamActivities.teamId, id));
    // Finally delete the team
    const result = await db.delete(teams).where(eq(teams.id, id));
    return (result.rowCount ?? 0) > 0;
  }
  
  // Team membership operations
  async getTeamMemberships(teamId: number): Promise<TeamMembership[]> {
    const memberships = await db.select().from(teamMemberships).where(eq(teamMemberships.teamId, teamId));
    return memberships;
  }
  
  async getUserTeamMembership(userId: number, teamId: number): Promise<TeamMembership | undefined> {
    const [membership] = await db
      .select()
      .from(teamMemberships)
      .where(eq(teamMemberships.userId, userId))
      .where(eq(teamMemberships.teamId, teamId));
    return membership || undefined;
  }
  
  async createTeamMembership(membership: InsertTeamMembership): Promise<TeamMembership> {
    const [newMembership] = await db
      .insert(teamMemberships)
      .values(membership)
      .returning();
    return newMembership;
  }
  
  async updateTeamMembership(id: number, updates: Partial<TeamMembership>): Promise<TeamMembership | undefined> {
    const [updatedMembership] = await db
      .update(teamMemberships)
      .set(updates)
      .where(eq(teamMemberships.id, id))
      .returning();
    return updatedMembership || undefined;
  }
  
  async deleteTeamMembership(id: number): Promise<boolean> {
    const result = await db.delete(teamMemberships).where(eq(teamMemberships.id, id));
    return (result.rowCount ?? 0) > 0;
  }
  
  // Shared goals operations
  async getSharedGoals(teamId: number): Promise<SharedGoal[]> {
    const sharedGoalsList = await db.select().from(sharedGoals).where(eq(sharedGoals.teamId, teamId));
    return sharedGoalsList;
  }
  
  async getUserSharedGoals(userId: number): Promise<SharedGoal[]> {
    const userSharedGoals = await db
      .select({
        id: sharedGoals.id,
        goalId: sharedGoals.goalId,
        teamId: sharedGoals.teamId,
        sharedBy: sharedGoals.sharedBy,
        sharedAt: sharedGoals.sharedAt,
        canEdit: sharedGoals.canEdit
      })
      .from(sharedGoals)
      .innerJoin(teamMemberships, eq(sharedGoals.teamId, teamMemberships.teamId))
      .where(eq(teamMemberships.userId, userId));
    return userSharedGoals;
  }
  
  async createSharedGoal(sharedGoal: InsertSharedGoal): Promise<SharedGoal> {
    const [newSharedGoal] = await db
      .insert(sharedGoals)
      .values(sharedGoal)
      .returning();
    return newSharedGoal;
  }
  
  async deleteSharedGoal(id: number): Promise<boolean> {
    const result = await db.delete(sharedGoals).where(eq(sharedGoals.id, id));
    return (result.rowCount ?? 0) > 0;
  }
  
  // Team activity operations
  async getTeamActivities(teamId: number, limit: number = 50): Promise<TeamActivity[]> {
    const activities = await db
      .select()
      .from(teamActivities)
      .where(eq(teamActivities.teamId, teamId))
      .orderBy(desc(teamActivities.createdAt))
      .limit(limit);
    return activities;
  }
  
  async createTeamActivity(activity: InsertTeamActivity): Promise<TeamActivity> {
    const [newActivity] = await db
      .insert(teamActivities)
      .values(activity)
      .returning();
    return newActivity;
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

      // Create demo user with hashed password
      const salt = randomBytes(16).toString("hex");
      const buf = (await scryptAsync("password", salt, 64)) as Buffer;
      const hashedPassword = `${buf.toString("hex")}.${salt}`;

      const demoUser = await this.createUser({
        username: "demo",
        email: "demo@example.com",
        password: hashedPassword,
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