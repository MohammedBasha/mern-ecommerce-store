import {
    getAllProducts,
    getFeaturedProducts,
    createProduct,
    deleteProduct,
    getRecommendedProducts,
    getProductsByCategory,
    toggleFeaturedProducts,
} from "../../controllers/product.controller.js";

import Product from "../../models/product.model.js";
import redisClient from "../../lib/redis.js";
import cloudinary from "../../lib/cloudinary.js";

jest.mock("../../models/product.model.js");

jest.mock("../../lib/redis.js", () => ({
    __esModule: true,
    default: {
        get: jest.fn(),
        set: jest.fn(),
        del: jest.fn(),
    },
}));

jest.mock("../../lib/cloudinary.js", () => ({
    __esModule: true,
    default: {
        uploader: {
            upload: jest.fn(),
            destroy: jest.fn(),
        },
    },
}));

const mockRequest = (body = {}, params = {}) => ({
    body,
    params,
});

const mockResponse = () => {
    const res = {};

    res.status = jest.fn().mockReturnValue(res);
    res.json = jest.fn().mockReturnValue(res);

    return res;
};

describe("Product Controller", () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    // GET ALL PRODUCTS

    test("should return all products", async () => {
        const req = mockRequest();

        const res = mockResponse();

        const products = [
            {
                _id: "1",
                name: "Laptop",
            },
        ];

        Product.find.mockResolvedValue(products);

        await getAllProducts(req, res);

        expect(Product.find).toHaveBeenCalledWith({});

        expect(res.json).toHaveBeenCalledWith({
            products,
        });
    });

    test("should return 500 if getAllProducts fails", async () => {
        const req = mockRequest();

        const res = mockResponse();

        Product.find.mockRejectedValue(new Error("DB Error"));

        await getAllProducts(req, res);

        expect(res.status).toHaveBeenCalledWith(500);
    });

    // GET FEATURED PRODUCTS

    test("should return featured products from cache", async () => {
        const req = mockRequest();

        const res = mockResponse();

        const cachedProducts = [
            {
                _id: "1",
                name: "Featured Product",
            },
        ];

        redisClient.get.mockResolvedValue(JSON.stringify(cachedProducts));

        await getFeaturedProducts(req, res);

        expect(redisClient.get).toHaveBeenCalledWith("featured_products");

        expect(res.json).toHaveBeenCalledWith({
            featuredProducts: cachedProducts,
        });
    });

    test("should fetch featured products from database", async () => {
        const req = mockRequest();

        const res = mockResponse();

        redisClient.get.mockResolvedValue(null);

        const featuredProducts = [
            {
                _id: "1",
                name: "Featured Product",
            },
        ];

        Product.find.mockReturnValue({
            lean: jest.fn().mockResolvedValue(featuredProducts),
        });

        await getFeaturedProducts(req, res);

        expect(Product.find).toHaveBeenCalledWith({
            isFeatured: true,
        });

        expect(redisClient.set).toHaveBeenCalled();

        expect(res.json).toHaveBeenCalledWith({
            featuredProducts,
        });
    });

    // CREATE PRODUCT

    test("should create product successfully", async () => {
        const req = mockRequest({
            name: "Laptop",
            description: "Gaming laptop",
            price: 1000,
            image: "base64-image",
            category: "electronics",
        });

        const res = mockResponse();

        cloudinary.uploader.upload.mockResolvedValue({
            secure_url: "image-url.jpg",
        });

        Product.create.mockResolvedValue({
            _id: "1",
            name: "Laptop",
        });

        await createProduct(req, res);

        expect(cloudinary.uploader.upload).toHaveBeenCalled();

        expect(Product.create).toHaveBeenCalled();

        expect(res.status).toHaveBeenCalledWith(201);
    });

    test("should return 500 if createProduct fails", async () => {
        const req = mockRequest({
            name: "Laptop",
        });

        const res = mockResponse();

        Product.create.mockRejectedValue(new Error("Create Error"));

        await createProduct(req, res);

        expect(res.status).toHaveBeenCalledWith(500);
    });

    // DELETE PRODUCT

    test("should return 404 if product not found", async () => {
        const req = mockRequest(
            {},
            {
                id: "123",
            },
        );

        const res = mockResponse();

        Product.findById.mockResolvedValue(null);

        await deleteProduct(req, res);

        expect(res.status).toHaveBeenCalledWith(404);

        expect(res.json).toHaveBeenCalledWith({
            message: "Product not found",
        });
    });

    test("should delete product successfully", async () => {
        const req = mockRequest(
            {},
            {
                id: "123",
            },
        );

        const res = mockResponse();

        Product.findById.mockResolvedValue({
            _id: "123",
            image: "https://cloudinary.com/products/test-image.jpg",
            isFeatured: true,
        });

        Product.findByIdAndDelete.mockResolvedValue(true);

        cloudinary.uploader.destroy.mockResolvedValue(true);

        await deleteProduct(req, res);

        expect(Product.findByIdAndDelete).toHaveBeenCalled();

        expect(redisClient.del).toHaveBeenCalledWith("featured_products");

        expect(res.json).toHaveBeenCalledWith({
            message: "Product deleted successfully",
        });
    });

    // GET RECOMMENDED PRODUCTS

    test("should return recommended products", async () => {
        const req = mockRequest();

        const res = mockResponse();

        const recommendedProducts = [
            {
                _id: "1",
                name: "Laptop",
            },
        ];

        Product.aggregate.mockResolvedValue(recommendedProducts);

        await getRecommendedProducts(req, res);

        expect(Product.aggregate).toHaveBeenCalled();

        expect(res.json).toHaveBeenCalledWith(recommendedProducts);
    });

    // GET PRODUCTS BY CATEGORY

    test("should return products by category", async () => {
        const req = mockRequest(
            {},
            {
                category: "electronics",
            },
        );

        const res = mockResponse();

        const products = [
            {
                _id: "1",
                category: "electronics",
            },
        ];

        Product.find.mockResolvedValue(products);

        await getProductsByCategory(req, res);

        expect(Product.find).toHaveBeenCalledWith({
            category: "electronics",
        });

        expect(res.json).toHaveBeenCalledWith({
            products,
        });
    });

    // TOGGLE FEATURED PRODUCTS

    test("should toggle featured product successfully", async () => {
        const req = mockRequest(
            {},
            {
                id: "123",
            },
        );

        const res = mockResponse();

        const mockProduct = {
            _id: "123",
            isFeatured: false,
            save: jest.fn(),
        };

        Product.findById.mockResolvedValue(mockProduct);

        Product.find.mockReturnValue({
            lean: jest.fn().mockResolvedValue([]),
        });

        await toggleFeaturedProducts(req, res);

        expect(mockProduct.isFeatured).toBe(true);

        expect(mockProduct.save).toHaveBeenCalled();

        expect(redisClient.set).toHaveBeenCalled();

        expect(res.json).toHaveBeenCalledWith(mockProduct);
    });

    test("should return 404 if toggle product not found", async () => {
        const req = mockRequest(
            {},
            {
                id: "123",
            },
        );

        const res = mockResponse();

        Product.findById.mockResolvedValue(null);

        await toggleFeaturedProducts(req, res);

        expect(res.status).toHaveBeenCalledWith(404);

        expect(res.json).toHaveBeenCalledWith({
            message: "Product not found",
        });
    });
});
