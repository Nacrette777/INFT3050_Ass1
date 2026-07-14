import { useEffect, useMemo, useState } from "react";
import { getEmployeeProducts } from "../../services/nocoDbService";

function ViewProducts() {
  const [products, setProducts] = useState([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;
    getEmployeeProducts()
      .then((result) => {
        if (active) setProducts(result.list || []);
      })
      .catch((err) => {
        if (active) setError(err.message);
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => { active = false; };
  }, []);

  const filteredProducts = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return products;
    return products.filter((product) =>
      [product.Title, product.Author, product.Genre]
        .some((value) => String(value || "").toLowerCase().includes(query))
    );
  }, [products, search]);

  return (
    <section className="employee-page">
      <div className="employee-page-heading">
        <div>
          <p className="employee-eyebrow">Product catalogue</p>
          <h1>View Products</h1>
          <p>Search and review product information. Editing is restricted to administrators.</p>
        </div>
        <span className="employee-count">{filteredProducts.length} items</span>
      </div>

      <div className="employee-toolbar">
        <label htmlFor="employee-product-search">Search products</label>
        <input
          id="employee-product-search"
          type="search"
          placeholder="Title, author, or genre"
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
              <th>Title</th>
              <th>Author</th>
              <th>Genre</th>
              <th>Price</th>
              <th>Published</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan="6" className="employee-empty">Loading products...</td></tr>
            ) : filteredProducts.length === 0 ? (
              <tr><td colSpan="6" className="employee-empty">No matching products found.</td></tr>
            ) : filteredProducts.map((product) => (
              <tr key={product.Id}>
                <td>{product.Id}</td>
                <td><strong>{product.Title}</strong></td>
                <td>{product.Author || "-"}</td>
                <td><span className="employee-tag">{product.Genre || "Other"}</span></td>
                <td>{product.Price != null ? `$${Number(product.Price).toFixed(2)}` : "-"}</td>
                <td>{product.Published ? String(product.Published).slice(0, 10) : "-"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}

export default ViewProducts;
