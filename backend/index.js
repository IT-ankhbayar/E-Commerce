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
    color: {
        type: String,
        required: true,
    },
    quantity: {
        type: Number,
        required: true,
    },
    price: {
        type: Number,
        required: true,
    },
    new_price: {
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

const sub_category = mongoose.model('sub_categories', {
    _id: {
        type: Number,
        required: true,
    },
    name: { type: String, required: true },
    parent_id: { type: Array, ref: 'categories' }, // Adjust `ref` if it points to a different collection
    description: { type: String, required: true },
    created_at: { type: Date, default: Date.now },
    updated_at: { type: Date, default: Date.now },
});

// Add Product Endpoint with Manual _id Generation
app.post('/addproduct', async (req, res) => {
    try {
        // Manually setting the product ID
        const lastProduct = await Product.findOne().sort({ _id: -1 });
        const id = lastProduct ? lastProduct._id + 1 : 1;

        const product = new Product({
            _id: id,
            name: req.body.name,
            images: req.body.images,
            category_id: req.body.category_id, // This is now the category ID
            title: req.body.title,
            description: req.body.description,
            variants: [], // Empty array for variants
        });

        await product.save();

        // Handle Product Variants
        const variantPromises = [];
        if (req.body.variants && req.body.variants.length > 0) {
            for (let i = 0; i < req.body.variants.length; i++) {
                const variant = req.body.variants[i];
                const variantId = id * 1000 + (i + 1); // Generate unique variantId
                const productVariant = new ProductVariant({
                    _id: variantId,
                    product_id: product._id,
                    size: variant.size,
                    color: variant.color,
                    quantity: variant.quantity,
                    price: variant.price,
                    new_price: variant.new_price,
                });

                // Save the variant and store the promise for later use
                const saveVariantPromise = productVariant.save().then((savedVariant) => {
                    product.variants.push(savedVariant._id); // Push variant ID to product
                });

                variantPromises.push(saveVariantPromise);
            }
        }

        // Wait for all variants to be saved before updating the product
        await Promise.all(variantPromises);

        // Update the product with variant IDs
        await product.save();

        // Return the saved product with populated variant and category data
        const populatedProduct = await Product.findById(product._id)
            .populate('variants')  // Populate variants
            .populate('category_id'); // Populate category details using category_id

        res.json({
            success: true,
            product: populatedProduct, // Return the full populated product
        });

    } catch (error) {
        console.error("Error while adding product:", error);
        res.status(500).json({ success: false, error: error.message });
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


// Remove Product Endpoint
app.post('/removeproduct', async (req, res) => {
    try {
        // First delete the variants that belong to the product
        await ProductVariant.deleteMany({ product_id: req.body.id }); // Ensure product_id is correct here

        // Now delete the product
        await Product.findByIdAndDelete(req.body.id);

        console.log("Product and variants removed");
        res.json({
            success: true,
            name: req.body.name
        });
    } catch (error) {
        console.error("Error removing product and variants:", error);
        res.status(500).json({
            success: false,
            message: "Error removing product and variants"
        });
    }
});
// Get All Products Endpoint
app.get('/allproducts', async (req, res) => {
    try {
        const products = await Product.find({}).populate('variants').populate('category_id', 'name');// Populate the variants
        console.log("All Products Fetched");
        res.json(products);
    } catch (error) {
        console.error("Error fetching products:", error);
        res.status(500).json({ success: false, error: error.message });
    }
});


// User Model Schema
const Users = mongoose.model('Users', {
    name: {
        type: String,
    },
    email: {
        type: String,
        unique: true,
    },
    password: {
        type: String,
    },
    cartData: {
        type: Object,
    },
    date: {
        type: Date,
        default: Date.now,
    }
});

// User Registration Endpoint
app.post('/signup', async (req, res) => {
    let check = await Users.findOne({ email: req.body.email });
    if (check) {
        return res.status(400).json({ success: false, errors: "Existing user found with same email address" });
    }
    let cart = {};
    for (let i = 0; i < 300; i++) {
        cart[i] = 0;
    }
    const user = new Users({
        name: req.body.username,
        email: req.body.email,
        password: req.body.password,
        cartData: cart,
    });

    await user.save();

    const data = {
        user: {
            id: user.id
        }
    };

    const token = jwt.sign(data, 'secret_ecom');
    res.json({ success: true, token });
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
