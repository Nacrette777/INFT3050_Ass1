import { useState } from "react";
import { Link, useNavigate } from "react-router";
import { registerPatron } from "../../services/accountService";

function Register() {
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
  });

  const [errors, setErrors] = useState({});
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [passwordStrength, setPasswordStrength] = useState(0);
  const [loading, setLoading] = useState(false);

  // Password strength (0-4)
  function calcStrength(val) {
    let score = 0;
    if (val.length >= 8) score++;
    if (/[A-Z]/.test(val)) score++;
    if (/[0-9]/.test(val)) score++;
    if (/[^a-zA-Z0-9]/.test(val)) score++;
    return score;
  }

  const strengthLabels = ["", "Weak", "Fair", "Good", "Strong"];

  function handleChange(event) {
    const { name, value } = event.target;
    setFormData({ ...formData, [name]: value });
    setErrors((prev) => ({ ...prev, [name]: "" }));
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

  async function handleSubmit(event) {
    event.preventDefault();
    const validationErrors = validate();
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

    setLoading(true);
    setErrors({});

    try {
      // Writes a real row to the Patrons table. The password is hashed
      // with SHA256(salt + password), matching what the backend expects.
      await registerPatron({
        Name: formData.name,
        Email: formData.email,
        password: formData.password,
      });

      navigate("/login");
    } catch (error) {
      // registerPatron attaches fieldErrors for duplicate emails.
      setErrors(error.fieldErrors || { general: error.message });
      setLoading(false);
    }
  }

  return (
    <section className="mg-auth">
      <div className="mg-auth-card mg-auth-card--wide">
        <h1 className="mg-auth-title">Register</h1>
        <p className="mg-auth-subtitle">Create your Entertainment Guild account</p>

        <form onSubmit={handleSubmit} className="mg-form" noValidate>
          {/* Name */}
          <div className="mg-field">
            <label className="mg-label" htmlFor="register-name">
              Name
            </label>
            <input
              id="register-name"
              name="name"
              type="text"
              className={`mg-input${errors.name ? " mg-input--error" : ""}`}
              value={formData.name}
              onChange={handleChange}
              placeholder="Your full name"
              autoComplete="name"
            />
            {errors.name && <span className="mg-field-error">{errors.name}</span>}
          </div>

          {/* Email */}
          <div className="mg-field">
            <label className="mg-label" htmlFor="register-email">
              Email
            </label>
            <input
              id="register-email"
              name="email"
              type="email"
              className={`mg-input${errors.email ? " mg-input--error" : ""}`}
              value={formData.email}
              onChange={handleChange}
              placeholder="you@example.com"
              autoComplete="email"
            />
            {errors.email && <span className="mg-field-error">{errors.email}</span>}
          </div>

          {/* Password */}
          <div className="mg-field">
            <label className="mg-label" htmlFor="register-password">
              Password
            </label>
            <div className="mg-input-wrap">
              <input
                id="register-password"
                name="password"
                type={showPassword ? "text" : "password"}
                className={`mg-input${errors.password ? " mg-input--error" : ""}`}
                value={formData.password}
                onChange={handleChange}
                placeholder="At least 6 characters"
                autoComplete="new-password"
              />
              <button
                type="button"
                className="mg-reveal"
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? "Hide" : "Show"}
              </button>
            </div>

            {formData.password.length > 0 && (
              <div className="mg-strength" data-level={passwordStrength}>
                <div className="mg-strength-track">
                  <div className="mg-strength-bar" />
                </div>
                <span className="mg-strength-label">
                  {strengthLabels[passwordStrength]}
                </span>
              </div>
            )}

            {errors.password && (
              <span className="mg-field-error">{errors.password}</span>
            )}
          </div>

          {/* Confirm Password */}
          <div className="mg-field">
            <label className="mg-label" htmlFor="register-confirm">
              Confirm Password
            </label>
            <div className="mg-input-wrap">
              <input
                id="register-confirm"
                name="confirmPassword"
                type={showConfirm ? "text" : "password"}
                className={`mg-input${
                  errors.confirmPassword ? " mg-input--error" : ""
                }`}
                value={formData.confirmPassword}
                onChange={handleChange}
                placeholder="Re-enter your password"
                autoComplete="new-password"
              />
              <button
                type="button"
                className="mg-reveal"
                onClick={() => setShowConfirm(!showConfirm)}
              >
                {showConfirm ? "Hide" : "Show"}
              </button>
            </div>
            {errors.confirmPassword && (
              <span className="mg-field-error">{errors.confirmPassword}</span>
            )}
          </div>

          <div className="mg-auth-actions">
            <button
              type="submit"
              className="mg-btn mg-btn--gold mg-btn--block"
              disabled={loading}
            >
              {loading ? "Creating account..." : "Register"}
            </button>
          </div>
        </form>

        <div className="mg-auth-links">
          <span>
            Already have an account?{" "}
            <Link className="mg-link mg-link--gold" to="/login">
              Login
            </Link>
          </span>
        </div>
      </div>
    </section>
  );
}

export default Register;
