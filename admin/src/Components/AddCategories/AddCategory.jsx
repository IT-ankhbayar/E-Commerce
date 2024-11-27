import React, { useState, useEffect } from 'react';
import './AddCategory.css';

const CategoryCRUD = () => {
    const [categories, setCategories] = useState([]);
    const [parentCategories, setParentCategories] = useState([]);
    const [newCategory, setNewCategory] = useState({
        name: "",
        description: "",
        parentCategoryId: "", // Added parentCategoryId
    });
    const [editCategory, setEditCategory] = useState(null);
    const [loading, setLoading] = useState(false);

    // Fetch categories and parent categories
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

        const fetchParentCategories = async () => {
            try {
                const response = await fetch('http://localhost:4000/parent-categories');
                const data = await response.json();
                if (data.success) {
                    setParentCategories(data.categories);
                }
            } catch (error) {
                console.error('Error fetching parent categories:', error);
            }
        };

        fetchCategories();
        fetchParentCategories();
    }, []);

    // Handle input change for new or edited categories
    const handleInputChange = (e) => {
        const { name, value } = e.target;
        if (editCategory) {
            setEditCategory({ ...editCategory, [name]: value });
        } else {
            setNewCategory({ ...newCategory, [name]: value });
        }
    };

    // Add new category
    const addCategory = async () => {
        if (!newCategory.name || !newCategory.description || !newCategory.parentCategoryId) {
            alert('Please fill in all fields, including the parent category');
            return;
        }

        setLoading(true);
        try {
            const response = await fetch('http://localhost:4000/addcategory', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(newCategory),
            });
            const data = await response.json();
            if (data.success) {
                setCategories([...categories, data.category]);
                setNewCategory({ name: "", description: "", parentCategoryId: "" });
                alert('Category added successfully');
            } else {
                alert('Failed to add category');
            }
        } catch (error) {
            alert('Error adding category');
        } finally {
            setLoading(false);
        }
    };

    // Edit category
    const editCategoryHandler = (category) => {
        setEditCategory({
            ...category,
            parentCategoryId: category.parent__id,
        });
    };

    // Update edited category
    const updateCategory = async () => {
        if (!editCategory.name || !editCategory.description) {
            alert('Please fill in both fields');
            return;
        }

        setLoading(true);
        try {
            const response = await fetch(`http://localhost:4000/categories/${editCategory._id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(editCategory),
            });
            const data = await response.json();
            if (data.success) {
                const updatedCategories = categories.map((category) =>
                    category._id === editCategory._id ? data.category : category
                );
                setCategories(updatedCategories);
                setEditCategory(null); // Reset editCategory
                alert('Category updated successfully');
            } else {
                alert('Failed to update category');
            }
        } catch (error) {
            alert('Error updating category');
        } finally {
            setLoading(false);
        }
    };

    // Delete category
    const deleteCategory = async (id) => {
        const confirmDelete = window.confirm('Are you sure you want to delete this category?');
        if (!confirmDelete) return;

        setLoading(true);
        try {
            const response = await fetch(`http://localhost:4000/categories/${id}`, {
                method: 'DELETE',
            });
            const data = await response.json();
            if (data.success) {
                setCategories(categories.filter((category) => category._id !== id));
                alert('Category deleted successfully');
            } else {
                alert('Failed to delete category');
            }
        } catch (error) {
            alert('Error deleting category');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="category-crud">
            <h2>Category CRUD</h2>

            {/* Add/Edit Category Form */}
            <div className="category-form">
                <h3>{editCategory ? 'Edit Category' : 'Add Category'}</h3>
                <input
                    type="text"
                    name="name"
                    value={editCategory ? editCategory.name : newCategory.name}
                    onChange={handleInputChange}
                    placeholder="Category Name"
                />
                <input
                    type="text"
                    name="description"
                    value={editCategory ? editCategory.description : newCategory.description}
                    onChange={handleInputChange}
                    placeholder="Category Description"
                />

                {/* Parent Category Dropdown */}
                <select
                    name="parentCategoryId"
                    value={editCategory ? editCategory.parentCategoryId : newCategory.parentCategoryId}
                    onChange={handleInputChange}
                >
                    <option value="">Дэд Каталоги сонгох</option>
                    {parentCategories.map((category) => (
                        <option key={category._id} value={category._id}>
                            {category.name}
                        </option>
                    ))}
                </select>

                <button
                    onClick={() => {
                        if (editCategory) {
                            console.log('Updating category...');
                            updateCategory();
                        } else {
                            console.log('Adding category...');
                            addCategory();
                        }
                    }}
                    disabled={loading || (!editCategory && (!newCategory.name || !newCategory.description))}
                >
                    {loading ? 'Submitting...' : editCategory ? 'Update Category' : 'Add Category'}
                </button>

                {/* Cancel Edit Button */}
                {editCategory && (
                    <button onClick={() => setEditCategory(null)}>Cancel Edit</button>
                )}
            </div>

            {/* Category List */}
            <div className="category-list">
                <h3>Categories</h3>
                <table>
                    <thead>
                        <tr>
                            <th>Name</th>
                            <th>Description</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {categories.map((category) => (
                            <tr key={category._id}>
                                <td>{category.name}</td>
                                <td>{category.description}</td>
                                <td>
                                    <button onClick={() => editCategoryHandler(category)}>Edit</button>
                                    <button onClick={() => deleteCategory(category._id)}>Delete</button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default CategoryCRUD;
