import { useState } from "react";
import { format, isSameDay, isBefore, startOfMonth, endOfMonth, eachDayOfInterval, addMonths, subMonths, getDay, startOfDay } from "date-fns";
import { CalendarIcon, Clock, User, ChevronLeft, ChevronRight } from "lucide-react";
import type { Task, TaskType, Priority } from "@projexo/types";

interface ProjectCalendarProps {
    tasks: Task[];
}

const typeColors: Record<TaskType, string> = {
    BUG: "bg-red-200 text-red-800 dark:bg-red-500/20 dark:text-red-400",
    FEATURE: "bg-blue-200 text-blue-800 dark:bg-blue-500/20 dark:text-blue-400",
    TASK: "bg-green-200 text-green-800 dark:bg-green-500/20 dark:text-green-400",
    IMPROVEMENT: "bg-purple-200 text-purple-800 dark:bg-purple-500/20 dark:text-purple-400",
    OTHER: "bg-amber-200 text-amber-800 dark:bg-amber-500/20 dark:text-amber-400",
};

const priorityBorders: Record<Priority, string> = {
    LOW: "border-zinc-300 dark:border-zinc-600",
    MEDIUM: "border-amber-400 dark:border-amber-500",
    HIGH: "border-red-500 dark:border-red-500",
};

