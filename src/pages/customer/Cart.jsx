import { Link } from "react-router";

function Cart() {
  return (
    <section>
      <h1>Your Cart</h1>

      <table className="basic-table">
        <thead>
          <tr>
            <th>Image</th>
            <th>Item</th>
            <th>Price</th>
            <th>Qty</th>
            <th>Subtotal</th>
          </tr>
        </thead>

        <tbody>
          <tr>
            <td>img</td>
            <td>Electric Guitar</td>
            <td>$429</td>
            <td>1</td>
            <td>$429</td>
          </tr>
          <tr>
            <td>img</td>
            <td>Guitar Strap</td>
            <td>$35</td>
            <td>2</td>
            <td>$70</td>
          </tr>
        </tbody>
      </table>

      <aside className="order-summary">
        <h2>Order Summary</h2>
        <p>Subtotal: $499</p>
        <p>Shipping: $15</p>
        <p>Total: $514</p>
        <Link to="/customer/checkout">
          <button>Proceed to Checkout</button>
        </Link>
      </aside>
    </section>
  );
}

export default Cart;