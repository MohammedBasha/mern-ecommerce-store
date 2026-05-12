import toast from "react-hot-toast";
import { ShoppingCart } from "lucide-react";
import { useUserStore } from "../stores/useUserStore";
import { useCartStore } from "../stores/useCartStore";

const ProductCard = ({ product }) => {
    const { user } = useUserStore();
    const { addToCart } = useCartStore();

    const handleAddToCart = () => {
        if (!user) {
            toast.error("Please login to add products to cart", {
                id: "login",
            });
            return;
        }
        addToCart(product);
    };

    return (
        <div className="flex w-full flex-col overflow-hidden rounded-lg border border-gray-700 bg-gray-800 shadow-lg transition hover:shadow-xl hover:border-emerald-500">
            {/* Image */}
            <div className="relative mx-3 mt-3 h-60 overflow-hidden rounded-xl">
                <img
                    className="h-full w-full object-cover"
                    src={product.image}
                    alt={product.name}
                />
            </div>

            {/* Content */}
            <div className="mt-4 flex flex-1 flex-col px-5 pb-5">
                <h5 className="text-xl font-semibold tracking-tight text-white">
                    {product.name}
                </h5>

                <div className="mt-2 mb-5">
                    <span className="text-3xl font-bold text-emerald-400">
                        ${product.price}
                    </span>
                </div>

                <button
                    onClick={handleAddToCart}
                    className="mt-auto flex items-center justify-center rounded-lg bg-emerald-600 px-5 py-2.5 text-sm font-medium text-white hover:bg-emerald-700 focus:outline-none focus:ring-4 focus:ring-emerald-300"
                >
                    <ShoppingCart size={22} className="mr-2" />
                    Add to cart
                </button>
            </div>
        </div>
    );
};
export default ProductCard;
