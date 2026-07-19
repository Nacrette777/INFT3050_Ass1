import { useState } from "react";
import { useNavigate } from "react-router";
import {
  addEmployee,
  isEmailTaken,
  isUsernameTaken,
} from "../../services/adminUserService";

// 新增员工表单使用同一套邮箱格式校验。
const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function AddEmployee() {
  const navigate = useNavigate();

  // 使用 controlled components 保存每个表单字段的当前输入。
  const [formData, setFormData] = useState({
    username: "",
    fullName: "",
    email: "",
    password: "",
    confirmPassword: "",
    status: "Active",
  });

  const [errors, setErrors] = useState([]);

  function handleChange(event) {
    const { name, value } = event.target;

    setFormData({
      ...formData,
      [name]: value,
    });
  }

  // 提交前统一校验必填、格式、密码一致性和账号唯一性。
  function validateForm() {
    const validationErrors = [];

    if (!formData.username.trim()) {
      validationErrors.push("Username is required.");
    }

    if (!formData.fullName.trim()) {
      validationErrors.push("Full name is required.");
    }

    if (!formData.email.trim()) {
      validationErrors.push("Email is required.");
    } else if (!emailPattern.test(formData.email)) {
      validationErrors.push("Please enter a valid email address.");
    }

    if (!formData.password) {
      validationErrors.push("Password is required.");
    } else if (formData.password.length < 6) {
      validationErrors.push("Password must be at least 6 characters.");
    }

    if (!formData.confirmPassword) {
      validationErrors.push("Confirm password is required.");
    } else if (formData.password !== formData.confirmPassword) {
      validationErrors.push("Passwords do not match.");
    }

    if (formData.username.trim() && isUsernameTaken(formData.username)) {
      validationErrors.push("Username is already in use.");
    }

    if (formData.email.trim() && isEmailTaken(formData.email)) {
      validationErrors.push("Email is already in use.");
    }

    return validationErrors;
  }

  function handleSubmit(event) {
    event.preventDefault();

    // 如果校验失败，错误信息直接显示在页面上。
    const validationErrors = validateForm();

    if (validationErrors.length > 0) {
      setErrors(validationErrors);
      return;
    }

    const result = addEmployee(formData);

    if (!result.success) {
      setErrors([result.message]);
      return;
    }

    // 保存成功后返回员工列表。
    navigate("/admin/employees");
  }

  return (
    <section>
      {/* 页面标题和返回按钮 */}
      <div className="page-title-row">
        <h1>Add Employee</h1>
        <button type="button" onClick={() => navigate("/admin/employees")}>
          Back
        </button>
      </div>

      {/* 表单级错误提示 */}
      {errors.length > 0 && (
        <div className="error-message">
          <p>Please fix the following:</p>
          <ul>
            {errors.map((error) => (
              <li key={error}>{error}</li>
            ))}
          </ul>
        </div>
      )}

      {/* 新增员工表单 */}
      <form className="admin-form" onSubmit={handleSubmit}>
        <label>
          Username
          <input
            name="username"
            value={formData.username}
            onChange={handleChange}
          />
        </label>

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
          Confirm Password
          <input
            type="password"
            name="confirmPassword"
            value={formData.confirmPassword}
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
          <button type="submit">Add Employee</button>
          <button type="button" onClick={() => navigate("/admin/employees")}>
            Cancel
          </button>
        </div>
      </form>
    </section>
  );
}

export default AddEmployee;
