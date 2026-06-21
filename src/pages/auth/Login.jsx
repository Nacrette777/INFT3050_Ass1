import { useState } from "react";
import { useNavigate, Link } from "react-router";
import { login } from "../../services/authService";

function Login() {
  const navigate = useNavigate();

  const [username, setUsername] = useState("admin");
  const [password, setPassword] = useState("adminPW");
  const [error, setError] = useState("");

  function handleSubmit(event) {
    event.preventDefault();

    const result = login(username, password);

    if (!result.success) {
      setError(result.message);
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
      <h1>Login</h1>

      {error && <p className="error-message">{error}</p>}

      <form onSubmit={handleSubmit} className="auth-form">
        <label>
          Username / Email
          <input
            value={username}
            onChange={(event) => setUsername(event.target.value)}
          />
        </label>

        <label>
          Password
          <input
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
          />
        </label>

        <button type="submit">Login</button>
      </form>

      <p>
        Do not have an account? <Link to="/register">Register</Link>
      </p>
    </section>
  );
}

export default Login;