import { useState } from "react";
import { XIcon } from "lucide-react";
import { useAppDispatch, useAppSelector } from "../app/hooks";
import toast from "react-hot-toast";
import api from "../configs/api";
import { useAuth } from "@clerk/react";
import { addProject } from "../features/workspaceSlice";

interface CreateProjectDialogProps {
    isDialogOpen: boolean;
    setIsDialogOpen: (open: boolean) => void;
}

interface ProjectFormData {
    name: string;
    description: string;
    status: string;
    priority: string;
    start_date: string;
    end_date: string;
    team_members: string[];
    team_lead: string;
    progress: number;
}

const initialFormData: ProjectFormData = {
    name: "",
    description: "",
    status: "PLANNING",
    priority: "MEDIUM",
    start_date: "",
    end_date: "",
    team_members: [],
    team_lead: "",
    progress: 0,
};

const CreateProjectDialog: React.FC<CreateProjectDialogProps> = ({ isDialogOpen, setIsDialogOpen }) => {
    const { getToken } = useAuth();
    const dispatch = useAppDispatch();
    const { currentWorkspace } = useAppSelector((state) => state.workspace);

    const [formData, setFormData] = useState<ProjectFormData>(initialFormData);
    const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

    const handleSubmit = async (e: React.SubmitEvent) => {
        e.preventDefault();
        try {
            if (!formData.team_lead) {
                return toast.error("Please select a team lead");
            }
            setIsSubmitting(true);
            const { data } = await api.post("/api/projects", 
                { workspaceId: currentWorkspace?.id, ...formData }, 
                { headers: { Authorization: `Bearer ${await getToken()}` } });
            
            dispatch(addProject(data.project));
            toast.success(data.message || "Project created successfully");
            setFormData(initialFormData);
            setIsDialogOpen(false);
        } catch (error: unknown) {
            const err = error as { response?: { data?: { message?: string } }; message?: string };
            toast.error(err?.response?.data?.message || err?.message || "An error occurred");
        } finally {
            setIsSubmitting(false);
        }
    };

    const removeTeamMember = (email: string) => {
        setFormData((prev) => ({ ...prev, team_members: prev.team_members.filter((m) => m !== email) }));
    };

    if (!isDialogOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/20 dark:bg-black/60 backdrop-blur flex items-center justify-center text-left z-50">
            <div className="bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl p-6 w-full max-w-lg text-zinc-900 dark:text-zinc-200 relative">
                <button
                    type="button"
                    className="absolute top-3 right-3 text-zinc-500 dark:text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 cursor-pointer"
                    onClick={() => {
                        setFormData(initialFormData);
                        setIsDialogOpen(false);
                    }}
                >
                    <XIcon className="size-5" />
                </button>

                <h2 className="text-xl font-medium mb-1">Create New Project</h2>
                {currentWorkspace && (
                    <p className="text-sm text-zinc-600 dark:text-zinc-400 mb-4">
                        In workspace: <span className="text-blue-600 dark:text-blue-400">{currentWorkspace.name}</span>
                    </p>
                )}

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-sm mb-1">Project Name</label>
                        <input
                            type="text"
                            name="name"
                            value={formData.name}
                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                            placeholder="Enter project name"
                            className="w-full px-3 py-2 rounded bg-white dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-700 mt-1 text-zinc-900 dark:text-zinc-200 text-sm focus:outline-none focus:border-blue-500"
                            required
                        />
                    </div>

                    <div>
                        <label className="block text-sm mb-1">Description</label>
                        <textarea
                            name="description"
                            value={formData.description}
                            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                            placeholder="Describe your project"
                            className="w-full px-3 py-2 rounded bg-white dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-700 mt-1 text-zinc-900 dark:text-zinc-200 text-sm h-20 focus:outline-none focus:border-blue-500"
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm mb-1">Status</label>
                            <select
                                name="status"
                                value={formData.status}
                                onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                                className="w-full px-3 py-2 rounded bg-white dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-700 mt-1 text-zinc-900 dark:text-zinc-200 text-sm"
                            >
                                <option value="PLANNING">Planning</option>
                                <option value="ACTIVE">Active</option>
                                <option value="COMPLETED">Completed</option>
                                <option value="ON_HOLD">On Hold</option>
                                <option value="CANCELLED">Cancelled</option>
                            </select>
                        </div>

                        <div>
                            <label className="block text-sm mb-1">Priority</label>
                            <select
                                name="priority"
                                value={formData.priority}
                                onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
                                className="w-full px-3 py-2 rounded bg-white dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-700 mt-1 text-zinc-900 dark:text-zinc-200 text-sm"
                            >
                                <option value="LOW">Low</option>
                                <option value="MEDIUM">Medium</option>
                                <option value="HIGH">High</option>
                            </select>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm mb-1">Start Date</label>
                            <input
                                type="date"
                                name="start_date"
                                value={formData.start_date}
                                onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                                className="w-full px-3 py-2 rounded bg-white dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-700 mt-1 text-zinc-900 dark:text-zinc-200 text-sm"
                            />
                        </div>
                        <div>
                            <label className="block text-sm mb-1">End Date</label>
                            <input
                                type="date"
                                name="end_date"
                                value={formData.end_date}
                                onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
                                min={formData.start_date || undefined}
                                className="w-full px-3 py-2 rounded bg-white dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-700 mt-1 text-zinc-900 dark:text-zinc-200 text-sm"
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm mb-1">Project Lead</label>
                        <select
                            name="team_lead"
                            value={formData.team_lead}
                            onChange={(e) => setFormData({ 
                                ...formData, 
                                team_lead: e.target.value, 
                                team_members: e.target.value ? [...new Set([...formData.team_members, e.target.value])] : formData.team_members 
                            })}
                            className="w-full px-3 py-2 rounded bg-white dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-700 mt-1 text-zinc-900 dark:text-zinc-200 text-sm"
                            required
                        >
                            <option value="">Select a team lead</option>
                            {currentWorkspace?.members?.map((member) => (
                                <option key={member.user.email} value={member.user.email}>
                                    {member.user.email}
                                </option>
                            ))}
                        </select>
                    </div>

                    <div>
                        <label className="block text-sm mb-1">Team Members</label>
                        <select
                            onChange={(e) => {
                                if (e.target.value && !formData.team_members.includes(e.target.value)) {
                                    setFormData((prev) => ({ ...prev, team_members: [...prev.team_members, e.target.value] }));
                                }
                            }}
                            className="w-full px-3 py-2 rounded bg-white dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-700 mt-1 text-zinc-900 dark:text-zinc-200 text-sm"
                            value=""
                        >
                            <option value="">Add team members</option>
                            {currentWorkspace?.members
                                ?.filter((member) => !formData.team_members.includes(member.user.email))
                                .map((member) => (
                                    <option key={member.user.email} value={member.user.email}>
                                        {member.user.email}
                                    </option>
                                ))}
                        </select>

                        {formData.team_members.length > 0 && (
                            <div className="flex flex-wrap gap-2 mt-2">
                                {formData.team_members.map((email) => (
                                    <div key={email} className="flex items-center gap-1 bg-blue-100 dark:bg-blue-500/20 text-blue-700 dark:text-blue-300 px-2 py-1 rounded-md text-xs font-medium">
                                        {email}
                                        <button type="button" onClick={() => removeTeamMember(email)} className="ml-1 hover:bg-blue-200 dark:hover:bg-blue-500/30 rounded p-0.5">
                                            <XIcon className="w-3 h-3" />
                                        </button>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    <div className="flex justify-end gap-3 pt-2 text-sm">
                        <button 
                            type="button" 
                            onClick={() => {
                                setFormData(initialFormData);
                                setIsDialogOpen(false);
                            }} 
                            className="px-4 py-2 rounded border border-zinc-300 dark:border-zinc-700 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition"
                        >
                            Cancel
                        </button>
                        <button 
                            type="submit" 
                            disabled={isSubmitting || !currentWorkspace} 
                            className="px-4 py-2 rounded bg-linear-to-br from-blue-500 to-blue-600 hover:opacity-90 disabled:opacity-50 text-white font-medium transition"
                        >
                            {isSubmitting ? "Creating..." : "Create Project"}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default CreateProjectDialog;