// Enums matching schema.prisma
export type WorkspaceRole = 'ADMIN' | 'MEMBER';

export type TaskStatus = 'TODO' | 'IN_PROGRESS' | 'DONE';

export type TaskType = 'TASK' | 'BUG' | 'FEATURE' | 'IMPROVEMENT' | 'OTHER';

export type ProjectStatus = 'ACTIVE' | 'PLANNING' | 'COMPLETED' | 'ON_HOLD' | 'CANCELLED';

export type Priority = 'LOW' | 'MEDIUM' | 'HIGH';

// Entity Interfaces
export interface User {
  id: string;
  name: string;
  email: string;
  image?: string;
  createdAt?: string | Date;
  updatedAt: string | Date;
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
  assigneeId: string;
  due_date: string | Date;
  createdAt?: string;
  updatedAt?: string;
  assignee?: User;
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