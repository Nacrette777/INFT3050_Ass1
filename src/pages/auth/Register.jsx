import { useState } from "react";
import { Link, useNavigate } from "react-router";

function Register() {
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
  });

  const [errors, setErrors]         = useState({});
  const [showPassword, setShowPassword]   = useState(false);
  const [showConfirm, setShowConfirm]     = useState(false);
  const [passwordStrength, setPasswordStrength] = useState(0);
  const [loading, setLoading]       = useState(false);

  // 计算密码强度 (0–4)
  function calcStrength(val) {
    let score = 0;
    if (val.length >= 8)            score++;
    if (/[A-Z]/.test(val))          score++;
    if (/[0-9]/.test(val))          score++;
    if (/[^a-zA-Z0-9]/.test(val))  score++;
    return score;
  }

  const strengthLabels = ["", "Weak", "Fair", "Good", "Strong"];
  const strengthColors = ["", "#d32f2f", "#f57c00", "#1976d2", "#388e3c"];

  function handleChange(event) {
    const { name, value } = event.target;
    setFormData({ ...formData, [name]: value });
    // 清除对应字段的错误
    setErrors((prev) => ({ ...prev, [name]: "" }));
    // 实时更新密码强度
    if (name === "password") setPasswordStrength(calcStrength(value));
  }

  function validate() {
    const newErrors = {};
    if (!formData.name.trim() || formData.name.trim().length < 2)
      newErrors.name = "Full name must be at least 2 characters.";
    if (!formData.email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email))
      newErrors.email = "Please enter a valid email address.";
    if (!formData.password || formData.password.length < 6)
      newErrors.password = "Password must be at least 6 characters.";
    if (!formData.confirmPassword || formData.confirmPassword !== formData.password)
      newErrors.confirmPassword = "Passwords do not match.";
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

    // 把新用户存入 localStorage（与 authService 格式保持兼容）
    const existingUsers = JSON.parse(localStorage.getItem("registeredUsers") || "[]");
    const emailTaken = existingUsers.find((u) => u.email === formData.email);
    if (emailTaken) {
      setErrors({ email: "This email is already registered." });
      setLoading(false);
      return;
    }

    const newUser = {
      username: formData.email,
      email: formData.email,
      name: formData.name,
      password: formData.password,
      role: "customer",
      joinedAt: new Date().toISOString(),
    };

    existingUsers.push(newUser);
    localStorage.setItem("registeredUsers", JSON.stringify(existingUsers));

    alert("Account created successfully! Please sign in.");
    navigate("/login");
  }

  return (
    <section className="register-page">
      <h1>Create Account</h1>
      <p style={{ color: "#666", marginBottom: "20px" }}>
        Join Trade Web today
      </p>

      <form onSubmit={handleSubmit} className="auth-form" noValidate>

        {/* Name */}
        <label>
          Full Name
          <input
            name="name"
            type="text"
            value={formData.name}
            onChange={handleChange}
            placeholder="Your full name"
            autoComplete="name"
          />
          {errors.name && (
            <span className="error-message" style={{ fontSize: "0.8rem" }}>
              {errors.name}
            </span>
          )}
        </label>

        {/* Email */}
        <label>
          Email Address
          <input
            name="email"
            type="email"
            value={formData.email}
            onChange={handleChange}
            placeholder="you@example.com"
            autoComplete="email"
          />
          {errors.email && (
            <span className="error-message" style={{ fontSize: "0.8rem" }}>
              {errors.email}
            </span>
          )}
        </label>

        {/* Password */}
        <label>
          Password
          <div style={{ position: "relative" }}>
            <input
              name="password"
              type={showPassword ? "text" : "password"}
              value={formData.password}
              onChange={handleChange}
              placeholder="Min. 6 characters"
              autoComplete="new-password"
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
          {/* 密码强度条 */}
          {formData.password.length > 0 && (
            <div style={{ marginTop: "6px" }}>
              <div
                style={{
                  height: "4px",
                  background: "#e0e0e0",
                  borderRadius: "2px",
                  overflow: "hidden",
                }}
              >
                <div
                  style={{
                    height: "100%",
                    width: `${(passwordStrength / 4) * 100}%`,
                    background: strengthColors[passwordStrength],
                    transition: "width 0.3s, background 0.3s",
                  }}
                />
              </div>
              <span style={{ fontSize: "0.75rem", color: strengthColors[passwordStrength] }}>
                {strengthLabels[passwordStrength]}
              </span>
            </div>
          )}
          {errors.password && (
            <span className="error-message" style={{ fontSize: "0.8rem" }}>
              {errors.password}
            </span>
          )}
        </label>

        {/* Confirm Password */}
        <label>
          Confirm Password
          <div style={{ position: "relative" }}>
            <input
              name="confirmPassword"
              type={showConfirm ? "text" : "password"}
              value={formData.confirmPassword}
              onChange={handleChange}
              placeholder="Re-enter your password"
              autoComplete="new-password"
              style={{ paddingRight: "40px", width: "100%" }}
            />
            <button
              type="button"
              onClick={() => setShowConfirm(!showConfirm)}
              style={{
                position: "absolute", right: "8px", top: "50%",
                transform: "translateY(-50%)", background: "none",
                border: "none", cursor: "pointer", padding: "0",
                color: "#666", fontSize: "0.8rem",
              }}
            >
              {showConfirm ? "Hide" : "Show"}
            </button>
          </div>
          {errors.confirmPassword && (
            <span className="error-message" style={{ fontSize: "0.8rem" }}>
              {errors.confirmPassword}
            </span>
          )}
        </label>

        <button type="submit" disabled={loading}>
          {loading ? "Creating account…" : "Create Account"}
        </button>
      </form>

      <p style={{ marginTop: "16px" }}>
        Already have an account? <Link to="/login">Sign in</Link>
      </p>
    </section>
  );
}

export default Register;
