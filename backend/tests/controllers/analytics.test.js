import {
    getAnalyticsData,
    getDailySalesData,
} from "../../controllers/analytics.controller.js";

import Order from "../../models/order.model.js";
import Product from "../../models/product.model.js";
import User from "../../models/user.model.js";

jest.mock("../../models/order.model.js");
jest.mock("../../models/product.model.js");
jest.mock("../../models/user.model.js");

describe("Analytics Controller", () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    test("should return analytics object", async () => {
        User.countDocuments.mockResolvedValue(1);
        Product.countDocuments.mockResolvedValue(1);

        Order.aggregate.mockResolvedValue([
            {
                totalSales: 1,
                totalRevenue: 1,
            },
        ]);

        const result = await getAnalyticsData();

        expect(result).toHaveProperty("users");
        expect(result).toHaveProperty("products");
        expect(result).toHaveProperty("totalSales");
        expect(result).toHaveProperty("totalRevenue");
    });

    test("should fill missing dates with zero values", async () => {
        Order.aggregate.mockResolvedValue([
            {
                _id: "2025-01-01",
                sales: 1,
                revenue: 100,
            },
        ]);

        const result = await getDailySalesData(
            new Date("2025-01-01"),
            new Date("2025-01-03"),
        );

        expect(result).toHaveLength(3);

        expect(result[1]).toEqual({
            date: "2025-01-02",
            sales: 0,
            revenue: 0,
        });
    });

    test("should throw error if aggregation fails", async () => {
        Order.aggregate.mockRejectedValue(new Error("DB Error"));

        await expect(
            getDailySalesData(new Date("2025-01-01"), new Date("2025-01-03")),
        ).rejects.toThrow("DB Error");
    });
});
