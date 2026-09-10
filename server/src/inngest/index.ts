import { Inngest } from "inngest";
import { prisma } from "../db.js";
import sendEmail from "../configs/nodemailer.js";

// Create a client to send and receive events
export const inngest = new Inngest({ id: "projexo" });

const formatName = (firstName?: string | null, lastName?: string | null): string => {
  const parts = [firstName, lastName].filter(Boolean);
  return parts.length > 0 ? parts.join(" ") : "Anonymous User";
};

// Inngest Function to save user data to a database
const syncUserCreation = inngest.createFunction(
  {
    id: 'sync-user-from-clerk',
    triggers: [{ event: 'clerk/user.created' }]
  },
  async ({ event }) => {
    const { data } = event;
    const email = data?.email_addresses?.[0]?.email_address || "";
    const name = formatName(data?.first_name, data?.last_name);
    const image = data?.image_url || "";

    await prisma.user.upsert({
      where: { id: data.id },
      update: {
        email,
        name,
        image,
      },
      create: {
        id: data.id,
        email,
        name,
        image,
      },
    });
  }
);

// Inngest function to delete user from database
const syncUserDeletion = inngest.createFunction(
  {
    id: 'delete-user-with-clerk',
    triggers: { event: 'clerk/user.deleted' }
  },
  async ({ event }) => {
    const { data } = event;
    await prisma.user.deleteMany({
      where: {
        id: data.id,
      }
    });
  }
);

// Inngest function to update user data in database
const syncUserUpdation = inngest.createFunction(
  {
    id: 'update-user-from-clerk',
    triggers: { event: 'clerk/user.updated' }
  },
  async ({ event }) => {
    const { data } = event;
    const email = data?.email_addresses?.[0]?.email_address || "";
    const name = formatName(data?.first_name, data?.last_name);
    const image = data?.image_url || "";

    await prisma.user.upsert({
      where: { id: data.id },
      update: { 
        email,
        name,
        image,
      },
      create: {
        id: data.id,
        email,
        name,
        image,
      },
    });
  }
);

// Inngest function to save workspace data to a database
const syncWorkspaceCreation = inngest.createFunction(
  {
    id: 'sync-workspace-from-clerk',
    triggers: { event: 'clerk/organization.created' },
  },
  async ({ event }) => {
    const { data } = event;

    // Ensure the creator user exists in database to satisfy foreign key constraints
    if (data.created_by) {
      await prisma.user.upsert({
        where: { id: data.created_by },
        update: {},
        create: {
          id: data.created_by,
          email: "",
          name: "Workspace Owner",
          image: "",
        },
      });
    }

    await prisma.workspace.upsert({
      where: { id: data.id },
      update: {
        name: data.name,
        slug: data.slug,
        image_url: data.image_url || "",
      },
      create: {
        id: data.id,
        name: data.name,
        slug: data.slug,
        ownerId: data.created_by,
        image_url: data.image_url || "",
      }
    });

    if (data.created_by) {
      await prisma.workspaceMember.upsert({
        where: {
          userId_workspaceId: {
            userId: data.created_by,
            workspaceId: data.id,
          },
        },
        update: {
          role: "ADMIN",
        },
        create: {
          userId: data.created_by,
          workspaceId: data.id,
          role: "ADMIN"
        }
      });
    }
  }
);

// Inngest function to update workspace data in database
const syncWorkspaceUpdation = inngest.createFunction(
  {
    id: 'update-workspace-from-clerk',
    triggers: { event: 'clerk/organization.updated' }
  },
  async ({ event }) => {
    const { data } = event;
    await prisma.workspace.updateMany({
      where: {
        id: data.id
      },
      data: {
        name: data.name,
        slug: data.slug,
        image_url: data.image_url || "",
      }
    });
  }
);

// Inngest function to delete workspace from database
const syncWorkspaceDeletion = inngest.createFunction(
  {
    id: `delete-workspace-with-clerk`,
    triggers: { event: `clerk/organization.deleted` }
  },
  async ({ event }) => {
    const { data } = event;
    await prisma.workspace.deleteMany({
      where: {
        id: data.id
      }
    });
  }
);

