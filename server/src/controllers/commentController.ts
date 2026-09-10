import { getAuth } from "@clerk/express";
import { prisma } from "../db.js";
import type { Request, Response } from "express";

const getErrorMessage = (error: unknown): string => {
  if (error instanceof Error) return error.message;
  if (typeof error === "object" && error !== null && "message" in error) {
    return String((error as { message: unknown }).message);
  }
  return "Internal server error";
};

// Add comment
export const addComment = async (req: Request, res: Response) => {
  try {
    const { userId } = getAuth(req);
    const { content, taskId } = req.body;

    if (!userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    if (!taskId || !content?.trim()) {
      return res.status(400).json({ message: "Task ID and content are required" });
    }

    // Check if task exists and fetch its project and workspace membership
    const task = await prisma.task.findUnique({
      where: { id: taskId },
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

    const isProjectMember = task.project.members.some((m) => m.userId === userId);
    const isWorkspaceAdmin = task.project.workspace.members.some(
      (m) => m.userId === userId && m.role === "ADMIN"
    );

    if (!isProjectMember && !isWorkspaceAdmin) {
      return res
        .status(403)
        .json({ message: "You do not have permission to comment on this task" });
    }

    const comment = await prisma.comment.create({
      data: {
        taskId,
        content: content.trim(),
        userId,
      },
      include: {
        user: {
          select: { id: true, name: true, email: true, image: true },
        },
      },
    });

    return res.json({ comment });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: getErrorMessage(error) });
  }
};

// Get comments for task (Secured)
export const getTaskComments = async (req: Request, res: Response) => {
  try {
    const { userId } = getAuth(req);
    const { taskId } = req.params;

    if (!userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    if (!taskId || typeof taskId !== "string") {
      return res.status(400).json({ message: "Valid task ID is required" });
    }

    // Verify task exists and caller belongs to the project or workspace
    const task = await prisma.task.findUnique({
      where: { id: taskId },
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

    const isProjectMember = task.project.members.some((m) => m.userId === userId);
    const isWorkspaceMember = task.project.workspace.members.some((m) => m.userId === userId);

    if (!isProjectMember && !isWorkspaceMember) {
      return res.status(403).json({ message: "Access denied to task comments" });
    }

    const comments = await prisma.comment.findMany({
      where: { taskId },
      include: {
        user: {
          select: { id: true, name: true, email: true, image: true },
        },
      },
      orderBy: { createdAt: "asc" },
    });

    return res.json({ comments });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: getErrorMessage(error) });
  }
};