import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router";
import { getCatalogProductById } from "../../services/catalogService";
import {
  addProductToCustomerCart,
  formatCurrency,
  getStockStatusText,
} from "../../utils/customerCartStorage";

function getProductId(product, fallback = "") {
  return String(product?.id || product?.productId || fallback);
}

function getSafeNumber(value, fallback = 0) {
  const number = Number(value);
  return Number.isFinite(number) && number >= 0 ? number : fallback;
}

function getProductImages(product) {
  if (Array.isArray(product?.images)) {
    return product.images.filter(Boolean);
  }

  return product?.image ? [product.image] : [];
}

function getQuantityLimit(stock) {
  const stockNumber = Number(stock);
  return Number.isFinite(stockNumber) && stockNumber > 0
    ? Math.floor(stockNumber)
    : null;
}

function clampQuantity(value, stockLimit) {
  const number = Math.floor(Number(value));
  const safeNumber = Number.isFinite(number) && number > 0 ? number : 1;
  return stockLimit ? Math.min(safeNumber, stockLimit) : safeNumber;
}

function renderSpecifications(specifications) {
  if (Array.isArray(specifications) && specifications.length > 0) {
    return (
      <ul className="product-detail-list">
        {specifications.map((specification) => (
          <li key={String(specification)}>{specification}</li>
        ))}
      </ul>
    );
  }

  if (specifications && typeof specifications === "object") {
    const entries = Object.entries(specifications).filter(([, value]) => value);

    if (entries.length > 0) {
      return (
        <dl className="product-spec-list">
          {entries.map(([key, value]) => (
            <div key={key}>
              <dt>{key}</dt>
              <dd>{String(value)}</dd>
            </div>
          ))}
        </dl>
      );
    }
  }

  return <p>No specifications available.</p>;
}

function renderReviews(reviews) {
  if (!Array.isArray(reviews) || reviews.length === 0) {
    return <p>No reviews yet.</p>;
  }

  return (
    <div className="product-review-list">
      {reviews.map((review, index) => (
        <article className="product-review" key={review?.id || index}>
          <strong>{review?.author || "Customer"}</strong>
          <p>{review?.comment || "No review comment provided."}</p>
        </article>
      ))}
    </div>
  );
}

