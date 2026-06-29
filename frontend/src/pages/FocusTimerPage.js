import React, { useState, useEffect, useRef } from "react";
import { useAuth } from "../context/AuthContext";
import { getUserTasks, updateTask } from "../services/api";
import { Play, Pause, RotateCcw, CheckCircle, Timer } from "lucide-react";
import toast from "react-hot-toast";
import "./FocusTimerPage.css";

const PRESETS = [
    { label: "25 min", seconds: 25 * 60, color: "#6366f1" },
    { label: "45 min", seconds: 45 * 60, color: "#10b981" },
    { label: "60 min", seconds: 60 * 60, color: "#f59e0b" },
    { label: "90 min", seconds: 90 * 60, color: "#ef4444" },
];

function pad(n) { return String(n).padStart(2, "0"); }

export default function FocusTimerPage() {
    const { user } = useAuth();
    const [tasks, setTasks] = useState([]);
    const [selectedTask, setSelectedTask] = useState(null);
    const [preset, setPreset] = useState(PRESETS[0]);
    const [timeLeft, setTimeLeft] = useState(PRESETS[0].seconds);
    const [running, setRunning] = useState(false);
    const [sessions, setSessions] = useState([]);
    const [totalFocused, setTotalFocused] = useState(0);
    const intervalRef = useRef(null);

    useEffect(() => {
        if (user) getUserTasks(user.uid).then(r => setTasks(r.data.filter(t => t.status !== "completed"))).catch(() => { });
    }, [user]);

    useEffect(() => {
        if (running) {
            intervalRef.current = setInterval(() => {
                setTimeLeft(t => {
                    if (t <= 1) { clearInterval(intervalRef.current); setRunning(false); handleComplete(); return 0; }
                    return t - 1;
                });
            }, 1000);
        } else { clearInterval(intervalRef.current); }
        return () => clearInterval(intervalRef.current);
    }, [running]);

    const handleComplete = () => {
        const mins = Math.round(preset.seconds / 60);
        toast.success(`🎯 Focus session complete! ${mins} minutes done!`);
        setSessions(p => [...p, { task: selectedTask?.title || "Free focus", duration: mins, time: new Date().toLocaleTimeString() }]);
        setTotalFocused(p => p + mins);
        if (selectedTask) {
            const newP = Math.min((selectedTask.progress || 0) + 10, 100);
            updateTask(selectedTask.id, { progress: newP }).then(r => {
                setTasks(p => p.map(t => t.id === selectedTask.id ? r.data : t));
                toast(`📈 ${selectedTask.title}: ${newP}% done`);
            }).catch(() => { });
        }
        if (Notification.permission === "granted")
            new Notification("DeadlineGuardian", { body: `Focus session complete! ${mins} min focused.` });
    };

    const selectPreset = (p) => { if (running) return; setPreset(p); setTimeLeft(p.seconds); };
    const reset = () => { setRunning(false); setTimeLeft(preset.seconds); };

    const progress = ((preset.seconds - timeLeft) / preset.seconds) * 100;
    const R = 90, C = 2 * Math.PI * R;
    const mins = Math.floor(timeLeft / 60), secs = timeLeft % 60;

    return (
        <div className="focus-page">
            <div className="focus-header">
                <Timer size={22} color="var(--accent)" />
                <div><h1>Focus Timer</h1><p className="text-muted">Auto-updates task progress when done.</p></div>
            </div>

            <div className="focus-layout">
                <div className="card timer-card">
                    <div className="presets">
                        {PRESETS.map(p => (
                            <button key={p.label} className={`preset-btn ${preset.label === p.label ? "active" : ""}`}
                                style={preset.label === p.label ? { borderColor: p.color, color: p.color } : {}}
                                onClick={() => selectPreset(p)}>{p.label}</button>
                        ))}
                    </div>

                    <div className="timer-ring-wrapper">
                        <svg width="220" height="220" viewBox="0 0 220 220">
                            <circle cx="110" cy="110" r={R} fill="none" stroke="var(--surface2)" strokeWidth="10" />
                            <circle cx="110" cy="110" r={R} fill="none" stroke={preset.color} strokeWidth="10"
                                strokeDasharray={C} strokeDashoffset={C - (progress / 100) * C}
                                strokeLinecap="round" transform="rotate(-90 110 110)"
                                style={{ transition: "stroke-dashoffset 1s linear" }} />
                        </svg>
                        <div className="timer-display">
                            <span className="timer-time">{pad(mins)}:{pad(secs)}</span>
                            <span className="timer-label">{running ? "focusing..." : timeLeft === preset.seconds ? "ready" : "paused"}</span>
                        </div>
                    </div>

                    <div className="timer-controls">
                        <button className="ctrl-btn reset" onClick={reset}><RotateCcw size={18} /></button>
                        <button className="ctrl-btn play" style={{ background: preset.color }}
                            onClick={() => { setRunning(!running); if (Notification.permission === "default") Notification.requestPermission(); }}>
                            {running ? <Pause size={24} /> : <Play size={24} />}
                        </button>
                    </div>

                    <div className="task-selector">
                        <label>Working on:</label>
                        <select value={selectedTask?.id || ""}
                            onChange={e => setSelectedTask(tasks.find(t => t.id === e.target.value) || null)}>
                            <option value="">Free focus</option>
                            {tasks.map(t => <option key={t.id} value={t.id}>{t.title} — {t.risk_level}</option>)}
                        </select>
                    </div>

                    <div className="total-focused">
                        <CheckCircle size={14} color="var(--safe)" />
                        <span>Today: <strong>{totalFocused} min focused</strong></span>
                    </div>
                </div>

                <div className="sessions-panel">
                    <h3>Today's Sessions</h3>
                    {sessions.length === 0 ? (
                        <div className="card no-sessions">
                            <Timer size={28} color="var(--text-muted)" />
                            <p>Start your first focus session!</p>
                            <p style={{ fontSize: 12, color: "var(--text-muted)" }}>Completes auto-update task by 10%</p>
                        </div>
                    ) : sessions.map((s, i) => (
                        <div key={i} className="card session-card">
                            <div><p className="session-task">{s.task}</p><p className="session-meta">{s.time}</p></div>
                            <span className="session-duration">{s.duration}m</span>
                        </div>
                    ))}

                    <div className="card focus-tips">
                        <h4>🎯 Focus Tips</h4>
                        <ul>
                            <li>Work on CRITICAL tasks first</li>
                            <li>Put phone face down</li>
                            <li>Close unrelated tabs</li>
                            <li>5 min break after each session</li>
                        </ul>
                    </div>
                </div>
            </div>
        </div>
    );
}