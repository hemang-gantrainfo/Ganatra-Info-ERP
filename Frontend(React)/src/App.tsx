import { Routes, Route, Navigate } from 'react-router-dom';
import AdminLogin from './Admin/Authentication/Login';
import AdminDashboard from './Admin/Components/Dashboard/Admin-Dashboard';
import AuthService from './Services/AuthService';
import PrivateRoute from './Services/PrivateRoute';
import Layout from './Admin/Components/Layout/Layout';
import { ToastContainer } from 'react-toastify';
import "react-toastify/dist/ReactToastify.css";
import './index.scss';
import Categories from './Admin/Components/Category/Categories';
import Users from './Admin/User/Admin-Users';
import Brands from './Admin/Components/Brands/Brands';
import Products from './Admin/Components/Products/ProductList';
import NotFound from './Admin/Components/Layout/NotFound';
import Settings from './Admin/Components/Settings/Settings';
import OrderList from './Admin/Components/Orders/OrderList';
import OrderDetails from './Admin/Components/Orders/OrderDetails';

function App() {

  return (
    <>
      <ToastContainer position="top-right" autoClose={3000}
        hideProgressBar={false} newestOnTop={false} closeOnClick rtl={false} pauseOnFocusLoss
        draggable pauseOnHover theme="light" toastClassName="custom-toast" />
      <Routes>
        <Route path="/" element={AuthService.isLoggedIn() ? (<Navigate to="/dashboard" replace />) : (<Navigate to="/login" replace />)} />
        <Route path="/login" element={<AdminLogin />} />
        {/* <Route path="/admin-register" element={<AdminRegister />} /> */}
        <Route element={<PrivateRoute> <Layout /> </PrivateRoute>} >
          <Route path="/dashboard" element={<AdminDashboard />} />
          <Route path="/products" element={<Products />} />
          <Route path="/categories" element={<Categories />} />
          <Route path="/users" element={<Users />} />
          <Route path="/brands" element={<Brands />} />
          <Route path="/orders" element={<OrderList />} />
          <Route path="/orders/:id" element={<OrderDetails />} />
          <Route path="/settings" element={<Settings />} />
        </Route>
        <Route path="*" element={<NotFound />} />
      </Routes>
    </>
  );
}

export default App;