function ProductDetail() {
  const { productId } = useParams();
  const navigate = useNavigate();
  const decodedProductId = decodeURIComponent(productId || "");

  // The product now comes from the database. Hooks must run in the same
  // order on every render, so all of them stay above the early returns.
  const [product, setProduct] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  const images = useMemo(() => getProductImages(product), [product]);
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [activeTab, setActiveTab] = useState("description");
  const [quantity, setQuantity] = useState(1);
  const [cartNotice, setCartNotice] = useState("");

  useEffect(() => {
    let cancelled = false;
    setIsLoading(true);

    getCatalogProductById(decodedProductId)
      .then((row) => {
        if (!cancelled) setProduct(row);
      })
      .catch(() => {
        if (!cancelled) setProduct(null);
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [decodedProductId]);

  if (isLoading) {
    return (
      <section>
        <h1>Product Detail</h1>
        <p aria-live="polite">Loading product...</p>
      </section>
    );
  }

  if (!product) {
    return (
      <section>
        <h1>Product Detail</h1>
        <div className="customer-empty-state">
          <h2>Product not found</h2>
          <p>This product may be unavailable or has been removed.</p>
          <Link className="button-link" to="/customer/products">
            Back to Products
          </Link>
        </div>
      </section>
    );
  }

  const productDisplayId = getProductId(product, decodedProductId);
  const name = product.name || "Unnamed Product";
  const price = getSafeNumber(product.price);
  const rating = getSafeNumber(product.rating);
  const stockLimit = getQuantityLimit(product.stock);
  const stock = Number(product.stock);
  const isOutOfStock = stock === 0;
  const reviewCount = Array.isArray(product.reviews)
    ? product.reviews.length
    : getSafeNumber(product.reviewCount, 0);
  const currentImage = images[activeImageIndex];

  function updateQuantity(nextQuantity) {
    setQuantity(clampQuantity(nextQuantity, stockLimit));
  }

  function handleAddToCart() {
    const result = addProductToCustomerCart(product, quantity);

    if (result.outOfStock) {
      setCartNotice("Out of stock.");
    } else if (result.reachedStockLimit && result.addedQuantity > 0) {
      setCartNotice("Only the available stock was added. Maximum stock reached.");
    } else if (result.reachedStockLimit) {
      setCartNotice("Maximum stock reached.");
    } else {
      setCartNotice(`${name} added to cart.`);
    }
  }

  function handleBuyNow() {
    const result = addProductToCustomerCart(product, quantity);

    if (result.outOfStock) {
      setCartNotice("Out of stock.");
      return;
    }

    if (result.addedQuantity > 0) {
      navigate("/customer/cart");
      return;
    }

    if (result.reachedStockLimit) {
      setCartNotice("Maximum stock reached.");
    }
  }

  return (
    <section>
      <div className="breadcrumb-row">
        <Link to="/customer/products">Back to Products</Link>
      </div>

      <h1>Product Detail</h1>

      <div className="product-detail-layout">
        <div>
          {currentImage ? (
            <img className="large-product-image" src={currentImage} alt={name} />
          ) : (
            <div className="large-image-placeholder">
              {product.imageText || "Main Product Image"}
            </div>
          )}

          {images.length > 1 && (
            <div className="thumbnail-row">
              {images.map((image, index) => (
                <button
                  className={index === activeImageIndex ? "active" : ""}
                  key={image}
                  type="button"
                  onClick={() => setActiveImageIndex(index)}
                >
                  <img src={image} alt={`${name} thumbnail ${index + 1}`} />
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="product-detail-info">
          <p className="product-meta">
            {product.category || "Other"} | {product.brand || "Unknown Brand"}
          </p>
          <h2>{name}</h2>
          <p>Product ID: {productDisplayId}</p>
          <p>Price: {formatCurrency(price)}</p>
          <p>
            Rating: {rating > 0 ? `${rating.toFixed(1)} stars` : "No ratings yet"}
            {reviewCount > 0 ? ` (${reviewCount} reviews)` : ""}
          </p>
          <p>
            Availability:{" "}
            {getStockStatusText(stock)}
          </p>

          <div className="quantity-control">
            <label htmlFor="product-quantity">Quantity</label>
            <div>
              <button
                type="button"
                onClick={() => updateQuantity(quantity - 1)}
                disabled={quantity <= 1 || isOutOfStock}
              >
                -
              </button>
              <input
                id="product-quantity"
                type="number"
                min="1"
                max={stockLimit || undefined}
                value={quantity}
                onChange={(event) => updateQuantity(event.target.value)}
                disabled={isOutOfStock}
              />
              <button
                type="button"
                onClick={() => updateQuantity(quantity + 1)}
                disabled={isOutOfStock || (stockLimit ? quantity >= stockLimit : false)}
              >
                +
              </button>
            </div>
          </div>

          {cartNotice && (
            <p className="customer-success-message" aria-live="polite">
              {cartNotice}
            </p>
          )}

          <div className="product-actions product-detail-actions">
            <button type="button" onClick={handleAddToCart} disabled={isOutOfStock}>
              {isOutOfStock ? "Out of Stock" : "Add to Cart"}
            </button>
            <button type="button" onClick={handleBuyNow} disabled={isOutOfStock}>
              Buy Now
            </button>
          </div>
        </div>
      </div>

      <div className="product-tabs">
        <div className="product-tab-buttons" role="tablist">
          <button
            type="button"
            className={activeTab === "description" ? "active" : ""}
            onClick={() => setActiveTab("description")}
          >
            Description
          </button>
          <button
            type="button"
            className={activeTab === "specifications" ? "active" : ""}
            onClick={() => setActiveTab("specifications")}
          >
            Specifications
          </button>
          <button
            type="button"
            className={activeTab === "reviews" ? "active" : ""}
            onClick={() => setActiveTab("reviews")}
          >
            Reviews
          </button>
        </div>

        <div className="product-tab-panel">
          {activeTab === "description" && (
            <p>{product.description || "No product description is available."}</p>
          )}
          {activeTab === "specifications" && renderSpecifications(product.specifications)}
          {activeTab === "reviews" && renderReviews(product.reviews)}
        </div>
      </div>
    </section>
  );
}

export default ProductDetail;
