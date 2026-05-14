import {
    createCheckoutSession,
    checkoutSuccess,
} from "../../controllers/payment.controller.js";

import Coupon from "../../models/coupon.model.js";
import Order from "../../models/order.model.js";

jest.mock("../../models/coupon.model.js");

jest.mock("../../models/order.model.js", () => {
    return jest.fn().mockImplementation((data) => ({
        ...data,
        _id: "order123",
        save: jest.fn(),
    }));
});

jest.mock("../../lib/stripe.js", () => ({
    stripe: {
        checkout: {
            sessions: {
                create: jest.fn(),
                retrieve: jest.fn(),
            },
        },
        coupons: {
            create: jest.fn(),
        },
    },
}));

import { stripe } from "../../lib/stripe.js";

const mockRequest = (body = {}, user = {}) => ({
    body,
    user,
});

const mockResponse = () => {
    const res = {};

    res.status = jest.fn().mockReturnValue(res);
    res.json = jest.fn().mockReturnValue(res);

    return res;
};

describe("Payment Controller", () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    // CREATE CHECKOUT SESSION

    test("should return 400 for empty products array", async () => {
        const req = mockRequest(
            {
                products: [],
            },
            {
                _id: "user123",
            },
        );

        const res = mockResponse();

        await createCheckoutSession(req, res);

        expect(res.status).toHaveBeenCalledWith(400);

        expect(res.json).toHaveBeenCalledWith({
            error: "Invalid or empty products array",
        });
    });

    test("should create checkout session successfully", async () => {
        const req = mockRequest(
            {
                products: [
                    {
                        _id: "product1",
                        name: "Laptop",
                        image: "image.jpg",
                        price: 100,
                        quantity: 2,
                    },
                ],
            },
            {
                _id: "user123",
            },
        );

        const res = mockResponse();

        stripe.checkout.sessions.create.mockResolvedValue({
            url: "https://stripe-session-url.com",
        });

        await createCheckoutSession(req, res);

        expect(stripe.checkout.sessions.create).toHaveBeenCalled();

        expect(res.status).toHaveBeenCalledWith(200);

        expect(res.json).toHaveBeenCalledWith({
            url: "https://stripe-session-url.com",
            totalAmount: 200,
        });
    });

    test("should apply coupon discount successfully", async () => {
        const req = mockRequest(
            {
                products: [
                    {
                        _id: "product1",
                        name: "Laptop",
                        image: "image.jpg",
                        price: 100,
                        quantity: 1,
                    },
                ],
                couponCode: "SAVE20",
            },
            {
                _id: "user123",
            },
        );

        const res = mockResponse();

        Coupon.findOne.mockResolvedValue({
            code: "SAVE20",
            discountPercentage: 20,
            isActive: true,
        });

        stripe.coupons.create.mockResolvedValue({
            id: "stripeCoupon123",
        });

        stripe.checkout.sessions.create.mockResolvedValue({
            url: "https://stripe-session-url.com",
        });

        await createCheckoutSession(req, res);

        expect(Coupon.findOne).toHaveBeenCalled();

        expect(stripe.coupons.create).toHaveBeenCalled();

        expect(res.status).toHaveBeenCalledWith(200);

        expect(res.json).toHaveBeenCalledWith({
            url: "https://stripe-session-url.com",
            totalAmount: 80,
        });
    });

    test("should return 500 if checkout session creation fails", async () => {
        const req = mockRequest(
            {
                products: [
                    {
                        _id: "product1",
                        name: "Laptop",
                        image: "image.jpg",
                        price: 100,
                        quantity: 1,
                    },
                ],
            },
            {
                _id: "user123",
            },
        );

        const res = mockResponse();

        stripe.checkout.sessions.create.mockRejectedValue(
            new Error("Stripe Error"),
        );

        await createCheckoutSession(req, res);

        expect(res.status).toHaveBeenCalledWith(500);

        expect(res.json).toHaveBeenCalledWith({
            message: "Error processing checkout",
            error: "Stripe Error",
        });
    });

    // CHECKOUT SUCCESS

    test("should return existing order if already processed", async () => {
        const req = mockRequest({
            sessionId: "session123",
        });

        const res = mockResponse();

        stripe.checkout.sessions.retrieve.mockResolvedValue({
            payment_status: "paid",
            metadata: {},
        });

        Order.findOne = jest.fn().mockResolvedValue({
            _id: "existingOrder123",
        });

        await checkoutSuccess(req, res);

        expect(Order.findOne).toHaveBeenCalled();

        expect(res.status).toHaveBeenCalledWith(200);

        expect(res.json).toHaveBeenCalledWith({
            success: true,
            message: "Payment already processed. Returning existing order.",
            orderId: "existingOrder123",
        });
    });

    test("should create order successfully after payment", async () => {
        const req = mockRequest({
            sessionId: "session123",
        });

        const res = mockResponse();

        stripe.checkout.sessions.retrieve.mockResolvedValue({
            payment_status: "paid",
            amount_total: 10000,
            metadata: {
                userId: "user123",
                couponCode: "",
                products: JSON.stringify([
                    {
                        id: "product1",
                        quantity: 2,
                        price: 50,
                    },
                ]),
            },
        });

        Order.findOne = jest.fn().mockResolvedValue(null);

        await checkoutSuccess(req, res);

        expect(Order.findOne).toHaveBeenCalled();

        expect(res.status).toHaveBeenCalledWith(200);

        expect(res.json).toHaveBeenCalledWith({
            success: true,
            message:
                "Payment successful, order created, and coupon deactivated if used.",
            orderId: "order123",
        });
    });

    test("should deactivate coupon after successful payment", async () => {
        const req = mockRequest({
            sessionId: "session123",
        });

        const res = mockResponse();

        stripe.checkout.sessions.retrieve.mockResolvedValue({
            payment_status: "paid",
            amount_total: 5000,
            metadata: {
                userId: "user123",
                couponCode: "SAVE20",
                products: JSON.stringify([
                    {
                        id: "product1",
                        quantity: 1,
                        price: 50,
                    },
                ]),
            },
        });

        Order.findOne = jest.fn().mockResolvedValue(null);

        Coupon.findOneAndUpdate.mockResolvedValue(true);

        await checkoutSuccess(req, res);

        expect(Coupon.findOneAndUpdate).toHaveBeenCalled();
    });

    test("should return 500 if checkoutSuccess fails", async () => {
        const req = mockRequest({
            sessionId: "session123",
        });

        const res = mockResponse();

        stripe.checkout.sessions.retrieve.mockRejectedValue(
            new Error("Stripe Retrieve Error"),
        );

        await checkoutSuccess(req, res);

        expect(res.status).toHaveBeenCalledWith(500);

        expect(res.json).toHaveBeenCalledWith({
            message: "Error processing successful checkout",
            error: "Stripe Retrieve Error",
        });
    });
});
