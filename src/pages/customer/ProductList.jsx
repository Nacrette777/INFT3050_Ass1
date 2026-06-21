import { Link } from "react-router";

function ProductList() {
  const products = [
    { id: "P001", name: "Electric Guitar", price: 429 },
    { id: "P002", name: "Bass Guitar", price: 399 },
    { id: "P003", name: "Guitar Strap", price: 35 },
    { id: "P004", name: "Amp Speaker", price: 199 },
  ];

  return (
    <section>
      <h1>Product Listing</h1>

      <div className="product-page-layout">
        <aside className="filter-panel">
          <h2>Filters</h2>
          <label>
            <input type="checkbox" /> Instruments
          </label>
          <label>
            <input type="checkbox" /> Merchandise
          </label>
          <label>
            <input type="checkbox" /> Accessories
          </label>
          <label>
            <input type="checkbox" /> Vinyl & Media
          </label>
        </aside>

        <div className="product-grid">
          {products.map((product) => (
            <div className="product-card" key={product.id}>
              <div className="product-image-placeholder">Product Image</div>
              <h3>{product.name}</h3>
              <p>${product.price}</p>
              <Link to={`/customer/products/${product.id}`}>
                <button>View Details</button>
              </Link>
              <button>Add to Cart</button>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

export default ProductList;