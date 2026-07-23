function ManageOrders() {
  return (
    <section>
      <h1>Manage Orders</h1>

      <input className="admin-page-search" placeholder="Search orders..." />

      <select>
        <option>All Status</option>
        <option>Paid</option>
        <option>Pending</option>
        <option>Shipped</option>
        <option>Cancelled</option>
      </select>

      <button>Export</button>

      <table className="admin-table">
        <thead>
          <tr>
            <th>Order ID</th>
            <th>Customer</th>
            <th>Email</th>
            <th>Total</th>
            <th>Status</th>
            <th>Date</th>
            <th>Actions</th>
          </tr>
        </thead>

        <tbody>
          <tr>
            <td>0001</td>
            <td>John</td>
            <td>john@email.com</td>
            <td>$120.00</td>
            <td>Paid</td>
            <td>20xx-xx-xx</td>
            <td>
              <button>View</button>
            </td>
          </tr>
        </tbody>
      </table>
    </section>
  );
}

export default ManageOrders;