import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router";
import { getCurrentUser, logout } from "../../services/authService";

// Read this customer's saved orders without crashing on bad localStorage data.
function readCustomerOrders(username) {
  try {
    const allOrders = JSON.parse(localStorage.getItem("tradeOrders") || "{}");
    return Array.isArray(allOrders?.[username]) ? allOrders[username] : [];
  } catch {
    return [];
  }
}

function getOrderTotal(order) {
  const total = Number(order?.total);
  return Number.isFinite(total) ? total : 0;
}

function CustomerProfile() {
  const navigate = useNavigate();
  // Initialize from authService once to avoid extra renders during page load.
  const [user] = useState(() => getCurrentUser());
  const [orders] = useState(() => (user ? readCustomerOrders(user.username) : []));

  useEffect(() => {
    if (!user) {
      navigate("/login");
    }
  }, [navigate, user]);

  function handleLogout() {
    logout();
    navigate("/login");
  }

  const stats = useMemo(() => {
    const completedOrders = orders.filter((order) => order?.status === "Completed");

    // Profile summary cards are derived from the customer's stored orders.
    return [
      { label: "Total Orders", value: orders.length },
      { label: "Completed", value: completedOrders.length },
      {
        label: "Total Spent",
        value: `$${completedOrders
          .reduce((sum, order) => sum + getOrderTotal(order), 0)
          .toFixed(2)}`,
      },
    ];
  }, [orders]);

  if (!user) {
    return null;
  }

  const displayName = user.name || user.username || "Customer";
  const email = user.email || user.username || "Not provided";
  // Use the first letters of the display name for the profile avatar.
  const initials = displayName
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return (
    <section>
      <h1>My Account</h1>

      <div className="profile-layout">
        <aside className="profile-sidebar">
          <Link to="/customer/profile">
            <button className="profile-nav-active">My Profile</button>
          </Link>
          <Link to="/customer/orders">
            <button>Order History</button>
          </Link>
          <button className="danger-button" onClick={handleLogout}>
            Sign Out
          </button>
        </aside>

        <main className="profile-content">
          <div className="profile-card profile-hero">
            <div className="profile-avatar">{initials || "?"}</div>
            <div>
              <h2>{displayName}</h2>
              <p>{email}</p>
              <span className="member-badge">Trade Member</span>
            </div>
          </div>

          <div className="profile-stats">
            {stats.map((stat) => (
              <div className="profile-stat-card" key={stat.label}>
                <div>{stat.value}</div>
                <span>{stat.label}</span>
              </div>
            ))}
          </div>

          <div className="profile-card">
            <h2>Personal Information</h2>
            <p>
              <strong>Name:</strong> {displayName}
            </p>
            <p>
              <strong>Username:</strong> {user.username || "Not provided"}
            </p>
            <p>
              <strong>Email:</strong> {email}
            </p>
            <p>
              <strong>Role:</strong> {user.role || "customer"}
            </p>
          </div>

          <div className="profile-card profile-actions-card">
            <h2>Account Shortcuts</h2>
            <p>Review past orders, continue shopping, or sign out of this account.</p>
            <div className="profile-action-row">
              <Link className="button-link" to="/customer/orders">
                View Order History
              </Link>
              <Link className="secondary-button" to="/customer/products">
                Continue Shopping
              </Link>
            </div>
          </div>
        </main>
      </div>
    </section>
  );
}

export default CustomerProfile;
