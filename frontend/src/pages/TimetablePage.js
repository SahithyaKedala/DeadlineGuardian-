import React, { useState, useEffect } from "react";
import { Upload, Calendar, Bell, Trash2, Plus, AlertTriangle, FileText } from "lucide-react";
import toast from "react-hot-toast";
import * as pdfjsLib from "pdfjs-dist";
import "./TimetablePage.css";

// Required for pdf.js to work in browser
pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js`;

const STORAGE_KEY = "dg_timetable_events";
const CATEGORIES = ["Exam", "Assignment", "Project", "Lab", "Presentation", "Holiday", "Other"];

function daysUntil(dateStr) {
    const now = new Date(); now.setHours(0, 0, 0, 0);
    const target = new Date(dateStr + "T00:00:00");
    return Math.round((target - now) / 86400000);
}

function getUrgency(days) {
    if (days < 0) return "overdue";
    if (days <= 3) return "critical";
    if (days <= 7) return "warning";
    if (days <= 14) return "soon";
    return "safe";
}

const URGENCY = {
    overdue: { label: "OVERDUE", color: "#ff2222" },
    critical: { label: "< 3 days", color: "#ef4444" },
    warning: { label: "< 1 week", color: "#f59e0b" },
    soon: { label: "< 2 weeks", color: "#6366f1" },
    safe: { label: "Upcoming", color: "#10b981" },
};

// Parse any raw text to find events with dates
function parseText(text) {
    const lines = text.split("\n").filter(l => l.trim().length > 2);
    const result = [];
    const seen = new Set();

    const datePatterns = [
        // dd/mm/yyyy or dd-mm-yyyy
        /(\d{1,2})[\/\-\.](\d{1,2})[\/\-\.](\d{2,4})/,
        // yyyy-mm-dd
        /(\d{4})[\/\-](\d{1,2})[\/\-](\d{1,2})/,
        // "15 July 2026" or "July 15 2026" or "15 Jul 26"
        /(\d{1,2})\s+(Jan(?:uary)?|Feb(?:ruary)?|Mar(?:ch)?|Apr(?:il)?|May|Jun(?:e)?|Jul(?:y)?|Aug(?:ust)?|Sep(?:tember)?|Oct(?:ober)?|Nov(?:ember)?|Dec(?:ember)?)\s+(\d{2,4})/i,
        /( Jan(?:uary)?|Feb(?:ruary)?|Mar(?:ch)?|Apr(?:il)?|May|Jun(?:e)?|Jul(?:y)?|Aug(?:ust)?|Sep(?:tember)?|Oct(?:ober)?|Nov(?:ember)?|Dec(?:ember)?)\s+(\d{1,2}),?\s+(\d{2,4})/i,
    ];

    const monthMap = {
        jan: 1, feb: 2, mar: 3, apr: 4, may: 5, jun: 6,
        jul: 7, aug: 8, sep: 9, oct: 10, nov: 11, dec: 12,
        january: 1, february: 2, march: 3, april: 4, june: 6,
        july: 7, august: 8, september: 9, october: 10, november: 11, december: 12
    };

    lines.forEach((line, i) => {
        let dateStr = null;

        // Pattern 1: dd/mm/yyyy
        const m1 = line.match(/(\d{1,2})[\/\-\.](\d{1,2})[\/\-\.](\d{2,4})/);
        if (m1) {
            const yr = m1[3].length === 2 ? "20" + m1[3] : m1[3];
            dateStr = `${yr}-${m1[2].padStart(2, "0")}-${m1[1].padStart(2, "0")}`;
        }

        // Pattern 2: yyyy-mm-dd
        if (!dateStr) {
            const m2 = line.match(/(\d{4})[\/\-](\d{1,2})[\/\-](\d{1,2})/);
            if (m2) dateStr = `${m2[1]}-${m2[2].padStart(2, "0")}-${m2[3].padStart(2, "0")}`;
        }

        // Pattern 3: 15 July 2026
        if (!dateStr) {
            const m3 = line.match(/(\d{1,2})\s+(Jan\w*|Feb\w*|Mar\w*|Apr\w*|May|Jun\w*|Jul\w*|Aug\w*|Sep\w*|Oct\w*|Nov\w*|Dec\w*)\s+(\d{2,4})/i);
            if (m3) {
                const mn = monthMap[m3[2].toLowerCase().slice(0, 3)];
                const yr = m3[3].length === 2 ? "20" + m3[3] : m3[3];
                if (mn) dateStr = `${yr}-${String(mn).padStart(2, "0")}-${m3[1].padStart(2, "0")}`;
            }
        }

        // Pattern 4: July 15 2026
        if (!dateStr) {
            const m4 = line.match(/(Jan\w*|Feb\w*|Mar\w*|Apr\w*|May|Jun\w*|Jul\w*|Aug\w*|Sep\w*|Oct\w*|Nov\w*|Dec\w*)\s+(\d{1,2}),?\s+(\d{2,4})/i);
            if (m4) {
                const mn = monthMap[m4[1].toLowerCase().slice(0, 3)];
                const yr = m4[3].length === 2 ? "20" + m4[3] : m4[3];
                if (mn) dateStr = `${yr}-${String(mn).padStart(2, "0")}-${m4[2].padStart(2, "0")}`;
            }
        }

        if (dateStr) {
            // Validate date
            const d = new Date(dateStr + "T00:00:00");
            if (isNaN(d.getTime())) return;

            // Clean title
            let title = line
                .replace(/(\d{1,2})[\/\-\.](\d{1,2})[\/\-\.](\d{2,4})/g, "")
                .replace(/(\d{4})[\/\-](\d{1,2})[\/\-](\d{1,2})/g, "")
                .replace(/(Jan\w*|Feb\w*|Mar\w*|Apr\w*|May|Jun\w*|Jul\w*|Aug\w*|Sep\w*|Oct\w*|Nov\w*|Dec\w*)\s+\d{1,2},?\s+\d{2,4}/gi, "")
                .replace(/\d{1,2}\s+(Jan\w*|Feb\w*|Mar\w*|Apr\w*|May|Jun\w*|Jul\w*|Aug\w*|Sep\w*|Oct\w*|Nov\w*|Dec\w*)\s+\d{2,4}/gi, "")
                .replace(/[:\-\|,]+/g, " ")
                .replace(/\s+/g, " ")
                .trim();

            if (!title || title.length < 2) title = `Event on ${dateStr}`;
            title = title.slice(0, 80);

            const key = `${title}-${dateStr}`;
            if (seen.has(key)) return;
            seen.add(key);

            const cat = /exam/i.test(title) ? "Exam"
                : /assign/i.test(title) ? "Assignment"
                    : /project/i.test(title) ? "Project"
                        : /lab/i.test(title) ? "Lab"
                            : /present/i.test(title) ? "Presentation"
                                : /holiday|break|vacation/i.test(title) ? "Holiday"
                                    : "Other";

            result.push({
                title, date: dateStr, category: cat,
                subject: "", notes: "",
                id: Date.now() + i + Math.random(),
                createdAt: new Date().toISOString()
            });
        }
    });

    return result.sort((a, b) => new Date(a.date) - new Date(b.date));
}

// Extract text from PDF using pdf.js
async function extractPDFText(file) {
    const arrayBuffer = await file.arrayBuffer();
    const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
    let fullText = "";
    for (let i = 1; i <= pdf.numPages; i++) {
        const page = await pdf.getPage(i);
        const content = await page.getTextContent();
        const pageText = content.items.map(item => item.str).join(" ");
        fullText += pageText + "\n";
    }
    return fullText;
}

export default function TimetablePage() {
    const [events, setEvents] = useState(() => {
        try { return JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]"); } catch { return []; }
    });
    const [showForm, setShowForm] = useState(false);
    const [form, setForm] = useState({ title: "", date: "", category: "Exam", subject: "", notes: "" });
    const [filter, setFilter] = useState("all");
    const [parsedPreview, setParsedPreview] = useState(null);
    const [uploading, setUploading] = useState(false);
    const [uploadedFileName, setUploadedFileName] = useState("");
    const fileRef = React.useRef();

    useEffect(() => { localStorage.setItem(STORAGE_KEY, JSON.stringify(events)); }, [events]);

    // Reminder checker every 60 seconds
    useEffect(() => {
        const check = () => {
            const notified = JSON.parse(sessionStorage.getItem("dg_ev_notified") || "[]");
            events.forEach(ev => {
                const days = daysUntil(ev.date);
                [7, 3, 1, 0].forEach(d => {
                    const key = `${ev.id}-${d}`;
                    if (days === d && !notified.includes(key)) {
                        const msg = d === 0
                            ? `📅 TODAY: "${ev.title}" is due today!`
                            : `⏰ "${ev.title}" is in ${d} day${d > 1 ? "s" : ""}!`;
                        toast(msg, { duration: 8000, icon: d <= 1 ? "🔴" : "⚠️" });
                        if (Notification.permission === "granted")
                            new Notification("DeadlineGuardian Reminder", { body: msg });
                        notified.push(key);
                        sessionStorage.setItem("dg_ev_notified", JSON.stringify(notified));
                    }
                });
            });
        };
        check();
        const t = setInterval(check, 60000);
        return () => clearInterval(t);
    }, [events]);

    const addEvent = (e) => {
        e.preventDefault();
        if (!form.title || !form.date) { toast.error("Fill title and date"); return; }
        const ev = { ...form, id: Date.now().toString(), createdAt: new Date().toISOString() };
        setEvents(prev => [...prev, ev].sort((a, b) => new Date(a.date) - new Date(b.date)));
        toast.success("Event added! Reminders set for 7, 3, 1 day before.");
        setShowForm(false);
        setForm({ title: "", date: "", category: "Exam", subject: "", notes: "" });
    };

    const deleteEvent = (id) => {
        setEvents(prev => prev.filter(e => e.id !== id));
        toast.success("Event removed");
    };

    const handleFile = async (e) => {
        const file = e.target.files[0];
        if (!file) return;
        setUploading(true);
        setUploadedFileName(file.name);

        try {
            let text = "";

            if (file.name.match(/\.pdf$/i)) {
                toast("Reading PDF... please wait");
                text = await extractPDFText(file);
            } else if (file.name.match(/\.(txt|csv)$/i)) {
                text = await file.text();
            } else {
                toast.error("Supported: PDF, TXT, CSV only");
                setUploading(false);
                e.target.value = "";
                return;
            }

            if (!text.trim()) {
                toast.error("File appears empty or couldn't be read");
                setUploading(false);
                e.target.value = "";
                return;
            }

            const parsed = parseText(text);

            if (parsed.length > 0) {
                setParsedPreview(parsed);
                toast.success(`✅ Found ${parsed.length} events in "${file.name}"! Review below.`);
            } else {
                toast.error("No dates found in this file. Try adding events manually.", { duration: 6000 });
            }
        } catch (err) {
            console.error(err);
            toast.error("Failed to read file: " + err.message);
        } finally {
            setUploading(false);
            e.target.value = "";
        }
    };

    const importAll = () => {
        const toAdd = parsedPreview.map(ev => ({ ...ev, id: Date.now() + Math.random() + "" }));
        setEvents(prev => [...prev, ...toAdd].sort((a, b) => new Date(a.date) - new Date(b.date)));
        toast.success(`${parsedPreview.length} events imported!`);
        setParsedPreview(null);
        setUploadedFileName("");
    };

    const getMin = () => new Date().toISOString().split("T")[0];

    const urgentCount = events.filter(ev => { const d = daysUntil(ev.date); return d >= 0 && d <= 7; }).length;

    const filtered = events.filter(ev => {
        const d = daysUntil(ev.date);
        if (filter === "urgent") return d >= 0 && d <= 3;
        if (filter === "week") return d >= 0 && d <= 7;
        if (filter === "upcoming") return d > 7;
        return true;
    });

    return (
        <div className="timetable-page">
            <div className="tt-header">
                <div>
                    <h1>📅 Academic Calendar</h1>
                    <p className="text-muted">Upload timetable (PDF/TXT/CSV) — get reminders 7 days, 3 days, 1 day before</p>
                </div>
                <div className="tt-header-actions">
                    <button className="btn-upload" onClick={() => fileRef.current.click()} disabled={uploading}>
                        <Upload size={15} />
                        {uploading ? "Reading file..." : "Upload PDF / TXT / CSV"}
                    </button>
                    <input ref={fileRef} type="file" accept=".pdf,.txt,.csv"
                        style={{ display: "none" }} onChange={handleFile} />
                    <button className="btn-primary" onClick={() => setShowForm(!showForm)}>
                        <Plus size={15} /> Add Event
                    </button>
                </div>
            </div>

            {/* File format info */}
            <div className="card format-info">
                <FileText size={16} color="var(--accent)" />
                <div>
                    <strong>Supported upload formats:</strong>
                    <p>
                        <span className="fmt-badge">PDF</span> Academic calendars, exam timetables, schedules
                        <span className="fmt-badge">TXT</span> One event per line with date
                        <span className="fmt-badge">CSV</span> Exported calendar files
                    </p>
                    <p style={{ fontSize: 12, marginTop: 6, color: "var(--text-muted)" }}>
                        Detects dates like: <code>15/07/2026</code> · <code>2026-07-15</code> · <code>15 July 2026</code> · <code>July 15, 2026</code>
                    </p>
                </div>
            </div>

            {/* Parsed preview */}
            {parsedPreview && (
                <div className="card parse-preview">
                    <h3>📋 Found {parsedPreview.length} events in "{uploadedFileName}"</h3>
                    <p style={{ fontSize: 12, color: "var(--text-muted)", marginBottom: 12 }}>
                        Review below. Edit categories after importing if needed.
                    </p>
                    <div className="preview-list">
                        {parsedPreview.map((ev, i) => (
                            <div key={i} className="preview-item">
                                <span className="preview-cat">{ev.category}</span>
                                <span className="preview-title">{ev.title}</span>
                                <span className="preview-date">
                                    {new Date(ev.date + "T00:00:00").toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })}
                                </span>
                            </div>
                        ))}
                    </div>
                    <div className="preview-actions">
                        <button className="btn-ghost" onClick={() => { setParsedPreview(null); setUploadedFileName(""); }}>Cancel</button>
                        <button className="btn-primary" onClick={importAll}>Import All {parsedPreview.length} Events</button>
                    </div>
                </div>
            )}

            {/* Add form */}
            {showForm && (
                <form className="card tt-form" onSubmit={addEvent}>
                    <h3>Add Academic Event</h3>
                    <div className="tt-form-grid">
                        <div className="form-group span-2">
                            <label>Event Title</label>
                            <input required placeholder="e.g. DBMS Final Exam" value={form.title}
                                onChange={e => setForm({ ...form, title: e.target.value })} />
                        </div>
                        <div className="form-group">
                            <label>Date</label>
                            <input type="date" required min={getMin()} value={form.date}
                                onChange={e => setForm({ ...form, date: e.target.value })} />
                        </div>
                        <div className="form-group">
                            <label>Category</label>
                            <select value={form.category} onChange={e => setForm({ ...form, category: e.target.value })}>
                                {CATEGORIES.map(c => <option key={c}>{c}</option>)}
                            </select>
                        </div>
                        <div className="form-group">
                            <label>Subject</label>
                            <input placeholder="e.g. Database Management" value={form.subject}
                                onChange={e => setForm({ ...form, subject: e.target.value })} />
                        </div>
                        <div className="form-group">
                            <label>Notes (optional)</label>
                            <input placeholder="e.g. Units 1-4, Open book" value={form.notes}
                                onChange={e => setForm({ ...form, notes: e.target.value })} />
                        </div>
                    </div>
                    <div className="form-actions">
                        <button type="button" className="btn-ghost" onClick={() => setShowForm(false)}>Cancel</button>
                        <button type="submit" className="btn-primary">Add Event</button>
                    </div>
                </form>
            )}

            {/* Stats */}
            {events.length > 0 && (
                <div className="tt-stats">
                    <div className="tt-stat"><span className="stat-num">{events.length}</span><span>Total Events</span></div>
                    <div className="tt-stat"><span className="stat-num" style={{ color: "var(--critical)" }}>{urgentCount}</span><span>This Week</span></div>
                    <div className="tt-stat"><span className="stat-num" style={{ color: "var(--warning)" }}>
                        {events.filter(e => { const d = daysUntil(e.date); return d >= 0 && d <= 14; }).length}
                    </span><span>Next 2 Weeks</span></div>
                    <div className="tt-stat"><span className="stat-num" style={{ color: "var(--safe)" }}>
                        {events.filter(e => daysUntil(e.date) < 0).length}
                    </span><span>Past</span></div>
                </div>
            )}

            {/* Filters */}
            <div className="filter-bar">
                {[
                    { k: "all", l: "All" },
                    { k: "urgent", l: `🔴 Urgent${urgentCount > 0 ? ` (${urgentCount})` : ""}` },
                    { k: "week", l: "This Week" },
                    { k: "upcoming", l: "Later" },
                ].map(f => (
                    <button key={f.k} className={`filter-btn ${filter === f.k ? "active" : ""}`}
                        onClick={() => setFilter(f.k)}>{f.l}
                    </button>
                ))}
            </div>

            {/* Events */}
            {filtered.length === 0 ? (
                <div className="card tt-empty">
                    <Calendar size={40} color="var(--text-muted)" />
                    <h3>No events yet</h3>
                    <p>Upload your academic timetable PDF or add events manually</p>
                    <div className="tt-format-hint">
                        <p><strong>TXT/CSV format (one per line):</strong></p>
                        <code>DBMS Exam 15/07/2026</code>
                        <code>OS Assignment 20-07-2026</code>
                        <code>2026-07-25 Network Lab</code>
                        <code>July 28 2026 - Mini Project</code>
                    </div>
                </div>
            ) : (
                <div className="events-list">
                    {filtered.map(ev => {
                        const days = daysUntil(ev.date);
                        const urg = URGENCY[getUrgency(days)];
                        return (
                            <div key={ev.id} className={`card event-card urgency-${getUrgency(days)}`}>
                                <div className="event-date-box">
                                    <span className="event-day">{new Date(ev.date + "T00:00:00").getDate()}</span>
                                    <span className="event-month">{new Date(ev.date + "T00:00:00").toLocaleString("en", { month: "short" })}</span>
                                </div>
                                <div className="event-body">
                                    <div className="event-top">
                                        <h3>{ev.title}</h3>
                                        <span className="event-cat">{ev.category}</span>
                                    </div>
                                    {ev.subject && <p className="event-subject">{ev.subject}</p>}
                                    {ev.notes && <p className="event-notes">📝 {ev.notes}</p>}
                                    <div className="event-bottom">
                                        <span className="days-badge"
                                            style={{ color: urg.color, background: `${urg.color}18`, border: `1px solid ${urg.color}40` }}>
                                            {days < 0 ? `Overdue by ${Math.abs(days)}d`
                                                : days === 0 ? "📅 TODAY!"
                                                    : `${days} day${days !== 1 ? "s" : ""} left`}
                                        </span>
                                        <span style={{ fontSize: 11, color: urg.color, fontWeight: 600 }}>{urg.label}</span>
                                    </div>
                                </div>
                                <div className="event-actions">
                                    {days >= 0 && days <= 7 && <AlertTriangle size={16} color={urg.color} />}
                                    <button className="btn-ghost btn-sm" onClick={() => deleteEvent(ev.id)}>
                                        <Trash2 size={14} />
                                    </button>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}

            <div className="card reminder-info">
                <Bell size={16} color="var(--accent)" />
                <div>
                    <strong>Auto Reminders Active</strong>
                    <p>Notifications 7 days, 3 days, 1 day before, and on the event day. Keep this tab open.</p>
                </div>
            </div>
        </div>
    );
}