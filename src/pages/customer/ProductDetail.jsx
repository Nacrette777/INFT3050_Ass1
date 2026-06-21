import { useParams } from "react-router";

function ProductDetail() {
  const { productId } = useParams();

  return (
    <section>
      <h1>Product Detail</h1>

      <div className="product-detail-layout">
        <div className="large-image-placeholder">Main Product Image</div>

        <div>
          <h2>Professional Electric Guitar</h2>
          <p>Product ID: {productId}</p>
          <p>Brand: Yamaha</p>
          <p>Price: $429.00</p>
          <p>Availability: In Stock</p>
          <p>
            Description placeholder text area for product description, key
            benefits, material, sound quality and shipping note.
          </p>

          <button>Add to Cart</button>
          <button>Buy Now</button>
        </div>
      </div>
    </section>
  );
}

export default ProductDetail;