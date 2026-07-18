import { useEffect, useRef, useState } from "react";
import { Outlet, Link, useNavigate, useSearchParams } from "react-router";
import "../../styles/customer.css";
import {
  CUSTOMER_CART_UPDATED_EVENT,
  getCustomerCartItemCount,
} from "../../utils/customerCartStorage";

function CustomerLayout() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const searchInputRef = useRef(null);
  const currentSearch = searchParams.get("search") || "";
  const [cartCount, setCartCount] = useState(() => getCustomerCartItemCount());

  useEffect(() => {
    function refreshCartCount() {
      setCartCount(getCustomerCartItemCount());
    }

    window.addEventListener(CUSTOMER_CART_UPDATED_EVENT, refreshCartCount);
    window.addEventListener("storage", refreshCartCount);

    return () => {
      window.removeEventListener(CUSTOMER_CART_UPDATED_EVENT, refreshCartCount);
      window.removeEventListener("storage", refreshCartCount);
    };
  }, []);

  function handleSearchSubmit(event) {
    event.preventDefault();
    const trimmedSearch = searchInputRef.current?.value.trim() || "";

    navigate(
      trimmedSearch
        ? `/customer/products?search=${encodeURIComponent(trimmedSearch)}`
        : "/customer/products"
    );
  }

  return (
    <div className="customer-layout">
      <header className="customer-header">
        <Link to="/customer/home" className="customer-logo">
          Entertainment Guild
        </Link>

        <form className="customer-search-form" onSubmit={handleSearchSubmit}>
          <input
            key={currentSearch}
            ref={searchInputRef}
            type="search"
            placeholder="Search for products..."
            className="customer-search"
            defaultValue={currentSearch}
          />
          <button type="submit">Search</button>
        </form>

        <nav className="customer-nav">
          <Link to="/customer/home">Home</Link>
          <Link to="/customer/products">Products</Link>
          <Link to="/customer/cart">Cart{cartCount > 0 ? ` (${cartCount})` : ""}</Link>
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
