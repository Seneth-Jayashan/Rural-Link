import { useEffect, useState } from "react";
import { get, post } from "../../shared/api.js";
import { motion } from "framer-motion";
import { FiSearch, FiPlus } from "react-icons/fi";
import { useToast } from "../../shared/ui/Toast.jsx";
import { Spinner } from "../../shared/ui/Spinner.jsx";
import { useCart } from "../../shared/CartContext.jsx";

export default function CustomerHome() {
  const [q, setQ] = useState("");
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const { notify } = useToast();
  const { addItem } = useCart();

  useEffect(() => {
    let mounted = true;
    setLoading(true);
    get(`/api/products/search?q=${encodeURIComponent(q)}`)
      .then((d) => mounted && setProducts(d.data || []))
      .catch((e) => mounted && setError(e.message))
      .finally(() => mounted && setLoading(false));
    return () => {
      mounted = false;
    };
  }, [q]);

  async function placeQuickOrder(product) {
    try {
      const res = await post("/api/orders", {
        items: [{ product: product._id, quantity: 1 }],
        deliveryAddress: {
          street: "",
          city: "",
          state: "",
          zipCode: "",
          country: "",
        },
        paymentMethod: "cash",
      });
      if (res.offline) {
        notify({
          type: "info",
          title: "Offline",
          message: "Order queued and will sync later",
        });
      } else {
        notify({
          type: "success",
          title: "Order placed",
          message: `${product.name}`,
        });
      }
    } catch (err) {
      notify({ type: "error", title: "Failed", message: err.message });
    }
  }

  return (
    <div className="p-4 pb-20 bg-white min-h-screen">
      {/* Search Bar */}
      <div className="sticky top-4 bg-white z-10">
        <div className="flex items-center bg-gray-50 rounded-xl shadow-sm p-3 gap-3 border border-gray-100">
          <FiSearch className="text-gray-400 text-lg" />
          <input
            type="text"
            placeholder="Search products..."
            value={q}
            onChange={(e) => setQ(e.target.value)}
            className="flex-1 outline-none text-gray-700 placeholder-gray-400 text-sm bg-transparent"
          />
        </div>
      </div>

      {/* Loading */}
      {loading && (
        <div className="mt-8 flex justify-center">
          <Spinner size={40} />
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="mt-8 text-center text-red-600 font-medium">{error}</div>
      )}

      {/* Products Grid - cooler modern style */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 mt-3">
        {products.map((p, idx) => (
          <motion.div
            key={p._id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.05 }}
            whileHover={{ scale: 1.03 }}
            className="group relative bg-gradient-to-br from-orange-50/80 via-white/90 to-orange-100/70 rounded-3xl border border-orange-100 overflow-hidden shadow-md hover:shadow-xl transition-all duration-300 backdrop-blur-md"
          >
            {/* Image with floating effect */}
            <div className="relative overflow-hidden">
              {Array.isArray(p.images) && p.images.length ? (
                <motion.img
                  src={p.images[0].url}
                  alt={p.images[0].alt || p.name}
                  className="w-full h-48 object-cover rounded-t-3xl group-hover:scale-110 transition-transform duration-500"
                />
              ) : (
                <div className="h-48 bg-gradient-to-br from-gray-100 to-gray-200 rounded-t-3xl" />
              )}

              {/* Glass top overlay */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-transparent" />
            </div>

            {/* Content */}
            <div className="p-4">
              <div className="text-base font-semibold text-gray-800 line-clamp-2">
                {p.name}
              </div>
              <div className="text-xs text-gray-500 mt-1">
                {p?.merchant?.businessName || ""}
              </div>

              {/* Price + Button */}
              <div className="flex items-center justify-between mt-4">
                <div className="text-lg font-bold text-gray-900">
                  ${p.price.toFixed(2)}
                </div>
                <motion.button
                  whileTap={{ scale: 0.95 }}
                  onClick={() => {
                    addItem(p, 1);
                    notify({
                      type: "success",
                      title: "Added to cart",
                      message: p.name,
                    });
                  }}
                  className="flex items-center gap-1 text-white bg-gradient-to-r from-orange-500 to-orange-600 rounded-xl px-3 py-1.5 text-xs font-medium shadow-md hover:shadow-lg transition-all"
                >
                  <FiPlus className="text-xs" /> Add
                </motion.button>
              </div>
            </div>

            {/* Glow Effect */}
            <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition duration-500 bg-gradient-to-br from-orange-200/10 via-orange-300/20 to-white/10 rounded-3xl pointer-events-none" />
          </motion.div>
        ))}
      </div>

      {/* No Products */}
      {!loading && products.length === 0 && !error && (
        <div className="text-center text-gray-500 mt-10 text-sm">
          No products found.
        </div>
      )}
    </div>
  );
}
