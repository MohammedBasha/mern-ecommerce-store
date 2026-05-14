jest.mock("../../lib/redis.js", () => ({
    __esModule: true,
    default: {
        connect: jest.fn(() => Promise.resolve()),
        set: jest.fn(),
        get: jest.fn(),
        del: jest.fn(),
    },
}));

jest.mock("jsonwebtoken", () => ({
    sign: jest.fn(() => "mockToken"),
    verify: jest.fn(() => ({ userId: "123" })),
}));

import {
    signup,
    login,
    logout,
    refreshToken,
    getProfile,
} from "../../controllers/auth.controller.js";

import User from "../../models/user.model.js";
import redisClient from "../../lib/redis.js";
import jwt from "jsonwebtoken";

jest.mock("../../models/user.model.js");

const mockRequest = (body = {}, cookies = {}, user = null) => ({
    body,
    cookies,
    user,
});

const mockResponse = () => {
    const res = {};

    res.status = jest.fn().mockReturnValue(res);
    res.json = jest.fn().mockReturnValue(res);
    res.cookie = jest.fn().mockReturnValue(res);
    res.clearCookie = jest.fn().mockReturnValue(res);

    return res;
};

describe("Auth Controller", () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    // SIGNUP

    test("should return 400 if user already exists", async () => {
        const req = mockRequest({
            name: "Mohamed",
            email: "test@test.com",
            password: "123456",
        });

        const res = mockResponse();

        User.findOne.mockResolvedValue({
            _id: "1",
        });

        await signup(req, res);

        expect(res.status).toHaveBeenCalledWith(400);

        expect(res.json).toHaveBeenCalledWith({
            message: "User already exists",
        });
    });

    test("should create user successfully", async () => {
        const req = mockRequest({
            name: "Mohamed",
            email: "test@test.com",
            password: "123456",
        });

        const res = mockResponse();

        User.findOne.mockResolvedValue(null);

        User.create.mockResolvedValue({
            _id: "1",
            name: "Mohamed",
            email: "test@test.com",
            role: "customer",
        });

        redisClient.set.mockResolvedValue(true);

        await signup(req, res);

        expect(res.status).toHaveBeenCalledWith(201);

        expect(res.cookie).toHaveBeenCalled();

        expect(res.json).toHaveBeenCalled();
    });

    // LOGIN

    test("should return 401 for invalid credentials", async () => {
        const req = mockRequest({
            email: "wrong@test.com",
            password: "wrongpass",
        });

        const res = mockResponse();

        User.findOne.mockResolvedValue(null);

        await login(req, res);

        expect(res.status).toHaveBeenCalledWith(401);

        expect(res.json).toHaveBeenCalledWith({
            message: "Invalid email or password",
        });
    });

    test("should login successfully", async () => {
        const req = mockRequest({
            email: "test@test.com",
            password: "123456",
        });

        const res = mockResponse();

        User.findOne.mockResolvedValue({
            _id: "1",
            name: "Mohamed",
            email: "test@test.com",
            role: "customer",
            comparePassword: jest.fn().mockResolvedValue(true),
        });

        redisClient.set.mockResolvedValue(true);

        await login(req, res);

        expect(res.status).toHaveBeenCalledWith(201);

        expect(res.cookie).toHaveBeenCalled();

        expect(res.json).toHaveBeenCalled();
    });

    // LOGOUT

    test("should return 400 if refresh token is missing", async () => {
        const req = mockRequest({}, {});

        const res = mockResponse();

        await logout(req, res);

        expect(res.status).toHaveBeenCalledWith(400);

        expect(res.json).toHaveBeenCalledWith({
            message: "Refresh token not found",
        });
    });

    test("should logout successfully", async () => {
        const req = mockRequest(
            {},
            {
                refreshToken: "mockRefreshToken",
            },
        );

        const res = mockResponse();

        redisClient.del.mockResolvedValue(true);

        await logout(req, res);

        expect(jwt.verify).toHaveBeenCalled();

        expect(redisClient.del).toHaveBeenCalled();

        expect(res.clearCookie).toHaveBeenCalledWith("accessToken");

        expect(res.clearCookie).toHaveBeenCalledWith("refreshToken");

        expect(res.status).toHaveBeenCalledWith(200);
    });

    // REFRESH TOKEN

    test("should return 401 if no refresh token provided", async () => {
        const req = mockRequest({}, {});

        const res = mockResponse();

        await refreshToken(req, res);

        expect(res.status).toHaveBeenCalledWith(401);

        expect(res.json).toHaveBeenCalledWith({
            message: "No refresh token provided",
        });
    });

    test("should return 401 for invalid refresh token", async () => {
        const req = mockRequest(
            {},
            {
                refreshToken: "wrongToken",
            },
        );

        const res = mockResponse();

        redisClient.get.mockResolvedValue("differentToken");

        await refreshToken(req, res);

        expect(res.status).toHaveBeenCalledWith(401);

        expect(res.json).toHaveBeenCalledWith({
            message: "Invalid refresh token",
        });
    });

    test("should refresh token successfully", async () => {
        const req = mockRequest(
            {},
            {
                refreshToken: "validToken",
            },
        );

        const res = mockResponse();

        redisClient.get.mockResolvedValue("validToken");

        await refreshToken(req, res);

        expect(res.cookie).toHaveBeenCalled();

        expect(res.json).toHaveBeenCalledWith({
            message: "Token refreshed successfully",
        });
    });

    // PROFILE

    test("should return user profile", async () => {
        const req = mockRequest(
            {},
            {},
            {
                _id: "1",
                name: "Mohamed",
                email: "test@test.com",
            },
        );

        const res = mockResponse();

        await getProfile(req, res);

        expect(res.json).toHaveBeenCalledWith(req.user);
    });
});
