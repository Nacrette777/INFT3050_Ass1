import { useState } from "react";
import { useNavigate } from "react-router";

function AddEmployee() {
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    password: "",
    department: "",
    status: "Active",
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
      !formData.firstName ||
      !formData.lastName ||
      !formData.email ||
      !formData.password ||
      !formData.department
    ) {
      setError("Please fill in all required fields.");
      return;
    }

    if (!formData.email.includes("@")) {
      setError("Please enter a valid email address.");
      return;
    }

    alert("Employee has been added successfully.");
    navigate("/admin/employees");
  }

  return (
    <section>
      <h1>Add Employee</h1>

      {error && <p className="error-message">{error}</p>}

      <form className="admin-form" onSubmit={handleSubmit}>
        <label>
          First Name
          <input
            name="firstName"
            value={formData.firstName}
            onChange={handleChange}
          />
        </label>

        <label>
          Last Name
          <input
            name="lastName"
            value={formData.lastName}
            onChange={handleChange}
          />
        </label>

        <label>
          Email
          <input
            name="email"
            value={formData.email}
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
          Department
          <input
            name="department"
            value={formData.department}
            onChange={handleChange}
          />
        </label>

        <label>
          Status
          <select name="status" value={formData.status} onChange={handleChange}>
            <option value="Active">Active</option>
            <option value="Inactive">Inactive</option>
          </select>
        </label>

        <div className="form-actions">
          <button type="submit">Save</button>
          <button type="button" onClick={() => navigate("/admin/employees")}>
            Cancel
          </button>
        </div>
      </form>
    </section>
  );
}

export default AddEmployee;