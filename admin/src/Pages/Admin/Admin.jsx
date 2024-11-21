import React from 'react';
import './Admin.css';
import Sidebar from '../../Components/Sidebar/Sidebar';
import { Routes, Route } from 'react-router-dom';
import AddProduct from '../../Components/AddProduct/AddProduct';
import ListProduct from '../../Components/ListProduct/ListProduct';
import EditProduct from '../../Components/EditProduct/EditProduct';  // Import EditProduct component

const Admin = () => {
  return (
    <div className="admin">
      <Sidebar />
      <Routes>
      <Route path="/editproduct/:id" element={<EditProduct />} />
        <Route path="/addproduct" element={<AddProduct />} />
        <Route path="/listproduct" element={<ListProduct />} />
      </Routes>
    </div>
  );
};

export default Admin;
