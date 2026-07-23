function AddProduct() {
  return (
    <section>
      <h1>Add Product</h1>

      <form className="admin-form">
        <label>
          Product Name
          <input />
        </label>

        <label>
          Category
          <input />
        </label>

        <label>
          Price
          <input type="number" />
        </label>

        <label>
          Stock
          <input type="number" />
        </label>

        <label>
          Description
          <textarea />
        </label>

        <button type="submit">Save</button>
      </form>
    </section>
  );
}

export default AddProduct;