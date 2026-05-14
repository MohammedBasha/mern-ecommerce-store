import { protectRoute, adminRoute } from "../../middlewares/auth.middleware.js";

import User from "../../models/user.model.js";
import jwt from "jsonwebtoken";

jest.mock("../../models/user.model.js");

jest.mock("jsonwebtoken", () => ({
    verify: jest.fn(),
}));

const mockRequest = (cookies = {}, user = {}) => ({
    cookies,
    user,
});

const mockResponse = () => {
    const res = {};

    res.status = jest.fn().mockReturnValue(res);
    res.json = jest.fn().mockReturnValue(res);

    return res;
};

describe("Auth Middleware", () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    // PROTECT ROUTE

    test("should return 401 if no token provided", async () => {
        const req = mockRequest();

        const res = mockResponse();

        const next = jest.fn();

        await protectRoute(req, res, next);

        expect(res.status).toHaveBeenCalledWith(401);

        expect(res.json).toHaveBeenCalledWith({
            message: "Unauthorized: No token provided - try loging in",
        });

        expect(next).not.toHaveBeenCalled();
    });

    test("should return 401 if token expired", async () => {
        const req = mockRequest({
            accessToken: "expiredToken",
        });

        const res = mockResponse();

        const next = jest.fn();

        jwt.verify.mockImplementation(() => {
            const error = new Error("Token expired");
            error.name = "TokenExpiredError";
            throw error;
        });

        await protectRoute(req, res, next);

        expect(res.status).toHaveBeenCalledWith(401);

        expect(res.json).toHaveBeenCalledWith({
            message: "Unauthorized: Token expired",
        });

        expect(next).not.toHaveBeenCalled();
    });

    test("should return 401 if user not found", async () => {
        const req = mockRequest({
            accessToken: "validToken",
        });

        const res = mockResponse();

        const next = jest.fn();

        jwt.verify.mockReturnValue({
            userId: "123",
        });

        User.findById.mockReturnValue({
            select: jest.fn().mockResolvedValue(null),
        });

        await protectRoute(req, res, next);

        expect(res.status).toHaveBeenCalledWith(401);

        expect(res.json).toHaveBeenCalledWith({
            message: "Unauthorized: User not found",
        });

        expect(next).not.toHaveBeenCalled();
    });

    test("should call next and attach user for valid token", async () => {
        const req = mockRequest({
            accessToken: "validToken",
        });

        const res = mockResponse();

        const next = jest.fn();

        const mockUser = {
            _id: "123",
            name: "Mohamed",
            role: "customer",
        };

        jwt.verify.mockReturnValue({
            userId: "123",
        });

        User.findById.mockReturnValue({
            select: jest.fn().mockResolvedValue(mockUser),
        });

        await protectRoute(req, res, next);

        expect(req.user).toEqual(mockUser);

        expect(next).toHaveBeenCalled();
    });

    // ADMIN ROUTE

    test("should call next for admin user", () => {
        const req = mockRequest(
            {},
            {
                role: "admin",
            },
        );

        const res = mockResponse();

        const next = jest.fn();

        adminRoute(req, res, next);

        expect(next).toHaveBeenCalled();
    });

    test("should return 403 for non-admin user", () => {
        const req = mockRequest(
            {},
            {
                _id: "123",
                role: "customer",
            },
        );

        const res = mockResponse();

        const next = jest.fn();

        adminRoute(req, res, next);

        expect(res.status).toHaveBeenCalledWith(403);

        expect(res.json).toHaveBeenCalledWith({
            message: "Forbidden: Admin access required",
        });

        expect(next).not.toHaveBeenCalled();
    });
});
