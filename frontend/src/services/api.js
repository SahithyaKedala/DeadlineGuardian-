import axios from "axios";

const API = axios.create({
  baseURL: process.env.REACT_APP_API_URL || "http://localhost:8000",
  headers: { "Content-Type": "application/json" },
});

// Tasks
export const createTask = (data) => API.post("/tasks/", data);
export const getUserTasks = (userId) => API.get(`/tasks/user/${userId}`);
export const updateTask = (taskId, data) => API.patch(`/tasks/${taskId}`, data);
export const deleteTask = (taskId) => API.delete(`/tasks/${taskId}`);
export const completeSubtask = (taskId, subtaskId) =>
  API.post(`/tasks/${taskId}/subtask/${subtaskId}/complete`);
export const markTaskMissed = (taskId) => API.post(`/tasks/${taskId}/miss`);

// AI
export const getDashboard = (userId) => API.get(`/ai/dashboard/${userId}`);
export const sendChatMessage = (userId, message) =>
  API.post("/ai/chat", { user_id: userId, message });
export const generateSchedule = (userId) =>
  API.post("/ai/schedule", { user_id: userId });
export const getSmartReminder = (taskId, userId) =>
  API.post("/ai/reminder", { task_id: taskId, user_id: userId });

export default API;
