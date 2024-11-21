import React, { useState, useEffect } from 'react';
import './EditProduct.css';
import upload_area from '../../assets/upload_area.svg';
import { useParams } from 'react-router-dom'; // Import useParams hook

const EditProduct = () => {
    const { id } = useParams(); // Access the product ID using useParams hook
    const [categories, setCategories] = useState([]);
    const [images, setImages] = useState([]);
    const [productDetails, setProductDetails] = useState({
        name: "",
        title: "",
        description: "",
        category_id: Number, 
        images: [],
        variants: [{
            size: "",
            color: "",
            quantity: "",
            price: "",
            new_price: "",
        }],
    });

    // Fetch product data for editing
    useEffect(() => {
        const fetchCategories = async () => {
            try {
                const response = await fetch('http://localhost:4000/categories');
                const data = await response.json();
                if (data.success) {
                    setCategories(data.categories);
                }
            } catch (error) {
                console.error('Error fetching categories:', error);
            }
        };

        const fetchProductDetails = async () => {
            const response = await fetch(`http://localhost:4000/product/${id}`); // Use 'id' from useParams
            const data = await response.json();
            if (data.success) {
                setProductDetails(data.product);
            } else {
                console.error("Failed to fetch product");
            }
        };

        fetchCategories();
        fetchProductDetails();
    }, [id]); // Fetch product details whenever the 'id' changes

    const imageHandler = (e) => {
        setImages([...images, ...e.target.files]);
    };

    const changeHandler = (e) => {
        const { name, value } = e.target;
        setProductDetails((prevDetails) => ({
            ...prevDetails,
            [name]: value,
        }));
    };

    const variantChangeHandler = (index, e) => {
        const updatedVariants = [...productDetails.variants];
        updatedVariants[index][e.target.name] = e.target.value;
        setProductDetails({ ...productDetails, variants: updatedVariants });
    };

    const addVariant = () => {
        setProductDetails({
            ...productDetails,
            variants: [...productDetails.variants, { size: "", color: "", quantity: "", price: "", new_price: "" }]
        });
    };

    const removeVariant = (index) => {
        const updatedVariants = productDetails.variants.filter((_, i) => i !== index);
        setProductDetails({ ...productDetails, variants: updatedVariants });
    };

    const editProduct = async () => {
        if (!productDetails.category_id || !productDetails.name || !productDetails.title || !productDetails.description) {
            alert("Please fill in all required fields.");
            return;
        }

        const formData = new FormData();
        images.forEach((image) => formData.append('productImages', image));

        const uploadResponse = await fetch('http://localhost:4000/upload', {
            method: 'POST',
            body: formData,
        });
        const uploadData = await uploadResponse.json();

        if (uploadData.success) {
            const updatedProduct = {
                ...productDetails,
                images: uploadData.image_urls, 
            };

            await fetch(`http://localhost:4000/editproduct/${productDetails._id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(updatedProduct),
            }).then((resp) => resp.json())
              .then((data) => {
                  if (data.success) {
                      alert("Product updated successfully!");
                  } else {
                      alert("Failed to update product.");
                  }
              });
        } else {
            alert('Image upload failed. Please try again.');
        }
    };

    return (
        <div className="edit-product">
            {/* Product Details */}
            <div className="editproduct-itemfield">
                <p>Product Name</p>
                <input
                    value={productDetails.name}
                    onChange={changeHandler}
                    type="text"
                    name="name"
                    placeholder="Enter product name"
                />
            </div>
            <div className="editproduct-itemfield">
                <p>Product Title</p>
                <input
                    value={productDetails.title}
                    onChange={changeHandler}
                    type="text"
                    name="title"
                    placeholder="Enter product title"
                />
            </div>
            <div className="editproduct-itemfield">
                <p>Product Description</p>
                <input
                    value={productDetails.description}
                    onChange={changeHandler}
                    type="text"
                    name="description"
                    placeholder="Enter product description"
                />
            </div>
            <div className="editproduct-itemfield">
                <p>Product Category</p>
                <select
                    value={productDetails.category_id}
                    onChange={changeHandler}
                    name="category_id"
                >
                    <option value="" disabled>Select a category</option>
                    {categories.map((category) => (
                        <option key={category._id} value={category._id}>
                            {category.description}
                        </option>
                    ))}
                </select>
            </div>

            {/* Image Upload */}
            <div className="editproduct-itemfield">
                <p>Images</p>
                <label htmlFor="file-input">
                    <div className="image-preview-container">
                        {images.length > 0 ? (
                            images.map((img, index) => (
                                <img
                                    key={index}
                                    src={URL.createObjectURL(img)}
                                    alt={`Preview ${index + 1}`}
                                    className="editproduct-thumbnail-img"
                                />
                            ))
                        ) : (
                            <img src={upload_area} className="editproduct-thumbnail-img" alt="Upload area" />
                        )}
                    </div>
                </label>
                <input onChange={imageHandler} type="file" name="images" id="file-input" multiple />
            </div>

            {/* Product Variant Section */}
            <div className="variants-section">
                <h3>Product Variants</h3>
                {productDetails.variants.map((variant, index) => (
                    <div key={index} className="variant-item">
                        <div className="editproduct-itemfield">
                            <p>Size</p>
                            <input
                                value={variant.size}
                                onChange={(e) => variantChangeHandler(index, e)}
                                type="text"
                                name="size"
                                placeholder="Enter size"
                            />
                        </div>
                        <div className="editproduct-itemfield">
                            <p>Color</p>
                            <input
                                value={variant.color}
                                onChange={(e) => variantChangeHandler(index, e)}
                                type="text"
                                name="color"
                                placeholder="Enter color"
                            />
                        </div>
                        <div className="editproduct-itemfield">
                            <p>Quantity</p>
                            <input
                                value={variant.quantity}
                                onChange={(e) => variantChangeHandler(index, e)}
                                type="number"
                                name="quantity"
                                placeholder="Enter quantity"
                            />
                        </div>
                        <div className="editproduct-itemfield">
                            <p>Price</p>
                            <input
                                value={variant.price}
                                onChange={(e) => variantChangeHandler(index, e)}
                                type="number"
                                name="price"
                                placeholder="Enter price"
                            />
                        </div>
                        <div className="editproduct-itemfield">
                            <p>New Price</p>
                            <input
                                value={variant.new_price}
                                onChange={(e) => variantChangeHandler(index, e)}
                                type="number"
                                name="new_price"
                                placeholder="Enter new price"
                            />
                        </div>
                        <button onClick={() => removeVariant(index)} className="remove-variant-btn">
                            Remove Variant
                        </button>
                    </div>
                ))}
                <button onClick={addVariant} className="add-variant-btn">
                    Add Another Variant
                </button>
            </div>

            <button onClick={editProduct} className="editproduct-btn">
                Update Product
            </button>
        </div>
    );
};

export default EditProduct;
