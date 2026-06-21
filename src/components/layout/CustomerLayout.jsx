import { Outlet, Link } from "react-router";
import "../../styles/customer.css";

function CustomerLayout() {
  return (
    <div className="customer-layout">
      <header className="customer-header">
        <Link to="/customer/home" className="customer-logo">
          Entertainment Guild
        </Link>

        <input
          type="text"
          placeholder="Search for products..."
          className="customer-search"
        />

        <nav className="customer-nav">
          <Link to="/customer/home">Home</Link>
          <Link to="/customer/products">Products</Link>
          <Link to="/customer/cart">Cart</Link>
          <Link to="/customer/profile">Profile</Link>
          <Link to="/customer/orders">Orders</Link>
          <Link to="/login">Login</Link>
        </nav>
      </header>

      <main className="customer-main-content">
        <Outlet />
      </main>

      <footer className="customer-footer">
        About Us | Contact | Shipping Policy | © 2026 Entertainment Guild
      </footer>
    </div>
  );
}

export default CustomerLayout;