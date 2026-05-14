import {
    getCoupon,
    validateCoupon,
} from "../../controllers/coupon.controller.js";

import Coupon from "../../models/Coupon.model.js";

jest.mock("../../models/Coupon.model.js");

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

describe("Coupon Controller", () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    // GET COUPON

    test("should return active coupon", async () => {
        const req = mockRequest(
            {},
            {
                _id: "user123",
            },
        );

        const res = mockResponse();

        const mockCoupon = {
            code: "SAVE20",
            discountPercentage: 20,
            isActive: true,
        };

        Coupon.findOne.mockResolvedValue(mockCoupon);

        await getCoupon(req, res);

        expect(Coupon.findOne).toHaveBeenCalledWith({
            userId: "user123",
            isActive: true,
        });

        expect(res.json).toHaveBeenCalledWith(mockCoupon);
    });

    test("should return null if no coupon exists", async () => {
        const req = mockRequest(
            {},
            {
                _id: "user123",
            },
        );

        const res = mockResponse();

        Coupon.findOne.mockResolvedValue(null);

        await getCoupon(req, res);

        expect(res.json).toHaveBeenCalledWith(null);
    });

    test("should return 500 if getCoupon fails", async () => {
        const req = mockRequest(
            {},
            {
                _id: "user123",
            },
        );

        const res = mockResponse();

        Coupon.findOne.mockRejectedValue(new Error("DB Error"));

        await getCoupon(req, res);

        expect(res.status).toHaveBeenCalledWith(500);

        expect(res.json).toHaveBeenCalledWith({
            message: "Server error",
            error: "DB Error",
        });
    });

    // VALIDATE COUPON

    test("should validate coupon successfully", async () => {
        const req = mockRequest(
            {
                code: "SAVE20",
            },
            {
                _id: "user123",
            },
        );

        const res = mockResponse();

        const mockCoupon = {
            code: "SAVE20",
            discountPercentage: 20,
            expirationDate: new Date(Date.now() + 24 * 60 * 60 * 1000),
            isActive: true,
        };

        Coupon.findOne.mockResolvedValue(mockCoupon);

        await validateCoupon(req, res);

        expect(Coupon.findOne).toHaveBeenCalledWith({
            code: "SAVE20",
            userId: "user123",
            isActive: true,
        });

        expect(res.json).toHaveBeenCalledWith({
            message: "Coupon is valid",
            code: "SAVE20",
            discountPercentage: 20,
        });
    });

    test("should return 404 if coupon not found", async () => {
        const req = mockRequest(
            {
                code: "INVALID",
            },
            {
                _id: "user123",
            },
        );

        const res = mockResponse();

        Coupon.findOne.mockResolvedValue(null);

        await validateCoupon(req, res);

        expect(res.status).toHaveBeenCalledWith(404);

        expect(res.json).toHaveBeenCalledWith({
            message: "Coupon not found",
        });
    });

    test("should return 404 if coupon is expired", async () => {
        const req = mockRequest(
            {
                code: "OLD20",
            },
            {
                _id: "user123",
            },
        );

        const res = mockResponse();

        const mockCoupon = {
            code: "OLD20",
            discountPercentage: 20,
            expirationDate: new Date(Date.now() - 24 * 60 * 60 * 1000),
            isActive: true,
            save: jest.fn(),
        };

        Coupon.findOne.mockResolvedValue(mockCoupon);

        await validateCoupon(req, res);

        expect(mockCoupon.isActive).toBe(false);

        expect(mockCoupon.save).toHaveBeenCalled();

        expect(res.status).toHaveBeenCalledWith(404);

        expect(res.json).toHaveBeenCalledWith({
            message: "Coupon expired",
        });
    });

    test("should return 500 if validateCoupon fails", async () => {
        const req = mockRequest(
            {
                code: "SAVE20",
            },
            {
                _id: "user123",
            },
        );

        const res = mockResponse();

        Coupon.findOne.mockRejectedValue(new Error("DB Error"));

        await validateCoupon(req, res);

        expect(res.status).toHaveBeenCalledWith(500);

        expect(res.json).toHaveBeenCalledWith({
            message: "Server error",
            error: "DB Error",
        });
    });
});
