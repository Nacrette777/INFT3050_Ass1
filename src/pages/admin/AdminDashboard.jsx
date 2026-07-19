import { Link } from "react-router";
import { getCurrentUser } from "../../services/authService";
import {
  getDashboardStats,
  getRecentManagedUsers,
} from "../../services/adminUserService";

// 计算图表中 active 状态的占比，避免总数为 0 时出现 NaN。
function getProgressPercent(activeCount, totalCount) {
  if (totalCount === 0) {
    return 0;
  }

  return Math.round((activeCount / totalCount) * 100);
}

function AdminDashboard() {
  // Dashboard 数据统一来自 service，避免页面内重复统计业务逻辑。
  const currentUser = getCurrentUser();
  const stats = getDashboardStats();
  const recentUsers = getRecentManagedUsers(5);
  const welcomeName = currentUser?.name || currentUser?.username;
  const quickActions = [
    { label: "Manage Employees", path: "/admin/employees" },
    { label: "Add Employee", path: "/admin/employees/add" },
    { label: "Manage Admins", path: "/admin/admins" },
    { label: "Add Admin", path: "/admin/admins/add" },
    { label: "Manage Products", path: "/admin/products" },
    { label: "Manage Orders", path: "/admin/orders" },
  ];
  const systemStatusItems = [
    { label: "Authentication", value: "Mock Login" },
    { label: "Storage", value: "LocalStorage" },
    { label: "Database", value: "Not Connected" },
    { label: "Admin CRUD", value: "Available" },
    { label: "Customer Module", value: "Prototype" },
    { label: "Employee Module", value: "Prototype" },
  ];
  const chartRows = [
    {
      label: "Employees",
      active: stats.activeEmployees,
      inactive: stats.inactiveEmployees,
      total: stats.totalEmployees,
    },
    {
      label: "Admins",
      active: stats.activeAdmins,
      inactive: stats.inactiveAdmins,
      total: stats.totalAdmins,
    },
  ];

  return (
    <section className="admin-dashboard-page">
      {/* 页面标题、系统说明和当前管理员欢迎信息 */}
      <div className="dashboard-header">
        <div>
          <h1>Admin Dashboard</h1>
          <p>Overview of the Entertainment Guild Management System</p>
        </div>
        <p className="dashboard-welcome">
          {welcomeName
            ? `Welcome back, ${welcomeName}`
            : "Welcome back to the admin workspace."}
        </p>
      </div>

      {/* 系统核心统计卡片 */}
      <div className="dashboard-cards">
        <div>
          <span>Total Employees</span>
          <strong>{stats.totalEmployees}</strong>
        </div>
        <div>
          <span>Active Employees</span>
          <strong>{stats.activeEmployees}</strong>
        </div>
        <div>
          <span>Total Admins</span>
          <strong>{stats.totalAdmins}</strong>
        </div>
        <div>
          <span>Active Admins</span>
          <strong>{stats.activeAdmins}</strong>
        </div>
        <div>
          <span>Total Managed Users</span>
          <strong>{stats.totalManagedUsers}</strong>
        </div>
      </div>

      {/* 常用管理入口和用户状态可视化 */}
      <div className="dashboard-grid">
        <section className="dashboard-panel">
          <h2>Quick Actions</h2>
          <div className="quick-action-grid">
            {quickActions.map((action) => (
              <Link
                key={action.path}
                to={action.path}
                className="quick-action-card"
              >
                {action.label}
              </Link>
            ))}
          </div>
        </section>

        <section className="dashboard-panel">
          <h2>User Status Summary</h2>
          <div className="dashboard-chart">
            {chartRows.map((row) => {
              const activePercent = getProgressPercent(row.active, row.total);
              const inactivePercent = row.total === 0 ? 0 : 100 - activePercent;

              return (
                <div className="chart-row" key={row.label}>
                  <div className="chart-row-header">
                    <span>{row.label}</span>
                    <span>
                      {row.active} active / {row.inactive} inactive
                    </span>
                  </div>
                  <div className="chart-track">
                    <div
                      className="chart-bar active"
                      style={{ width: `${activePercent}%` }}
                    />
                    <div
                      className="chart-bar inactive"
                      style={{ width: `${inactivePercent}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      </div>

      {/* 最近用户变化和 prototype 系统状态 */}
      <div className="dashboard-grid">
        <section className="dashboard-panel">
          <h2>Recent User Activity</h2>
          {recentUsers.length === 0 ? (
            <p className="empty-state">No recent user activity.</p>
          ) : (
            <div className="recent-activity-list">
              {recentUsers.map((user) => (
                <div className="recent-activity-item" key={user.id}>
                  <div>
                    <span className="activity-role">{user.role}</span>
                    <strong>{user.fullName || user.username}</strong>
                    <small>{user.activityDate}</small>
                  </div>
                  <span className={`status-pill ${user.status.toLowerCase()}`}>
                    {user.status}
                  </span>
                </div>
              ))}
            </div>
          )}
        </section>

        <section className="dashboard-panel">
          <h2>System Status</h2>
          <div className="system-status-grid">
            {systemStatusItems.map((item) => (
              <div className="system-status-item" key={item.label}>
                <span>{item.label}</span>
                <strong>{item.value}</strong>
              </div>
            ))}
          </div>
        </section>
      </div>
    </section>
  );
}

export default AdminDashboard;
