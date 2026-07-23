import { Outlet, useNavigate } from "react-router";
import Sidebar from "../common/Sidebar";
import { getCurrentUser, logout } from "../../services/authService";
import "../../styles/employee.css";

const employeeLinks = [
  { label: "Dashboard", path: "/employee/dashboard" },
  { label: "Products", path: "/employee/products" },
  { label: "User Accounts", path: "/employee/users" },
];

function EmployeeLayout() {
  const navigate = useNavigate();
  const currentUser = getCurrentUser();

  function handleLogout() {
    logout();
    navigate("/login");
  }

  return (
    <div className="employee-theme employee-layout">
      <header className="employee-header">
        <div className="employee-brand-mark">EG</div>
        <div>
          <strong>Entertainment Guild</strong>
          <span>Employee Portal</span>
        </div>
        <div className="employee-user-area">
          <span>{currentUser?.name || "Employee"}</span>
          <button type="button" onClick={handleLogout}>Logout</button>
        </div>
      </header>

      <div className="employee-body">
        <Sidebar links={employeeLinks} />
        <main className="employee-main">
          <Outlet />
        </main>
      </div>
    </div>
  );
}

export default EmployeeLayout;
