import { useEffect, useState } from "react";
import { format } from "date-fns";
import { Plus, Save } from "lucide-react";
import AddProjectMember from "./AddProjectMember";
import type { Project } from "@projexo/types";
import { useAuth } from "@clerk/react";
import toast from "react-hot-toast";
import { fetchWorkspaces, updateProject } from "../features/workspaceSlice";
import api from "../configs/api";
import { useAppDispatch } from "../app/hooks";

interface ProjectSettingsProps {
    project: Project;
}

interface FormDataState {
    name: string;
    description: string;
    status: string;
    priority: string;
    start_date: string | Date;
    end_date: string | Date;
    progress: number;
}

export default function ProjectSettings({ project }: ProjectSettingsProps) {
    const dispatch = useAppDispatch();
    const { getToken } = useAuth();
    const [formData, setFormData] = useState<FormDataState>({
        name: "",
        description: "",
        status: "PLANNING",
        priority: "MEDIUM",
        start_date: "",
        end_date: "",
        progress: 0,
    });

    const [isDialogOpen, setIsDialogOpen] = useState<boolean>(false);
    const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

    const handleSubmit = async (e: React.SubmitEvent) => {
        e.preventDefault();
        setIsSubmitting(true);
        const toastId = toast.loading("Saving...");
        try {
            const { data } = await api.put('/api/projects', 
                {
                  ...formData,
                  id: project.id,
                  workspaceId: project.workspaceId
                }, 
                { headers: { Authorization: `Bearer ${await getToken()}` } }
            );

            if (data.project) {
                dispatch(updateProject(data.project));
            }
            dispatch(fetchWorkspaces({ getToken }));
            toast.success(data.message || "Project updated successfully", { id: toastId });
        } catch (error: unknown) {
            const err = error as { response?: { data?: { message?: string } }; message?: string };
            toast.error(err?.response?.data?.message || err?.message || "An error occurred", { id: toastId });
        } finally {
            setIsSubmitting(false);
        }
    };

    useEffect(() => {
        if (project) {
            setFormData({
                name: project.name || "",
                description: project.description || "",
                status: project.status || "PLANNING",
                priority: project.priority || "MEDIUM",
                start_date: project.start_date || "",
                end_date: project.end_date || "",
                progress: project.progress || 0,
            });
        }
    }, [project]);

    const inputClasses = "w-full px-3 py-2 rounded mt-2 border text-sm bg-white dark:bg-zinc-900 border-zinc-300 dark:border-zinc-700 text-zinc-900 dark:text-zinc-300 focus:outline-none focus:border-blue-500";
    const cardClasses = "rounded-lg border p-6 not-dark:bg-white dark:bg-linear-to-br dark:from-zinc-800/70 dark:to-zinc-900/50 border-zinc-300 dark:border-zinc-800";
    const labelClasses = "text-sm text-zinc-600 dark:text-zinc-400";

    return (
        <div className="grid lg:grid-cols-2 gap-8">
            {/* Project Details */}
            <div className={cardClasses}>
                <h2 className="text-lg font-medium text-zinc-900 dark:text-zinc-300 mb-4">Project Details</h2>
                <form onSubmit={handleSubmit} className="space-y-4">
                    {/* Name */}
                    <div className="space-y-2">
                        <label className={labelClasses}>Project Name</label>
                        <input 
                            value={formData.name} 
                            onChange={(e) => setFormData({ ...formData, name: e.target.value })} 
                            className={inputClasses} 
                            required 
                        />
                    </div>

                    {/* Description */}
                    <div className="space-y-2">
                        <label className={labelClasses}>Description</label>
                        <textarea 
                            value={formData.description} 
                            onChange={(e) => setFormData({ ...formData, description: e.target.value })} 
                            className={inputClasses + " h-24"} 
                        />
                    </div>

                    {/* Status & Priority */}
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <label className={labelClasses}>Status</label>
                            <select 
                                value={formData.status} 
                                onChange={(e) => setFormData({ ...formData, status: e.target.value })} 
                                className={inputClasses}
                            >
                                <option value="PLANNING">Planning</option>
                                <option value="ACTIVE">Active</option>
                                <option value="ON_HOLD">On Hold</option>
                                <option value="COMPLETED">Completed</option>
                                <option value="CANCELLED">Cancelled</option>
                            </select>
                        </div>

                        <div className="space-y-2">
                            <label className={labelClasses}>Priority</label>
                            <select 
                                value={formData.priority} 
                                onChange={(e) => setFormData({ ...formData, priority: e.target.value })} 
                                className={inputClasses}
                            >
                                <option value="LOW">Low</option>
                                <option value="MEDIUM">Medium</option>
                                <option value="HIGH">High</option>
                            </select>
                        </div>
                    </div>

                    {/* Timeline */}
                    <div className="space-y-4 grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <label className={labelClasses}>Start Date</label>
                            <input
                                type="date"
                                value={formData.start_date && !isNaN(new Date(formData.start_date).getTime()) ? format(new Date(formData.start_date), "yyyy-MM-dd") : ""}
                                onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                                className={inputClasses}
                            />
                        </div>
                        <div className="space-y-2">
                            <label className={labelClasses}>End Date</label>
                            <input
                                type="date"
                                value={formData.end_date && !isNaN(new Date(formData.end_date).getTime()) ? format(new Date(formData.end_date), "yyyy-MM-dd") : ""}
                                onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
                                className={inputClasses}
                            />
                        </div>
                    </div>

                    {/* Progress */}
                    <div className="space-y-2">
                        <label className={labelClasses}>Progress: {formData.progress}%</label>
                        <input 
                            type="range" 
                            min="0" 
                            max="100" 
                            step="5" 
                            value={formData.progress} 
                            onChange={(e) => setFormData({ ...formData, progress: Number(e.target.value) })} 
                            className="w-full accent-blue-500 dark:accent-blue-400" 
                        />
                    </div>

                    {/* Save Button */}
                    <button 
                        type="submit" 
                        disabled={isSubmitting} 
                        className="ml-auto flex items-center text-sm justify-center gap-2 bg-linear-to-br from-blue-500 to-blue-600 hover:opacity-90 transition disabled:opacity-50 text-white px-4 py-2 rounded"
                    >
                        <Save className="size-4" /> {isSubmitting ? "Saving..." : "Save Changes"}
                    </button>
                </form>
            </div>

            {/* Team Members */}
            <div className="space-y-6">
                <div className={cardClasses}>
                    <div className="flex items-center justify-between gap-4">
                        <h2 className="text-lg font-medium text-zinc-900 dark:text-zinc-300 mb-4">
                            Team Members <span className="text-sm text-zinc-600 dark:text-zinc-400">({project?.members?.length || 0})</span>
                        </h2>
                        <button 
                            type="button" 
                            onClick={() => setIsDialogOpen(true)} 
                            className="p-2 rounded-lg border border-zinc-300 dark:border-zinc-700 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition"
                        >
                            <Plus className="size-4 text-zinc-900 dark:text-zinc-300" />
                        </button>
                        <AddProjectMember isDialogOpen={isDialogOpen} setIsDialogOpen={setIsDialogOpen} />
                    </div>

                    {/* Member List */}
                    {project?.members && project.members.length > 0 && (
                        <div className="space-y-2 mt-2 max-h-48 overflow-y-auto">
                            {project.members.map((member, index) => (
                                <div key={index} className="flex items-center justify-between px-3 py-2 rounded bg-zinc-50 dark:bg-zinc-800 text-sm text-zinc-900 dark:text-zinc-300">
                                    <span>{member?.user?.email || "Unknown"}</span>
                                    {project.team_lead === member.user.id && (
                                        <span className="px-2 py-0.5 text-xs rounded bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300">
                                            Team Lead
                                        </span>
                                    )}
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}