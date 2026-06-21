import { Link } from "react-router";

function ManageAdmins() {
  const admins = [
    {
      id: "ADM001",
      name: "Alice",
      email: "alice@email.com",
      lastLogin: "20xx-xx-xx",
    },
    {
      id: "ADM002",
      name: "Bob",
      email: "bob@email.com",
      lastLogin: "20xx-xx-xx",
    },
  ];

  return (
    <section>
      <div className="page-title-row">
        <h1>Manage Admins</h1>
        <Link to="/admin/admins/add">
          <button>Create Admin</button>
        </Link>
      </div>

      <input className="admin-page-search" placeholder="Search admin..." />

      <table className="admin-table">
        <thead>
          <tr>
            <th>Admin ID</th>
            <th>Name</th>
            <th>Email</th>
            <th>Last Login</th>
            <th>Actions</th>
          </tr>
        </thead>

        <tbody>
          {admins.map((admin) => (
            <tr key={admin.id}>
              <td>{admin.id}</td>
              <td>{admin.name}</td>
              <td>{admin.email}</td>
              <td>{admin.lastLogin}</td>
              <td>
                <button>Edit</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      <div className="chart-placeholder">Admin Summary Chart Placeholder</div>
    </section>
  );
}

export default ManageAdmins;