import { Request, Response } from "express";
import { storage } from "../storage";
import { sendMessageToUser, WebSocketMessage, WebSocketMessageType } from "../websocket";
import { log } from "../vite";
import { UserRole, NotificationType, ActivityType } from "../constants";

export const getTeam = async (req: Request, res: Response) => {
  try {
    const userId = parseInt(req.params.userId);

    // Security: Users can only access their own teams
    if (userId !== req.body.userId) {
      return res.status(403).json({ message: "Not authorized to view teams for this user" });
    }

    const teams = await storage.getUserTeams(userId);
    return res.status(200).json(teams);
  } catch (error) {
    return res.status(500).json({ message: "Server error" });
  }
};

export const createTeam = async (req: Request, res: Response) => {
  try {
    const teamData = {
      ...req.body,
      ownerId: req.body.userId
    };

    const team = await storage.createTeam(teamData);

    // Create team activity for team creation
    await storage.createTeamActivity({
      teamId: team.id,
      userId: req.body.userId,
      activityType: ActivityType.TEAM_CREATED,
      description: `Team "${team.name}" was created`,
    });

    // Send WebSocket notification to team owner about new team
    const teamCreatedMessage: WebSocketMessage = {
      type: WebSocketMessageType.NOTIFICATION,
      payload: {
        type: NotificationType.TEAM_CREATED,
        team: team,
        timestamp: new Date().toISOString()
      },
      timestamp: Date.now()
    };

    sendMessageToUser(req.body.userId, teamCreatedMessage);
    log(`Sent WebSocket notification to user ${req.body.userId} about team creation: ${team.name}`);

    return res.status(201).json(team);
  } catch (error) {
    return res.status(500).json({ message: "Server error" });
  }
};

export const joinTeam = async (req: Request, res: Response) => {
  try {
    const { inviteCode } = req.body;
    const userId = req.body.userId;

    // Find team by invite code
    const team = await storage.getTeamByInviteCode(inviteCode);
    if (!team) {
      return res.status(404).json({ message: "Invalid invite code" });
    }

    // Check if user is already a member
    const existingMembership = await storage.getUserTeamMembership(userId, team.id);
    if (existingMembership) {
      return res.status(409).json({ message: "Already a member of this team" });
    }

    // Add user to team
    const membership = await storage.createTeamMembership({
      teamId: team.id,
      userId,
      role: UserRole.MEMBER
    });

    // Get user details for activity log
    const user = await storage.getUser(userId);

    // Create team activity for member joining
    await storage.createTeamActivity({
      teamId: team.id,
      userId,
      activityType: ActivityType.MEMBER_JOINED,
      description: `${user?.name || 'Unknown'} joined the team`,
    });

    // Send WebSocket notification to all team members about new member
    const teamMemberships = await storage.getTeamMemberships(team.id);
    const memberJoinedMessage: WebSocketMessage = {
      type: WebSocketMessageType.NOTIFICATION,
      payload: {
        type: NotificationType.MEMBER_JOINED,
        team: team,
        user: { id: user?.id, name: user?.name },
        timestamp: new Date().toISOString()
      },
      timestamp: Date.now()
    };

    // Broadcast to all team members
    for (const member of teamMemberships) {
      sendMessageToUser(member.userId, memberJoinedMessage);
    }
    log(`Broadcasted member joined notification to team ${team.name} (${teamMemberships.length} members)`);

    return res.status(201).json({ team, membership });
  } catch (error) {
    return res.status(500).json({ message: "Server error" });
  }
};

export const getTeamActivities = async (req: Request, res: Response) => {
  try {
    const teamId = parseInt(req.params.teamId);
    const limit = parseInt(req.query.limit as string) || 20;

    // Verify user is member of the team
    const membership = await storage.getUserTeamMembership(req.body.userId, teamId);
    if (!membership) {
      return res.status(403).json({ message: "Not a member of this team" });
    }

    const activities = await storage.getTeamActivities(teamId, limit);
    return res.status(200).json(activities);
  } catch (error) {
    return res.status(500).json({ message: "Server error" });
  }
};
