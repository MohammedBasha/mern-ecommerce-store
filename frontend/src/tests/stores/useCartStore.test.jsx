/* global vi */
import { act } from "@testing-library/react";
import { useCartStore } from "../../stores/useCartStore";

import axios from "../../lib/axios";
import { toast } from "react-hot-toast";

vi.mock("../../lib/axios");

vi.mock("react-hot-toast", () => ({
    toast: {
        success: vi.fn(),
        error: vi.fn(),
    },
}));

describe("useCartStore", () => {
    beforeEach(() => {
        vi.clearAllMocks();

        useCartStore.setState({
            cart: [],
            coupon: null,
            total: 0,
            subtotal: 0,
            isCouponApplied: false,
        });
    });

    // GET COUPON

    test("should fetch coupon successfully", async () => {
        axios.get.mockResolvedValue({
            data: {
                code: "SAVE20",
                discountPercentage: 20,
            },
        });

        await act(async () => {
            await useCartStore.getState().getMyCoupon();
        });

        expect(axios.get).toHaveBeenCalledWith("/coupons");

        expect(useCartStore.getState().coupon).toEqual({
            code: "SAVE20",
            discountPercentage: 20,
        });
    });

    // APPLY COUPON

    test("should apply coupon successfully", async () => {
        useCartStore.setState({
            cart: [
                {
                    _id: "1",
                    price: 100,
                    quantity: 2,
                },
            ],
        });

        axios.post.mockResolvedValue({
            data: {
                code: "SAVE20",
                discountPercentage: 20,
            },
        });

        await act(async () => {
            await useCartStore.getState().applyCoupon("SAVE20");
        });

        expect(axios.post).toHaveBeenCalledWith("/coupons/validate", {
            code: "SAVE20",
        });

        expect(useCartStore.getState().coupon).toEqual({
            code: "SAVE20",
            discountPercentage: 20,
        });

        expect(useCartStore.getState().total).toBe(160);

        expect(toast.success).toHaveBeenCalledWith(
            "Coupon applied successfully",
        );
    });

    test("should handle apply coupon error", async () => {
        axios.post.mockRejectedValue({
            response: {
                data: {
                    message: "Invalid coupon",
                },
            },
        });

        await act(async () => {
            await useCartStore.getState().applyCoupon("INVALID");
        });

        expect(toast.error).toHaveBeenCalledWith("Invalid coupon");
    });

    // REMOVE COUPON

    test("should remove coupon successfully", () => {
        useCartStore.setState({
            cart: [
                {
                    _id: "1",
                    price: 100,
                    quantity: 1,
                },
            ],
            coupon: {
                discountPercentage: 20,
            },
            total: 80,
            subtotal: 100,
            isCouponApplied: true,
        });

        act(() => {
            useCartStore.getState().removeCoupon();
        });

        expect(useCartStore.getState().coupon).toBe(null);

        expect(useCartStore.getState().isCouponApplied).toBe(false);

        expect(useCartStore.getState().total).toBe(100);

        expect(toast.success).toHaveBeenCalledWith("Coupon removed");
    });

    // GET CART ITEMS

    test("should fetch cart items successfully", async () => {
        axios.get.mockResolvedValue({
            data: [
                {
                    _id: "1",
                    price: 100,
                    quantity: 2,
                },
            ],
        });

        await act(async () => {
            await useCartStore.getState().getCartItems();
        });

        expect(axios.get).toHaveBeenCalledWith("/cart");

        expect(useCartStore.getState().cart).toEqual([
            {
                _id: "1",
                price: 100,
                quantity: 2,
            },
        ]);

        expect(useCartStore.getState().subtotal).toBe(200);
    });

    // ADD TO CART

    test("should add product to cart", async () => {
        const product = {
            _id: "1",
            name: "Laptop",
            price: 100,
        };

        axios.post.mockResolvedValue({});

        await act(async () => {
            await useCartStore.getState().addToCart(product);
        });

        expect(axios.post).toHaveBeenCalledWith("/cart", {
            productId: "1",
        });

        expect(useCartStore.getState().cart).toEqual([
            {
                ...product,
                quantity: 1,
            },
        ]);

        expect(toast.success).toHaveBeenCalledWith("Product added to cart");
    });

    test("should increase quantity if product already exists", async () => {
        useCartStore.setState({
            cart: [
                {
                    _id: "1",
                    name: "Laptop",
                    price: 100,
                    quantity: 1,
                },
            ],
        });

        axios.post.mockResolvedValue({});

        await act(async () => {
            await useCartStore.getState().addToCart({
                _id: "1",
                name: "Laptop",
                price: 100,
            });
        });

        expect(useCartStore.getState().cart[0].quantity).toBe(2);
    });

    // REMOVE FROM CART

    test("should remove product from cart", async () => {
        useCartStore.setState({
            cart: [
                {
                    _id: "1",
                    price: 100,
                    quantity: 1,
                },
            ],
        });

        axios.delete.mockResolvedValue({});

        await act(async () => {
            await useCartStore.getState().removeFromCart("1");
        });

        expect(axios.delete).toHaveBeenCalledWith("/cart", {
            data: {
                productId: "1",
            },
        });

        expect(useCartStore.getState().cart).toEqual([]);
    });

    // UPDATE QUANTITY

    test("should update quantity successfully", async () => {
        useCartStore.setState({
            cart: [
                {
                    _id: "1",
                    price: 100,
                    quantity: 1,
                },
            ],
        });

        axios.put.mockResolvedValue({});

        await act(async () => {
            await useCartStore.getState().updateQuantity("1", 5);
        });

        expect(axios.put).toHaveBeenCalledWith("/cart/1", {
            quantity: 5,
        });

        expect(useCartStore.getState().cart[0].quantity).toBe(5);
    });

    // CALCULATE TOTALS

    test("should calculate totals correctly", () => {
        useCartStore.setState({
            cart: [
                {
                    price: 100,
                    quantity: 2,
                },
                {
                    price: 50,
                    quantity: 1,
                },
            ],
        });

        act(() => {
            useCartStore.getState().calculateTotals();
        });

        expect(useCartStore.getState().subtotal).toBe(250);

        expect(useCartStore.getState().total).toBe(250);
    });

    test("should calculate totals with coupon", () => {
        useCartStore.setState({
            cart: [
                {
                    price: 100,
                    quantity: 2,
                },
            ],
            coupon: {
                discountPercentage: 10,
            },
        });

        act(() => {
            useCartStore.getState().calculateTotals();
        });

        expect(useCartStore.getState().subtotal).toBe(200);

        expect(useCartStore.getState().total).toBe(180);
    });
});
