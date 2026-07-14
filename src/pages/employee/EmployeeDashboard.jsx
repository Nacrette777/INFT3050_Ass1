import { useEffect, useState } from "react";
import { Link } from "react-router";
import { getCurrentUser } from "../../services/authService";
import { getEmployeeProducts, getEmployeeUsers } from "../../services/nocoDbService";

function EmployeeDashboard() {
  const currentUser = getCurrentUser();
  const [products, setProducts] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;

    async function loadDashboard() {
      try {
        const [productResult, userResult] = await Promise.all([
          getEmployeeProducts(),
          getEmployeeUsers(),
        ]);
        if (!active) return;
        setProducts(productResult.list || []);
        setUsers(userResult.list || []);
      } catch (err) {
        if (active) setError(err.message);
      } finally {
        if (active) setLoading(false);
      }
    }

    loadDashboard();
    return () => { active = false; };
  }, []);

  const activeUsers = users.filter((user) => user.Status === "Active").length;

  return (
    <section className="employee-page">
      <div className="employee-welcome">
        <div>
          <p className="employee-eyebrow">Employee workspace</p>
          <h1>Welcome, {currentUser?.name || "Employee"}</h1>
          <p>Review product and account information for daily operations.</p>
        </div>
        <span className="employee-access-badge">Read-only access</span>
      </div>

      {error && <div className="employee-alert">{error}</div>}

      <div className="employee-stats" aria-busy={loading}>
        <article>
          <span>Products</span>
          <strong>{loading ? "..." : products.length}</strong>
          <small>Items available to review</small>
        </article>
        <article>
          <span>User accounts</span>
          <strong>{loading ? "..." : users.length}</strong>
          <small>Accounts visible to employees</small>
        </article>
        <article>
          <span>Active accounts</span>
          <strong>{loading ? "..." : activeUsers}</strong>
          <small>Currently enabled users</small>
        </article>
      </div>

      <div className="employee-dashboard-grid">
        <article className="employee-panel">
          <div className="employee-panel-heading">
            <h2>Recent products</h2>
            <Link to="/employee/products">View all</Link>
          </div>
          {loading ? (
            <p className="employee-empty">Loading products...</p>
          ) : (
            <div className="employee-compact-list">
              {products.slice(0, 5).map((product) => (
                <div key={product.Id}>
                  <span><strong>{product.Title}</strong>{product.Author || "Unknown author"}</span>
                  <b>{product.Price != null ? `$${Number(product.Price).toFixed(2)}` : "-"}</b>
                </div>
              ))}
            </div>
          )}
        </article>

        <article className="employee-panel">
          <div className="employee-panel-heading">
            <h2>Account status</h2>
            <Link to="/employee/users">View accounts</Link>
          </div>
          <div className="employee-status-summary">
            <strong>{loading ? "..." : activeUsers}</strong>
            <span>of {loading ? "..." : users.length} accounts are active</span>
            <p>Employee access is limited to viewing account information. Password and security fields are never requested.</p>
          </div>
        </article>
      </div>
    </section>
  );
}

export default EmployeeDashboard;
