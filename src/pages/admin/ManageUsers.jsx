function ManageUsers() {
  return (
    <section>
      <h1>Manage Users</h1>

      <input className="admin-page-search" placeholder="Search users..." />

      <table className="admin-table">
        <thead>
          <tr>
            <th>User ID</th>
            <th>Name</th>
            <th>Email</th>
            <th>Role</th>
            <th>Status</th>
            <th>Actions</th>
          </tr>
        </thead>

        <tbody>
          <tr>
            <td>U001</td>
            <td>John</td>
            <td>john@email.com</td>
            <td>User</td>
            <td>Active</td>
            <td>
              <button>Edit</button>
              <button>Suspend</button>
              <button>Delete</button>
            </td>
          </tr>
        </tbody>
      </table>
    </section>
  );
}

export default ManageUsers;