// Ingest function to save workspace member data to a database
const syncWorkspaceMemberCreation = inngest.createFunction(
  {
    id: 'sync-workspace-member-from-clerk',
    triggers: { event: 'clerk/organizationInvitation.accepted' },
  },
  async ({ event }) => {
    const { data } = event;

    const rawRole = String(data.role_name || data.role || '').toUpperCase();
    const role = rawRole.includes('ADMIN') ? 'ADMIN' : 'MEMBER';

    // Ensure member exists before inserting membership
    if (data.user_id) {
      await prisma.user.upsert({
        where: { id: data.user_id },
        update: {},
        create: {
          id: data.user_id,
          email: "",
          name: "Team Member",
          image: "",
        },
      });
    }

    await prisma.workspaceMember.upsert({
      where: {
        userId_workspaceId: {
          userId: data.user_id,
          workspaceId: data.organization_id,
        },
      },
      update: {
        role,
      },
      create: {
        userId: data.user_id,
        workspaceId: data.organization_id,
        role,
      }
    });
  }
);

// Inngest Function to send Email on Task creation
const sendTaskAssignmentEmail = inngest.createFunction(
  { 
    id: "send-task-assignment-email",
    triggers: { event: "app/task.assigned" },
  },
  async ({ event, step }) => {
    const { taskId, origin } = event.data;

    const task = await prisma.task.findUnique({
      where: { id: taskId },
      include: { assignee: true, project: true },
    });

    if (!task || !task.assignee) {
      return;
    }

    await sendEmail(
      task.assignee.email,
      `New Task Assignment in ${task.project.name}`,
      `<div style="max-width: 600px;">
        <h2>Hi ${task.assignee.name}, 👋</h2>

        <p style="font-size: 16px;">You've been assigned a new task:</p>

        <p style="font-size: 18px; font-weight: bold; color: #007bff; margin: 8px 0;">${
          task.title
        }</p>

        <div style="border: 1px solid #ddd; padding: 12px 16px; border-radius: 6px; margin-bottom: 30px;">
          <p style="margin: 6px 0;">
            <strong>Description:</strong> ${task.description || "No description provided"}
          </p>
          <p style="margin: 6px 0;"><strong>Due Date:</strong> ${new Date(
            task.due_date
          ).toLocaleDateString()}</p>
        </div>

        <a href="${origin}" style="background-color: #007bff; padding: 12px 24px; border-radius: 5px; color: #fff; font-weight: 600; font-size: 16px; text-decoration: none;">
          View Task
        </a>

        <p style="margin-top: 20px; font-size: 14px; color: #6c757d;">
          Please make sure to review and complete it before the due date.
        </p>
      </div>`
    );

    const now = new Date();
    const dueDate = new Date(task.due_date);

    // Only wait and remind if due date is strictly in the future and not today
    if (dueDate > now && dueDate.toDateString() !== now.toDateString()) {
      await step.sleepUntil("wait-for-the-due-date", dueDate);

      await step.run("check-and-send-task-reminder", async () => {
        const currentTask = await prisma.task.findUnique({
          where: { id: taskId },
          include: { assignee: true, project: true },
        });

        if (!currentTask || !currentTask.assignee || currentTask.status === "DONE") {
          return;
        }

        await sendEmail(
          currentTask.assignee.email,
          `Reminder for ${currentTask.project.name}`,
          `<div style="max-width: 600px;">
            <h2>Hi ${currentTask.assignee.name}, 👋</h2>

            <p style="font-size: 16px;">You have a task due in ${
              currentTask.project.name
            }:</p>

            <p style="font-size: 18px; font-weight: bold; color: #007bff; margin: 8px 0;">${
              currentTask.title
            }</p>

            <div style="border: 1px solid #ddd; padding: 12px 16px; border-radius: 6px; margin-bottom: 30px;">
              <p style="margin: 6px 0;">
                <strong>Description:</strong> ${currentTask.description || "No description provided"}
              </p>
              <p style="margin: 6px 0;"><strong>Due Date:</strong> ${new Date(
                currentTask.due_date
              ).toLocaleDateString()}</p>
            </div>

            <a href="${origin}" style="background-color: #007bff; padding: 12px 24px; border-radius: 5px; color: #fff; font-weight: 600; font-size: 16px; text-decoration: none;">
              View Task
            </a>

            <p style="margin-top: 20px; font-size: 14px; color: #6c757d;">
              Please make sure to review and complete it before the due date.
            </p>
          </div>`
        );
      });
    }
  }
);

export const functions = [
  syncUserCreation,
  syncUserDeletion,
  syncUserUpdation,
  syncWorkspaceCreation,
  syncWorkspaceUpdation,
  syncWorkspaceDeletion,
  syncWorkspaceMemberCreation,
  sendTaskAssignmentEmail,
];