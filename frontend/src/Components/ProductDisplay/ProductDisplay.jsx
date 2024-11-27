import React, { useState, useEffect, useContext } from 'react';
import './ProductDisplay.css';
import star_icon from "../Assets/star_icon.png";
import star_dull_icon from "../Assets/star_dull_icon.png";
import { ShopContext } from '../../Context/ShopContext';
import { useParams } from 'react-router-dom';  // To access the URL parameter

const ProductDisplay = () => {
    const { id } = useParams();  // Get the product ID from the URL
    const [product, setProduct] = useState(null);  // State to store the product data
    const { addToCart } = useContext(ShopContext);  // Context to handle cart actions

    useEffect(() => {
        fetch(`http://localhost:4000/product/${id}`)
            .then((response) => response.json())
            .then((data) => setProduct(data))
            .catch((error) => {
                console.error("Error fetching product:", error);
                // Optionally, set an error state to display an error message in the UI
                setProduct({ error: 'Error fetching product data' });
            });
    }, [id]);  // Refetch the product if the ID changes
    console.log(product);
    if (!product) {
        return <div>Loading...</div>;  // Show a loading message while the product is being fetched
    }

    return (
        <div className='productdisplay'>
            <div className='productdisplay-left'>
                <div className='productdisplay-img-list'>
                    {product.images && product.images.length > 0 ? (
                        product.images.map((image, index) => (
                            <img key={index} src={image} alt={`Product Image ${index + 1}`} />
                        ))
                    ) : (
                        <p>No images available</p>  // Fallback message or placeholder image
                    )}
                </div>
                <div className='productdisplay-img'>
                    <img className='productdisplay-main-img' src={product.images?.[0] || "default-image-url.jpg"} alt="Main Product" />
                </div>
            </div>
            <div className='productdisplay-right'>
                <h1>{product.name}</h1>
                <div className='productdisplay-right-star'>
                    <img src={star_icon} alt="Star" />
                    <img src={star_icon} alt="Star" />
                    <img src={star_icon} alt="Star" />
                    <img src={star_icon} alt="Star" />
                    <img src={star_dull_icon} alt="Star" />
                    <div className='productdisplay-right-prices'>
                        <div className='productdisplay-right-price-old'>${product.variants.map((variant) => variant.price).join(', ')}</div>
                        <div className="productdisplay-right-price-new">${product.variants.map((variant) => variant.new_price).join(', ')}</div>
                    </div>
                    <div className="productdisplay-right-description">
                        {product.description}
                    </div>
                    <div className="productdisplay-right-size">
                        <h1>Select Size</h1>
                        <div className="productdisplay-right-sizes">
                            {['S', 'M', 'L', 'XL', 'XXL'].map((size, index) => (
                                <div key={index}>{size}</div>
                            ))}
                        </div>
                    </div>
                    <button onClick={() => addToCart(product._id)}>ADD TO CART</button>
                    <p className='productdisplay-right-category'>
                        <span>Category:</span> {product.category_id}
                    </p>
                    <p className='productdisplay-right-category'>
                        <span>Tags:</span> Modern , Latest
                    </p>
                </div>
            </div>
        </div>
    );
};

export default ProductDisplay;
