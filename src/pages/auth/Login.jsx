import { useState } from "react";
import { useNavigate, Link } from "react-router";
import { login } from "../../services/authService";

function Login() {
  const navigate = useNavigate();

  const [username, setUsername]     = useState("");
  const [password, setPassword]     = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors]         = useState({});
  const [loading, setLoading]       = useState(false);

  function validate() {
    const newErrors = {};
    if (!username.trim()) newErrors.username = "Username or email is required.";
    if (!password)        newErrors.password = "Password is required.";
    return newErrors;
  }

  function handleSubmit(event) {
    event.preventDefault();

    const validationErrors = validate();
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

    setLoading(true);
    setErrors({});

    // -------------------------------------------------------
    // STEP 1: 先查 Register.jsx 存进 localStorage 的注册用户
    //         key = "registeredUsers"，格式与 authService 兼容
    // -------------------------------------------------------
    const registeredUsers = JSON.parse(
      localStorage.getItem("registeredUsers") || "[]"
    );
    const registeredUser = registeredUsers.find(
      (u) =>
        (u.username === username || u.email === username) &&
        u.password === password
    );

    if (registeredUser) {
      // 用与 authService 完全相同的 key 写入 session
      // 这样 getCurrentUser() 和 logout() 都能正常工作
      localStorage.setItem("currentUser", JSON.stringify(registeredUser));
      navigate("/customer/home");
      return;
    }

    // -------------------------------------------------------
    // STEP 2: 注册用户里找不到，fallback 到 authService
    //         处理 admin / employee / 原始 customer 账号
    // -------------------------------------------------------
    const result = login(username, password);

    if (!result.success) {
      setErrors({ general: "Invalid username or password." });
      setLoading(false);
      return;
    }

    if (result.user.role === "admin") {
      navigate("/admin/dashboard");
    } else if (result.user.role === "employee") {
      navigate("/employee/dashboard");
    } else {
      navigate("/customer/home");
    }
  }

  return (
    <section className="login-page">
      <h1>Sign In</h1>
      <p style={{ color: "#666", marginBottom: "20px" }}>
        Access your Trade Web account
      </p>

      {errors.general && (
        <p className="error-message">{errors.general}</p>
      )}

      <form onSubmit={handleSubmit} className="auth-form" noValidate>

        <label>
          Username / Email
          <input
            type="text"
            value={username}
            onChange={(e) => {
              setUsername(e.target.value);
              setErrors((prev) => ({ ...prev, username: "" }));
            }}
            placeholder="Enter your username or email"
            autoComplete="username"
          />
          {errors.username && (
            <span className="error-message" style={{ fontSize: "0.8rem" }}>
              {errors.username}
            </span>
          )}
        </label>

        <label>
          Password
          <div style={{ position: "relative" }}>
            <input
              type={showPassword ? "text" : "password"}
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                setErrors((prev) => ({ ...prev, password: "" }));
              }}
              placeholder="Enter your password"
              autoComplete="current-password"
              style={{ paddingRight: "40px", width: "100%" }}
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              style={{
                position: "absolute", right: "8px", top: "50%",
                transform: "translateY(-50%)", background: "none",
                border: "none", cursor: "pointer", padding: "0",
                color: "#666", fontSize: "0.8rem",
              }}
            >
              {showPassword ? "Hide" : "Show"}
            </button>
          </div>
          {errors.password && (
            <span className="error-message" style={{ fontSize: "0.8rem" }}>
              {errors.password}
            </span>
          )}
        </label>

        <button type="submit" disabled={loading}>
          {loading ? "Signing in…" : "Sign In"}
        </button>
      </form>

      <p style={{ marginTop: "16px" }}>
        Don&apos;t have an account? <Link to="/register">Register here</Link>
      </p>

      <div
        style={{
          marginTop: "24px", padding: "12px",
          background: "#f0f4ff", border: "1px solid #c7d2fe",
          borderRadius: "4px", fontSize: "0.8rem", color: "#444",
        }}
      >
        <strong>Demo accounts:</strong><br />
        Customer: <code>customer</code> / <code>customerPW</code><br />
        Admin: <code>admin</code> / <code>adminPW</code>
      </div>
    </section>
  );
}

export default Login;
