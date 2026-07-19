import { useState } from "react";
import { useNavigate, Link } from "react-router";
import { login } from "../../services/authService";

function Login() {
  const navigate = useNavigate();

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);

  function validate() {
    const newErrors = {};
    if (!username.trim()) newErrors.username = "Username or email is required.";
    if (!password) newErrors.password = "Password is required.";
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
    // STEP 1: check users saved by Register.jsx in localStorage
    //         key = "registeredUsers", format matches authService
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
      localStorage.setItem("currentUser", JSON.stringify(registeredUser));
      navigate("/customer/home");
      return;
    }

    // -------------------------------------------------------
    // STEP 2: fall back to authService for admin / employee /
    //         seeded customer accounts
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
    <section className="mg-auth">
      <div className="mg-auth-card">
        <h1 className="mg-auth-title">Login</h1>
        <p className="mg-auth-subtitle">Access your Entertainment Guild account</p>

        {errors.general && (
          <p className="mg-alert mg-alert--error">{errors.general}</p>
        )}

        <form onSubmit={handleSubmit} className="mg-form" noValidate>
          <div className="mg-field">
            <label className="mg-label" htmlFor="login-username">
              Email / Username
            </label>
            <input
              id="login-username"
              type="text"
              className={`mg-input${errors.username ? " mg-input--error" : ""}`}
              value={username}
              onChange={(e) => {
                setUsername(e.target.value);
                setErrors((prev) => ({ ...prev, username: "" }));
              }}
              placeholder="Enter your email or username"
              autoComplete="username"
            />
            {errors.username && (
              <span className="mg-field-error">{errors.username}</span>
            )}
          </div>

          <div className="mg-field">
            <label className="mg-label" htmlFor="login-password">
              Password
            </label>
            <div className="mg-input-wrap">
              <input
                id="login-password"
                type={showPassword ? "text" : "password"}
                className={`mg-input${errors.password ? " mg-input--error" : ""}`}
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  setErrors((prev) => ({ ...prev, password: "" }));
                }}
                placeholder="Enter your password"
                autoComplete="current-password"
              />
              <button
                type="button"
                className="mg-reveal"
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? "Hide" : "Show"}
              </button>
            </div>
            {errors.password && (
              <span className="mg-field-error">{errors.password}</span>
            )}
          </div>

          <div className="mg-auth-actions">
            <button
              type="submit"
              className="mg-btn mg-btn--gold mg-btn--block"
              disabled={loading}
            >
              {loading ? "Signing in..." : "Login"}
            </button>
          </div>
        </form>

        <div className="mg-auth-links">
          <Link className="mg-link" to="/login">
            Forgot Password?
          </Link>
          <span>
            Do not have an account?{" "}
            <Link className="mg-link mg-link--gold" to="/register">
              Register
            </Link>
          </span>
        </div>

        <div className="mg-demo">
          <strong>Demo accounts</strong>
          <br />
          Customer: <code>customer</code> / <code>customerPW</code>
          <br />
          Admin: <code>admin</code> / <code>adminPW</code>
        </div>
      </div>
    </section>
  );
}

export default Login;
