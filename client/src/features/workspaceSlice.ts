import { createAsyncThunk, createSlice, type PayloadAction } from "@reduxjs/toolkit";
import api from "../configs/api";
import type { Project, Task, Workspace, DeleteTaskPayload } from "@projexo/types";

export interface WorkspaceState {
    workspaces: Workspace[];
    currentWorkspace: Workspace | null;
    loading: boolean;
    hasFetched: boolean;
}

export const fetchWorkspaces = createAsyncThunk(
    'workspace/fetchWorkspaces',
    async ({ getToken }: { getToken: () => Promise<string | null> }) => {
        try {
            const token = await getToken();
            const { data } = await api.get('/api/workspaces', {
                headers: { Authorization: `Bearer ${token}` }
            });
            return (data.workspaces as Workspace[]) || [];
        } catch (error: unknown) {
            const message = error instanceof Error 
                ? error.message 
                : (error as { response?: { data?: { message?: string } } })?.response?.data?.message || 'Failed to fetch workspaces';
            console.error(message);
            return [];
        }
    }
);

const initialState: WorkspaceState = {
    workspaces: [],
    currentWorkspace: null,
    loading: false,
    hasFetched: false,
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
                localStorage.setItem("currentWorkspaceId", action.payload.id);
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
                if (state.currentWorkspace) {
                    localStorage.setItem("currentWorkspaceId", state.currentWorkspace.id);
                } else {
                    localStorage.removeItem("currentWorkspaceId");
                }
            }
        },
        addProject: (state, action: PayloadAction<Project>) => {
            if (!state.currentWorkspace) return;

            const workspace = state.workspaces.find((w) => w.id === state.currentWorkspace?.id);
            if (workspace) {
                const alreadyExists = workspace.projects.some((p) => p.id === action.payload.id);
                if (!alreadyExists) {
                    workspace.projects.push(action.payload);
                }
            }
            state.currentWorkspace = workspace || null;
        },
        updateProject: (state, action: PayloadAction<Project>) => {
            if (!state.currentWorkspace) return;

            const workspace = state.workspaces.find((w) => w.id === state.currentWorkspace?.id);
            if (workspace) {
                workspace.projects = workspace.projects.map((p) =>
                    p.id === action.payload.id
                        ? {
                              ...p,
                              ...action.payload,
                              members: action.payload.members ?? p.members,
                              tasks: action.payload.tasks ?? p.tasks,
                          }
                        : p
                );
            }
            state.currentWorkspace = workspace || null;
        },
        addTask: (state, action: PayloadAction<Task>) => {
            if (!state.currentWorkspace) return;

            const workspace = state.workspaces.find((w) => w.id === state.currentWorkspace?.id);
            if (workspace) {
                const project = workspace.projects.find((p) => p.id === action.payload.projectId);
                if (project) {
                    const alreadyExists = project.tasks.some((t) => t.id === action.payload.id);
                    if (!alreadyExists) {
                        project.tasks.push(action.payload);
                    }
                }
            }
            state.currentWorkspace = workspace || null;
        },
        updateTask: (state, action: PayloadAction<Task>) => {
            if (!state.currentWorkspace) return;

            const workspace = state.workspaces.find((w) => w.id === state.currentWorkspace?.id);
            if (workspace) {
                const project = workspace.projects.find((p) => p.id === action.payload.projectId);
                if (project) {
                    project.tasks = project.tasks.map((t) =>
                        t.id === action.payload.id ? action.payload : t
                    );
                }
            }
            state.currentWorkspace = workspace || null;
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

            const workspace = state.workspaces.find((w) => w.id === state.currentWorkspace?.id);
            if (workspace) {
                workspace.projects.forEach((p) => {
                    if (!projectId || p.id === projectId) {
                        p.tasks = p.tasks.filter((t) => !taskIds.includes(t.id));
                    }
                });
            }
            state.currentWorkspace = workspace || null;
        },
    },
    extraReducers: (builder) => {
        builder.addCase(fetchWorkspaces.pending, (state) => {
            state.loading = true;
        });

        builder.addCase(fetchWorkspaces.fulfilled, (state, action) => {
            state.workspaces = action.payload;
            state.hasFetched = true;

            if (action.payload.length > 0) {
                const savedWorkspaceId = localStorage.getItem("currentWorkspaceId");

                let activeWorkspace: Workspace | null = null;

                if (savedWorkspaceId) {
                    activeWorkspace = action.payload.find((w) => w.id === savedWorkspaceId) || null;
                }

                if (!activeWorkspace) {
                    activeWorkspace = action.payload[0] ?? null;
                }

                state.currentWorkspace = activeWorkspace;
                if (activeWorkspace) {
                    localStorage.setItem("currentWorkspaceId", activeWorkspace.id);
                }
            } else {
                state.currentWorkspace = null;
            }

            state.loading = false;
        });

        builder.addCase(fetchWorkspaces.rejected, (state) => {
            state.loading = false;
            state.hasFetched = true;
        });
    },
});

export const {
    setWorkspaces,
    setCurrentWorkspace,
    addWorkspace,
    updateWorkspace,
    deleteWorkspace,
    addProject,
    updateProject,
    addTask,
    updateTask,
    deleteTask,
} = workspaceSlice.actions;

export default workspaceSlice.reducer;