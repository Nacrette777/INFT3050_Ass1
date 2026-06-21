function CustomerProfile() {
  return (
    <section>
      <h1>My Account</h1>

      <div className="profile-layout">
        <aside className="profile-sidebar">
          <button>My Profile</button>
          <button>Order History</button>
          <button>Wishlist</button>
          <button>Settings</button>
        </aside>

        <main>
          <h2>Personal Information</h2>
          <p>Name: John Tan</p>
          <p>Email: john.tan@email.com</p>
          <p>Phone: +65 XXXX XXXX</p>
          <p>Address: Saved shipping address</p>

          <button>Edit Profile</button>

          <h2>Account Security</h2>
          <p>Password: ********</p>
          <button>Change Password</button>
        </main>
      </div>
    </section>
  );
}

export default CustomerProfile;