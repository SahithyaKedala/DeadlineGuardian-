import React, { useEffect, useState, useCallback, useRef } from "react";
import { useAuth } from "../context/AuthContext";
import { createTask, getUserTasks, updateTask, deleteTask, completeSubtask } from "../services/api";
import { Plus, Trash2, ChevronDown, ChevronUp, AlertCircle, Clock } from "lucide-react";
import toast from "react-hot-toast";
import "./TasksPage.css";

function getMissedStatus(task) {
  if (task.status === "completed") return null;
  const now = new Date();
  const deadline = new Date(task.deadline);
  const minsLeft = (deadline - now) / 60000;
  if (minsLeft < 0) return "OVERDUE";
  if (minsLeft <= 30 && (task.progress || 0) < 50) return "URGENT";
  return null;
}

function MissedBanner({ tasks }) {
  const missed = tasks.filter(t => getMissedStatus(t));
  if (!missed.length) return null;
  return (
    <div className="missed-banner">
      <AlertCircle size={18} />
      <div>
        <strong>{missed.length} task(s) need immediate attention!</strong>
        <div className="missed-list">
          {missed.map(t => {
            const s = getMissedStatus(t);
            const mins = Math.round((new Date(t.deadline) - new Date()) / 60000);
            return (
              <span key={t.id} className="missed-chip">
                🔴 {t.title} — {s === "OVERDUE" ? "OVERDUE" : `${mins}min left!`}
              </span>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function TaskForm({ onCreated }) {
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ title: "", deadline: "", priority: "medium", estimated_hours: 4, category: "General", difficulty: "medium" });
  const [loading, setLoading] = useState(false);

  const getMin = () => {
    const now = new Date();
    now.setMinutes(now.getMinutes() - now.getTimezoneOffset());
    return now.toISOString().slice(0, 16);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.deadline) { toast.error("Select a deadline"); return; }
    setLoading(true);
    try {
      const { data } = await createTask({ ...form, deadline: new Date(form.deadline).toISOString(), user_id: user.uid });
      toast.success("Task created! AI decomposing...");
      onCreated(data);
      setOpen(false);
      setForm({ title: "", deadline: "", priority: "medium", estimated_hours: 4, category: "General", difficulty: "medium" });
    } catch { toast.error("Failed to create task"); }
    finally { setLoading(false); }
  };

  if (!open) return (
    <button className="btn-primary" onClick={() => setOpen(true)}>
      <Plus size={15} /> Add Task
    </button>
  );

  return (
    <form className="card task-form" onSubmit={handleSubmit}>
      <h3>New Task</h3>
      <div className="form-grid">
        <div className="form-group span-2">
          <label>Task Title</label>
          <input required placeholder="e.g. Submit DBMS project" value={form.title}
            onChange={e => setForm({ ...form, title: e.target.value })} />
        </div>
        <div className="form-group">
          <label>Deadline</label>
          <input type="datetime-local" required min={getMin()} value={form.deadline}
            onChange={e => setForm({ ...form, deadline: e.target.value })} />
        </div>
        <div className="form-group">
          <label>Estimated Hours</label>
          <input type="number" min="0.5" step="0.5" value={form.estimated_hours}
            onChange={e => setForm({ ...form, estimated_hours: parseFloat(e.target.value) })} />
        </div>
        <div className="form-group">
          <label>Priority</label>
          <select value={form.priority} onChange={e => setForm({ ...form, priority: e.target.value })}>
            <option value="low">Low</option><option value="medium">Medium</option><option value="high">High</option>
          </select>
        </div>
        <div className="form-group">
          <label>Difficulty</label>
          <select value={form.difficulty} onChange={e => setForm({ ...form, difficulty: e.target.value })}>
            <option value="easy">Easy</option><option value="medium">Medium</option><option value="hard">Hard</option>
          </select>
        </div>
        <div className="form-group">
          <label>Category</label>
          <input placeholder="Academics, Work..." value={form.category}
            onChange={e => setForm({ ...form, category: e.target.value })} />
        </div>
      </div>
      <div className="form-actions">
        <button type="button" className="btn-ghost" onClick={() => setOpen(false)}>Cancel</button>
        <button type="submit" className="btn-primary" disabled={loading}>
          {loading ? "Creating..." : "Create Task"}
        </button>
      </div>
    </form>
  );
}

function TaskCard({ task, onUpdate, onDelete }) {
  const [expanded, setExpanded] = useState(false);
  const missed = getMissedStatus(task);
  const deadline = new Date(task.deadline);
  const minsLeft = Math.round((deadline - new Date()) / 60000);

  const riskColor = missed === "OVERDUE" ? "#ff2222"
    : missed === "URGENT" ? "var(--warning)"
      : task.risk_level === "CRITICAL" ? "var(--critical)"
        : task.risk_level === "WARNING" ? "var(--warning)" : "var(--safe)";

  return (
    <div className={`task-card card ${missed ? "missed-pulse" : ""}`}
      style={{ borderLeft: `4px solid ${riskColor}` }}>

      {missed && (
        <div className={`missed-tag ${missed === "OVERDUE" ? "overdue" : "urgent"}`}>
          <Clock size={12} />
          {missed === "OVERDUE" ? `OVERDUE by ${Math.abs(minsLeft)} min` : `⚠ Only ${minsLeft} min left! Start NOW`}
        </div>
      )}

      <div className="task-header">
        <div className="task-meta">
          <h3>{task.title}</h3>
          <div className="task-tags">
            <span className={`risk-badge risk-${missed || task.risk_level}`}>{missed || task.risk_level}</span>
            <span className="tag">{task.category}</span>
            <span className="tag">{task.priority}</span>
          </div>
        </div>
        <div className="task-actions">
          <button className="btn-ghost btn-sm" onClick={() => onDelete(task.id)}><Trash2 size={13} /></button>
          <button className="btn-ghost btn-sm" onClick={() => setExpanded(!expanded)}>
            {expanded ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
          </button>
        </div>
      </div>

      <div className="task-risk-info">
        <span style={{ color: riskColor, fontWeight: 700, marginRight: 8 }}>Risk: {task.risk_score}%</span>
        <span style={{ color: "var(--text-muted)", fontSize: 12 }}>{task.reason}</span>
      </div>

      <div className="progress-section">
        <div className="progress-label"><span>Progress</span><span>{task.progress || 0}%</span></div>
        <input type="range" min="0" max="100" step="5" value={task.progress || 0}
          onChange={async e => {
            try { const { data } = await updateTask(task.id, { progress: parseFloat(e.target.value) }); onUpdate(data); }
            catch { toast.error("Update failed"); }
          }} className="progress-slider" />
        <div className="progress-bar">
          <div className="progress-fill" style={{ width: `${task.progress || 0}%`, background: riskColor }} />
        </div>
      </div>

      {expanded && task.subtasks?.length > 0 && (
        <div className="subtasks">
          <h4>AI Subtasks</h4>
          {task.subtasks.map(sub => (
            <div key={sub.id} className={`subtask ${sub.status === "completed" ? "done" : ""}`}>
              <button className={`subtask-check ${sub.status === "completed" ? "checked" : ""}`}
                onClick={async () => {
                  if (sub.status === "completed") return;
                  try { const { data } = await completeSubtask(task.id, sub.id); onUpdate(data); toast.success("Done!"); }
                  catch { toast.error("Failed"); }
                }}>
                {sub.status === "completed" ? "✓" : "○"}
              </button>
              <div className="subtask-info">
                <span>{sub.title}</span>
                <span className="subtask-time">{sub.estimated_time}h</span>
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="task-footer">
        <span style={minsLeft < 60 && minsLeft > 0 ? { color: "var(--critical)", fontWeight: 600 } : { color: "var(--text-muted)" }}>
          {minsLeft < 0 ? `Overdue by ${Math.abs(minsLeft)}min`
            : minsLeft < 60 ? `⏰ ${minsLeft} minutes left!`
              : `Deadline: ${deadline.toLocaleString("en-IN", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" })}`}
        </span>
        <span style={{ color: "var(--text-muted)", fontSize: 12 }}>{task.estimated_hours}h est.</span>
      </div>
    </div>
  );
}

export default function TasksPage() {
  const { user } = useAuth();
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");
  const notified = useRef(new Set());

  const loadTasks = useCallback(() => {
    getUserTasks(user.uid).then(r => setTasks(r.data))
      .catch(() => toast.error("Failed to load tasks"))
      .finally(() => setLoading(false));
  }, [user]);

  useEffect(() => { if (user) loadTasks(); }, [user, loadTasks]);

  useEffect(() => {
    if (Notification.permission === "default") Notification.requestPermission();
  }, []);

  useEffect(() => {
    const check = () => {
      tasks.forEach(task => {
        const status = getMissedStatus(task);
        const key = `${task.id}-${status}`;
        if (status && !notified.current.has(key)) {
          notified.current.add(key);
          const mins = Math.round((new Date(task.deadline) - new Date()) / 60000);
          if (status === "OVERDUE") {
            toast.error(`🔴 OVERDUE: "${task.title}" deadline has passed!`, { duration: 8000 });
          } else {
            toast(`⚠️ "${task.title}" due in ${mins} min — ${task.progress || 0}% done!`, { duration: 8000, icon: "🔴" });
          }
          if (Notification.permission === "granted") {
            new Notification("DeadlineGuardian Alert!", {
              body: status === "OVERDUE" ? `OVERDUE: ${task.title}` : `${task.title} due in ${mins} min!`
            });
          }
        }
      });
    };
    check();
    const interval = setInterval(check, 60000);
    return () => clearInterval(interval);
  }, [tasks]);

  const missedCount = tasks.filter(t => getMissedStatus(t)).length;

  const filtered = tasks.filter(t => {
    if (filter === "all") return true;
    if (filter === "missed") return !!getMissedStatus(t);
    if (filter === "critical") return t.risk_level === "CRITICAL";
    if (filter === "warning") return t.risk_level === "WARNING";
    if (filter === "safe") return t.risk_level === "SAFE";
    return true;
  });

  return (
    <div className="tasks-page">
      <div className="page-header">
        <h1>Tasks</h1>
        <TaskForm onCreated={task => setTasks(prev => [task, ...prev])} />
      </div>

      <MissedBanner tasks={tasks} />

      <div className="filter-bar">
        {[
          { key: "all", label: "All" },
          { key: "missed", label: `🔴 Urgent${missedCount > 0 ? ` (${missedCount})` : ""}` },
          { key: "critical", label: "Critical" },
          { key: "warning", label: "Warning" },
          { key: "safe", label: "Safe" },
        ].map(f => (
          <button key={f.key}
            className={`filter-btn ${filter === f.key ? "active" : ""} ${f.key === "missed" && missedCount > 0 ? "filter-alert" : ""}`}
            onClick={() => setFilter(f.key)}>{f.label}</button>
        ))}
      </div>

      {loading ? <div className="page-loading">Loading...</div>
        : filtered.length === 0 ? (
          <div className="card" style={{ textAlign: "center", padding: 48, color: "var(--text-muted)" }}>
            No tasks here. Add your first task above.
          </div>
        ) : filtered.map(task => (
          <TaskCard key={task.id} task={task}
            onUpdate={updated => setTasks(prev => prev.map(t => t.id === updated.id ? updated : t))}
            onDelete={async id => { await deleteTask(id); setTasks(prev => prev.filter(t => t.id !== id)); toast.success("Deleted"); }}
          />
        ))}
    </div>
  );
}