export default function ProjectCalendar({ tasks }: ProjectCalendarProps) {
    const [selectedDate, setSelectedDate] = useState<Date>(new Date());
    const [currentMonth, setCurrentMonth] = useState<Date>(new Date());

    const todayStart = startOfDay(new Date());

    const getTasksForDate = (date: Date) => tasks.filter((task) => isSameDay(new Date(task.due_date), date));

    const upcomingTasks = tasks
        .filter((task) => {
            if (!task.due_date || task.status === "DONE") return false;
            const dueStart = startOfDay(new Date(task.due_date));
            return !isBefore(dueStart, todayStart);
        })
        .sort((a, b) => new Date(a.due_date).getTime() - new Date(b.due_date).getTime())
        .slice(0, 5);

    const overdueTasks = tasks.filter((task) => {
        if (!task.due_date || task.status === "DONE") return false;
        const dueStart = startOfDay(new Date(task.due_date));
        return isBefore(dueStart, todayStart);
    });

    const monthStart = startOfMonth(currentMonth);
    const monthEnd = endOfMonth(currentMonth);
    const startDayOfWeek = getDay(monthStart); // 0 = Sun, 1 = Mon ... 6 = Sat

    const daysInMonth = eachDayOfInterval({
        start: monthStart,
        end: monthEnd,
    });

    const handleMonthChange = (direction: "next" | "prev") => {
        setCurrentMonth((prev) => (direction === "next" ? addMonths(prev, 1) : subMonths(prev, 1)));
    };

    return (
        <div className="grid lg:grid-cols-3 gap-6">
            {/* Calendar View */}
            <div className="lg:col-span-2">
                <div className="bg-white dark:bg-linear-to-br dark:from-zinc-800/70 dark:to-zinc-900/50 border border-zinc-300 dark:border-zinc-800 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-4">
                        <h2 className="text-zinc-900 dark:text-white text-md flex gap-2 items-center font-medium">
                            <CalendarIcon className="size-5" /> Task Calendar
                        </h2>
                        <div className="flex gap-2 items-center">
                            <button 
                                type="button" 
                                onClick={() => handleMonthChange("prev")} 
                                className="p-1 rounded hover:bg-zinc-100 dark:hover:bg-zinc-800"
                            >
                                <ChevronLeft className="size-5 text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white" />
                            </button>
                            <span className="text-zinc-900 dark:text-white font-medium min-w-32 text-center">
                                {format(currentMonth, "MMMM yyyy")}
                            </span>
                            <button 
                                type="button" 
                                onClick={() => handleMonthChange("next")} 
                                className="p-1 rounded hover:bg-zinc-100 dark:hover:bg-zinc-800"
                            >
                                <ChevronRight className="size-5 text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white" />
                            </button>
                        </div>
                    </div>

                    <div className="grid grid-cols-7 text-xs text-zinc-600 dark:text-zinc-400 mb-2 text-center font-semibold">
                        {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => (
                            <div key={day} className="py-1">{day}</div>
                        ))}
                    </div>

                    <div className="grid grid-cols-7 gap-2">
                        {/* Empty padding cells for correct weekday offset */}
                        {Array.from({ length: startDayOfWeek }).map((_, idx) => (
                            <div key={`empty-${idx}`} className="h-12 sm:h-14 bg-transparent rounded-md" />
                        ))}

                        {daysInMonth.map((day) => {
                            const dayTasks = getTasksForDate(day);
                            const isSelected = isSameDay(day, selectedDate);
                            const hasOverdue = dayTasks.some(
                                (t) => t.status !== "DONE" && isBefore(startOfDay(new Date(t.due_date)), todayStart)
                            );

                            return (
                                <button
                                    key={day.toISOString()}
                                    type="button"
                                    onClick={() => setSelectedDate(day)}
                                    className={`h-12 sm:h-14 rounded-md flex flex-col items-center justify-center text-sm transition cursor-pointer
                                    ${isSelected ? "bg-blue-600 text-white font-semibold shadow-xs" : "bg-zinc-50 text-zinc-900 dark:bg-zinc-800/40 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-700"}
                                    ${hasOverdue && !isSelected ? "ring-2 ring-red-500 dark:ring-red-400" : ""}`}
                                >
                                    <span>{format(day, "d")}</span>
                                    {dayTasks.length > 0 && (
                                        <span className={`text-[10px] ${isSelected ? "text-blue-100" : "text-blue-600 dark:text-blue-400"} font-medium`}>
                                            {dayTasks.length} task{dayTasks.length !== 1 ? "s" : ""}
                                        </span>
                                    )}
                                </button>
                            );
                        })}
                    </div>
                </div>

                {/* Tasks for Selected Day */}
                {getTasksForDate(selectedDate).length > 0 && (
                    <div className="bg-white mt-6 dark:bg-linear-to-br dark:from-zinc-800/70 dark:to-zinc-900/50 border border-zinc-300 dark:border-zinc-800 rounded-lg p-4">
                        <h3 className="text-zinc-900 dark:text-white text-base font-medium mb-3">
                            Tasks for {format(selectedDate, "MMM d, yyyy")}
                        </h3>
                        <div className="space-y-3">
                            {getTasksForDate(selectedDate).map((task) => (
                                <div
                                    key={task.id}
                                    className={`bg-zinc-50 dark:bg-zinc-800/40 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition p-4 rounded border-l-4 ${priorityBorders[task.priority] || "border-zinc-400"}`}
                                >
                                    <div className="flex justify-between items-start mb-2">
                                        <h4 className="text-zinc-900 dark:text-white font-medium">{task.title}</h4>
                                        <span className={`px-2 py-0.5 rounded text-xs font-semibold uppercase ${typeColors[task.type] || ""}`}>
                                            {task.type}
                                        </span>
                                    </div>
                                    <div className="flex justify-between text-xs text-zinc-600 dark:text-zinc-400">
                                        <span className="capitalize">{task.priority.toLowerCase()} priority</span>
                                        {task.assignee && (
                                            <span className="flex items-center gap-1 font-medium">
                                                <User className="size-3" />
                                                {task.assignee.name}
                                            </span>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
                {/* Upcoming Tasks */}
                <div className="bg-white dark:bg-linear-to-br dark:from-zinc-800/70 dark:to-zinc-900/50 border border-zinc-300 dark:border-zinc-800 rounded-lg p-4">
                    <h3 className="text-zinc-900 dark:text-white text-sm font-medium flex items-center gap-2 mb-3">
                        <Clock className="w-4 h-4 text-blue-500" /> Upcoming Tasks ({upcomingTasks.length})
                    </h3>
                    {upcomingTasks.length === 0 ? (
                        <p className="text-zinc-500 dark:text-zinc-400 text-sm text-center py-4">No upcoming tasks</p>
                    ) : (
                        <div className="space-y-2">
                            {upcomingTasks.map((task) => (
                                <div
                                    key={task.id}
                                    className="bg-zinc-50 dark:bg-zinc-800/40 hover:bg-zinc-100 dark:hover:bg-zinc-800 p-3 rounded-lg transition"
                                >
                                    <div className="flex justify-between items-start text-sm">
                                        <span className="text-zinc-900 dark:text-white font-medium truncate max-w-44">{task.title}</span>
                                        <span className={`text-[10px] px-2 py-0.5 rounded font-semibold uppercase ${typeColors[task.type] || ""}`}>
                                            {task.type}
                                        </span>
                                    </div>
                                    <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">Due {format(new Date(task.due_date), "MMM d")}</p>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Overdue Tasks */}
                {overdueTasks.length > 0 && (
                    <div className="bg-white dark:bg-zinc-950 border border-red-300 dark:border-red-900/60 border-l-4 border-l-red-500 rounded-lg p-4">
                        <h3 className="text-red-600 dark:text-red-400 text-sm font-medium flex items-center gap-2 mb-3">
                            <Clock className="w-4 h-4" /> Overdue Tasks ({overdueTasks.length})
                        </h3>
                        <div className="space-y-2">
                            {overdueTasks.slice(0, 5).map((task) => (
                                <div key={task.id} className="bg-red-50 dark:bg-red-950/30 hover:bg-red-100 dark:hover:bg-red-950/50 p-3 rounded-lg transition">
                                    <div className="flex justify-between items-start text-sm text-zinc-900 dark:text-white">
                                        <span className="font-medium truncate max-w-44">{task.title}</span>
                                        <span className="text-[10px] px-2 py-0.5 rounded bg-red-200 dark:bg-red-500/20 text-red-800 dark:text-red-300 font-semibold uppercase">
                                            {task.type}
                                        </span>
                                    </div>
                                    <p className="text-xs text-red-600 dark:text-red-400 mt-1">
                                        Due {format(new Date(task.due_date), "MMM d")}
                                    </p>
                                </div>
                            ))}
                            {overdueTasks.length > 5 && (
                                <p className="text-xs text-zinc-500 dark:text-zinc-400 text-center pt-1">
                                    +{overdueTasks.length - 5} more overdue
                                </p>
                            )}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}