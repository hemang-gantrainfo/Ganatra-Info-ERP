# 🧩 Inventory, Orders & User Management System

This project is a backend/admin panel for managing products, orders, and users while syncing data with popular ecommerce platforms like **Maropost** and **Shopify**.

It provides:

- Centralized **product management**
- **Order syncing** between ecommerce platforms and suppliers
- Basic **user management** (admin/operators/etc.)

---

## 🚀 Features

### 1. Products Management

- **Add Products**
  - Create new products with details like name, SKU, price, stock, brand, etc.
- **Update Products**
  - Edit existing product details and sync changes with connected platforms if required.
- **Delete Products**
  - Soft or hard delete products (depending on business rules).
- **Bulk Products Import (CSV)**
  - Upload a CSV file to import multiple products at once.
  - Validate data and show errors for incorrect rows.
- **Bulk Products Export (CSV)**
  - Export all or filtered products into a CSV file.
- **Sync Products with Ecommerce Platforms (Maropost / Shopify)**
  - Push local products to connected ecommerce platforms.
  - Pull product updates from Maropost/Shopify into the system.

---

### 2. Order Management

- **Fetch Orders from Ecommerce Platforms**
  - Retrieve orders from Maropost/Shopify via API.
  - Store them in the local database for processing.
- **Add Orders to Suppliers**
  - Create purchase orders for suppliers based on ecommerce orders.
  - Map ecommerce order items to supplier products.
- **Update Orders in Ecommerce Platforms**
  - Update order status (e.g., shipped, cancelled) back to Maropost/Shopify.
  - Optionally update tracking numbers and notes.

---

### 3. User Management

- **Add Users**
  - Create new admin/operator accounts.
  - Assign roles/permissions (if implemented).
- **Update Users**
  - Edit user details such as name, email, role, and status.
- **Delete Users**
  - Deactivate or delete users from the system.

---

## 🛠️ Tech Stack (Example – Update as per your project)

- Backend: `PHP / Laravel` (update this)
- Frontend: `React` (if applicable)
- Database: `MySQL`
- Ecommerce Integrations:
  - **Maropost**
  - **Shopify**
- Other:
  - REST or GraphQL API

> ⚠️ Replace the above with your actual stack so the README matches your project.

---

## 📦 Getting Started

### 1. Clone the Repository

```bash
git clone https://github.com/hemang-gantrainfo/Ganatra-Info-ERP.git
cd Ganatra-Info-ERP
