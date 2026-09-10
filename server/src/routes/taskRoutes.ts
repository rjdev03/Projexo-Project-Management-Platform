import express from "express";
import { createTask, deleteTask, updateTask, getProjectTasks } from "../controllers/taskController.js";

const taskRouter = express.Router();

taskRouter.post("/", createTask);
taskRouter.put("/:id", updateTask);
taskRouter.post("/delete", deleteTask);
taskRouter.get("/project/:projectId", getProjectTasks);

export default taskRouter;