import {
    getCartProducts,
    addToCart,
    removeAllFromCart,
    updateQuantity,
} from "../../controllers/cart.controller.js";

import Product from "../../models/product.model.js";

jest.mock("../../models/product.model.js");

const mockRequest = (body = {}, user = {}, params = {}) => ({
    body,
    user,
    params,
});

const mockResponse = () => {
    const res = {};

    res.status = jest.fn().mockReturnValue(res);
    res.json = jest.fn().mockReturnValue(res);

    return res;
};

describe("Cart Controller", () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    // GET CART PRODUCTS

    test("should return cart products with quantity", async () => {
        const req = mockRequest(
            {},
            {
                cartItems: [
                    {
                        id: "1",
                        quantity: 2,
                    },
                ],
            },
        );

        const res = mockResponse();

        Product.find.mockResolvedValue([
            {
                id: "1",
                name: "Laptop",
                price: 1000,
                toJSON: () => ({
                    id: "1",
                    name: "Laptop",
                    price: 1000,
                }),
            },
        ]);

        await getCartProducts(req, res);

        expect(Product.find).toHaveBeenCalled();

        expect(res.json).toHaveBeenCalledWith([
            {
                id: "1",
                name: "Laptop",
                price: 1000,
                quantity: 2,
            },
        ]);
    });

    test("should return 500 if getCartProducts fails", async () => {
        const req = mockRequest(
            {},
            {
                cartItems: [],
            },
        );

        const res = mockResponse();

        Product.find.mockRejectedValue(new Error("DB Error"));

        await getCartProducts(req, res);

        expect(res.status).toHaveBeenCalledWith(500);
    });

    // ADD TO CART

    test("should add new product to cart", async () => {
        const user = {
            cartItems: [],
            save: jest.fn(),
        };

        const req = mockRequest(
            {
                productId: "1",
            },
            user,
        );

        const res = mockResponse();

        await addToCart(req, res);

        expect(user.cartItems).toContain("1");

        expect(user.save).toHaveBeenCalled();

        expect(res.json).toHaveBeenCalledWith(user.cartItems);
    });

    test("should increase quantity if product already exists", async () => {
        const user = {
            cartItems: [
                {
                    product: "1",
                    quantity: 1,
                },
            ],
            save: jest.fn(),
        };

        const req = mockRequest(
            {
                productId: "1",
            },
            user,
        );

        const res = mockResponse();

        await addToCart(req, res);

        expect(user.cartItems[0].quantity).toBe(2);

        expect(user.save).toHaveBeenCalled();
    });

    test("should return 500 if addToCart fails", async () => {
        const user = {
            cartItems: [],
            save: jest.fn().mockRejectedValue(new Error("Save Error")),
        };

        const req = mockRequest(
            {
                productId: "1",
            },
            user,
        );

        const res = mockResponse();

        await addToCart(req, res);

        expect(res.status).toHaveBeenCalledWith(500);
    });

    // REMOVE ALL FROM CART

    test("should clear cart if no productId provided", async () => {
        const user = {
            cartItems: [
                {
                    id: "1",
                    quantity: 1,
                },
            ],
            save: jest.fn(),
        };

        const req = mockRequest({}, user);

        const res = mockResponse();

        await removeAllFromCart(req, res);

        expect(user.cartItems).toEqual([]);

        expect(user.save).toHaveBeenCalled();

        expect(res.json).toHaveBeenCalledWith([]);
    });

    test("should remove one product from cart", async () => {
        const user = {
            cartItems: [
                {
                    id: "1",
                    quantity: 1,
                },
                {
                    id: "2",
                    quantity: 2,
                },
            ],
            save: jest.fn(),
        };

        const req = mockRequest(
            {
                productId: "1",
            },
            user,
        );

        const res = mockResponse();

        await removeAllFromCart(req, res);

        expect(user.cartItems).toEqual([
            {
                id: "2",
                quantity: 2,
            },
        ]);

        expect(user.save).toHaveBeenCalled();
    });

    // UPDATE QUANTITY

    test("should update product quantity", async () => {
        const user = {
            cartItems: [
                {
                    id: "1",
                    quantity: 1,
                },
            ],
            save: jest.fn(),
        };

        const req = mockRequest(
            {
                quantity: 5,
            },
            user,
            {
                id: "1",
            },
        );

        const res = mockResponse();

        await updateQuantity(req, res);

        expect(user.cartItems[0].quantity).toBe(5);

        expect(user.save).toHaveBeenCalled();

        expect(res.json).toHaveBeenCalledWith(user.cartItems);
    });

    test("should remove product if quantity is zero", async () => {
        const user = {
            cartItems: [
                {
                    id: "1",
                    quantity: 2,
                },
            ],
            save: jest.fn(),
        };

        const req = mockRequest(
            {
                quantity: 0,
            },
            user,
            {
                id: "1",
            },
        );

        const res = mockResponse();

        await updateQuantity(req, res);

        expect(user.cartItems).toEqual([]);

        expect(user.save).toHaveBeenCalled();
    });

    test("should return 404 if product not found", async () => {
        const user = {
            cartItems: [],
            save: jest.fn(),
        };

        const req = mockRequest(
            {
                quantity: 2,
            },
            user,
            {
                id: "999",
            },
        );

        const res = mockResponse();

        await updateQuantity(req, res);

        expect(res.status).toHaveBeenCalledWith(404);

        expect(res.json).toHaveBeenCalledWith({
            message: "Product not found",
        });
    });

    test("should return 500 if updateQuantity fails", async () => {
        const user = {
            cartItems: [
                {
                    id: "1",
                    quantity: 1,
                },
            ],
            save: jest.fn().mockRejectedValue(new Error("Save Error")),
        };

        const req = mockRequest(
            {
                quantity: 3,
            },
            user,
            {
                id: "1",
            },
        );

        const res = mockResponse();

        await updateQuantity(req, res);

        expect(res.status).toHaveBeenCalledWith(500);
    });
});
