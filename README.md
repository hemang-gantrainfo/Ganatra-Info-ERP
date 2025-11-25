# 🧩 Inventory, Orders & User Management System

This project is a backend/admin panel for managing **products**, **orders**, and **users**, with sync support for popular ecommerce platforms like **Maropost** and **Shopify**.

It provides:

- Centralized **product management**
- **Order syncing** between ecommerce platforms and suppliers
- Basic **user management** (admin, operators, etc.)

---

## 🚀 Features

### 1. Product Management

- **Add Products**  
  Create products with details such as name, SKU, price, stock, brand, etc.

- **Update Products**  
  Edit product details and sync changes with connected ecommerce platforms.

- **Delete Products**  
  Soft-delete or permanently delete products according to business rules.

- **Bulk Product Import (CSV)**  
  Upload CSV files to import multiple products at once, with validation.

- **Bulk Product Export (CSV)**  
  Export all or filtered products into CSV format.

- **Sync Products with Ecommerce Platforms (Maropost / Shopify)**  
  Push or pull product data between this system and connected platforms.

---

### 2. Order Management

- **Fetch Orders from Ecommerce Platforms**  
  Retrieve orders from Shopify/Maropost via APIs.

- **Create Supplier Orders**  
  Convert ecommerce orders into supplier orders.

- **Update Orders in Ecommerce Platforms**  
  Send back order status, tracking numbers, and fulfillment updates to platforms.

---

### 3. User Management

- **Add Users**  
  Create admin or operator accounts.

- **Update Users**  
  Edit user information such as name, email, and role.

- **Delete Users**  
  Deactivate or delete user accounts.

---

## 🧪 Demo

### 🔐 Login Page
<img src="demo/LoginPage.png" alt="Login Page" width="500" />

### 📊 Dashboard
<img src="demo/Dashboard.png" alt="Dashboard" width="500" />

### 📦 Products Page
<img src="demo/ProductPage.png" alt="Products Page" width="500" />

### 📝 Orders Page
<img src="demo/OrderPage.png" alt="Orders Page" width="500" />

---

## 🔐 Demo Login Credentials

**URL:** https://erp.ganatrainfo.com  
**Email:** `demo@example.com`  
**Password:** `Demo@123`

---

## 🛠️ Tech Stack

- **Frontend:** React 19.1.1 (TypeScript), Node.js 22.18.0  
- **Backend:** Laravel 12 (PHP 8.2)  
- **Database:** MySQL 10.4.32  
- **Integrations:** Maropost, Shopify  
- **API Type:** REST  

---

## ⚠️ Important Notice

### ❗ This project is for **demo purposes only**

This repository contains a **showcase version** of our Inventory, Orders & User Management System.  
Please note the following before using or cloning the project:

- The codebase is **not fully implemented** and several modules are incomplete.  
- Some features shown in the demo are **mocked or partially functional**.  
- Third-party integrations (Shopify, Maropost, etc.) are **disabled** in this demo version.  
- API endpoints, authentication flow, and automation modules are **stripped down** or contain placeholder logic.  
- Database migrations and seeders are **not fully included**, so the system will not run out-of-the-box.  

Because of these limitations:

➡️ **If you clone or download this repository, it will *not* work as a production-ready system.**  
➡️ **Do not use this version for live or client projects.**

---

## 🔧 Need a Fully Functional System?

If you require:

- A complete, production-ready ERP  
- Customized features tailored to your business  
- Deep ecommerce integrations (Maropost, Shopify, WooCommerce, etc.)  
- Automated product, order, and user workflows  
- Supplier syncing and advanced reporting  
- Role-based access control, permissions, and logging  
- A scalable architecture for thousands of products or orders  

Our team can build a **fully working, secure, optimized, and enterprise-grade version** of this system for you.

---

## 📞 Contact Us

👉 **Get in touch with our development team:**  
📧 **contact@ganatrainfo.com**  
🌐 **https://ganatrainfo.com**

We will help you build a **custom ERP** tailored to your exact business operations, with all modules fully functional and ready for real-world use.

