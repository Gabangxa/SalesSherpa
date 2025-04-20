import { 
  User, InsertUser, 
  Goal, InsertGoal, 
  Task, InsertTask, 
  CheckIn, InsertCheckIn, 
  TimeOff, InsertTimeOff, 
  ChatMessage, InsertChatMessage,
  SalesMetrics, InsertSalesMetrics
} from "@shared/schema";

export interface IStorage {
  // User operations
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
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
}

export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private goals: Map<number, Goal>;
  private tasks: Map<number, Task>;
  private checkIns: Map<number, CheckIn>;
  private timeOffs: Map<number, TimeOff>;
  private chatMessages: Map<number, ChatMessage>;
  private salesMetrics: Map<number, SalesMetrics>;
  
  private currentId: { 
    users: number; 
    goals: number; 
    tasks: number; 
    checkIns: number; 
    timeOffs: number; 
    chatMessages: number; 
    salesMetrics: number;
  };

  constructor() {
    this.users = new Map();
    this.goals = new Map();
    this.tasks = new Map();
    this.checkIns = new Map();
    this.timeOffs = new Map();
    this.chatMessages = new Map();
    this.salesMetrics = new Map();
    
    this.currentId = {
      users: 1,
      goals: 1,
      tasks: 1,
      checkIns: 1,
      timeOffs: 1,
      chatMessages: 1,
      salesMetrics: 1
    };
    
    // Create a default user
    this.createUser({
      username: "demo",
      password: "password",
      name: "Jordan Doe",
      role: "Fintech Sales Manager"
    });
    
    // Create initial data for demo user
    this.setupDemoData(1);
  }
  
  private setupDemoData(userId: number) {
    // Create demo goals
    this.createGoal({
      userId,
      title: "Monthly Sales Target",
      targetAmount: 150000,
      currentAmount: 127500,
      deadline: new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0),
      category: "revenue"
    });
    
    this.createGoal({
      userId,
      title: "New Accounts",
      targetAmount: 10,
      currentAmount: 7,
      deadline: new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0),
      category: "accounts"
    });
    
    this.createGoal({
      userId,
      title: "Client Meetings",
      targetAmount: 30,
      currentAmount: 28,
      deadline: new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0),
      category: "activities"
    });
    
    // Create demo tasks
    this.createTask({
      userId,
      title: "Follow up with Acme Financial",
      description: "Send proposal by 3 PM",
      priority: "high",
      completed: false,
      dueDate: new Date(new Date().setHours(15, 0, 0, 0))
    });
    
    this.createTask({
      userId,
      title: "Prepare for TeamPay demo",
      description: "Review product updates and features",
      priority: "medium",
      completed: false,
      dueDate: new Date(new Date().setHours(17, 0, 0, 0))
    });
    
    this.createTask({
      userId,
      title: "Call back GlobalPay prospect",
      description: "Discuss integration requirements",
      priority: "medium",
      completed: false,
      dueDate: new Date(new Date().setHours(16, 0, 0, 0))
    });
    
    this.createTask({
      userId,
      title: "Update sales forecast",
      description: "Include Acme Financial opportunity",
      priority: "low",
      completed: false,
      dueDate: new Date(new Date().setHours(17, 30, 0, 0))
    });
    
    // Create demo check-ins
    const today = new Date();
    
    this.createCheckIn({
      userId,
      date: new Date(today.getFullYear(), today.getMonth(), today.getDate() - 2),
      achievements: "Contract signed with TechFinance",
      challenges: "No major challenges",
      goals: "Contact 5 cold leads from conference",
      reflection: "Productive day with a big win"
    });
    
    this.createCheckIn({
      userId,
      date: new Date(today.getFullYear(), today.getMonth(), today.getDate() - 1),
      achievements: "Secured meeting with Acme Financial",
      challenges: "Price objection from FastPay prospect",
      goals: "Prepare custom demo for Acme",
      reflection: "Good progress despite some obstacles"
    });
    
    this.createCheckIn({
      userId,
      date: new Date(today.getFullYear(), today.getMonth(), today.getDate()),
      achievements: "Demo to GlobalTech completed, positive feedback",
      challenges: "Delays in product roadmap affecting pitch",
      goals: "Follow up with 3 new leads",
      reflection: "Overall positive but need to address roadmap concerns"
    });
    
    // Create demo chat messages
    this.createChatMessage({
      userId,
      message: "Hi Jordan! I noticed you haven't checked in yet today. How did your client meetings go? Let's update your progress toward your weekly targets.",
      sender: "assistant",
      timestamp: new Date(new Date().setHours(10, 34, 0, 0))
    });
    
    this.createChatMessage({
      userId,
      message: "The meeting with Acme Financial went well! They're interested in our payment processing solution. I think we'll close next week.",
      sender: "user",
      timestamp: new Date(new Date().setHours(10, 38, 0, 0))
    });
    
    this.createChatMessage({
      userId,
      message: "That's excellent news about Acme Financial! This puts you at 85% of your monthly target. What's your follow-up strategy to ensure the deal closes next week?",
      sender: "assistant",
      timestamp: new Date(new Date().setHours(10, 40, 0, 0))
    });
    
    // Create sales metrics
    this.createSalesMetrics({
      userId,
      date: new Date(),
      monthlyTarget: 150000,
      monthlyCurrent: 127500,
      newAccountsTarget: 10,
      newAccountsCurrent: 7,
      meetingsTarget: 30,
      meetingsCurrent: 28,
      weeklyActivity: {
        monday: 4,
        tuesday: 6,
        wednesday: 5,
        thursday: 8,
        friday: 5,
        saturday: 0,
        sunday: 0
      }
    });
  }

  // User operations
  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username === username,
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = this.currentId.users++;
    const user: User = { ...insertUser, id };
    this.users.set(id, user);
    return user;
  }
  
  // Goal operations
  async getGoals(userId: number): Promise<Goal[]> {
    return Array.from(this.goals.values()).filter(goal => goal.userId === userId);
  }
  
  async getGoal(id: number): Promise<Goal | undefined> {
    return this.goals.get(id);
  }
  
  async createGoal(insertGoal: InsertGoal): Promise<Goal> {
    const id = this.currentId.goals++;
    const goal: Goal = { ...insertGoal, id };
    this.goals.set(id, goal);
    return goal;
  }
  
  async updateGoal(id: number, updates: Partial<Goal>): Promise<Goal | undefined> {
    const goal = this.goals.get(id);
    if (!goal) return undefined;
    
    const updatedGoal = { ...goal, ...updates };
    this.goals.set(id, updatedGoal);
    return updatedGoal;
  }
  
  async deleteGoal(id: number): Promise<boolean> {
    return this.goals.delete(id);
  }
  
  // Task operations
  async getTasks(userId: number): Promise<Task[]> {
    return Array.from(this.tasks.values())
      .filter(task => task.userId === userId)
      .sort((a, b) => {
        // Sort by priority (high, medium, low)
        const priorityOrder = { high: 0, medium: 1, low: 2 };
        const priorityA = priorityOrder[a.priority as keyof typeof priorityOrder];
        const priorityB = priorityOrder[b.priority as keyof typeof priorityOrder];
        
        if (priorityA !== priorityB) {
          return priorityA - priorityB;
        }
        
        // Then by due date
        if (a.dueDate && b.dueDate) {
          return a.dueDate.getTime() - b.dueDate.getTime();
        }
        
        return 0;
      });
  }
  
  async getTask(id: number): Promise<Task | undefined> {
    return this.tasks.get(id);
  }
  
  async createTask(insertTask: InsertTask): Promise<Task> {
    const id = this.currentId.tasks++;
    const task: Task = { ...insertTask, id };
    this.tasks.set(id, task);
    return task;
  }
  
  async updateTask(id: number, updates: Partial<Task>): Promise<Task | undefined> {
    const task = this.tasks.get(id);
    if (!task) return undefined;
    
    const updatedTask = { ...task, ...updates };
    this.tasks.set(id, updatedTask);
    return updatedTask;
  }
  
  async deleteTask(id: number): Promise<boolean> {
    return this.tasks.delete(id);
  }
  
  // Check-in operations
  async getCheckIns(userId: number): Promise<CheckIn[]> {
    return Array.from(this.checkIns.values())
      .filter(checkIn => checkIn.userId === userId)
      .sort((a, b) => b.date.getTime() - a.date.getTime()); // Sort by date descending
  }
  
  async getCheckIn(id: number): Promise<CheckIn | undefined> {
    return this.checkIns.get(id);
  }
  
  async createCheckIn(insertCheckIn: InsertCheckIn): Promise<CheckIn> {
    const id = this.currentId.checkIns++;
    const checkIn: CheckIn = { ...insertCheckIn, id };
    this.checkIns.set(id, checkIn);
    return checkIn;
  }
  
  // Time off operations
  async getTimeOffPeriods(userId: number): Promise<TimeOff[]> {
    return Array.from(this.timeOffs.values())
      .filter(timeOff => timeOff.userId === userId)
      .sort((a, b) => a.startDate.getTime() - b.startDate.getTime());
  }
  
  async createTimeOff(insertTimeOff: InsertTimeOff): Promise<TimeOff> {
    const id = this.currentId.timeOffs++;
    const timeOff: TimeOff = { ...insertTimeOff, id };
    this.timeOffs.set(id, timeOff);
    return timeOff;
  }
  
  // Chat messages operations
  async getChatMessages(userId: number): Promise<ChatMessage[]> {
    return Array.from(this.chatMessages.values())
      .filter(message => message.userId === userId)
      .sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());
  }
  
  async createChatMessage(insertChatMessage: InsertChatMessage): Promise<ChatMessage> {
    const id = this.currentId.chatMessages++;
    const chatMessage: ChatMessage = { ...insertChatMessage, id };
    this.chatMessages.set(id, chatMessage);
    return chatMessage;
  }
  
  // Sales metrics operations
  async getSalesMetrics(userId: number): Promise<SalesMetrics | undefined> {
    return Array.from(this.salesMetrics.values())
      .find(metrics => metrics.userId === userId);
  }
  
  async createSalesMetrics(insertSalesMetrics: InsertSalesMetrics): Promise<SalesMetrics> {
    const id = this.currentId.salesMetrics++;
    const salesMetrics: SalesMetrics = { ...insertSalesMetrics, id };
    this.salesMetrics.set(id, salesMetrics);
    return salesMetrics;
  }
  
  async updateSalesMetrics(userId: number, updates: Partial<SalesMetrics>): Promise<SalesMetrics | undefined> {
    const metrics = Array.from(this.salesMetrics.values())
      .find(metrics => metrics.userId === userId);
      
    if (!metrics) return undefined;
    
    const updatedMetrics = { ...metrics, ...updates };
    this.salesMetrics.set(metrics.id, updatedMetrics);
    return updatedMetrics;
  }
}

export const storage = new MemStorage();
