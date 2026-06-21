import { useState } from "react";
import { useNavigate } from "react-router";

function AddAdmin() {
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    username: "",
    password: "",
    confirmPassword: "",
  });

  const [error, setError] = useState("");

  function handleChange(event) {
    const { name, value } = event.target;

    setFormData({
      ...formData,
      [name]: value,
    });
  }

  function handleSubmit(event) {
    event.preventDefault();

    if (
      !formData.fullName ||
      !formData.email ||
      !formData.username ||
      !formData.password ||
      !formData.confirmPassword
    ) {
      setError("Please fill in all required fields.");
      return;
    }

    if (!formData.email.includes("@")) {
      setError("Please enter a valid email address.");
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    alert("Admin account has been created successfully.");
    navigate("/admin/admins");
  }

  return (
    <section>
      <h1>Create Admin Account</h1>

      {error && <p className="error-message">{error}</p>}

      <form className="admin-form" onSubmit={handleSubmit}>
        <label>
          Full Name
          <input
            name="fullName"
            value={formData.fullName}
            onChange={handleChange}
          />
        </label>

        <label>
          Email
          <input name="email" value={formData.email} onChange={handleChange} />
        </label>

        <label>
          Username
          <input
            name="username"
            value={formData.username}
            onChange={handleChange}
          />
        </label>

        <label>
          Password
          <input
            type="password"
            name="password"
            value={formData.password}
            onChange={handleChange}
          />
        </label>

        <label>
          Confirm Password
          <input
            type="password"
            name="confirmPassword"
            value={formData.confirmPassword}
            onChange={handleChange}
          />
        </label>

        <div className="form-actions">
          <button type="submit">Create Admin</button>
          <button type="button" onClick={() => navigate("/admin/admins")}>
            Cancel
          </button>
        </div>
      </form>
    </section>
  );
}

export default AddAdmin;