import React, { useEffect, useState } from 'react';
import './ListProduct.css';
import { useNavigate } from 'react-router-dom'; // Import useNavigate instead of useHistory
import cross_icon from '../../assets/cross_icon.png';
import dropdown from '../../assets/dropdown_icon.png';

const ListProduct = () => {
  const [allproducts, setAllProducts] = useState([]);
  const navigate = useNavigate();

  const fetchInfo = async () => {
    try {
      const response = await fetch('http://localhost:4000/allproducts');
      const data = await response.json();
      console.log(data);
      // Check if the data is an array before setting it
      if (Array.isArray(data)) {
        setAllProducts(data);
      } else {
        console.error("Fetched data is not an array:", data);
      }
    } catch (error) {
      console.error("Error fetching products:", error);
    }
  };

  useEffect(() => {
    fetchInfo(); // Fetch products on component mount
  }, []);

  const remove_product = async (id) => {
    try {
      await fetch('http://localhost:4000/removeproduct', {
        method: 'POST',
        headers: {
          Accept: 'application/json',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ id }),
      });
      await fetchInfo(); // Refresh product list after removal
    } catch (error) {
      console.error("Error removing product:", error);
    }
  };

  const editProduct = (id) => {
    navigate(`/editproduct/${id}`);
  };

  return (
    <div className="list-product">
      <h1>All Product List</h1>
      <div className="listproduct-format-main">
        <p>Products</p>
        <p>Title</p>
        <p>Old Prices</p>
        <p>New Prices</p>
        <p>Category</p>
        <p>Edit</p>
        <p>Remove</p>
      </div>
      <div className="listproduct-allproducts">
        <hr />
        {Array.isArray(allproducts) && allproducts.map((product, index) => (
          <React.Fragment key={index}>
            <div className="listproduct-format-main listproduct-format">
              <img
                src={product.images[0]} // Display first image from array
                alt=""
                className="listproduct-product-icon"
              />
              <p>{product.name}</p>
              <p>{product.price}</p>
              <p>{product.new_price}</p>
              <p>{product.category_id ? product.category_id.name : "N/A"}</p>
              <img
                onClick={() => editProduct(product._id)}
                alt=""
                className="listproduct-remove-icon"
                src={dropdown}
              />
              <img
                onClick={() => remove_product(product._id)}
                alt=""
                className="listproduct-remove-icon"
                src={cross_icon}
              />
            </div>
            <hr />
          </React.Fragment>
        ))}
      </div>
    </div>
  );
};

export default ListProduct;
