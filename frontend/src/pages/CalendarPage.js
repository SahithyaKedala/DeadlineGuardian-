import React, { useState } from "react";
import { useAuth } from "../context/AuthContext";
import { generateSchedule } from "../services/api";
import { Calendar, Zap, Clock } from "lucide-react";
import { format, parseISO } from "date-fns";
import toast from "react-hot-toast";
import "./CalendarPage.css";

export default function CalendarPage() {
  const { user } = useAuth();
  const [schedule, setSchedule] = useState([]);
  const [loading, setLoading] = useState(false);

  const handleGenerate = async () => {
    setLoading(true);
    try {
      const { data } = await generateSchedule(user.uid);
      setSchedule(data.schedule || []);
      if (data.total_blocks > 0) {
        toast.success(`${data.total_blocks} work blocks added to Google Calendar!`);
      } else {
        toast("No tasks to schedule right now.");
      }
    } catch {
      toast.error("Scheduling failed. Check backend connection.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="calendar-page">
      <div className="page-header">
        <div>
          <h1>Calendar</h1>
          <p className="text-muted">AI-generated work schedule</p>
        </div>
        <button className="btn-primary" onClick={handleGenerate} disabled={loading}>
          <Zap size={14} style={{ marginRight: 6 }} />
          {loading ? "Generating..." : "Generate Schedule"}
        </button>
      </div>

      {schedule.length === 0 ? (
        <div className="card calendar-empty">
          <Calendar size={48} color="var(--text-muted)" />
          <h3>No schedule yet</h3>
          <p>Click "Generate Schedule" to let AI create an optimized work plan based on your tasks and risk scores.</p>
          <button className="btn-primary" onClick={handleGenerate} disabled={loading}>
            {loading ? "Generating..." : "Generate Now"}
          </button>
        </div>
      ) : (
        <div className="schedule-list">
          <h2 style={{ marginBottom: 16 }}>Your Work Blocks</h2>
          {schedule.map((block, i) => (
            <div key={i} className="schedule-block card">
              <div className="block-time">
                <Clock size={14} />
                <span>
                  {block.start_time ? format(parseISO(block.start_time), "MMM d, h:mm a") : "TBD"} –{" "}
                  {block.end_time ? format(parseISO(block.end_time), "h:mm a") : "TBD"}
                </span>
              </div>
              <div className="block-details">
                <h3>{block.task_title}</h3>
                <p className="text-muted">{block.duration_hours}h work session</p>
              </div>
              {block.calendar_event?.link && (
                <a
                  href={block.calendar_event.link}
                  target="_blank"
                  rel="noreferrer"
                  className="btn-ghost btn-sm"
                >
                  View in Calendar →
                </a>
              )}
            </div>
          ))}
        </div>
      )}

      <div className="card info-card">
        <h3>How it works</h3>
        <ol className="info-list">
          <li>AI analyzes all your tasks and their risk scores</li>
          <li>Checks your Google Calendar for free slots</li>
          <li>CRITICAL tasks get scheduled first</li>
          <li>Creates calendar events automatically</li>
          <li>If you miss a session, use "Recovery Plan" on the task</li>
        </ol>
      </div>
    </div>
  );
}
