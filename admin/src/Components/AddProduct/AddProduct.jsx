import React, { useState, useEffect } from 'react';
import './AddProduct.css';
import upload_area from '../../assets/upload_area.svg';

const AddProduct = () => {
    const [categories, setCategories] = useState([]); // Store categories
    const [images, setImages] = useState([]);
    const [productDetails, setProductDetails] = useState({
        name: "",
        title: "",
        description: "",
        category_id: Number, 
        images: [],
        created_at: "",
        updated_at: "",
        variants: [{
            size: "",
            color: "",
            quantity: "",
            price: "",
            new_price: "",
        }],
    });
    
    // Fetch categories from the database
    useEffect(() => {
        const fetchCategories = async () => {
            try {
                const response = await fetch('http://localhost:4000/categories');
                const data = await response.json();
                if (data.success) {
                    setCategories(data.categories); // Update state with fetched categories
                }
            } catch (error) {
                console.error('Error fetching categories:', error);
            }
        };

        fetchCategories();
    }, []);

    const imageHandler = (e) => {
        setImages([...images, ...e.target.files]); // Allow adding multiple files
    };

    // const changeHandler = (e) => {
    //     setProductDetails({ ...productDetails, [e.target.name]: e.target.value });
    // };
    const changeHandler = (e) => {
        const { name, value } = e.target;
    
        setProductDetails((prevDetails) => ({
            ...prevDetails,
            [name]: value, // Only update the corresponding field
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

    const Add_Product = async () => {
        if (!productDetails.category_id || !productDetails.name || !productDetails.title || !productDetails.description) {
            alert("Please fill in all required fields.");
            return;
        }
    
        const formData = new FormData();
        images.forEach((image) => formData.append('productImages', image)); // Append all images
    
        const uploadResponse = await fetch('http://localhost:4000/upload', {
            method: 'POST',
            body: formData,
        });
        const uploadData = await uploadResponse.json();
    
        if (uploadData.success) {
            const newProduct = {
                ...productDetails,
                images: uploadData.image_urls, // Set image URLs from the upload response
            };
    
            await fetch('http://localhost:4000/addproduct', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(newProduct),
            }).then((resp) => resp.json())
              .then((data) => {
                  if (data.success) {
                      alert("Product added successfully!");
                  } else {
                      alert("Failed to add product.");
                  }
              });
        } else {
            alert('Image upload failed. Please try again.');
        }
    };    

    return (
        <div className="add-product">
            {/* Product Details */}
            <div className="addproduct-itemfield">
                <p>Product Name</p>
                <input
                    value={productDetails.name}
                    onChange={changeHandler}
                    type="text"
                    name="name"
                    placeholder="Enter product name"
                />
            </div>
            <div className="addproduct-itemfield">
                <p>Product Title</p>
                <input
                    value={productDetails.title}
                    onChange={changeHandler}
                    type="text"
                    name="title"
                    placeholder="Enter product title"
                />
            </div>
            <div className="addproduct-itemfield">
                <p>Product Description</p>
                <input
                    value={productDetails.description}
                    onChange={changeHandler}
                    type="text"
                    name="description"
                    placeholder="Enter product description"
                />
            </div>
            <div className="addproduct-itemfield">
    <p>Product Category</p>
    <select
        value={productDetails.category_id}  // Ensures the correct category is selected
        onChange={changeHandler}            // Calls changeHandler on change
        name="category_id"                 // Ensures the correct field is updated in state
    >
        <option value="" disabled>Select a category</option>
        {categories.map((category) => (
            <option key={category._id} value={category._id}>
                {category.description}  {/* Displays the description but saves only the category_id */}
            </option>
        ))}
    </select>
</div>

            {/* Image Upload */}
            <div className="addproduct-itemfield">
                <p>Images</p>
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
                <h3>Product Variants</h3>
                {productDetails.variants.map((variant, index) => (
                    <div key={index} className="variant-item">
                        <div className="addproduct-itemfield">
                            <p>Size</p>
                            <input
                                value={variant.size}
                                onChange={(e) => variantChangeHandler(index, e)}
                                type="text"
                                name="size"
                                placeholder="Enter size"
                            />
                        </div>
                        <div className="addproduct-itemfield">
                            <p>Color</p>
                            <input
                                value={variant.color}
                                onChange={(e) => variantChangeHandler(index, e)}
                                type="text"
                                name="color"
                                placeholder="Enter color"
                            />
                        </div>
                        <div className="addproduct-itemfield">
                            <p>Quantity</p>
                            <input
                                value={variant.quantity}
                                onChange={(e) => variantChangeHandler(index, e)}
                                type="number"
                                name="quantity"
                                placeholder="Enter quantity"
                            />
                        </div>
                        <div className="addproduct-itemfield">
                            <p>Price</p>
                            <input
                                value={variant.price}
                                onChange={(e) => variantChangeHandler(index, e)}
                                type="number"
                                name="price"
                                placeholder="Enter price"
                            />
                        </div>
                        <div className="addproduct-itemfield">
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

            <button onClick={Add_Product} className="addproduct-btn">
                ADD
            </button>
        </div>
    );
};

export default AddProduct;
