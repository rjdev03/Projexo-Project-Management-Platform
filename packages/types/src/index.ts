// ==============================
// Enums
// ==============================
export type WorkspaceRole = 'ADMIN' | 'MEMBER';
export type TaskStatus = 'TODO' | 'IN_PROGRESS' | 'DONE';
export type TaskType = 'TASK' | 'BUG' | 'FEATURE' | 'IMPROVEMENT' | 'OTHER';
export type ProjectStatus = 'ACTIVE' | 'PLANNING' | 'COMPLETED' | 'ON_HOLD' | 'CANCELLED';
export type Priority = 'LOW' | 'MEDIUM' | 'HIGH';

// ==============================
// Domain Models
// ==============================
export interface User {
  id: string;
  name: string;
  email: string;
  image?: string;
  createdAt?: string | Date;
  updatedAt?: string | Date;
}

export interface WorkspaceMember {
  id: string;
  userId: string;
  workspaceId: string;
  message?: string;
  role: WorkspaceRole;
  user: User;
  workspace?: Workspace;
}

export interface ProjectMember {
  id: string;
  userId: string;
  projectId: string;
  user: User;
  project?: Project;
}

export interface Comment {
  id: string;
  content: string;
  userId: string;
  taskId: string;
  createdAt: string | Date;
  user?: User;
}

export interface Task {
  id: string;
  projectId: string;
  title: string;
  description?: string | null;
  status: TaskStatus;
  type: TaskType;
  priority: Priority;
  assigneeId?: string | null;
  due_date: string | Date;
  createdAt?: string | Date;
  updatedAt?: string | Date;
  assignee?: User | null;
  comments?: Comment[];
}

export interface Project {
  id: string;
  name: string;
  description?: string | null;
  priority: Priority;
  status: ProjectStatus;
  start_date?: string | Date | null;
  end_date?: string | Date | null;
  team_lead: string;
  workspaceId: string;
  progress: number;
  createdAt: string | Date;
  updatedAt: string | Date;
  owner?: User;
  members: ProjectMember[];
  tasks: Task[];
}

export interface Workspace {
  id: string;
  name: string;
  slug: string;
  description?: string | null;
  settings?: Record<string, unknown>;
  ownerId: string;
  image_url?: string;
  createdAt: string | Date;
  updatedAt: string | Date;
  owner?: User;
  members?: WorkspaceMember[];
  membersCount?: number;
  projects: Project[];
}

// ==============================
// API Request & Response DTOs
// ==============================
export interface CreateProjectDto {
  workspaceId: string;
  name: string;
  description?: string;
  status: ProjectStatus;
  priority: Priority;
  start_date?: string;
  end_date?: string;
  team_lead?: string;
  team_members?: string[];
  progress?: number;
}

export interface UpdateProjectDto {
  id: string;
  workspaceId: string;
  name?: string;
  description?: string;
  status?: ProjectStatus;
  priority?: Priority;
  start_date?: string;
  end_date?: string;
  progress?: number;
}

export interface AddProjectMemberDto {
  projectId: string;
  email: string;
}

export interface CreateTaskDto {
  projectId: string;
  title: string;
  description?: string;
  type: TaskType;
  status: TaskStatus;
  priority: Priority;
  assigneeId?: string;
  due_date: string;
}

export interface UpdateTaskDto {
  title?: string;
  description?: string;
  status?: TaskStatus;
  type?: TaskType;
  priority?: Priority;
  assigneeId?: string;
  due_date?: string;
}

export interface DeleteTasksDto {
  taskIds: string[];
  tasksIds?: string[];
}

export interface DeleteTaskPayload {
  projectId?: string;
  taskIds: string[];
}

export interface AddCommentDto {
  taskId: string;
  content: string;
}

export interface AddWorkspaceMemberDto {
  email: string;
  role: WorkspaceRole;
  workspaceId: string;
  message?: string;
}

// ==============================
// API Response Wrappers
// ==============================
export interface GetWorkspacesResponse {
  workspaces: Workspace[];
}

export interface ProjectResponse {
  project: Project;
  message: string;
}

export interface TaskResponse {
  task: Task;
  message: string;
}

export interface CommentsResponse {
  comments: Comment[];
}

export interface CommentResponse {
  comment: Comment;
}

// ==============================
// Event Payloads (Inngest / Webhooks)
// ==============================
export interface TaskAssignedEventData {
  taskId: string;
  origin: string;
}