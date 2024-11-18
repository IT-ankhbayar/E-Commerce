import React, { useEffect, useState } from 'react';
import './ListProduct.css';
import cross_icon from '../../assets/cross_icon.png';

const ListProduct = () => {
  const [allproducts, setAllProducts] = useState([]);

  const fetchInfo = async () => {
    try {
      const response = await fetch('http://localhost:4000/allproducts');
      const data = await response.json();
      setAllProducts(data);
      console.log(data); // Check fetched data
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

  return (
    <div className="list-product">
      <h1>All Product List</h1>
      <div className="listproduct-format-main">
        <p>Products</p>
        <p>Title</p>
        {/* <p>Color</p> */}
        <p>Old Prices</p>
        <p>New Prices</p>
        <p>Category</p>
        <p>Remove</p>
      </div>
      <div className="listproduct-allproducts">
        <hr />
        {allproducts.map((product, index) => (
          <React.Fragment key={index}>
            <div className="listproduct-format-main listproduct-format">
              <img
                src={product.images[0]} // Display first image from array
                alt=""
                className="listproduct-product-icon"
              />
              <p>{product.name}</p>
              {/* Display old and new prices from variants */}
              {/* <p>{product.variants.map((variant) => variant.size).join(', ')}</p> */}
              <p>
                {product.variants.map((variant) => variant.price).join(', ')}
              </p>
              <p>
                {product.variants.map((variant) => variant.new_price).join(', ')}
              </p>
              <p>{product.category_id ? product.category_id.name : "N/A"}</p>
              <img
                onClick={() => remove_product(product._id)} // Use _id to match backend
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
