import { vi } from "vitest";

// -------------------------
// MUST BE FIRST (HOISTED MOCK)
// -------------------------
vi.mock("react-hot-toast", () => ({
    toast: {
        success: vi.fn(),
        error: vi.fn(),
    },
}));

import { act } from "@testing-library/react";
import { useUserStore } from "../../stores/useUserStore";
import axios from "../../lib/axios";
import { toast } from "react-hot-toast";

// Mock axios
vi.mock("../../lib/axios");

describe("useUserStore", () => {
    beforeEach(() => {
        vi.clearAllMocks();

        useUserStore.setState({
            user: null,
            loading: false,
            checkingAuth: true,
        });
    });

    // ---------------------------
    // SIGNUP SUCCESS
    // ---------------------------
    test("signup success sets user", async () => {
        axios.post.mockResolvedValue({
            data: { _id: "1", name: "John" },
        });

        await act(async () => {
            await useUserStore.getState().signup({
                name: "John",
                email: "john@test.com",
                password: "123",
                confirmPassword: "123",
            });
        });

        expect(axios.post).toHaveBeenCalledWith("/auth/signup", {
            name: "John",
            email: "john@test.com",
            password: "123",
        });

        expect(useUserStore.getState().user).toEqual({
            _id: "1",
            name: "John",
        });
    });

    // ---------------------------
    // SIGNUP PASSWORD MISMATCH
    // ---------------------------
    test("signup fails when passwords mismatch", async () => {
        await act(async () => {
            await useUserStore.getState().signup({
                name: "John",
                email: "john@test.com",
                password: "123",
                confirmPassword: "999",
            });
        });

        expect(toast.error).toHaveBeenCalledWith("Passwords do not match");

        expect(axios.post).not.toHaveBeenCalled();
    });

    // ---------------------------
    // LOGIN SUCCESS
    // ---------------------------
    test("login success sets user", async () => {
        axios.post.mockResolvedValue({
            data: { _id: "2", email: "test@test.com" },
        });

        await act(async () => {
            await useUserStore.getState().login("test@test.com", "123");
        });

        expect(axios.post).toHaveBeenCalledWith("/auth/login", {
            email: "test@test.com",
            password: "123",
        });

        expect(useUserStore.getState().user).toEqual({
            _id: "2",
            email: "test@test.com",
        });
    });

    // ---------------------------
    // LOGOUT
    // ---------------------------
    test("logout clears user", async () => {
        useUserStore.setState({
            user: { _id: "1" },
        });

        axios.post.mockResolvedValue({});

        await act(async () => {
            await useUserStore.getState().logout();
        });

        expect(axios.post).toHaveBeenCalledWith("/auth/logout");
        expect(useUserStore.getState().user).toBe(null);
    });

    // ---------------------------
    // CHECK AUTH SUCCESS
    // ---------------------------
    test("checkAuth sets user", async () => {
        axios.get.mockResolvedValue({
            data: { _id: "1", name: "User" },
        });

        await act(async () => {
            await useUserStore.getState().checkAuth();
        });

        expect(axios.get).toHaveBeenCalledWith("/auth/profile");

        expect(useUserStore.getState().user).toEqual({
            _id: "1",
            name: "User",
        });

        expect(useUserStore.getState().checkingAuth).toBe(false);
    });

    // ---------------------------
    // CHECK AUTH FAILURE
    // ---------------------------
    test("checkAuth failure resets user", async () => {
        axios.get.mockRejectedValue(new Error("fail"));

        await act(async () => {
            await useUserStore.getState().checkAuth();
        });

        expect(useUserStore.getState().user).toBe(null);
        expect(useUserStore.getState().checkingAuth).toBe(false);
    });

    // ---------------------------
    // REFRESH TOKEN FAILURE
    // ---------------------------
    test("refreshToken failure clears user", async () => {
        axios.post.mockRejectedValue(new Error("401"));

        // ✅ IMPORTANT FIX
        useUserStore.setState({
            user: { _id: "1" },
            checkingAuth: false,
        });

        let errorThrown = false;

        await act(async () => {
            try {
                await useUserStore.getState().refreshToken();
            } catch (e) {
                errorThrown = true;
            }
        });

        expect(errorThrown).toBe(true);
        expect(useUserStore.getState().user).toBe(null);
        expect(useUserStore.getState().checkingAuth).toBe(false);
    });
});
