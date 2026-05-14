import { act } from "@testing-library/react";
import { useProductStore } from "../../stores/useProductStore";
import axios from "../../lib/axios";
import toast from "react-hot-toast";

vi.mock("../../lib/axios");

vi.mock("react-hot-toast", () => ({
    default: {
        error: vi.fn(),
    },
}));

describe("useProductStore", () => {
    beforeEach(() => {
        vi.clearAllMocks();

        useProductStore.setState({
            products: [],
            loading: false,
        });
    });

    // ---------------------------
    // FETCH ALL PRODUCTS
    // ---------------------------
    test("fetchAllProducts updates products", async () => {
        axios.get.mockResolvedValue({
            data: {
                products: [{ _id: "1", name: "Laptop" }],
            },
        });

        await act(async () => {
            await useProductStore.getState().fetchAllProducts();
        });

        expect(axios.get).toHaveBeenCalledWith("/products");

        expect(useProductStore.getState().products.length).toBe(1);
    });

    // ---------------------------
    // CREATE PRODUCT
    // ---------------------------
    test("createProduct adds product", async () => {
        axios.post.mockResolvedValue({
            data: { _id: "1", name: "Phone" },
        });

        await act(async () => {
            await useProductStore.getState().createProduct({ name: "Phone" });
        });

        expect(axios.post).toHaveBeenCalledWith("/products", { name: "Phone" });

        expect(useProductStore.getState().products.length).toBe(1);
    });

    // ---------------------------
    // DELETE PRODUCT
    // ---------------------------
    test("deleteProduct removes product", async () => {
        useProductStore.setState({
            products: [{ _id: "1", name: "Laptop" }],
        });

        axios.delete.mockResolvedValue({});

        await act(async () => {
            await useProductStore.getState().deleteProduct("1");
        });

        expect(axios.delete).toHaveBeenCalledWith("/products/1");

        expect(useProductStore.getState().products).toEqual([]);
    });

    // ---------------------------
    // TOGGLE FEATURED
    // ---------------------------
    test("toggleFeaturedProduct updates isFeatured", async () => {
        useProductStore.setState({
            products: [
                {
                    _id: "1",
                    name: "Laptop",
                    isFeatured: false,
                },
            ],
        });

        axios.patch.mockResolvedValue({
            data: {
                isFeatured: true,
            },
        });

        await act(async () => {
            await useProductStore.getState().toggleFeaturedProduct("1");
        });

        expect(useProductStore.getState().products[0].isFeatured).toBe(true);
    });

    // ---------------------------
    // FETCH FEATURED PRODUCTS
    // ---------------------------
    test("fetchFeaturedProducts sets products", async () => {
        axios.get.mockResolvedValue({
            data: {
                featuredProducts: [{ _id: "1", name: "Laptop" }],
            },
        });

        await act(async () => {
            await useProductStore.getState().fetchFeaturedProducts();
        });

        expect(useProductStore.getState().products.length).toBe(1);
    });

    // ---------------------------
    // ERROR CASE (MINIMAL)
    // ---------------------------
    test("handles fetchAllProducts error", async () => {
        axios.get.mockRejectedValue({
            response: {
                data: {
                    error: "Failed",
                },
            },
        });

        await act(async () => {
            await useProductStore.getState().fetchAllProducts();
        });

        expect(toast.error).toHaveBeenCalled();
    });
});
