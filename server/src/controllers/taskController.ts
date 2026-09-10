import type { Request, Response } from "express";
import { getAuth } from "@clerk/express";
import { prisma } from "../db.js";
import { inngest } from "../inngest/index.js";
import type { Prisma } from "@prisma/client";
import type { Priority, TaskStatus, TaskType } from "@projexo/types";

const getErrorMessage = (error: unknown): string => {
  if (error instanceof Error) return error.message;
  if (typeof error === "object" && error !== null && "message" in error) {
    return String((error as { message: unknown }).message);
  }
  return "Internal server error";
};

// Get paginated tasks for a project
export const getProjectTasks = async (req: Request, res: Response) => {
  try {
    const { userId } = getAuth(req);
    const { projectId } = req.params;

    if (!userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    if (!projectId || typeof projectId !== "string") {
      return res.status(400).json({ message: "Valid project ID is required" });
    }

    const project = await prisma.project.findUnique({
      where: { id: projectId },
      include: {
        workspace: {
          include: { members: true },
        },
        members: true,
      },
    });

    if (!project) {
      return res.status(404).json({ message: "Project not found" });
    }

    const isMember = project.members.some((m) => m.userId === userId);
    const isWorkspaceMember = project.workspace.members.some((m) => m.userId === userId);

    if (!isMember && !isWorkspaceMember) {
      return res.status(403).json({ message: "Access denied" });
    }

    const page = Math.max(1, parseInt(String(req.query.page || "1"), 10));
    const limit = Math.min(100, Math.max(1, parseInt(String(req.query.limit || "50"), 10)));
    const skip = (page - 1) * limit;

    const status = req.query.status as TaskStatus | undefined;
    const priority = req.query.priority as Priority | undefined;

    const whereClause: Prisma.TaskWhereInput = { projectId };
    if (status) whereClause.status = status;
    if (priority) whereClause.priority = priority;

    const [tasks, total] = await prisma.$transaction([
      prisma.task.findMany({
        where: whereClause,
        include: {
          assignee: {
            select: { id: true, name: true, email: true, image: true },
          },
        },
        orderBy: { due_date: "asc" },
        skip,
        take: limit,
      }),
      prisma.task.count({ where: whereClause }),
    ]);

    return res.json({
      tasks,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: getErrorMessage(error) });
  }
};

// Create task
export const createTask = async (req: Request, res: Response) => {
  try {
    const { userId } = getAuth(req);
    const {
      projectId,
      title,
      description,
      type,
      status,
      priority,
      assigneeId,
      due_date,
    } = req.body as {
      projectId: string;
      title: string;
      description?: string;
      type?: TaskType;
      status?: TaskStatus;
      priority?: Priority;
      assigneeId?: string;
      due_date: string;
    };
    const origin = req.get("origin") || process.env.CLIENT_URL || "http://localhost:5173";

    if (!userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    if (!projectId || !title || !due_date) {
      return res.status(400).json({ message: "Project ID, title, and due date are required" });
    }

    const project = await prisma.project.findUnique({
      where: { id: projectId },
      include: {
        members: true,
        workspace: {
          include: { members: true },
        },
      },
    });

    if (!project) {
      return res.status(404).json({ message: "Project not found" });
    }

    const isTeamLead = project.team_lead === userId;
    const isProjectMember = project.members.some((member) => member.userId === userId);
    const isWorkspaceAdmin = project.workspace.members.some(
      (m) => m.userId === userId && m.role === "ADMIN"
    );

    if (!isTeamLead && !isProjectMember && !isWorkspaceAdmin) {
      return res
        .status(403)
        .json({ message: "You do not have permission to create tasks in this project" });
    }

    const normalizedAssigneeId = assigneeId ? assigneeId : null;

    if (
      normalizedAssigneeId &&
      !project.members.some((member) => member.userId === normalizedAssigneeId)
    ) {
      return res.status(400).json({
        message: "Assignee must be an existing member of this project",
      });
    }

    const task = await prisma.task.create({
      data: {
        projectId,
        title,
        description: description || null,
        priority: priority || "MEDIUM",
        assigneeId: normalizedAssigneeId,
        status: status || "TODO",
        type: type || "TASK",
        due_date: new Date(due_date),
      },
      include: {
        assignee: {
          select: { id: true, name: true, email: true, image: true },
        },
      },
    });

    if (normalizedAssigneeId) {
      try {
        await inngest.send({
          name: "app/task.assigned",
          data: {
            taskId: task.id,
            origin,
          },
        });
      } catch (inngestErr) {
        console.error("Warning: Failed to queue task assignment event:", inngestErr);
      }
    }

    return res.status(201).json({ task, message: "Task created successfully" });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: getErrorMessage(error) });
  }
};

