import { format } from "date-fns";
import toast from "react-hot-toast";
import { useEffect, useState, useCallback } from "react";
import { useSearchParams } from "react-router-dom";
import { CalendarIcon, MessageCircle, PenIcon } from "lucide-react";
import { useAppSelector } from "../app/hooks";
import type { Task, Project, Comment } from "@projexo/types";
import { useAuth, useUser } from "@clerk/react";
import api from "../configs/api";

const TaskDetails = () => {
    const [searchParams] = useSearchParams();
    const projectId = searchParams.get("projectId");
    const taskId = searchParams.get("taskId");

    const { user } = useUser();
    const { getToken } = useAuth();

    const [task, setTask] = useState<Task | null>(null);
    const [project, setProject] = useState<Project | null>(null);
    const [comments, setComments] = useState<Comment[]>([]);
    const [newComment, setNewComment] = useState<string>("");
    const [loading, setLoading] = useState<boolean>(true);

    const { currentWorkspace } = useAppSelector((state) => state.workspace);

    const fetchComments = useCallback(async () => {
        if (!taskId) return;
        try {
            const token = await getToken();
            const { data } = await api.get(`/api/comments/${taskId}`, { headers: { Authorization: `Bearer ${token}` } });
            setComments(data.comments || []);
        } catch (error: unknown) {
            const err = error as { response?: { data?: { message?: string } }; message?: string };
            console.error(err?.response?.data?.message || err.message || "Failed to load comments");
        }
    }, [taskId, getToken]);

    const fetchTaskDetails = useCallback(() => {
        if (!currentWorkspace) return;

        setLoading(true);
        try {
            if (!projectId || !taskId) {
                setTask(null);
                setProject(null);
                return;
            }

            const proj = currentWorkspace.projects.find((p) => p.id === projectId);
            if (!proj) {
                setTask(null);
                setProject(null);
                return;
            }

            const tsk = proj.tasks.find((t) => t.id === taskId);
            setTask(tsk || null);
            setProject(proj);
        } finally {
            setLoading(false);
        }
    }, [projectId, taskId, currentWorkspace]);

    const handleAddComment = async () => {
        if (!newComment.trim() || !task) return;

        const toastId = toast.loading("Adding comment...");
        try {
            const token = await getToken();
            const { data } = await api.post(
                `/api/comments`, 
                { taskId: task.id, content: newComment.trim() }, 
                { headers: { Authorization: `Bearer ${token}` } }
            );

            setComments((prev) => [...prev, data.comment]);
            setNewComment("");
            toast.success("Comment added", { id: toastId });
        } catch (error: unknown) {
            const err = error as { response?: { data?: { message?: string } }; message?: string };
            toast.error(err?.response?.data?.message || err.message || "An error occurred", { id: toastId });
        }
    };

    useEffect(() => {
        fetchTaskDetails();
    }, [fetchTaskDetails]);

    useEffect(() => {
        if (!taskId) return;
        fetchComments();
        const interval = setInterval(() => {
            if (document.visibilityState === "visible") {
                fetchComments();
            }
        }, 10000);

        return () => clearInterval(interval);
    }, [taskId, fetchComments]);

    if (loading) {
        return <div className="text-gray-500 dark:text-zinc-400 px-4 py-8 text-center">Loading task details...</div>;
    }

    if (!task) {
        return (
            <div className="text-center py-16">
                <p className="text-2xl font-semibold text-zinc-900 dark:text-zinc-100 mb-2">Task not found</p>
                <p className="text-sm text-zinc-500 dark:text-zinc-400">The task may have been deleted or the link is invalid.</p>
            </div>
        );
    }

    return (
        <div className="flex flex-col-reverse lg:flex-row gap-6 sm:p-4 text-gray-900 dark:text-zinc-100 max-w-6xl mx-auto">
            {/* Left: Comments / Chatbox */}
            <div className="w-full lg:w-2/3">
                <div className="p-5 rounded-md border border-gray-300 dark:border-zinc-800 flex flex-col lg:h-[80vh] bg-white dark:bg-zinc-950">
                    <h2 className="text-base font-semibold flex items-center gap-2 mb-4 text-gray-900 dark:text-white">
                        <MessageCircle className="size-5" /> Task Discussion ({comments.length})
                    </h2>

                    <div className="flex-1 md:overflow-y-scroll no-scrollbar">
                        {comments.length > 0 ? (
                            <div className="flex flex-col gap-4 mb-6 mr-2">
                                {comments.map((comment) => (
                                    <div
                                        key={comment.id}
                                        className={`sm:max-w-4/5 dark:bg-linear-to-br dark:from-zinc-800 dark:to-zinc-900 border border-gray-300 dark:border-zinc-700 p-3 rounded-md ${
                                            String(comment.user?.id) === user?.id ? "ml-auto bg-blue-50/50 dark:bg-zinc-800" : "mr-auto bg-gray-50 dark:bg-zinc-900"
                                        }`}>
                                        <div className="flex items-center gap-2 mb-1 text-sm text-gray-500 dark:text-zinc-400">
                                            {comment.user?.image ? (
                                                <img src={comment.user.image} alt="avatar" className="size-5 rounded-full object-cover" />
                                            ) : (
                                                <div className="size-5 rounded-full bg-blue-500 text-white text-[10px] flex items-center justify-center font-bold">
                                                    {comment.user?.name?.[0]?.toUpperCase() || "?"}
                                                </div>
                                            )}
                                            <span className="font-medium text-gray-900 dark:text-white">{comment.user?.name || "User"}</span>
                                            <span className="text-xs text-gray-400 dark:text-zinc-600">
                                                • {format(new Date(comment.createdAt), "dd MMM yyyy, HH:mm")}
                                            </span>
                                        </div>
                                        <p className="text-sm text-gray-900 dark:text-zinc-200 wrap-break-word">{comment.content}</p>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <p className="text-gray-600 dark:text-zinc-500 mb-4 text-sm text-center py-8">No comments yet. Start the conversation!</p>
                        )}
                    </div>

                    {/* Add Comment */}
                    <div className="flex flex-col sm:flex-row items-start sm:items-end gap-3 pt-2">
                        <textarea
                            value={newComment}
                            onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setNewComment(e.target.value)}
                            placeholder="Write a comment..."
                            className="w-full bg-white dark:bg-zinc-900 border border-gray-300 dark:border-zinc-700 rounded-md p-2 text-sm text-gray-900 dark:text-zinc-200 resize-none focus:outline-none focus:ring-1 focus:ring-blue-600"
                            rows={3}
                        />
                        <button
                            type="button"
                            onClick={handleAddComment}
                            disabled={!newComment.trim()}
                            className="bg-linear-to-l from-blue-500 to-blue-600 hover:opacity-90 disabled:opacity-50 transition-colors text-white text-sm px-5 py-2.5 rounded font-medium shrink-0"
                        >
                            Post
                        </button>
                    </div>
                </div>
            </div>

            {/* Right: Task + Project Info */}
            <div className="w-full lg:w-1/2 flex flex-col gap-6">
                {/* Task Info */}
                <div className="p-5 rounded-md bg-white dark:bg-zinc-900 border border-gray-300 dark:border-zinc-800">
                    <div className="mb-3">
                        <h1 className="text-lg font-semibold text-gray-900 dark:text-zinc-100">{task.title}</h1>
                        <div className="flex flex-wrap gap-2 mt-2">
                            <span className="px-2 py-0.5 rounded bg-zinc-100 dark:bg-zinc-800 text-zinc-800 dark:text-zinc-300 text-xs font-medium">
                                {task.status.replace("_", " ")}
                            </span>
                            <span className="px-2 py-0.5 rounded bg-blue-100 dark:bg-blue-900/40 text-blue-800 dark:text-blue-300 text-xs font-medium">
                                {task.type}
                            </span>
                            <span className="px-2 py-0.5 rounded bg-red-100 dark:bg-red-900/40 text-red-800 dark:text-red-300 text-xs font-medium">
                                {task.priority}
                            </span>
                        </div>
                    </div>

                    {task.description && (
                        <p className="text-sm text-gray-600 dark:text-zinc-400 leading-relaxed mb-4">{task.description}</p>
                    )}

                    <hr className="border-zinc-200 dark:border-zinc-800 my-3" />

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm text-gray-700 dark:text-zinc-300">
                        <div className="flex items-center gap-2">
                            {task.assignee?.image ? (
                                <img src={task.assignee.image} className="size-5 rounded-full object-cover" alt="avatar" />
                            ) : (
                                <div className="size-5 rounded-full bg-blue-500 text-white text-[10px] flex items-center justify-center font-bold">
                                    {task.assignee?.name?.[0]?.toUpperCase() || "?"}
                                </div>
                            )}
                            <span className="truncate">{task.assignee?.name || "Unassigned"}</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <CalendarIcon className="size-4 text-gray-500 dark:text-zinc-500" />
                            <span>Due: {format(new Date(task.due_date), "dd MMM yyyy")}</span>
                        </div>
                    </div>
                </div>

                {/* Project Info */}
                {project && (
                    <div className="p-5 rounded-md bg-white dark:bg-zinc-900 text-zinc-700 dark:text-zinc-200 border border-gray-300 dark:border-zinc-800">
                        <p className="text-base font-semibold mb-3">Project Details</p>
                        <h2 className="text-gray-900 dark:text-zinc-100 font-medium flex items-center gap-2 text-sm">
                            <PenIcon className="size-4 text-blue-500" /> {project.name}
                        </h2>
                        {project.start_date && (
                            <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-2">
                                Start Date: {format(new Date(project.start_date), "dd MMM yyyy")}
                            </p>
                        )}
                        <div className="flex flex-wrap gap-4 text-xs text-gray-500 dark:text-zinc-400 mt-3 pt-3 border-t border-zinc-100 dark:border-zinc-800">
                            <span>Status: <strong className="text-zinc-700 dark:text-zinc-300 capitalize">{project.status.toLowerCase()}</strong></span>
                            <span>Priority: <strong className="text-zinc-700 dark:text-zinc-300 capitalize">{project.priority.toLowerCase()}</strong></span>
                            <span>Progress: <strong className="text-zinc-700 dark:text-zinc-300">{project.progress}%</strong></span>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default TaskDetails;