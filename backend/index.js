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
    parent_id: { type: Array, ref: 'categories' }, // Adjust `ref` if it points to a different collection
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
    color: {
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
                color: variant.color,
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
    const variantPromises = req.body.variants.map((variant, i) => {
        if (!variant.size || !variant.color || variant.quantity === undefined) {
            throw new Error(`Variant ${i + 1} is missing size, color, or quantity`);
        }
        
        const variantId = product._id * 1000 + (i + 1);
        const productVariant = new ProductVariant({
            _id: variantId,
            product_id: product._id,
            size: variant.size,
            color: variant.color,
            quantity: variant.quantity,
        });
    
        return productVariant.save().then((savedVariant) => {
            product.variants.push(savedVariant._id);
        });
    });
    req.body.variants.forEach((variant, index) => {
        if (!variant.size || !variant.color || typeof variant.quantity !== "number") {
            console.error(`Variant ${index + 1} is invalid:`, variant);
            throw new Error(`Variant ${index + 1} is missing required fields.`);
        }
    });
    await Promise.all(variantPromises);
});

app.put('/editproduct/:id', async (req, res) => {
    const { id } = req.params;
    const updatedProduct = req.body; 
    try {
        await Product.findByIdAndUpdate(id, updatedProduct);
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
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

