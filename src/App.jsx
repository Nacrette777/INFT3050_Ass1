import { Routes, Route, Navigate } from "react-router";

import CustomerLayout from "./components/layout/CustomerLayout";
import AdminLayout from "./components/layout/AdminLayout";
import EmployeeLayout from "./components/layout/EmployeeLayout";
import AuthLayout from "./components/layout/AuthLayout";
import ProtectedRoute from "./components/route/ProtectedRoute";

// Auth pages
import Login from "./pages/auth/Login";
import Register from "./pages/auth/Register";

// Customer pages
import CustomerHome from "./pages/customer/CustomerHome";
import ProductList from "./pages/customer/ProductList";
import ProductDetail from "./pages/customer/ProductDetail";
import Cart from "./pages/customer/Cart";
import Checkout from "./pages/customer/Checkout";
import CustomerProfile from "./pages/customer/CustomerProfile";
import OrderHistory from "./pages/customer/OrderHistory";

// Admin pages
import AdminDashboard from "./pages/admin/AdminDashboard";
import ManageProducts from "./pages/admin/ManageProducts";
import AddProduct from "./pages/admin/AddProduct";
import EditProduct from "./pages/admin/EditProduct";
import ManageUsers from "./pages/admin/ManageUsers";
import ManageOrders from "./pages/admin/ManageOrders";
import ManageEmployees from "./pages/admin/ManageEmployees";
import AddEmployee from "./pages/admin/AddEmployee";
import ManageAdmins from "./pages/admin/ManageAdmins";
import AddAdmin from "./pages/admin/AddAdmin";
import AdminSettings from "./pages/admin/AdminSettings";

// Employee pages
import EmployeeDashboard from "./pages/employee/EmployeeDashboard";
import ViewProducts from "./pages/employee/ViewProducts";
import ViewUsers from "./pages/employee/ViewUsers";

// Error pages
import Unauthorized from "./pages/error/Unauthorized";
import NotFound from "./pages/error/NotFound";

function App() {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/customer/home" replace />} />

      <Route element={<AuthLayout />}>
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
      </Route>

      <Route element={<CustomerLayout />}>
        <Route path="/customer/home" element={<CustomerHome />} />
        <Route path="/customer/products" element={<ProductList />} />
        <Route path="/customer/products/:productId" element={<ProductDetail />} />
        <Route path="/customer/cart" element={<Cart />} />
        <Route path="/customer/checkout" element={<Checkout />} />
        <Route path="/customer/profile" element={<CustomerProfile />} />
        <Route path="/customer/orders" element={<OrderHistory />} />
      </Route>

      <Route
        path="/admin"
        element={
          <ProtectedRoute allowedRoles={["admin"]}>
            <AdminLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<Navigate to="/admin/dashboard" replace />} />
        <Route path="dashboard" element={<AdminDashboard />} />

        <Route path="products" element={<ManageProducts />} />
        <Route path="products/add" element={<AddProduct />} />
        <Route path="products/edit/:productId" element={<EditProduct />} />

        <Route path="users" element={<ManageUsers />} />
        <Route path="orders" element={<ManageOrders />} />

        <Route path="employees" element={<ManageEmployees />} />
        <Route path="employees/add" element={<AddEmployee />} />

        <Route path="admins" element={<ManageAdmins />} />
        <Route path="admins/add" element={<AddAdmin />} />

        <Route path="settings" element={<AdminSettings />} />
      </Route>

      <Route
        path="/employee"
        element={
          <ProtectedRoute allowedRoles={["employee"]}>
            <EmployeeLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<Navigate to="/employee/dashboard" replace />} />
        <Route path="dashboard" element={<EmployeeDashboard />} />
        <Route path="products" element={<ViewProducts />} />
        <Route path="users" element={<ViewUsers />} />
      </Route>

      <Route path="/unauthorized" element={<Unauthorized />} />
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}

export default App;
