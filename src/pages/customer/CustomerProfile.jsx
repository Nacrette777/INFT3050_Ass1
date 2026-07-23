import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router";
import { getCurrentUser, logout } from "../../services/authService";
import { updatePatron } from "../../services/accountService";

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

// Update the browser session immediately so the UI stays responsive, then
// write the change through to the Patrons table in the background.
// Registration no longer uses localStorage, so the old "registeredUsers"
// mirror has been removed.
function persistUser(updatedUser) {
  localStorage.setItem("currentUser", JSON.stringify(updatedUser));

  if (updatedUser.role === "customer" && updatedUser.id) {
    updatePatron(updatedUser.id, {
      Name: updatedUser.name,
      Email: updatedUser.email,
    }).catch(() => {
      // Writes need an auth cookie, which only staff sessions have.
      // The local session is already updated, so this is non-fatal.
    });
  }
}

function CustomerProfile() {
  const navigate = useNavigate();
  const [user, setUser] = useState(() => getCurrentUser());
  const [orders] = useState(() => (user ? readCustomerOrders(user.username) : []));

  const [isEditing, setIsEditing] = useState(false);
  const [form, setForm] = useState({ name: "", email: "" });
  const [formErrors, setFormErrors] = useState({});

  const [passwordForm, setPasswordForm] = useState({
    current: "",
    next: "",
    confirm: "",
  });
  const [passwordErrors, setPasswordErrors] = useState({});
  const [notice, setNotice] = useState("");

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
  const initials = displayName
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  function startEditing() {
    setForm({ name: user.name || "", email: user.email || "" });
    setFormErrors({});
    setNotice("");
    setIsEditing(true);
  }

  function cancelEditing() {
    setIsEditing(false);
    setFormErrors({});
  }

  function handleFieldChange(event) {
    const { name, value } = event.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    setFormErrors((prev) => ({ ...prev, [name]: "" }));
  }

  function handleProfileSave(event) {
    event.preventDefault();

    const nextErrors = {};
    if (!form.name.trim() || form.name.trim().length < 2)
      nextErrors.name = "Name must be at least 2 characters.";
    if (!form.email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email))
      nextErrors.email = "Please enter a valid email address.";

    if (Object.keys(nextErrors).length > 0) {
      setFormErrors(nextErrors);
      return;
    }

    const updated = { ...user, name: form.name.trim(), email: form.email.trim() };
    persistUser(updated);
    setUser(updated);
    setIsEditing(false);
    setNotice("Profile updated.");
  }

  function handlePasswordChange(event) {
    const { name, value } = event.target;
    setPasswordForm((prev) => ({ ...prev, [name]: value }));
    setPasswordErrors((prev) => ({ ...prev, [name]: "" }));
  }

  function handlePasswordSave(event) {
    event.preventDefault();

    const nextErrors = {};
    if (user.password && passwordForm.current !== user.password)
      nextErrors.current = "Current password is incorrect.";
    if (!passwordForm.next || passwordForm.next.length < 6)
      nextErrors.next = "New password must be at least 6 characters.";
    if (passwordForm.confirm !== passwordForm.next)
      nextErrors.confirm = "Passwords do not match.";

    if (Object.keys(nextErrors).length > 0) {
      setPasswordErrors(nextErrors);
      return;
    }

    const updated = { ...user, password: passwordForm.next };
    persistUser(updated);
    setUser(updated);
    setPasswordForm({ current: "", next: "", confirm: "" });
    setNotice("Password updated.");
  }

  return (
    <section className="mg-account">
      <div className="mg-account-shell">
        <h1 className="mg-page-title">My Account</h1>

        <div className="mg-account-grid">
          {/* ---------- left column ---------- */}
          <aside className="mg-side-card">
            <div className="mg-avatar">{initials || "?"}</div>
            <h2 className="mg-side-name">{displayName}</h2>
            <p className="mg-side-email">{email}</p>
            <span className="mg-badge">Guild Member</span>

            <nav className="mg-side-nav">
              <Link className="mg-side-link is-active" to="/customer/profile">
                Profile
              </Link>
              <Link className="mg-side-link" to="/customer/orders">
                Order History
              </Link>
              <Link className="mg-side-link" to="/customer/products">
                Continue Shopping
              </Link>
              <button
                type="button"
                className="mg-btn mg-btn--danger mg-btn--block"
                onClick={handleLogout}
              >
                Sign Out
              </button>
            </nav>
          </aside>

          {/* ---------- right column ---------- */}
          <main className="mg-account-main">
            {notice && <p className="mg-alert mg-alert--success">{notice}</p>}

            <div className="mg-stats">
              {stats.map((stat) => (
                <div className="mg-stat" key={stat.label}>
                  <div className="mg-stat-value">{stat.value}</div>
                  <span className="mg-stat-label">{stat.label}</span>
                </div>
              ))}
            </div>

            {/* Personal Information */}
            <div className="mg-card">
              <div className="mg-card-head">
                <h2 className="mg-card-title">Personal Information</h2>
                {!isEditing && (
                  <button
                    type="button"
                    className="mg-btn mg-btn--ghost mg-btn--small"
                    onClick={startEditing}
                  >
                    Edit Profile
                  </button>
                )}
              </div>

              {isEditing ? (
                <form className="mg-form" onSubmit={handleProfileSave} noValidate>
                  <div className="mg-form-grid">
                    <div className="mg-field">
                      <label className="mg-label" htmlFor="profile-name">
                        Name
                      </label>
                      <input
                        id="profile-name"
                        name="name"
                        type="text"
                        className={`mg-input${
                          formErrors.name ? " mg-input--error" : ""
                        }`}
                        value={form.name}
                        onChange={handleFieldChange}
                      />
                      {formErrors.name && (
                        <span className="mg-field-error">{formErrors.name}</span>
                      )}
                    </div>

                    <div className="mg-field">
                      <label className="mg-label" htmlFor="profile-email">
                        Email
                      </label>
                      <input
                        id="profile-email"
                        name="email"
                        type="email"
                        className={`mg-input${
                          formErrors.email ? " mg-input--error" : ""
                        }`}
                        value={form.email}
                        onChange={handleFieldChange}
                      />
                      {formErrors.email && (
                        <span className="mg-field-error">{formErrors.email}</span>
                      )}
                    </div>
                  </div>

                  <div className="mg-form-actions">
                    <button type="submit" className="mg-btn mg-btn--gold">
                      Save Changes
                    </button>
                    <button
                      type="button"
                      className="mg-btn mg-btn--ghost"
                      onClick={cancelEditing}
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              ) : (
                <div className="mg-info-grid">
                  <div className="mg-info-item">
                    <span className="mg-info-label">Name</span>
                    <p className="mg-info-value">{displayName}</p>
                  </div>
                  <div className="mg-info-item">
                    <span className="mg-info-label">Email</span>
                    <p className="mg-info-value">{email}</p>
                  </div>
                </div>
              )}
            </div>

            {/* Account Information */}
            <div className="mg-card">
              <div className="mg-card-head">
                <h2 className="mg-card-title">Account Information</h2>
              </div>
              <div className="mg-info-grid">
                <div className="mg-info-item">
                  <span className="mg-info-label">Username</span>
                  <p className="mg-info-value">{user.username || "Not provided"}</p>
                </div>
                <div className="mg-info-item">
                  <span className="mg-info-label">Account Type</span>
                  <p className="mg-info-value">{user.role || "customer"}</p>
                </div>
                <div className="mg-info-item">
                  <span className="mg-info-label">Member Since</span>
                  <p className="mg-info-value">
                    {user.joinedAt
                      ? new Date(user.joinedAt).toLocaleDateString("en-AU")
                      : "Not available"}
                  </p>
                </div>
                <div className="mg-info-item">
                  <span className="mg-info-label">Orders Placed</span>
                  <p className="mg-info-value">{orders.length}</p>
                </div>
              </div>
            </div>

            {/* Change Password */}
            <div className="mg-card">
              <div className="mg-card-head">
                <h2 className="mg-card-title">Change Password</h2>
              </div>
              <p className="mg-card-note">
                Use at least 6 characters. You will stay signed in after saving.
              </p>

              <form className="mg-form" onSubmit={handlePasswordSave} noValidate>
                <div className="mg-field">
                  <label className="mg-label" htmlFor="password-current">
                    Current Password
                  </label>
                  <input
                    id="password-current"
                    name="current"
                    type="password"
                    className={`mg-input${
                      passwordErrors.current ? " mg-input--error" : ""
                    }`}
                    value={passwordForm.current}
                    onChange={handlePasswordChange}
                    autoComplete="current-password"
                  />
                  {passwordErrors.current && (
                    <span className="mg-field-error">{passwordErrors.current}</span>
                  )}
                </div>

                <div className="mg-form-grid">
                  <div className="mg-field">
                    <label className="mg-label" htmlFor="password-next">
                      New Password
                    </label>
                    <input
                      id="password-next"
                      name="next"
                      type="password"
                      className={`mg-input${
                        passwordErrors.next ? " mg-input--error" : ""
                      }`}
                      value={passwordForm.next}
                      onChange={handlePasswordChange}
                      autoComplete="new-password"
                    />
                    {passwordErrors.next && (
                      <span className="mg-field-error">{passwordErrors.next}</span>
                    )}
                  </div>

                  <div className="mg-field">
                    <label className="mg-label" htmlFor="password-confirm">
                      Confirm New Password
                    </label>
                    <input
                      id="password-confirm"
                      name="confirm"
                      type="password"
                      className={`mg-input${
                        passwordErrors.confirm ? " mg-input--error" : ""
                      }`}
                      value={passwordForm.confirm}
                      onChange={handlePasswordChange}
                      autoComplete="new-password"
                    />
                    {passwordErrors.confirm && (
                      <span className="mg-field-error">{passwordErrors.confirm}</span>
                    )}
                  </div>
                </div>

                <div className="mg-form-actions">
                  <button type="submit" className="mg-btn mg-btn--gold">
                    Save Changes
                  </button>
                  <button
                    type="button"
                    className="mg-btn mg-btn--ghost"
                    onClick={() => {
                      setPasswordForm({ current: "", next: "", confirm: "" });
                      setPasswordErrors({});
                    }}
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          </main>
        </div>
      </div>
    </section>
  );
}

export default CustomerProfile;