// Update task
export const updateTask = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { userId } = getAuth(req);

    if (!userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    if (!id || typeof id !== "string") {
      return res.status(400).json({ message: "Valid task ID is required" });
    }

    const task = await prisma.task.findUnique({
      where: { id },
      include: {
        project: {
          include: {
            members: true,
            workspace: {
              include: { members: true },
            },
          },
        },
      },
    });

    if (!task) {
      return res.status(404).json({ message: "Task not found" });
    }

    const isTeamLead = task.project.team_lead === userId;
    const isProjectMember = task.project.members.some((m) => m.userId === userId);
    const isWorkspaceAdmin = task.project.workspace.members.some(
      (m) => m.userId === userId && m.role === "ADMIN"
    );

    if (!isTeamLead && !isProjectMember && !isWorkspaceAdmin) {
      return res
        .status(403)
        .json({ message: "You don't have permission to update tasks in this project" });
    }

    const updateData = { ...req.body };
    if (updateData.due_date) {
      updateData.due_date = new Date(updateData.due_date);
    }
    if (updateData.assigneeId === "") {
      updateData.assigneeId = null;
    }

    if (updateData.assigneeId) {
      const isValidAssignee = task.project.members.some(
        (m) => m.userId === updateData.assigneeId
      );
      if (!isValidAssignee) {
        return res.status(400).json({
          message: "Assignee must be an existing member of this project",
        });
      }
    }

    const updatedTask = await prisma.task.update({
      where: { id },
      data: updateData,
      include: {
        assignee: {
          select: { id: true, name: true, email: true, image: true },
        },
      },
    });

    return res.json({ task: updatedTask, message: "Task updated successfully" });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: getErrorMessage(error) });
  }
};

// Delete task
export const deleteTask = async (req: Request, res: Response) => {
  try {
    const { userId } = getAuth(req);
    const taskIds: string[] = req.body.taskIds || req.body.tasksIds || [];

    if (!userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    if (!Array.isArray(taskIds) || taskIds.length === 0) {
      return res.status(400).json({ message: "No task IDs provided" });
    }

    const tasks = await prisma.task.findMany({
      where: { id: { in: taskIds } },
      include: {
        project: {
          include: {
            workspace: {
              include: { members: true },
            },
          },
        },
      },
    });

    if (tasks.length !== taskIds.length) {
      return res.status(404).json({
        message: "One or more tasks were not found or have already been deleted",
      });
    }

    const isUnauthorized = tasks.some((t) => {
      const isTeamLead = t.project.team_lead === userId;
      const isWorkspaceAdmin = t.project.workspace.members.some(
        (m) => m.userId === userId && m.role === "ADMIN"
      );
      return !isTeamLead && !isWorkspaceAdmin;
    });

    if (isUnauthorized) {
      return res.status(403).json({
        message: "You do not have permission to delete tasks across one or more of these projects",
      });
    }

    await prisma.task.deleteMany({
      where: { id: { in: taskIds } },
    });

    return res.json({ message: "Tasks deleted successfully" });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: getErrorMessage(error) });
  }
};