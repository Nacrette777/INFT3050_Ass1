import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router";
import { getCatalogProducts } from "../../services/catalogService";
import { formatCurrency } from "../../utils/customerCartStorage";

function getProductId(product, index) {
  return String(product?.id || product?.productId || `product-${index + 1}`);
}

function CustomerHome() {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState("");

  // Products come from the database via catalogService, which returns them
  // in the same flat shape this page was written against.
  const [products, setProducts] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState("");

  useEffect(() => {
    let cancelled = false;

    getCatalogProducts()
      .then((rows) => {
        if (!cancelled) setProducts(rows);
      })
      .catch((error) => {
        if (!cancelled) setLoadError(error.message || "Could not load products.");
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  const categories = useMemo(
    () => [
      ...new Set(
        products
          .map((product) => product?.category)
          .filter((category) => category !== undefined && category !== null && category !== "")
      ),
    ],
    [products]
  );

  // StoreDB has no "featured" column, so this shows the four most expensive
  // in-stock items as a stand-in. Deterministic, so the page does not
  // reshuffle on every render.
  const featuredProducts = useMemo(() => {
    const marked = products.filter((product) => product?.featured);
    if (marked.length > 0) return marked.slice(0, 4);

    return [...products]
      .filter((product) => product?.inStock !== false && Number(product?.price) > 0)
      .sort((a, b) => Number(b.price) - Number(a.price))
      .slice(0, 4);
  }, [products]);

  function handleHomeSearch(event) {
    event.preventDefault();
    const trimmedSearch = searchTerm.trim();

    navigate(
      trimmedSearch
        ? `/customer/products?search=${encodeURIComponent(trimmedSearch)}`
        : "/customer/products"
    );
  }

  return (
    <section>
      <h1>Discover Premium Entertainment Gear</h1>
      <p>Shop instruments, merchandise, accessories, vinyl and media.</p>

      <div className="home-actions">
        <Link className="button-link" to="/customer/products">
          Shop Now
        </Link>
        <form className="home-search-form" onSubmit={handleHomeSearch}>
          <input
            type="search"
            value={searchTerm}
            onChange={(event) => setSearchTerm(event.target.value)}
            placeholder="Search products"
          />
          <button type="submit">Search</button>
        </form>
      </div>

      {isLoading && <p aria-live="polite">Loading products...</p>}

      {loadError && (
        <p className="customer-error-message" aria-live="polite">
          {loadError}
        </p>
      )}

      <h2>Featured Categories</h2>
      <div className="category-grid">
        {categories.length > 0 ? (
          categories.map((category) => (
            <Link
              className="category-card"
              key={category}
              to={`/customer/products?category=${encodeURIComponent(category)}`}
            >
              {category}
            </Link>
          ))
        ) : (
          <div>No categories available</div>
        )}
      </div>

      <h2>Featured Products</h2>
      {featuredProducts.length === 0 ? (
        <div className="customer-empty-state">
          <h2>No featured products</h2>
          <p>Please check back later.</p>
        </div>
      ) : (
        <div className="product-grid">
          {featuredProducts.map((product, index) => {
            const productId = getProductId(product, index);
            const name = product?.name || "Unnamed Product";
            const price = Number(product?.price);
            const rating = Number(product?.rating);

            return (
              <Link
                className="product-card product-card-link"
                key={productId}
                to={`/customer/products/${encodeURIComponent(productId)}`}
              >
                {product?.image ? (
                  <img className="product-card-image" src={product.image} alt={name} />
                ) : (
                  <div className="product-image-placeholder">
                    {product?.imageText || "Product Image"}
                  </div>
                )}
                <div className="product-card-body">
                  <p className="product-meta">
                    {product?.category || "Other"} | {product?.brand || "Unknown Brand"}
                  </p>
                  <h3>{name}</h3>
                  <p className="product-rating">
                    {Number.isFinite(rating) && rating > 0
                      ? `${rating.toFixed(1)} stars`
                      : "No ratings yet"}
                  </p>
                  <p className="product-price">
                    {formatCurrency(Number.isFinite(price) ? price : 0)}
                  </p>
                  <span className="button-link">View Details</span>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </section>
  );
}

export default CustomerHome;
