import React, { useState, useEffect } from 'react';
import './AddProduct.css';
import upload_area from '../../assets/upload_area.svg';
import { sizes } from './Size';

const AddProduct = () => {
    const [categories, setCategories] = useState([]);
    const [images, setImages] = useState([]);
    const [productDetails, setProductDetails] = useState({
        name: "",
        title: "",
        description: "",
        category_id: "",
        price: "",
        new_price: "",
        color: "",
        images: [],
        created_at: "",
        updated_at: "",
        variants: [
            {
                sizes: sizes.map((size) => ({
                    size_id: size.id,
                    quantity: 0,
                })),
            },
        ],
    });

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
        fetchCategories();
    }, []);

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

    const sizeQuantityHandler = (variantIndex, sizeId, quantity) => {
        const updatedVariants = [...productDetails.variants];
        const sizeIndex = updatedVariants[variantIndex].sizes.findIndex(
            (size) => size.size_id === sizeId
        );
        if (sizeIndex !== -1) {
            updatedVariants[variantIndex].sizes[sizeIndex].quantity = parseInt(quantity, 10);
        }
        setProductDetails({ ...productDetails, variants: updatedVariants });
    };


    const Add_Product = async () => {
        const formattedVariants = productDetails.variants.flatMap((variant) =>
            variant.sizes
                .filter((size) => size.quantity > 0) // Exclude sizes with zero quantity
                .map((size) => ({
                    size: sizes.find((s) => s.id === size.size_id)?.name, // Map size_id to name
                    quantity: size.quantity, // Ensure quantity is included
                }))
        );

        const newProduct = {
            ...productDetails,
            variants: formattedVariants,
            images: [], // Add uploaded images as needed
        };

        const formData = new FormData();
        images.forEach((image) => formData.append('productImages', image));

        const uploadResponse = await fetch('http://localhost:4000/upload', {
            method: 'POST',
            body: formData,
        });
        const uploadData = await uploadResponse.json();

        if (uploadData.success) {
            newProduct.images = uploadData.image_urls;

            const response = await fetch('http://localhost:4000/addproduct', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(newProduct),
            });

            const data = await response.json();
            if (data.success) {
                alert("Product added successfully!");
                window.location.reload(); 
            } else {
                alert("Failed to add product.");
            }
        } else {
            alert('Image upload failed. Please try again.');
        }
    };

  
    return (
        <div className="add-product">
            {/* Product Details */}
            <div className="addproduct-itemfield">
                <p>Бүтээгдэхүүний нэр</p>
                <input
                    value={productDetails.name}
                    onChange={changeHandler}
                    type="text"
                    name="name"
                    placeholder="Бүтээгдэхүүний нэрийг оруулна уу"
                />
            </div>
            <div className="addproduct-itemfield">
                <p>Бүтээгдэхүүний гарчиг</p>
                <input
                    value={productDetails.title}
                    onChange={changeHandler}
                    type="text"
                    name="title"
                    placeholder="Бүтээгдэхүүний гарчигийг оруулна уу"
                />
            </div>
            <div className="addproduct-itemfield">
                <p>Бүтээгдэхүүний Тайлбар</p>
                <input
                    value={productDetails.description}
                    onChange={changeHandler}
                    type="text"
                    name="description"
                    placeholder="Бүтээгдэхүүний Тайлбарийг оруул"
                />
            </div>
            <div className="addproduct-itemfield">
            <p>Бүтээгдэхүүний Каталоги</p>
                <select
                    value={productDetails.category_id}  // Ensures the correct category is selected
                    onChange={changeHandler}            // Calls changeHandler on change
                    name="category_id"                 // Ensures the correct field is updated in state
                >
                    <option value="" disabled>Каталоги сонгоно уу</option>
                    {categories.map((category) => (
                        <option key={category._id} value={category._id}>
                            {category.description}  {/* Displays the description but saves only the category_id */}
                        </option>
                    ))}
                </select>
            </div>
            <div className="addproduct-itemfield">
                <p>Үнэ</p>
                <input
                    value={productDetails.price}
                    onChange={changeHandler}
                    type="number"
                    name="price"
                    placeholder="Үнийн мэдээллийг оруулна уу"
                />
            </div>
            <div className="addproduct-itemfield">
                <p>Шинэ үнэ</p>
                <input
                    value={productDetails.new_price}
                    onChange={changeHandler}
                    type="number"
                    name="new_price"
                    placeholder="Шинэ үнийг оруулна уу"
                />
            </div>
            <div className="addproduct-itemfield">
                            <p>Color</p>
                            <input
                                value={productDetails.color}
                                onChange={changeHandler}
                                type="text"
                                name="color"
                                placeholder="Enter color"
                            />
                        </div>
            {/* Image Upload */}
            <div className="addproduct-itemfield">
                <p>Зураг оруулах</p>
                <label htmlFor="file-input">
                    <div className="image-preview-container">
                        {images.length > 0 ? (
                            images.map((img, index) => (
                                <img
                                    key={index}
                                    src={URL.createObjectURL(img)}
                                    alt={`Preview ${index + 1}`}
                                    className="addproduct-thumbnail-img"
                                />
                            ))
                        ) : (
                            <img src={upload_area} className="addproduct-thumbnail-img" alt="Upload area" />
                        )}
                    </div>
                </label>
                <input onChange={imageHandler} type="file" name="images" id="file-input" multiple />
            </div>

            {/* Product Variant Section */}
            <div className="variants-section">
                <h3>Variants</h3>
                {productDetails.variants.map((variant, variantIndex) => (
                    <div key={variantIndex} className="variant-item">
                        <div className="addproduct-itemfield">
                            <h3>Sizes and Quantities for Variant</h3>
                            {variant.sizes.map((size) => (
                                <div key={size.size_id} className="size-quantity-field">
                                    <span>{sizes.find((s) => s.id === size.size_id).name}</span>
                                    <input
                                        type="number"
                                        min="0"
                                        value={size.quantity}
                                        placeholder="Enter quantity"
                                        onChange={(e) =>
                                            sizeQuantityHandler(variantIndex, size.size_id, e.target.value)
                                        }
                                    />
                                </div>
                            ))}
                        </div>
                    </div>
                ))}
            </div>
            <button onClick={Add_Product} className="addproduct-btn">
                ADD
            </button>
        </div>
    );
};

export default AddProduct;