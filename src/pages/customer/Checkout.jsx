function Checkout() {
  return (
    <section>
      <h1>Checkout</h1>

      <div className="checkout-layout">
        <form className="checkout-form">
          <h2>Shipping Address</h2>

          <label>
            Full Name
            <input />
          </label>

          <label>
            Email
            <input />
          </label>

          <label>
            Address
            <input />
          </label>

          <label>
            City
            <input />
          </label>

          <label>
            Postal Code
            <input />
          </label>

          <label>
            Country
            <input />
          </label>

          <h2>Payment Method</h2>

          <label>
            <input type="radio" name="payment" /> Credit Card
          </label>

          <label>
            <input type="radio" name="payment" /> PayPal
          </label>

          <label>
            <input type="radio" name="payment" /> Bank Transfer
          </label>
        </form>

        <aside className="order-summary">
          <h2>Order Summary</h2>
          <p>Electric Guitar: $429</p>
          <p>Guitar Strap x2: $70</p>
          <p>Shipping: $15</p>
          <h3>Total: $514</h3>
          <button>Place Order</button>
        </aside>
      </div>
    </section>
  );
}

export default Checkout;