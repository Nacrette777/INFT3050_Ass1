import { useMemo, useState } from "react";
import { Link } from "react-router";
import {
  deleteUser,
  getEmployees,
  isEmailTaken,
  isUsernameTaken,
  toggleUserStatus,
  updateUser,
} from "../../services/adminUserService";

// 用于 inline edit 的基础邮箱格式校验。
const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function ManageEmployees() {
  const [employees, setEmployees] = useState(() => getEmployees());
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [editingId, setEditingId] = useState("");
  const [editData, setEditData] = useState({
    username: "",
    fullName: "",
    email: "",
    status: "Active",
  });
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  // 根据搜索关键词和状态筛选员工列表。
  const filteredEmployees = useMemo(() => {
    const normalizedSearch = searchTerm.trim().toLowerCase();

    return employees.filter((employee) => {
      const matchesSearch =
        !normalizedSearch ||
        employee.fullName.toLowerCase().includes(normalizedSearch) ||
        employee.username.toLowerCase().includes(normalizedSearch) ||
        employee.email.toLowerCase().includes(normalizedSearch);

      const matchesStatus =
        statusFilter === "All" || employee.status === statusFilter;

      return matchesSearch && matchesStatus;
    });
  }, [employees, searchTerm, statusFilter]);

  // 每次 CRUD 后重新从 localStorage service 读取最新数据。
  function refreshEmployees() {
    setEmployees(getEmployees());
  }

  function clearFeedback() {
    setError("");
    setMessage("");
  }

  // 将当前行切换为 inline edit 状态。
  function startEdit(employee) {
    clearFeedback();
    setEditingId(employee.id);
    setEditData({
      username: employee.username,
      fullName: employee.fullName,
      email: employee.email,
      status: employee.status,
    });
  }

  function cancelEdit() {
    setEditingId("");
    setEditData({
      username: "",
      fullName: "",
      email: "",
      status: "Active",
    });
  }

  function handleEditChange(event) {
    const { name, value } = event.target;

    setEditData({
      ...editData,
      [name]: value,
    });
  }

  // 保存前校验必填字段、邮箱格式以及 username/email 唯一性。
  function validateEdit() {
    const validationErrors = [];

    if (!editData.username.trim()) {
      validationErrors.push("Username is required.");
    }

    if (!editData.fullName.trim()) {
      validationErrors.push("Full name is required.");
    }

    if (!editData.email.trim()) {
      validationErrors.push("Email is required.");
    } else if (!emailPattern.test(editData.email)) {
      validationErrors.push("Please enter a valid email address.");
    }

    if (editData.username.trim() && isUsernameTaken(editData.username, editingId)) {
      validationErrors.push("Username is already in use.");
    }

    if (editData.email.trim() && isEmailTaken(editData.email, editingId)) {
      validationErrors.push("Email is already in use.");
    }

    return validationErrors;
  }

  function saveEdit() {
    const validationErrors = validateEdit();

    if (validationErrors.length > 0) {
      setError(validationErrors.join(" "));
      setMessage("");
      return;
    }

    const result = updateUser(editingId, editData);

    if (!result.success) {
      setError(result.message);
      setMessage("");
      return;
    }

    cancelEdit();
    refreshEmployees();
    setError("");
    setMessage("Employee details have been updated.");
  }

  // 删除前二次确认，避免误删。
  function handleDelete(employee) {
    const confirmed = window.confirm(
      `Delete employee account for ${employee.fullName}?`
    );

    if (!confirmed) {
      return;
    }

    const result = deleteUser(employee.id);

    if (!result.success) {
      setError(result.message);
      setMessage("");
      return;
    }

    refreshEmployees();
    setError("");
    setMessage("Employee account has been deleted.");
  }

  function handleToggleStatus(employee) {
    const result = toggleUserStatus(employee.id);

    if (!result.success) {
      setError(result.message);
      setMessage("");
      return;
    }

    refreshEmployees();
    setError("");
    setMessage(
      `${employee.fullName} is now ${result.user.status.toLowerCase()}.`
    );
  }

  return (
    <section>
      {/* 页面标题和新增员工入口 */}
      <div className="page-title-row">
        <h1>Manage Employees</h1>
        <Link to="/admin/employees/add">
          <button>Add Employee</button>
        </Link>
      </div>

      {message && <p className="success-message">{message}</p>}
      {error && <p className="error-message">{error}</p>}

      {/* 搜索和状态筛选工具栏 */}
      <div className="admin-page-toolbar">
        <input
          type="text"
          placeholder="Search employees..."
          className="admin-page-search"
          value={searchTerm}
          onChange={(event) => setSearchTerm(event.target.value)}
        />

        <label>
          Status
          <select
            value={statusFilter}
            onChange={(event) => setStatusFilter(event.target.value)}
          >
            <option value="All">All</option>
            <option value="Active">Active</option>
            <option value="Inactive">Inactive</option>
          </select>
        </label>
      </div>

      {/* 员工列表，支持 inline edit、状态切换和删除 */}
      <div className="admin-table-wrapper">
        <table className="admin-table">
          <thead>
            <tr>
              <th>Employee ID</th>
              <th>Username</th>
              <th>Full Name</th>
              <th>Email</th>
              <th>Role</th>
              <th>Status</th>
              <th>Updated</th>
              <th>Actions</th>
            </tr>
          </thead>

          <tbody>
            {filteredEmployees.length === 0 ? (
              <tr>
                <td colSpan="8" className="empty-state">
                  No employees found.
                </td>
              </tr>
            ) : (
              filteredEmployees.map((employee) => (
                <tr key={employee.id}>
                  <td>{employee.id}</td>
                  <td>
                    {editingId === employee.id ? (
                      <input
                        name="username"
                        value={editData.username}
                        onChange={handleEditChange}
                        className="table-input"
                      />
                    ) : (
                      employee.username
                    )}
                  </td>
                  <td>
                    {editingId === employee.id ? (
                      <input
                        name="fullName"
                        value={editData.fullName}
                        onChange={handleEditChange}
                        className="table-input"
                      />
                    ) : (
                      employee.fullName
                    )}
                  </td>
                  <td>
                    {editingId === employee.id ? (
                      <input
                        name="email"
                        value={editData.email}
                        onChange={handleEditChange}
                        className="table-input"
                      />
                    ) : (
                      employee.email
                    )}
                  </td>
                  <td>{employee.role}</td>
                  <td>
                    {editingId === employee.id ? (
                      <select
                        name="status"
                        value={editData.status}
                        onChange={handleEditChange}
                        className="table-input"
                      >
                        <option value="Active">Active</option>
                        <option value="Inactive">Inactive</option>
                      </select>
                    ) : (
                      <span
                        className={`status-pill ${employee.status.toLowerCase()}`}
                      >
                        {employee.status}
                      </span>
                    )}
                  </td>
                  <td>{employee.updatedAt || employee.createdAt}</td>
                  <td>
                    {editingId === employee.id ? (
                      <div className="table-actions">
                        <button type="button" onClick={saveEdit}>
                          Save
                        </button>
                        <button type="button" onClick={cancelEdit}>
                          Cancel
                        </button>
                      </div>
                    ) : (
                      <div className="table-actions">
                        <button type="button" onClick={() => startEdit(employee)}>
                          Edit
                        </button>
                        <button
                          type="button"
                          onClick={() => handleToggleStatus(employee)}
                        >
                          {employee.status === "Active"
                            ? "Deactivate"
                            : "Activate"}
                        </button>
                        <button
                          type="button"
                          className="danger-button"
                          onClick={() => handleDelete(employee)}
                        >
                          Delete
                        </button>
                      </div>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}

export default ManageEmployees;
