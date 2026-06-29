import React from "react";
import { Outlet, NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { useTheme } from "../../context/ThemeContext";
import { getAuth, signOut } from "firebase/auth";
import {
  LayoutDashboard, CheckSquare, Calendar, MessageSquare,
  LogOut, Shield, Sun, Moon, Timer, BookOpen
} from "lucide-react";
import "./Layout.css";

const NAV = [
  { to: "/", icon: LayoutDashboard, label: "Dashboard" },
  { to: "/tasks", icon: CheckSquare, label: "Tasks" },
  { to: "/calendar", icon: Calendar, label: "Calendar" },
  { to: "/focus", icon: Timer, label: "Focus Timer" },
  { to: "/timetable", icon: BookOpen, label: "Timetable" },
  { to: "/chat", icon: MessageSquare, label: "AI Chat" },
];

export default function Layout() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { theme, toggle } = useTheme();

  const handleSignOut = async () => {
    await signOut(getAuth());
    navigate("/login");
  };

  return (
    <div className="layout">
      <aside className="sidebar">
        <div className="sidebar-logo">
          <Shield size={22} color="#6366f1" /><span>DeadlineGuardian</span>
        </div>
        <nav className="sidebar-nav">
          {NAV.map(({ to, icon: Icon, label }) => (
            <NavLink key={to} to={to} end={to === "/"}
              className={({ isActive }) => `nav-item ${isActive ? "active" : ""}`}>
              <Icon size={17} /><span>{label}</span>
            </NavLink>
          ))}
        </nav>
        <div className="sidebar-bottom">
          <button className="theme-btn" onClick={toggle}>
            {theme === "dark" ? <Sun size={16} /> : <Moon size={16} />}
            <span>{theme === "dark" ? "Light Mode" : "Dark Mode"}</span>
          </button>
          <div className="sidebar-user">
            <img
              src={user?.photoURL || `https://ui-avatars.com/api/?name=${encodeURIComponent(user?.displayName || user?.email?.charAt(0) || "U")}&background=6366f1&color=fff`}
              alt="avatar" className="avatar"
            />
            <div className="user-info">
              <p className="user-name">{user?.displayName || user?.email?.split("@")[0] || "User"}</p>
              <p className="user-email">{user?.email}</p>
            </div>
            <button className="btn-ghost signout-btn" onClick={handleSignOut}>
              <LogOut size={15} />
            </button>
          </div>
        </div>
      </aside>
      <main className="main-content"><Outlet /></main>
    </div>
  );
}