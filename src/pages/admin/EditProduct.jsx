import { useParams } from "react-router";

function EditProduct() {
  const { productId } = useParams();

  return (
    <section>
      <h1>Edit Product</h1>
      <p>Editing product: {productId}</p>

      <form className="admin-form">
        <label>
          Product Name
          <input defaultValue="Electric Guitar" />
        </label>

        <label>
          Category
          <input defaultValue="Instruments" />
        </label>

        <label>
          Price
          <input type="number" defaultValue="429" />
        </label>

        <label>
          Stock
          <input type="number" defaultValue="27" />
        </label>

        <button type="submit">Save Changes</button>
      </form>
    </section>
  );
}

export default EditProduct;