import Product from "../models/product.model.js";
import redisClient from "../lib/redis.js";
import cloudinary from "../lib/cloudinary.js";

export const getAllProducts = async (req, res) => {
    try {
        const products = await Product.find({});
        res.json({ products });
    } catch (error) {
        console.error(`Error fetching products: ${error.message}`);
        res.status(500).json({ message: "Server error", error: error.message });
    }
};

export const getFeaturedProducts = async (req, res) => {
    try {
        let featuredProducts = await redisClient.get("featured_products");

        if (featuredProducts) {
            console.log("Serving featured products from cache");
            return res.json({ featuredProducts: JSON.parse(featuredProducts) });
        }

        // If not in cache, fetch from database
        // .lean() is used to get plain JavaScript objects instead of Mongoose documents, which can improve performance
        featuredProducts = await Product.find({ isFeatured: true }).lean();

        if (!featuredProducts) {
            return res
                .status(404)
                .json({ message: "No featured products found" });
        }

        // Cache the featured products in Redis for future requests
        await redisClient.set("featured_products");
        res.json({ featuredProducts });
    } catch (error) {
        console.error(`Error fetching featured products: ${error.message}`);
        res.status(500).json({ message: "Server error", error: error.message });
    }
};

export const createProduct = async (req, res) => {
    try {
        const { name, description, price, image, category } = req.body;

        let cloudinaryResponse = null;

        if (image) {
            cloudinaryResponse = await cloudinary.uploader.upload(image, {
                folder: "products",
            });
        }

        const product = await Product.create({
            name,
            description,
            price,
            image: cloudinaryResponse?.secure_url
                ? cloudinaryResponse.secure_url
                : null,
            category,
        });

        res.status(201).json(product);
    } catch (error) {
        console.error(`Error creating product: ${error.message}`);
        res.status(500).json({ message: "Server error", error: error.message });
    }
};

export const deleteProduct = async (req, res) => {
    try {
        const product = await Product.findById(req.params.id);

        if (!product) {
            return res.status(404).json({ message: "Product not found" });
        }

        if (product.image) {
            const publicId = product.image.split("/").pop().split(".")[0]; // Extract public ID from URL
            try {
                await cloudinary.uploader.destroy(`products/${publicId}`);
                console.log(`Deleted image from Cloudinary: ${publicId}`);
            } catch (error) {
                console.error(
                    `Error deleting image from Cloudinary: ${error.message}`,
                );
            }
        }

        await product.findByIdAndDelete(req.params.id);

        res.json({ message: "Product deleted successfully" });
    } catch (error) {
        console.error(`Error deleting product: ${error.message}`);
        res.status(500).json({ message: "Server error", error: error.message });
    }
};

export const getRecommendedProducts = async (req, res) => {
    try {
        const recommendedProducts = await Product.aggregate([
            { $sample: { size: 3 } }, // Randomly select 3 recommended products
            {
                $project: {
                    _id: 1,
                    name: 1,
                    description: 1,
                    price: 1,
                    image: 1,
                },
            },
        ]);
        res.json(recommendedProducts);
    } catch (error) {
        console.error(`Error fetching recommended products: ${error.message}`);
        res.status(500).json({ message: "Server error", error: error.message });
    }
};

export const getProductsByCategory = async (req, res) => {
    const { category } = req.params;
    try {
        const products = await Product.find({ category });
        res.json(products);
    } catch (error) {
        console.error(`Error fetching products by category: ${error.message}`);
        res.status(500).json({ message: "Server error", error: error.message });
    }
};

async function updateFeaturedProductsCache() {
    try {
        // The lean() method is used to get plain JavaScript objects instead of Mongoose documents, which can improve performance when we don't need the full functionality of Mongoose documents
        const featuredProducts = await Product.find({
            isFeatured: true,
        }).lean();

        await redisClient.set(
            "featured_products",
            JSON.stringify(featuredProducts),
        );
    } catch (error) {
        console.error(
            `Error updating featured products cache: ${error.message}`,
        );
    }
}

export const toggleFeaturedProducts = async (req, res) => {
    try {
        const product = await Product.findById(req.params.id);
        if (product) {
            product.isFeatured = !product.isFeatured;
            await product.save();
            await updateFeaturedProductsCache(); // Update the cache after toggling
            res.json(product);
        } else {
            res.status(404).json({ message: "Product not found" });
        }
    } catch (error) {
        console.error(`Error toggling featured status: ${error.message}`);
        res.status(500).json({ message: "Server error", error: error.message });
    }
};
