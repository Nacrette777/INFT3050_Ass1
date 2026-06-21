function OrderHistory() {
  return (
    <section>
      <h1>Order History</h1>

      <table className="basic-table">
        <thead>
          <tr>
            <th>Order #</th>
            <th>Date</th>
            <th>Total</th>
            <th>Status</th>
          </tr>
        </thead>

        <tbody>
          <tr>
            <td>Order 1</td>
            <td>07/10/2021</td>
            <td>$10.00</td>
            <td>Completed</td>
          </tr>
          <tr>
            <td>Order 2</td>
            <td>08/10/2021</td>
            <td>$10.00</td>
            <td>Pending</td>
          </tr>
        </tbody>
      </table>
    </section>
  );
}

export default OrderHistory;