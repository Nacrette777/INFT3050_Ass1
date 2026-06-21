import { Link } from "react-router";

function ManageEmployees() {
  const employees = [
    {
      id: "EMP001",
      name: "John",
      email: "john@email.com",
      department: "Sales",
      status: "Active",
    },
    {
      id: "EMP002",
      name: "Amy",
      email: "amy@email.com",
      department: "Inventory",
      status: "Active",
    },
    {
      id: "EMP003",
      name: "Mark",
      email: "mark@email.com",
      department: "Support",
      status: "Inactive",
    },
  ];

  return (
    <section>
      <div className="page-title-row">
        <h1>Employee Management</h1>
        <Link to="/admin/employees/add">
          <button>Add Employee</button>
        </Link>
      </div>

      <input
        type="text"
        placeholder="Search employee..."
        className="admin-page-search"
      />

      <table className="admin-table">
        <thead>
          <tr>
            <th>Employee ID</th>
            <th>Name</th>
            <th>Email</th>
            <th>Department</th>
            <th>Status</th>
            <th>Actions</th>
          </tr>
        </thead>

        <tbody>
          {employees.map((employee) => (
            <tr key={employee.id}>
              <td>{employee.id}</td>
              <td>{employee.name}</td>
              <td>{employee.email}</td>
              <td>{employee.department}</td>
              <td>{employee.status}</td>
              <td>
                <button>Edit</button>
                <button>Delete</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      <div className="chart-placeholder">
        Employee Summary Chart Placeholder
      </div>
    </section>
  );
}

export default ManageEmployees;