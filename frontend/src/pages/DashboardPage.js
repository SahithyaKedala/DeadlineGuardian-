import React, { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";
import { getDashboard, generateSchedule, markTaskMissed } from "../services/api";
import { RadialBarChart, RadialBar, ResponsiveContainer } from "recharts";
import { AlertTriangle, CheckCircle, Clock, Calendar, Zap } from "lucide-react";
import toast from "react-hot-toast";
import "./DashboardPage.css";

function RiskCard({ task }) {
  const handleMissed = async () => {
    try {
      const { data } = await markTaskMissed(task.id);
      toast.success("Recovery plan generated!");
      alert(`Recovery Plan:\n\n${data.recovery_plan}`);
    } catch {
      toast.error("Failed to generate recovery plan");
    }
  };

  return (
    <div className={`risk-card risk-border-${task.risk_level}`}>
      <div className="risk-card-header">
        <h4>{task.title}</h4>
        <span className={`risk-badge risk-${task.risk_level}`}>{task.risk_level}</span>
      </div>
      <p className="risk-reason">{task.risk_score}% risk — {task.reason}</p>
      <div className="progress-bar" style={{ marginTop: 10 }}>
        <div
          className="progress-fill"
          style={{
            width: `${task.progress || 0}%`,
            background: task.risk_level === "CRITICAL" ? "var(--critical)" :
              task.risk_level === "WARNING" ? "var(--warning)" : "var(--safe)",
          }}
        />
      </div>
      <div className="risk-card-footer">
        <span className="text-muted">{task.progress || 0}% done</span>
        <button className="btn-ghost btn-sm" onClick={handleMissed}>
          Missed session?
        </button>
      </div>
    </div>
  );
}

export default function DashboardPage() {
  const { user } = useAuth();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [scheduling, setScheduling] = useState(false);

  useEffect(() => {
    if (!user) return;
    getDashboard(user.uid)
      .then((res) => setData(res.data))
      .catch(() => toast.error("Failed to load dashboard"))
      .finally(() => setLoading(false));
  }, [user]);

  const handleAutoSchedule = async () => {
    setScheduling(true);
    try {
      const { data: sched } = await generateSchedule(user.uid);
      toast.success(`Created ${sched.total_blocks} calendar blocks!`);
    } catch {
      toast.error("Scheduling failed");
    } finally {
      setScheduling(false);
    }
  };

  if (loading) return <div className="page-loading">Loading dashboard...</div>;
  if (!data) return <div className="page-loading">No data found.</div>;

  const { stats, top_risk_tasks } = data;

  const gaugeData = [{ value: stats.avg_progress, fill: "var(--accent)" }];

  return (
    <div className="dashboard">
      <div className="page-header">
        <div>
          <h1>Dashboard</h1>
          <p className="text-muted">Welcome back, {user?.displayName?.split(" ")[0]}</p>
        </div>
        <button
          className="btn-primary"
          onClick={handleAutoSchedule}
          disabled={scheduling}
        >
          <Zap size={14} style={{ marginRight: 6 }} />
          {scheduling ? "Scheduling..." : "Auto-Schedule"}
        </button>
      </div>

      {/* Stats */}
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-icon" style={{ background: "rgba(99,102,241,0.1)" }}>
            <Clock size={20} color="var(--accent)" />
          </div>
          <div>
            <p className="stat-value">{stats.total_tasks}</p>
            <p className="stat-label">Total Tasks</p>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon" style={{ background: "rgba(239,68,68,0.1)" }}>
            <AlertTriangle size={20} color="var(--critical)" />
          </div>
          <div>
            <p className="stat-value">{stats.critical_tasks}</p>
            <p className="stat-label">Critical</p>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon" style={{ background: "rgba(245,158,11,0.1)" }}>
            <Calendar size={20} color="var(--warning)" />
          </div>
          <div>
            <p className="stat-value">{stats.warning_tasks}</p>
            <p className="stat-label">At Risk</p>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon" style={{ background: "rgba(16,185,129,0.1)" }}>
            <CheckCircle size={20} color="var(--safe)" />
          </div>
          <div>
            <p className="stat-value">{stats.completed_tasks}</p>
            <p className="stat-label">Completed</p>
          </div>
        </div>
      </div>

      <div className="dashboard-bottom">
        {/* Top Risk Tasks */}
        <div>
          <h2 style={{ marginBottom: 16 }}>High Risk Tasks</h2>
          {top_risk_tasks.length === 0 ? (
            <div className="card empty-state">
              <CheckCircle size={32} color="var(--safe)" />
              <p>All tasks are on track!</p>
            </div>
          ) : (
            top_risk_tasks.map((task) => (
              <RiskCard key={task.id} task={task} />
            ))
          )}
        </div>

        {/* Progress Gauge */}
        <div className="card gauge-card">
          <h3>Overall Progress</h3>
          <ResponsiveContainer width="100%" height={200}>
            <RadialBarChart
              cx="50%"
              cy="50%"
              innerRadius="60%"
              outerRadius="90%"
              data={gaugeData}
              startAngle={90}
              endAngle={-270}
            >
              <RadialBar dataKey="value" cornerRadius={10} background={{ fill: "var(--surface2)" }} />
            </RadialBarChart>
          </ResponsiveContainer>
          <div className="gauge-label">
            <span className="gauge-value">{stats.avg_progress}%</span>
            <span className="text-muted">avg completion</span>
          </div>
          <div className="accountability">
            <p>Today planned: {stats.total_tasks - stats.completed_tasks} tasks</p>
            <p>Completed: {stats.completed_tasks}</p>
            {stats.critical_tasks > 0 && (
              <p className="critical-warning">
                ⚠ {stats.critical_tasks} task(s) are CRITICAL. Act now.
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
