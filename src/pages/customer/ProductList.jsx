import { useEffect, useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router";
import { mockProducts } from "../../data/mockProducts";
import {
  addProductToCustomerCart,
  formatCurrency,
  getStockStatusText,
} from "../../utils/customerCartStorage";

const PRODUCTS_PER_PAGE = 6;
const DEFAULT_FILTER = "all";
const DEFAULT_RATING = "0";
const DEFAULT_SORT = "default";

const priceRanges = [
  { label: "Any price", value: DEFAULT_FILTER, min: null, max: null },
  { label: "Under $50", value: "0-50", min: 0, max: 50, maxExclusive: true },
  { label: "$50 - $199", value: "50-199", min: 50, max: 199 },
  { label: "$200 - $399", value: "200-399", min: 200, max: 399 },
  { label: "$400+", value: "400-", min: 400, max: null },
];

const ratingOptions = [
  { label: "Any rating", value: DEFAULT_RATING },
  { label: "3+ stars", value: "3" },
  { label: "4+ stars", value: "4" },
  { label: "4.5+ stars", value: "4.5" },
];

const sortOptions = [
  { label: "Default", value: DEFAULT_SORT },
  { label: "Name", value: "name" },
  { label: "Price: Low to High", value: "price-low" },
  { label: "Price: High to Low", value: "price-high" },
  { label: "Rating", value: "rating" },
];

function getProductId(product, index) {
  return String(product?.id || product?.productId || `product-${index + 1}`);
}

function getProductText(product, key, fallback = "Unknown") {
  const value = product?.[key];
  return value === undefined || value === null || value === "" ? fallback : String(value);
}

function getProductPrice(product) {
  const price = Number(product?.price);
  return Number.isFinite(price) && price >= 0 ? price : 0;
}

function getProductRating(product) {
  const rating = Number(product?.rating);
  return Number.isFinite(rating) && rating >= 0 ? rating : 0;
}

function getProductStock(product) {
  const stock = Number(product?.stock);
  return Number.isFinite(stock) ? stock : null;
}

function getValidatedParam(searchParams, key, allowedValues, fallback) {
  const value = searchParams.get(key);
  return allowedValues.includes(value) ? value : fallback;
}

function getValidatedPage(searchParams) {
  const page = Number(searchParams.get("page"));
  return Number.isInteger(page) && page > 0 ? page : 1;
}

function ProductList() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [viewMode, setViewMode] = useState("grid");
  const [cartNotice, setCartNotice] = useState("");

  const products = useMemo(() => (Array.isArray(mockProducts) ? mockProducts : []), []);
  const queryString = searchParams.toString();

  const categories = useMemo(
    () => [
      DEFAULT_FILTER,
      ...new Set(products.map((product) => getProductText(product, "category", "Other"))),
    ],
    [products]
  );

  const brands = useMemo(
    () => [
      DEFAULT_FILTER,
      ...new Set(products.map((product) => getProductText(product, "brand", "Other"))),
    ],
    [products]
  );

  const searchTerm = searchParams.get("search") || "";
  const selectedCategory = getValidatedParam(
    searchParams,
    "category",
    categories,
    DEFAULT_FILTER
  );
  const selectedBrand = getValidatedParam(searchParams, "brand", brands, DEFAULT_FILTER);
  const selectedPriceRange = getValidatedParam(
    searchParams,
    "price",
    priceRanges.map((range) => range.value),
    DEFAULT_FILTER
  );
  const minimumRating = getValidatedParam(
    searchParams,
    "rating",
    ratingOptions.map((option) => option.value),
    DEFAULT_RATING
  );
  const sortBy = getValidatedParam(
    searchParams,
    "sort",
    sortOptions.map((option) => option.value),
    DEFAULT_SORT
  );
  const currentPage = getValidatedPage(searchParams);

  const filteredProducts = useMemo(() => {
    const normalizedSearch = searchTerm.trim().toLowerCase();
    const minimumRatingNumber = Number(minimumRating);
    const selectedRange = priceRanges.find((range) => range.value === selectedPriceRange);

    const filtered = products.filter((product) => {
      const name = getProductText(product, "name", "");
      const category = getProductText(product, "category", "Other");
      const brand = getProductText(product, "brand", "Other");
      const description = getProductText(product, "description", "");
      const price = getProductPrice(product);
      const rating = getProductRating(product);
      const meetsMinimum =
        selectedRange?.min === null ||
        selectedRange?.min === undefined ||
        price >= selectedRange.min;
      const meetsMaximum =
        selectedRange?.max === null ||
        selectedRange?.max === undefined ||
        (selectedRange.maxExclusive
          ? price < selectedRange.max
          : price <= selectedRange.max);

      const searchableText = `${name} ${brand} ${category} ${description}`.toLowerCase();
      const matchesSearch = !normalizedSearch || searchableText.includes(normalizedSearch);
      const matchesCategory = selectedCategory === DEFAULT_FILTER || category === selectedCategory;
      const matchesBrand = selectedBrand === DEFAULT_FILTER || brand === selectedBrand;
      const matchesRating = rating >= minimumRatingNumber;
      const matchesPrice =
        !selectedRange ||
        selectedRange.value === DEFAULT_FILTER ||
        (meetsMinimum && meetsMaximum);

      return (
        matchesSearch &&
        matchesCategory &&
        matchesBrand &&
        matchesPrice &&
        matchesRating
      );
    });

    return [...filtered].sort((a, b) => {
      if (sortBy === "price-low") return getProductPrice(a) - getProductPrice(b);
      if (sortBy === "price-high") return getProductPrice(b) - getProductPrice(a);
      if (sortBy === "rating") return getProductRating(b) - getProductRating(a);
      if (sortBy === "name") {
        return getProductText(a, "name", "").localeCompare(
          getProductText(b, "name", "")
        );
      }
      return 0;
    });
  }, [
    products,
    searchTerm,
    selectedCategory,
    selectedBrand,
    selectedPriceRange,
    minimumRating,
    sortBy,
  ]);

  const totalPages = Math.max(1, Math.ceil(filteredProducts.length / PRODUCTS_PER_PAGE));
  const page = Math.min(currentPage, totalPages);
  const pageStart = (page - 1) * PRODUCTS_PER_PAGE;
  const visibleProducts = filteredProducts.slice(
    pageStart,
    pageStart + PRODUCTS_PER_PAGE
  );

  useEffect(() => {
    if (currentPage === page) {
      return;
    }

    const nextParams = new URLSearchParams(queryString);

    if (page > 1) {
      nextParams.set("page", String(page));
    } else {
      nextParams.delete("page");
    }

    setSearchParams(nextParams, { replace: true });
  }, [currentPage, page, queryString, setSearchParams]);

  function updateQueryParam(key, value, defaultValue = DEFAULT_FILTER) {
    const nextParams = new URLSearchParams(searchParams);

    if (!value || value === defaultValue) {
      nextParams.delete(key);
    } else {
      nextParams.set(key, value);
    }

    nextParams.delete("page");
    setSearchParams(nextParams);
  }

  function setPage(nextPage) {
    const nextParams = new URLSearchParams(searchParams);

    if (nextPage > 1) {
      nextParams.set("page", String(nextPage));
    } else {
      nextParams.delete("page");
    }

    setSearchParams(nextParams);
  }

  function clearFilters() {
    setSearchParams({});
    setCartNotice("");
  }

  function handleAddToCart(product) {
    const result = addProductToCustomerCart(product, 1);

    if (result.outOfStock) {
      setCartNotice("Out of stock.");
    } else if (result.reachedStockLimit) {
      setCartNotice("Maximum stock reached.");
    } else {
      setCartNotice(`${getProductText(product, "name", "Product")} added to cart.`);
    }
  }

  return (
    <section>
      <h1>Product Listing</h1>

      <div className="product-page-layout">
        <aside className="filter-panel">
          <h2>Filters</h2>
          <div className="customer-filter-group">
            <label htmlFor="product-search">Search</label>
            <input
              id="product-search"
              type="search"
              value={searchTerm}
              onChange={(event) => updateQueryParam("search", event.target.value, "")}
              placeholder="Search products"
            />
          </div>

          <div className="customer-filter-group">
            <label htmlFor="category-filter">Category</label>
            <select
              id="category-filter"
              value={selectedCategory}
              onChange={(event) => updateQueryParam("category", event.target.value)}
            >
              {categories.map((category) => (
                <option key={category} value={category}>
                  {category === DEFAULT_FILTER ? "All categories" : category}
                </option>
              ))}
            </select>
          </div>

          <div className="customer-filter-group">
            <label htmlFor="brand-filter">Brand</label>
            <select
              id="brand-filter"
              value={selectedBrand}
              onChange={(event) => updateQueryParam("brand", event.target.value)}
            >
              {brands.map((brand) => (
                <option key={brand} value={brand}>
                  {brand === DEFAULT_FILTER ? "All brands" : brand}
                </option>
              ))}
            </select>
          </div>

          <div className="customer-filter-group">
            <label htmlFor="price-filter">Price</label>
            <select
              id="price-filter"
              value={selectedPriceRange}
              onChange={(event) => updateQueryParam("price", event.target.value)}
            >
              {priceRanges.map((range) => (
                <option key={range.value} value={range.value}>
                  {range.label}
                </option>
              ))}
            </select>
          </div>

          <div className="customer-filter-group">
            <label htmlFor="rating-filter">Minimum rating</label>
            <select
              id="rating-filter"
              value={minimumRating}
              onChange={(event) =>
                updateQueryParam("rating", event.target.value, DEFAULT_RATING)
              }
            >
              {ratingOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>

          <button type="button" className="secondary-button" onClick={clearFilters}>
            Clear Filters
          </button>
        </aside>

        <div className="customer-product-results">
          <div className="product-toolbar">
            <p>
              Showing {visibleProducts.length} of {filteredProducts.length} products
            </p>

            <div className="product-toolbar-controls">
              <label>
                Sort
                <select
                  value={sortBy}
                  onChange={(event) =>
                    updateQueryParam("sort", event.target.value, DEFAULT_SORT)
                  }
                >
                  {sortOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </label>

              <div className="view-toggle" aria-label="Product view">
                <button
                  type="button"
                  className={viewMode === "grid" ? "active" : ""}
                  onClick={() => setViewMode("grid")}
                >
                  Grid
                </button>
                <button
                  type="button"
                  className={viewMode === "list" ? "active" : ""}
                  onClick={() => setViewMode("list")}
                >
                  List
                </button>
              </div>
            </div>
          </div>

          {cartNotice && (
            <p className="customer-success-message" aria-live="polite">
              {cartNotice}
            </p>
          )}

          {visibleProducts.length === 0 ? (
            <div className="customer-empty-state">
              <h2>No products found</h2>
              <p>Try adjusting your search or filters.</p>
              <button type="button" onClick={clearFilters}>
                Reset Filters
              </button>
            </div>
          ) : (
            <div className={`product-grid product-grid-${viewMode}`}>
              {visibleProducts.map((product, index) => {
                const productId = getProductId(product, pageStart + index);
                const name = getProductText(product, "name", "Unnamed Product");
                const category = getProductText(product, "category", "Other");
                const brand = getProductText(product, "brand", "Unknown Brand");
                const price = getProductPrice(product);
                const rating = getProductRating(product);
                const stock = getProductStock(product);
                const isOutOfStock = stock === 0;

                return (
                  <article className="product-card" key={productId}>
                    <Link to={`/customer/products/${encodeURIComponent(productId)}`}>
                      {product?.image ? (
                        <img className="product-card-image" src={product.image} alt={name} />
                      ) : (
                        <div className="product-image-placeholder">
                          {getProductText(product, "imageText", "Product Image")}
                        </div>
                      )}
                    </Link>
                    <div className="product-card-body">
                      <p className="product-meta">
                        {category} | {brand}
                      </p>
                      <Link to={`/customer/products/${encodeURIComponent(productId)}`}>
                        <h3>{name}</h3>
                      </Link>
                      <p className="product-rating">
                        {rating > 0 ? `${rating.toFixed(1)} stars` : "No ratings yet"}
                      </p>
                      <p className="product-price">{formatCurrency(price)}</p>
                      <p className="product-stock">
                        {getStockStatusText(stock)}
                      </p>
                      <div className="product-actions">
                        <Link
                          className="button-link"
                          to={`/customer/products/${encodeURIComponent(productId)}`}
                        >
                          View Details
                        </Link>
                        <button
                          type="button"
                          onClick={() => handleAddToCart(product)}
                          disabled={isOutOfStock}
                        >
                          {isOutOfStock ? "Out of Stock" : "Add to Cart"}
                        </button>
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>
          )}

          {filteredProducts.length > PRODUCTS_PER_PAGE && (
            <div className="pagination-controls">
              <button
                type="button"
                onClick={() => setPage(Math.max(1, page - 1))}
                disabled={page === 1}
              >
                Previous
              </button>
              <span>
                Page {page} of {totalPages}
              </span>
              <button
                type="button"
                onClick={() => setPage(Math.min(totalPages, page + 1))}
                disabled={page === totalPages}
              >
                Next
              </button>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}

export default ProductList;
