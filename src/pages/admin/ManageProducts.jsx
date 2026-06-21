import { Link } from "react-router";

function ManageProducts() {
  const products = [
    { id: "P001", name: "Nike Shoes", category: "Sports", price: 120, stock: 50 },
    { id: "P002", name: "Zara Shirt", category: "Fashion", price: 35, stock: 25 },
    { id: "P003", name: "Adidas Cap", category: "Accessories", price: 20, stock: 40 },
  ];

  return (
    <section>
      <div className="page-title-row">
        <h1>Manage Products</h1>
        <Link to="/admin/products/add">
          <button>Add Item</button>
        </Link>
      </div>

      <input className="admin-page-search" placeholder="Search products..." />

      <table className="admin-table">
        <thead>
          <tr>
            <th>Product ID</th>
            <th>Image</th>
            <th>Name</th>
            <th>Category</th>
            <th>Price</th>
            <th>Stock</th>
            <th>Actions</th>
          </tr>
        </thead>

        <tbody>
          {products.map((product) => (
            <tr key={product.id}>
              <td>{product.id}</td>
              <td>img</td>
              <td>{product.name}</td>
              <td>{product.category}</td>
              <td>${product.price}</td>
              <td>{product.stock}</td>
              <td>
                <Link to={`/admin/products/edit/${product.id}`}>
                  <button>Edit</button>
                </Link>
                <button>Delete</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      <div className="chart-placeholder">Sales Chart Placeholder</div>
    </section>
  );
}

export default ManageProducts;