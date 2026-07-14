import { useEffect, useMemo, useState } from "react";
import { getEmployeeUsers } from "../../services/nocoDbService";

function ViewUsers() {
  const [users, setUsers] = useState([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;
    getEmployeeUsers()
      .then((result) => {
        if (active) setUsers(result.list || []);
      })
      .catch((err) => {
        if (active) setError(err.message);
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => { active = false; };
  }, []);

  const filteredUsers = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return users;
    return users.filter((user) =>
      [user.Name, user.UserName, user.Email, user.Status]
        .some((value) => String(value || "").toLowerCase().includes(query))
    );
  }, [users, search]);

  const getRole = (user) =>
    user.isAdmin === true || user.isAdmin === "true" || user.isAdmin === 1 || user.isAdmin === "1"
      ? "Admin"
      : "User";

  return (
    <section className="employee-page">
      <div className="employee-page-heading">
        <div>
          <p className="employee-eyebrow">Account directory</p>
          <h1>View User Accounts</h1>
          <p>Review public account details. Editing and security information are restricted.</p>
        </div>
        <span className="employee-count">{filteredUsers.length} accounts</span>
      </div>

      <div className="employee-toolbar">
        <label htmlFor="employee-user-search">Search accounts</label>
        <input
          id="employee-user-search"
          type="search"
          placeholder="Name, username, email, or status"
          value={search}
          onChange={(event) => setSearch(event.target.value)}
        />
      </div>

      {error && <div className="employee-alert">{error}</div>}

      <div className="employee-table-wrap">
        <table className="employee-table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Name</th>
              <th>Username</th>
              <th>Email</th>
              <th>Role</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan="6" className="employee-empty">Loading accounts...</td></tr>
            ) : filteredUsers.length === 0 ? (
              <tr><td colSpan="6" className="employee-empty">No matching accounts found.</td></tr>
            ) : filteredUsers.map((user) => (
              <tr key={user.Id}>
                <td>{user.Id}</td>
                <td><strong>{user.Name || "-"}</strong></td>
                <td>{user.UserName || "-"}</td>
                <td>{user.Email || "-"}</td>
                <td>{getRole(user)}</td>
                <td><span className={`employee-status ${user.Status === "Active" ? "is-active" : ""}`}>{user.Status || "Unknown"}</span></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}

export default ViewUsers;
