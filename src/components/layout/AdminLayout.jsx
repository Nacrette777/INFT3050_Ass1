import { Outlet } from "react-router";
import Header from "../common/Header";
import Sidebar from "../common/Sidebar";
import "../../styles/admin.css";

function AdminLayout() {
  const adminLinks = [
    { label: "Dashboard", path: "/admin/dashboard" },
    { label: "Products", path: "/admin/products" },
    { label: "Users", path: "/admin/users" },
    { label: "Orders", path: "/admin/orders" },
    { label: "Employees", path: "/admin/employees" },
    { label: "Admins", path: "/admin/admins" },
    { label: "Settings", path: "/admin/settings" },
  ];

  return (
    <div className="admin-layout">
      <Header systemName="Entertainment Guild Admin" />

      <div className="admin-body">
        <Sidebar links={adminLinks} />

        <main className="admin-main-content">
          <Outlet />
        </main>
      </div>
    </div>
  );
}

export default AdminLayout;