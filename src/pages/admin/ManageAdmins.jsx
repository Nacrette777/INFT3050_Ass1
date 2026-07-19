import { useMemo, useState } from "react";
import { Link } from "react-router";
import {
  deleteUser,
  getAdmins,
  isEmailTaken,
  isUsernameTaken,
  toggleUserStatus,
  updateUser,
} from "../../services/adminUserService";

// 用于 inline edit 的基础邮箱格式校验。
const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function ManageAdmins() {
  const [admins, setAdmins] = useState(() => getAdmins());
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

  // 根据搜索关键词和状态筛选管理员列表。
  const filteredAdmins = useMemo(() => {
    const normalizedSearch = searchTerm.trim().toLowerCase();

    return admins.filter((admin) => {
      const matchesSearch =
        !normalizedSearch ||
        admin.fullName.toLowerCase().includes(normalizedSearch) ||
        admin.username.toLowerCase().includes(normalizedSearch) ||
        admin.email.toLowerCase().includes(normalizedSearch);

      const matchesStatus =
        statusFilter === "All" || admin.status === statusFilter;

      return matchesSearch && matchesStatus;
    });
  }, [admins, searchTerm, statusFilter]);

  // 每次 CRUD 后重新从 localStorage service 读取最新数据。
  function refreshAdmins() {
    setAdmins(getAdmins());
  }

  function clearFeedback() {
    setError("");
    setMessage("");
  }

  // 将当前行切换为 inline edit 状态。
  function startEdit(admin) {
    clearFeedback();
    setEditingId(admin.id);
    setEditData({
      username: admin.username,
      fullName: admin.fullName,
      email: admin.email,
      status: admin.status,
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
    refreshAdmins();
    setError("");
    setMessage("Admin details have been updated.");
  }

  // 删除前二次确认；service 会阻止删除最后一个 active admin。
  function handleDelete(admin) {
    const confirmed = window.confirm(`Delete admin account for ${admin.fullName}?`);

    if (!confirmed) {
      return;
    }

    const result = deleteUser(admin.id);

    if (!result.success) {
      setError(result.message);
      setMessage("");
      return;
    }

    refreshAdmins();
    setError("");
    setMessage("Admin account has been deleted.");
  }

  function handleToggleStatus(admin) {
    const result = toggleUserStatus(admin.id);

    if (!result.success) {
      setError(result.message);
      setMessage("");
      return;
    }

    refreshAdmins();
    setError("");
    setMessage(`${admin.fullName} is now ${result.user.status.toLowerCase()}.`);
  }

  return (
    <section>
      {/* 页面标题和新增管理员入口 */}
      <div className="page-title-row">
        <h1>Manage Admins</h1>
        <Link to="/admin/admins/add">
          <button>Add Admin</button>
        </Link>
      </div>

      {message && <p className="success-message">{message}</p>}
      {error && <p className="error-message">{error}</p>}

      {/* 搜索和状态筛选工具栏 */}
      <div className="admin-page-toolbar">
        <input
          type="text"
          className="admin-page-search"
          placeholder="Search admins..."
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

      {/* 管理员列表，支持 inline edit、状态切换和删除 */}
      <div className="admin-table-wrapper">
        <table className="admin-table">
          <thead>
            <tr>
              <th>Admin ID</th>
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
            {filteredAdmins.length === 0 ? (
              <tr>
                <td colSpan="8" className="empty-state">
                  No admins found.
                </td>
              </tr>
            ) : (
              filteredAdmins.map((admin) => (
                <tr key={admin.id}>
                  <td>{admin.id}</td>
                  <td>
                    {editingId === admin.id ? (
                      <input
                        name="username"
                        value={editData.username}
                        onChange={handleEditChange}
                        className="table-input"
                      />
                    ) : (
                      admin.username
                    )}
                  </td>
                  <td>
                    {editingId === admin.id ? (
                      <input
                        name="fullName"
                        value={editData.fullName}
                        onChange={handleEditChange}
                        className="table-input"
                      />
                    ) : (
                      admin.fullName
                    )}
                  </td>
                  <td>
                    {editingId === admin.id ? (
                      <input
                        name="email"
                        value={editData.email}
                        onChange={handleEditChange}
                        className="table-input"
                      />
                    ) : (
                      admin.email
                    )}
                  </td>
                  <td>{admin.role}</td>
                  <td>
                    {editingId === admin.id ? (
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
                      <span className={`status-pill ${admin.status.toLowerCase()}`}>
                        {admin.status}
                      </span>
                    )}
                  </td>
                  <td>{admin.updatedAt || admin.createdAt}</td>
                  <td>
                    {editingId === admin.id ? (
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
                        <button type="button" onClick={() => startEdit(admin)}>
                          Edit
                        </button>
                        <button
                          type="button"
                          onClick={() => handleToggleStatus(admin)}
                        >
                          {admin.status === "Active" ? "Deactivate" : "Activate"}
                        </button>
                        <button
                          type="button"
                          className="danger-button"
                          onClick={() => handleDelete(admin)}
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

export default ManageAdmins;
