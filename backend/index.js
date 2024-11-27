const port = 4000;
const express = require("express");
const app = express();
const mongoose = require("mongoose");
const jwt = require("jsonwebtoken");
const multer = require("multer");
const path = require("path");
const cors = require('cors');  // Import cors
const router = express.Router();


app.use(express.json());
app.use(cors());

// Database Connection with MongoDB
mongoose.connect("mongodb+srv://murun:Ih80946194@cluster0.rvrsj4q.mongodb.net/ecomm?retryWrites=true&w=majority&appName=Cluster0");

// API Creation
app.get("/", (req, res) => {
    res.send("Express App is Running");
});

app.use('/images', express.static('D:/projects/E-Commerce/backend/upload/images'));
app.use('/images', express.static(path.join(__dirname, 'upload', 'images')));
app.use(cors({
    origin: ['http://localhost:3000', 'http://localhost:5173'],  // Allow requests from both ports
    methods: ['GET', 'POST'],
    allowedHeaders: ['Content-Type', 'Authorization'],
}));

app.get('/product/:id', async (req, res) => {
    try {
        const productId = req.params.id;

        // Check if productId is valid
        if (!productId || productId === 'undefined') {
            return res.status(400).json({ success: false, error: "Invalid product ID" });
        }

        // Find product by ID and populate the variants
        const product = await Product.findById(productId).populate('variants');
        if (!product) {
            return res.status(404).json({ success: false, error: "Product not found" });
        }

        res.json(product);  // Returns both the product and its variants
    } catch (error) {
        console.error("Error fetching product:", error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// Image Storage Engine
const storage = multer.diskStorage({
    destination: './upload/images',
    filename: (req, file, cb) => {
        cb(null, `${file.fieldname}_${Date.now()}${path.extname(file.originalname)}`);
    }
});

const upload = multer({ storage: storage });

// Update `/upload` to handle multiple file uploads
app.post("/upload", upload.array('productImages', 10), (req, res) => {
    const imageUrls = req.files.map((file) => `http://localhost:${port}/images/${file.filename}`);
    res.json({
        success: 1,
        image_urls: imageUrls, // Return an array of image URLs
    });
});

// Schema for Creating Products

const sub_category = mongoose.model('sub_categories', {
    _id: {
        type: Number,
        required: true,
    },
    name: { type: String, required: true },
    parent_id: { type: Number, ref: 'categories',required:true }, // Adjust `ref` if it points to a different collection
    description: { type: String, required: true },
    created_at: { type: Date, default: Date.now },
    updated_at: { type: Date, default: Date.now },
});

const category = mongoose.model('categories', {
    _id: {
        type: Number,
        required: true,
    },
    name: { type: String, required: true },
    description: { type: String, required: true },
    created_at: { type: Date, default: Date.now },
    updated_at: { type: Date, default: Date.now },
});


const ProductVariant = mongoose.model("ProductVariant", {
    _id: {
        type: Number,
        required: true,
    },
    product_id: {
        type: Number,  
        required: true,
    },
    size: {
        type: String,
        required: true,
    },
    quantity: {
        type: Number,
        required: true,
    },
    created_at: {
        type: Date,
        default: Date.now,
    },
    updated_at: {
        type: Date,
        default: Date.now,
    },
});

const Product = mongoose.model("Product", {
    _id: {
        type: Number,
        required: true,
    },
    name: {
        type: String,
        required: true,
    },
    images: {
        type: [String],
        required: true,
    },
    category_id: {
        type: Number,
        ref: "sub_categories"
    },
    title: {
        type: String,
        required: true,
    },
    description: {
        type: String,
        required: true,
    },
    price: {
        type: Number,
        required: true,
    },
    new_price: {
        type: Number,
    },
    color: {
        type: String,
        required: true,
    },
    variants: {
        type: Array,
        ref: "ProductVariant"  // Reference to ProductVariant model
    },
    created_at: {
        type: Date,
        default: Date.now,
    },
    updated_at: {
        type: Date,
        default: Date.now,
    },
});

// Add Product Endpoint with Manual _id Generation
app.post('/addproduct', async (req, res) => {
    try {
        // Step 1: Manually assign a product ID (this could be based on the last product ID)
        const lastProduct = await Product.findOne().sort({ _id: -1 });
        const productId = lastProduct ? lastProduct._id + 1 : 1;  // Assign unique product ID

        // Step 2: Create the Product document
        const product = new Product({
            _id: productId,
            name: req.body.name,
            images: req.body.images,
            category_id: req.body.category_id,
            title: req.body.title,
            description: req.body.description,
            price: req.body.price,
            new_price: req.body.new_price,
            color: req.body.color,
            variants: []  // Initialize empty variants array
        });

        // Save the product document
        await product.save();

        // Step 3: Sort variants (if needed, based on size or other criteria)
        const sortedVariants = req.body.variants.sort((a, b) => a.size.localeCompare(b.size));

        // Step 4: Generate variant IDs sequentially and store them in a local array
        let variantIdCounter = productId * 1000;  // Start with a base number based on the product ID (e.g., 61001)

        const variantsWithIds = sortedVariants.map((variant, index) => {
            const variantId = variantIdCounter + (index + 1);  // Ensure sequential IDs (61001, 61002, etc.)

            // Assign ID to each variant before saving
            return {
                _id: variantId,
                product_id: product._id,
                size: variant.size,
                quantity: variant.quantity
            };
        });

        // Step 5: Save the variants with manually assigned IDs
        const savedVariants = await ProductVariant.insertMany(variantsWithIds);

        // Step 6: Add the saved variant IDs to the product document
        product.variants = savedVariants.map(variant => variant._id);

        // Step 7: Save the product with the variant IDs populated
        await product.save();

        // Step 8: Populate the product with its variants
        const populatedProduct = await Product.findById(product._id).populate('variants');

        // Send response back with the populated product
        res.json({ success: true, product: populatedProduct });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

app.put('/editproduct/:id', async (req, res) => {
    const { id } = req.params;
    const updatedProductData = req.body;
  
    try {
      // Fetch the existing product
      const product = await Product.findById(id);
  
      if (!product) {
        return res.status(404).json({ success: false, message: 'Product not found' });
      }
  
      // Update basic product details
      product.name = updatedProductData.name || product.name;
      product.images = updatedProductData.images || product.images;
      product.category_id = updatedProductData.category_id || product.category_id;
      product.title = updatedProductData.title || product.title;
      product.description = updatedProductData.description || product.description;
      product.price = updatedProductData.price || product.price;
      product.new_price = updatedProductData.new_price || product.new_price;
      product.color = updatedProductData.color || product.color;
  
      // Validate the variants
      const validVariants = updatedProductData.variants.filter(variant => variant && typeof variant === 'object');
      if (validVariants.length !== updatedProductData.variants.length) {
        console.log('Found invalid variants that were filtered out.');
      }
  
      // Generate variant IDs sequentially based on the product ID
      let variantIdCounter = product._id * 1000;  // Use product _id to start the ID counter (e.g., product _id = 26, first variant ID = 26001)
  
      // Prepare the variants with generated IDs
      const variantsWithIds = validVariants.map((variant, index) => {
        if (variant._id) {
          return {
            _id: variant._id,  // Keep existing _id
            product_id: product._id,
            size: variant.size,
            quantity: variant.quantity
          };
        } else {
          const variantId = variantIdCounter + (index + 1);  // Variant IDs will be like 26001, 26002, etc.
          return {
            _id: variantId,  // Assign new ID
            product_id: product._id,
            size: variant.size,
            quantity: variant.quantity
          };
        }
      });
  
      console.log('Variants with IDs:', variantsWithIds);
  
      // Save the variants and ensure no null variants
      const savedVariants = [];
      for (const variant of variantsWithIds) {
        try {
          let savedVariant;
          if (variant._id) {
            // Check if the variant exists
            const existingVariant = await ProductVariant.findById(variant._id);
            if (existingVariant) {
              // Update existing variant
              savedVariant = await ProductVariant.findByIdAndUpdate(variant._id, variant, { new: true });
              console.log('Updated variant:', savedVariant);
            } else {
              console.log(`Variant with _id ${variant._id} does not exist. Creating a new variant.`);
              // Create new variant if it doesn't exist
              savedVariant = await ProductVariant.create(variant);
              console.log('Created new variant:', savedVariant);
            }
          } else {
            // Create new variant if _id is not present
            savedVariant = await ProductVariant.create(variant);
            console.log('Created new variant:', savedVariant);
          }
  
          if (savedVariant && savedVariant._id) {
            savedVariants.push(savedVariant);
          } else {
            console.error('Failed to save variant:', variant);
          }
        } catch (error) {
          console.error('Error saving variant:', error.message || error);
          if (error.name === 'ValidationError') {
            console.error('Validation error:', error.errors);
          } else {
            console.error('Other error:', error);
          }
        }
      }
  
      // Ensure variants are valid
      if (savedVariants.length === 0) {
        return res.status(500).json({ success: false, message: 'No variants were successfully saved' });
      }
  
      // Populate product with valid variant IDs
      product.variants = savedVariants.map(variant => variant._id);
  
      // Save the updated product
      await product.save();
  
      res.status(200).json({ success: true, message: 'Product updated successfully', data: product });
    } catch (error) {
      console.error('Error updating product:', error);
      res.status(500).json({ success: false, message: error.message || 'Server error' });
    }
  });
  
  
app.get('/categories', async (req, res) => {
    try {
        const categories = await sub_category.find(); // Fetch all subcategories
        res.json({ success: true, categories });
    } catch (error) {
        console.error('Error fetching categories:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

app.get('/parent-categories', async (req, res) => {
    try {
        const categories = await category.find(); 
        res.json({ success: true, categories });
    } catch (error) {
        console.error('Error fetching categories:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});


// Remove Product Endpoint
app.post('/removeproduct', async (req, res) => {
    try {
        const { id, name } = req.body; // Destructure input for clarity
        
        if (!id) {
            return res.status(400).json({
                success: false,
                message: "Product ID is required",
            });
        }

        // Delete associated product variants
        await ProductVariant.deleteMany({ product_id: id });

        // Delete the product itself
        await Product.findByIdAndDelete(id);

        console.log("Product and variants removed:", { id, name });
        res.json({
            success: true,
            name,
        });
    } catch (error) {
        console.error("Error removing product and variants:", error);
        res.status(500).json({
            success: false,
            message: "Error removing product and variants",
        });
    }
});


// Get All Products Endpoint
app.get('/allproducts', async (req, res) => {
    try {
        // Fetch all products and populate category_id
        const products = await Product.find({}).populate('category_id', 'name'); 
        
        

        // Ensure that variants are valid numbers
        const validVariants = products.flatMap(product => 
            product.variants.filter(variantId => typeof variantId === 'number')
        );

        // Fetch only valid product variants
        const productVariants = await ProductVariant.find({ _id: { $in: validVariants } });

        // Map the variants back to each product
        const enrichedProducts = products.map(product => ({
            ...product.toObject(),
            variants: product.variants.map(variantId =>
                productVariants.find(variant => variant._id === variantId)
            )
        }));

        
        res.json(enrichedProducts);
    } catch (error) {
        console.error("Error fetching products:", error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// User Model Schema
const Users = mongoose.model('Users', {

    email: {
        type: String,
        unique: true,
    },
    phone: {
        type: String,
    },
    first_name: {
        type: String,
    },
    last_name: {
        type: String,
    },
    avatar_id: {
        type: String,
    },
    password: {
        type: String,
    },
    cartData: {
        type: Object,
    },
    created_at: {
        type: Date,
        default: Date.now,
    },
    updated_at: {
        type: Date,
        default: Date.now,
    },
});

// User Registration Endpoint
app.post('/signup', async (req, res) => {
    let check = await Users.findOne({ email: req.body.email });
    if (check) {
        return res.status(400).json({ success: false, errors: "Existing user found with the same email address" });
    }

    const user = new Users({
        email: req.body.email,
        phone: req.body.phone,
        first_name: req.body.first_name,
        last_name: req.body.last_name,
        avatar_id: req.body.avatar_id,
        password: req.body.password,
        cartData: {},
        created_at: new Date(),
        updated_at: new Date(),
    });

    try {
        await user.save();
        const data = {
            user: {
                id: user.id
            }
        };

        const token = jwt.sign(data, 'secret_ecom');
        res.json({ success: true, token });
    } catch (err) {
        res.status(500).json({ success: false, errors: err.message });
    }
});

// User Login Endpoint
app.post('/login', async (req, res) => {
    let user = await Users.findOne({ email: req.body.email });
    if (user) {
        const passCompare = req.body.password === user.password;
        if (passCompare) {
            const data = {
                user: {
                    id: user.id
                }
            };
            const token = jwt.sign(data, 'secret_ecom');
            res.json({ success: true, token });
        } else {
            res.json({ success: false, errors: "Wrong Password" });
        }
    } else {
        res.json({ success: false, errors: "Wrong Email Id" });
    }
});

// New Collections Endpoint
app.get('/newcollections', async (req, res) => {
    let products = await Product.find({});
    let newcollection = products.slice(0).slice(-8);
    console.log("NewCollection Fetched");
    res.send(newcollection);
});

// Middleware to Fetch User
const fetchUser = async (req, res, next) => {
    const token = req.header('auth-token');
    if (!token) {
        res.status(401).send({ errors: "Please authenticate using valid token" });
    } else {
        try {
            const data = jwt.verify(token, 'secret_ecom');
            req.user = data.user;
            next();
        } catch (error) {
            res.status(401).send({ errors: "Please authenticate using a valid token" });
        }
    }
};

// Add to Cart Endpoint
app.post('/addtocart', fetchUser, async (req, res) => {
    let userData = await Users.findOne({ _id: req.user.id });
    userData.cartData[req.body.itemId] += 1;
    await Users.findOneAndUpdate({ _id: req.user.id }, { cartData: userData.cartData });
    res.send("Added");
});

app.listen(port, (error) => {
    if (!error) {
        console.log("Server Running on Port " + port);
    } else {
        console.log("Error: " + error);
    }
});

app.post('/addcategory', async (req, res) => {
    try {
        const { name, parentCategoryId, description } = req.body;

        // Check if category name is provided
        if (!name) {
            return res.status(400).json({ success: false, message: "Category name is required" });
        }

        // Manually create an ID based on the last inserted category
        const lastCategory = await sub_category.findOne().sort({ _id: -1 });
        const newCategoryId = lastCategory ? lastCategory._id + 1 : 1; // Generate the new ID

        // Create the new category
        const newCategory = new sub_category({
            _id: newCategoryId,
            parent_id: parentCategoryId,  // Use the manually generated ID
            name,  // Set parent_id (null if not provided)
            description,
            created_at: new Date(),
            updated_at: new Date(),
        });

        // Save the category
        await newCategory.save();

        // Respond with the new category
        res.status(201).json({ success: true, category: newCategory });
    } catch (error) {
        console.error("Error adding category:", error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// Edit Category Endpoint
app.put('/categories/:id', async (req, res) => {
    try {
        const categoryId = req.params.id;
        const { name, parentCategoryId, description } = req.body;

        // Find category by ID
        const category = await sub_category.findById(categoryId);
        if (!category) {
            return res.status(404).json({ success: false, message: "Category not found" });
        }

        // Update category details
        category.name = name || category.name;
        category.parent_id = parentCategoryId;
        category.description = description || category.description;
        category.updated_at = new Date();

        // Save the updated category
        await category.save();

        res.status(200).json({ success: true, category });
    } catch (error) {
        console.error("Error updating category:", error);
        res.status(500).json({ success: false, error: error.message });
    }
});
// Delete Category Endpoint
app.delete('/categories/:id', async (req, res) => {
    try {
        const categoryId = req.params.id;

        // Find and delete the category
        const category = await sub_category.findById(categoryId);
        if (!category) {
            return res.status(404).json({ success: false, message: "Category not found" });
        }

        // Delete the category
        await sub_category.findByIdAndDelete(categoryId);

        res.status(200).json({ success: true, message: "Category deleted successfully" });
    } catch (error) {
        console.error("Error deleting category:", error);
        res.status(500).json({ success: false, error: error.message });
    }
});
