import type { Request, Response } from "express";
import { getAuth } from "@clerk/express";
import { prisma } from "../db.js";

const getErrorMessage = (error: unknown): string => {
  if (error instanceof Error) return error.message;
  if (typeof error === "object" && error !== null && "message" in error) {
    return String((error as { message: unknown }).message);
  }
  return "Internal server error";
};

// Get all workspaces for user
export const getUserWorkspaces = async (req: Request, res: Response) => {
  try {
    const { userId } = getAuth(req);

    if (!userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const workspaces = await prisma.workspace.findMany({
      where: {
        members: { some: { userId } },
      },
      include: {
        members: {
          include: {
            user: {
              select: { id: true, name: true, email: true, image: true },
            },
          },
        },
        projects: {
          include: {
            tasks: {
              include: {
                assignee: {
                  select: { id: true, name: true, email: true, image: true },
                },
              },
            },
            members: {
              include: {
                user: {
                  select: { id: true, name: true, email: true, image: true },
                },
              },
            },
          },
        },
        owner: {
          select: { id: true, name: true, email: true, image: true },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return res.json({ workspaces });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: getErrorMessage(error) });
  }
};

// Add member to workspace
export const addMember = async (req: Request, res: Response) => {
  try {
    const { userId } = getAuth(req);
    const { email, role, workspaceId, message } = req.body;

    if (!userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    if (!workspaceId || !role || !email) {
      return res.status(400).json({ message: "Missing required parameters" });
    }

    if (!["ADMIN", "MEMBER"].includes(role)) {
      return res.status(400).json({ message: "Invalid role" });
    }

    // Check if user exists
    const user = await prisma.user.findUnique({ where: { email } });

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Fetch workspace
    const workspace = await prisma.workspace.findUnique({
      where: { id: workspaceId },
      include: { members: true },
    });

    if (!workspace) {
      return res.status(404).json({ message: "Workspace not found" });
    }

    // Check creator has admin role
    const callerMember = workspace.members.find(
      (member) => member.userId === userId && member.role === "ADMIN"
    );

    if (!callerMember) {
      return res.status(403).json({ message: "You do not have admin privileges" });
    }

    // Check if invited user is already a member (fixed: compare with user.id, not userId)
    const existingMember = workspace.members.find(
      (member) => member.userId === user.id
    );

    if (existingMember) {
      return res.status(400).json({ message: "User is already a member" });
    }

    const member = await prisma.workspaceMember.create({
      data: {
        userId: user.id,
        workspaceId,
        role,
        message: message || "",
      },
    });

    return res.json({ member, message: "Member added successfully" });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: getErrorMessage(error) });
  }
};