import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useTheme } from "../context/ThemeContext";
import { Shield, Sun, Moon, Eye, EyeOff } from "lucide-react";
import toast from "react-hot-toast";
import {
  getAuth,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  updateProfile,
  GoogleAuthProvider,
  signInWithPopup
} from "firebase/auth";
import "./LoginPage.css";

export default function LoginPage() {
  const [mode, setMode] = useState("login");
  const [form, setForm] = useState({ name: "", email: "", password: "" });
  const [loading, setLoading] = useState(false);
  const [showPass, setShowPass] = useState(false);
  const navigate = useNavigate();
  const { theme, toggle } = useTheme();
  const auth = getAuth();

  const handleGoogle = async () => {
    setLoading(true);
    try {
      await signInWithPopup(auth, new GoogleAuthProvider());
      navigate("/");
    } catch (err) {
      toast.error("Google sign in failed: " + err.message);
    } finally { setLoading(false); }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.email || !form.password) { toast.error("Fill all fields"); return; }
    if (mode === "register" && form.password.length < 6) { toast.error("Password min 6 characters"); return; }
    if (mode === "register" && !form.name.trim()) { toast.error("Enter your name"); return; }
    setLoading(true);
    try {
      if (mode === "login") {
        await signInWithEmailAndPassword(auth, form.email.trim(), form.password);
      } else {
        const result = await createUserWithEmailAndPassword(auth, form.email.trim(), form.password);
        await updateProfile(result.user, { displayName: form.name.trim() });
      }
      toast.success(mode === "login" ? "Welcome back!" : "Account created!");
      navigate("/");
    } catch (err) {
      const msgs = {
        "auth/user-not-found": "No account with this email",
        "auth/wrong-password": "Wrong password",
        "auth/invalid-credential": "Wrong email or password",
        "auth/email-already-in-use": "Email already registered — Sign In instead",
        "auth/invalid-email": "Invalid email address",
        "auth/weak-password": "Password too weak (min 6 chars)",
        "auth/too-many-requests": "Too many attempts. Wait a moment.",
        "auth/network-request-failed": "Network error. Check internet.",
        "auth/operation-not-allowed": "Email login not enabled — enable it in Firebase Console",
      };
      toast.error(msgs[err.code] || err.message);
    } finally { setLoading(false); }
  };

  const switchMode = (m) => { setMode(m); setForm({ name: "", email: "", password: "" }); };

  return (
    <div className="login-page">
      <button className="theme-toggle-btn" onClick={toggle}>
        {theme === "dark" ? <Sun size={18} /> : <Moon size={18} />}
      </button>
      <div className="login-card">
        <div className="login-logo"><Shield size={36} color="#6366f1" /></div>
        <h1 className="login-title">DeadlineGuardian AI</h1>
        <p className="login-subtitle">Your AI companion against deadline failure</p>

        <div className="auth-tabs">
          <button className={`auth-tab ${mode === "login" ? "active" : ""}`} onClick={() => switchMode("login")}>Sign In</button>
          <button className={`auth-tab ${mode === "register" ? "active" : ""}`} onClick={() => switchMode("register")}>Register</button>
        </div>

        <form onSubmit={handleSubmit} className="auth-form">
          {mode === "register" && (
            <div className="form-group">
              <label>Full Name</label>
              <input required placeholder="Your name" value={form.name}
                onChange={e => setForm({ ...form, name: e.target.value })} />
            </div>
          )}
          <div className="form-group">
            <label>Email</label>
            <input type="email" required placeholder="you@email.com" value={form.email}
              onChange={e => setForm({ ...form, email: e.target.value })} />
          </div>
          <div className="form-group">
            <label>Password</label>
            <div className="password-field">
              <input type={showPass ? "text" : "password"} required
                placeholder={mode === "register" ? "Min 6 characters" : "Your password"}
                value={form.password}
                onChange={e => setForm({ ...form, password: e.target.value })} />
              <button type="button" className="eye-btn" onClick={() => setShowPass(!showPass)}>
                {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>
          <button type="submit" className="btn-primary submit-btn" disabled={loading}>
            {loading ? "Please wait..." : mode === "login" ? "Sign In" : "Create Account"}
          </button>
        </form>

        <div className="divider"><span>or</span></div>
        <button className="btn-google" onClick={handleGoogle} disabled={loading}>
          <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" alt="G" width={18} />
          Continue with Google
        </button>
        <p className="switch-mode">
          {mode === "login" ? "Don't have an account? " : "Already have an account? "}
          <button type="button" className="link-btn" onClick={() => switchMode(mode === "login" ? "register" : "login")}>
            {mode === "login" ? "Register" : "Sign In"}
          </button>
        </p>

        {mode === "register" && (
          <p className="firebase-hint">
            ⚠ Make sure Email/Password is enabled in Firebase Console → Authentication → Sign-in methods
          </p>
        )}
      </div>
    </div>
  );
}