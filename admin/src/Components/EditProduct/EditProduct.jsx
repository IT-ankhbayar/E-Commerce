import React, { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { sizes } from "../AddProduct/Size";
import "./EditProduct.css";

const EditProduct = () => {
  const { id } = useParams();
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
    variants: Array(sizes.length).fill({
      size: "", // No need to display a field for each size for each variant
      quantity: 0,
    }),
  });

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const response = await fetch("http://localhost:4000/categories");
        const data = await response.json();
        if (data.success) {
          setCategories(data.categories);
        }
      } catch (error) {
        console.error("Error fetching categories:", error);
      }
    };

    const fetchProductDetails = async () => {
      try {
        const response = await fetch(`http://localhost:4000/product/${id}`);
        const data = await response.json();

        if (data && data._id) {
          const product = data;

          // Map fetched variants to the format we need (size and quantity)
          const variantData = sizes.map((size) => {
            const variant = product.variants.find(
              (v) => v.size === size.name
            );
            return {
              size: size.name,
              quantity: variant ? variant.quantity : 0,
              _id: variant ? variant._id : undefined, // Ensure _id is included
            };
          });

          setProductDetails({
            name: product.name || "",
            title: product.title || "",
            description: product.description || "",
            category_id: product.category_id || "",
            price: product.price || "",
            new_price: product.new_price || "",
            color: product.color || "",
            images: product.images || [],
            variants: variantData,
          });

          setImages(product.images.map((url) => ({ url })));
        }
      } catch (error) {
        console.error("Failed to fetch product details:", error);
      }
    };

    fetchCategories();
    fetchProductDetails();
  }, [id]);

  const imageHandler = (e) => {
    const newImages = Array.from(e.target.files).map((file) => ({ file }));
    setImages([...images, ...newImages]);
  };

  const changeHandler = (e) => {
    const { name, value } = e.target;
    setProductDetails((prevDetails) => ({
      ...prevDetails,
      [name]: value,
    }));
  };

  const sizeQuantityHandler = (sizeId, quantity) => {
    const updatedVariants = [...productDetails.variants];
    const sizeIndex = updatedVariants.findIndex(
      (variant) => variant.size === sizeId
    );
    if (sizeIndex !== -1) {
      updatedVariants[sizeIndex].quantity = parseInt(quantity, 10);
    }
    setProductDetails({ ...productDetails, variants: updatedVariants });
  };

  const editProduct = async () => {
    if (!productDetails.category_id || !productDetails.name || !productDetails.title || !productDetails.description) {
      alert("Please fill in all required fields.");
      return;
    }
  
    // Format the variants properly: Only send variants with quantity > 0 or existing ones with _id
    const formattedVariants = productDetails.variants.filter(variant => variant.quantity > 0 || variant._id).map(variant => {
      if (variant._id) {
        return {
          _id: variant._id,  // Keep _id for existing variants
          size: variant.size,
          quantity: variant.quantity,
        };
      } else {
        return {
          size: variant.size,
          quantity: variant.quantity,
        };  // New variant will not have _id
      }
    });
  
    const updatedProduct = {
      ...productDetails,
      variants: formattedVariants,
      images: [], // Images will be handled separately
    };
  
    const formData = new FormData();
    images.forEach((image) => {
      if (image.file) formData.append("productImages", image.file);
    });
  
    const uploadResponse = await fetch("http://localhost:4000/upload", {
      method: "POST",
      body: formData,
    });
  
    const uploadData = await uploadResponse.json();
  
    if (uploadData.success) {
      updatedProduct.images = uploadData.image_urls;
  
      await fetch(`http://localhost:4000/editproduct/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updatedProduct),
      })
        .then((resp) => resp.json())
        .then((data) => {
          if (data.success) {
            alert("Product updated successfully!");
          } else {
            alert("Failed to update product.");
          }
        });
    } else {
      alert("Image upload failed. Please try again.");
    }
  };

  return (
    <div className="edit-product">
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
        <p>Category</p>
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
      <div className="editproduct-itemfield">
        <p>Product Color</p>
        <input
          value={productDetails.color}
          onChange={changeHandler}
          type="text"
          name="color"
          placeholder="Enter product color"
        />
      </div>
      <div className="editproduct-itemfield">
        <p>Images</p>
        <label htmlFor="file-input">
          <div className="image-preview-container">
            {images.map((img, index) => (
              <img
                key={index}
                src={img.url || URL.createObjectURL(img.file)}
                alt={`Preview ${index + 1}`}
                className="editproduct-thumbnail-img"
              />
            ))}
          </div>
        </label>
        <input onChange={imageHandler} type="file" name="images" id="file-input" multiple />
      </div>
      <div className="variants-section">
        <h3>Product Variants</h3>
        <div className="size-quantity-fields">
          {sizes.map((size) => (
            <div key={size.id} className="size-quantity-field">
              <span>{size.name}</span>
              <input
                type="number"
                value={productDetails.variants.find((variant) => variant.size === size.name)?.quantity || 0}
                onChange={(e) => sizeQuantityHandler(size.name, e.target.value)}
              />
            </div>
          ))}
        </div>
      </div>
      <button onClick={editProduct} className="submit-edit-btn">
        Save Changes
      </button>
    </div>
  );
};

export default EditProduct;
