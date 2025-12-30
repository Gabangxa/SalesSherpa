// User Roles
export enum UserRole {
  ADMIN = 'admin',
  USER = 'user',
  MEMBER = 'member',
  OWNER = 'owner',
}

// WebSocket Notification Types
export enum NotificationType {
  GOAL_CREATED = 'goal_created',
  GOAL_UPDATED = 'goal_updated',
  GOAL_DELETED = 'goal_deleted',
  TEAM_CREATED = 'team_created',
  MEMBER_JOINED = 'member_joined',
  GOAL_SHARED = 'goal_shared',
  AI_CHAT_RESPONSE = 'ai_chat_response',
  CHECK_IN_ALERT = 'check_in_alert',
  CONNECTION_UPDATE = 'connection_update',
}

// Chat Sender Types
export enum ChatSender {
  USER = 'user',
  ASSISTANT = 'assistant',
}

// Activity Types
export enum ActivityType {
  TEAM_CREATED = 'team_created',
  MEMBER_JOINED = 'member_joined',
  GOAL_SHARED = 'goal_shared',
}
