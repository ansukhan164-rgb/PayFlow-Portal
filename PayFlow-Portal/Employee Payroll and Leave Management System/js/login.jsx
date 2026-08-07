import { useState } from "react";

// Adjust this to match your backend's login route
const LOGIN_ENDPOINT = "/api/auth/login";

export default function Login() {
  const [form, setForm] = useState({ identifier: "", password: "", remember: false });
  const [errors, setErrors] = useState({});
  const [message, setMessage] = useState({ text: "", type: "" });
  const [loading, setLoading] = useState(false);

  const isValidIdentifier = (value) => {
    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const idPattern = /^[A-Za-z0-9_-]{3,}$/;
    return emailPattern.test(value) || idPattern.test(value);
  };

  const validate = () => {
    const next = {};
    if (!form.identifier.trim()) {
      next.identifier = "Please enter your email or employee ID.";
    } else if (!isValidIdentifier(form.identifier.trim())) {
      next.identifier = "Enter a valid email or employee ID.";
    }
    if (!form.password) {
      next.password = "Please enter your password.";
    } else if (form.password.length < 6) {
      next.password = "Password must be at least 6 characters.";
    }
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm((prev) => ({ ...prev, [name]: type === "checkbox" ? checked : value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage({ text: "", type: "" });
    if (!validate()) return;

    setLoading(true);
    try {
      const res = await fetch(LOGIN_ENDPOINT, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        setMessage({ text: data.message || "Invalid credentials. Please try again.", type: "error" });
        return;
      }

      if (data.token) {
        sessionStorage.setItem("authToken", data.token);
      }

      setMessage({ text: "Login successful! Redirecting...", type: "success" });
      setTimeout(() => {
        window.location.href = "/dashboard"; // change to your app's dashboard route
      }, 800);
    } catch (err) {
      setMessage({ text: "Could not connect to the server. Please try again.", type: "error" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={styles.wrapper}>
      <div style={styles.card}>
        <div style={styles.header}>
          <div style={styles.logo}>EP</div>
          <h1 style={styles.title}>Welcome back</h1>
          <p style={styles.subtitle}>Sign in to Employee Payroll & Leave Management System</p>
        </div>

        <form onSubmit={handleSubmit} style={styles.form} noValidate>
          <div style={styles.field}>
            <label style={styles.label} htmlFor="identifier">Email or Employee ID</label>
            <input
              id="identifier"
              name="identifier"
              type="text"
              placeholder="you@company.com"
              autoComplete="username"
              value={form.identifier}
              onChange={handleChange}
              style={{ ...styles.input, ...(errors.identifier ? styles.inputInvalid : {}) }}
            />
            <div style={styles.errorText}>{errors.identifier || ""}</div>
          </div>

          <div style={styles.field}>
            <label style={styles.label} htmlFor="password">Password</label>
            <input
              id="password"
              name="password"
              type="password"
              placeholder="Enter your password"
              autoComplete="current-password"
              value={form.password}
              onChange={handleChange}
              style={{ ...styles.input, ...(errors.password ? styles.inputInvalid : {}) }}
            />
            <div style={styles.errorText}>{errors.password || ""}</div>
          </div>

          <div style={styles.rowBetween}>
            <label style={styles.checkboxLabel}>
              <input
                type="checkbox"
                name="remember"
                checked={form.remember}
                onChange={handleChange}
              />
              Remember me
            </label>
            <a href="/forgot-password" style={styles.link}>Forgot password?</a>
          </div>

          <button type="submit" disabled={loading} style={{ ...styles.submitBtn, ...(loading ? styles.submitBtnDisabled : {}) }}>
            {loading ? "Signing in..." : "Sign In"}
          </button>

          <div style={{ ...styles.formMessage, color: message.type === "error" ? "#e5484d" : "#16a34a" }}>
            {message.text}
          </div>
        </form>

        <p style={styles.signupLine}>
          Don't have an account? <a href="/register" style={styles.link}>Contact your admin</a>
        </p>
      </div>
    </div>
  );
}

const styles = {
  wrapper: {
    minHeight: "100vh",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    background: "linear-gradient(135deg, #eef2ff 0%, #f8fafc 100%)",
    padding: 20,
    fontFamily: "'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
  },
  card: {
    width: "100%",
    maxWidth: 400,
    background: "#fff",
    borderRadius: 14,
    boxShadow: "0 20px 45px rgba(30, 41, 59, 0.12)",
    padding: "40px 36px",
  },
  header: { textAlign: "center", marginBottom: 28 },
  logo: {
    width: 54, height: 54, margin: "0 auto 14px", borderRadius: 12,
    background: "#2f6fed", display: "flex", alignItems: "center", justifyContent: "center",
    color: "#fff", fontWeight: 700, fontSize: 22,
  },
  title: { fontSize: 20, margin: "0 0 4px", color: "#1e2433" },
  subtitle: { margin: 0, fontSize: 13.5, color: "#7a8399" },
  form: { display: "flex", flexDirection: "column", gap: 18 },
  field: { display: "flex", flexDirection: "column", gap: 6 },
  label: { fontSize: 13, fontWeight: 600, color: "#1e2433" },
  input: {
    padding: "12px 14px", border: "1.5px solid #e2e6f0", borderRadius: 10,
    fontSize: 14.5, outline: "none", background: "#fafbff",
  },
  inputInvalid: { borderColor: "#e5484d" },
  errorText: { fontSize: 12.5, color: "#e5484d", minHeight: 16 },
  rowBetween: {
    display: "flex", alignItems: "center", justifyContent: "space-between",
    fontSize: 13, color: "#7a8399",
  },
  checkboxLabel: { display: "flex", alignItems: "center", gap: 6, cursor: "pointer" },
  link: { color: "#2f6fed", textDecoration: "none", fontWeight: 600 },
  submitBtn: {
    marginTop: 4, padding: "12px 14px", border: "none", borderRadius: 10,
    background: "#2f6fed", color: "#fff", fontSize: 15, fontWeight: 600, cursor: "pointer",
  },
  submitBtnDisabled: { background: "#a9bceb", cursor: "not-allowed" },
  formMessage: { textAlign: "center", fontSize: 13, minHeight: 18 },
  signupLine: { textAlign: "center", fontSize: 13.5, color: "#7a8399", marginTop: 16 },
};