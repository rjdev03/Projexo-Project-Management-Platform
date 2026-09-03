import { createSlice, type PayloadAction } from "@reduxjs/toolkit";
import { dummyWorkspaces } from "../assets/assets";

import type { Project, Task, Workspace } from "../types";

export interface WorkspaceState {
    workspaces: Workspace[];
    currentWorkspace: Workspace | null;
    loading: boolean;
}

export interface DeleteTaskPayload {
    projectId: string;
    taskIds: string[];
}

const initialState: WorkspaceState = {
    workspaces: dummyWorkspaces || [],
    currentWorkspace: dummyWorkspaces?.[1] || null,
    loading: false,
};

const workspaceSlice = createSlice({
    name: "workspace",
    initialState,
    reducers: {
        setWorkspaces: (state, action: PayloadAction<Workspace[]>) => {
            state.workspaces = action.payload;
        },
        setCurrentWorkspace: (state, action: PayloadAction<string>) => {
            localStorage.setItem("currentWorkspaceId", action.payload);
            state.currentWorkspace =
                state.workspaces.find((w) => w.id === action.payload) || null;
        },
        addWorkspace: (state, action: PayloadAction<Workspace>) => {
            state.workspaces.push(action.payload);

            if (state.currentWorkspace?.id !== action.payload.id) {
                state.currentWorkspace = action.payload;
            }
        },
        updateWorkspace: (state, action: PayloadAction<Workspace>) => {
            state.workspaces = state.workspaces.map((w) =>
                w.id === action.payload.id ? action.payload : w
            );

            if (state.currentWorkspace?.id === action.payload.id) {
                state.currentWorkspace = action.payload;
            }
        },
        deleteWorkspace: (state, action: PayloadAction<string>) => {
            state.workspaces = state.workspaces.filter((w) => w.id !== action.payload);
            if (state.currentWorkspace?.id === action.payload) {
                state.currentWorkspace = state.workspaces[0] || null;
            }
        },
        addProject: (state, action: PayloadAction<Project>) => {
            if (!state.currentWorkspace) return;

            state.currentWorkspace.projects.push(action.payload);
            state.workspaces = state.workspaces.map((w) =>
                w.id === state.currentWorkspace?.id
                    ? { ...w, projects: w.projects.concat(action.payload) }
                    : w
            );
        },
        addTask: (state, action: PayloadAction<Task>) => {
            if (!state.currentWorkspace) return;

            state.currentWorkspace.projects = state.currentWorkspace.projects.map((p) => {
                console.log(p.id, action.payload.projectId, p.id === action.payload.projectId);
                if (p.id === action.payload.projectId) {
                    p.tasks.push(action.payload);
                }
                return p;
            });

            state.workspaces = state.workspaces.map((w) =>
                w.id === state.currentWorkspace?.id
                    ? {
                          ...w,
                          projects: w.projects.map((p) =>
                              p.id === action.payload.projectId
                                  ? { ...p, tasks: p.tasks.concat(action.payload) }
                                  : p
                          ),
                      }
                    : w
            );
        },
        updateTask: (state, action: PayloadAction<Task>) => {
            if (!state.currentWorkspace) return;

            state.currentWorkspace.projects.map((p) => {
                if (p.id === action.payload.projectId) {
                    p.tasks = p.tasks.map((t) =>
                        t.id === action.payload.id ? action.payload : t
                    );
                }
            });

            state.workspaces = state.workspaces.map((w) =>
                w.id === state.currentWorkspace?.id
                    ? {
                          ...w,
                          projects: w.projects.map((p) =>
                              p.id === action.payload.projectId
                                  ? {
                                        ...p,
                                        tasks: p.tasks.map((t) =>
                                            t.id === action.payload.id ? action.payload : t
                                        ),
                                    }
                                  : p
                          ),
                      }
                    : w
            );
        },
        deleteTask: (
            state,
            action: PayloadAction<DeleteTaskPayload | string[]>
        ) => {
            if (!state.currentWorkspace) return;

            const taskIds = Array.isArray(action.payload)
                ? action.payload
                : action.payload.taskIds;
            const projectId = Array.isArray(action.payload)
                ? undefined
                : action.payload.projectId;

            state.currentWorkspace.projects.forEach((p) => {
                if (!projectId || p.id === projectId) {
                    p.tasks = p.tasks.filter((t) => !taskIds.includes(t.id));
                }
            });

            state.workspaces = state.workspaces.map((w) =>
                w.id === state.currentWorkspace?.id
                    ? {
                          ...w,
                          projects: w.projects.map((p) =>
                              !projectId || p.id === projectId
                                  ? {
                                        ...p,
                                        tasks: p.tasks.filter((t) => !taskIds.includes(t.id)),
                                    }
                                  : p
                          ),
                      }
                    : w
            );
        },
    },
});

export const {
    setWorkspaces,
    setCurrentWorkspace,
    addWorkspace,
    updateWorkspace,
    deleteWorkspace,
    addProject,
    addTask,
    updateTask,
    deleteTask,
} = workspaceSlice.actions;

export default workspaceSlice.reducer;