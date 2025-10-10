import { useEffect, useState } from "react";
import { get, post } from "../../shared/api.js";
import { motion, AnimatePresence } from "framer-motion";
import { FiSearch, FiPlus, FiShoppingBag, FiStar, FiTruck } from "react-icons/fi";
import { useToast } from "../../shared/ui/Toast.jsx";
import { Spinner } from "../../shared/ui/Spinner.jsx";
import { useCart } from "../../shared/CartContext.jsx";
import { useI18n } from "../../shared/i18n/LanguageContext.jsx";

export default function CustomerHome() {
  const { t } = useI18n();
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
          title: t("Offline"),
          message: t("Order queued and will sync later"),
        });
      } else {
        notify({
          type: "success",
          title: t("Order placed"),
          message: `${product.name}`,
        });
      }
    } catch (err) {
      notify({ type: "error", title: t("Failed"), message: err.message });
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 to-amber-50/30 p-4 pb-24">
      {/* Header Section */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-6xl mx-auto mb-8"
      >
        <div className="flex items-center gap-3 mb-2">
          <div className="p-2 bg-white rounded-2xl shadow-lg border border-orange-100">
            <FiShoppingBag className="w-6 h-6 text-orange-600" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">{t('Discover Products')}</h1>
            <p className="text-gray-600 text-sm mt-1">{t('Find amazing items for your needs')}</p>
          </div>
        </div>

        {/* Search Bar */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="relative mt-6"
        >
          <div className="flex items-center bg-white rounded-2xl shadow-lg border border-orange-100 p-4 gap-3 hover:shadow-xl transition-all duration-300">
            <FiSearch className="text-orange-400 text-lg" />
            <input
              type="text"
              placeholder={t('Search products, brands, categories...')}
              value={q}
              onChange={(e) => setQ(e.target.value)}
              className="flex-1 outline-none text-gray-700 placeholder-gray-400 text-sm bg-transparent"
            />
          </div>
        </motion.div>

        {/* Features */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="grid grid-cols-3 gap-4 mt-6"
        >
          <div className="text-center p-3 bg-white/80 rounded-xl border border-orange-100">
            <FiTruck className="w-5 h-5 text-orange-500 mx-auto mb-2" />
            <div className="text-xs text-gray-600">{t('Free Delivery')}</div>
            <div className="text-xs font-semibold text-orange-600">{t('Over $50')}</div>
          </div>
          <div className="text-center p-3 bg-white/80 rounded-xl border border-orange-100">
            <FiStar className="w-5 h-5 text-orange-500 mx-auto mb-2" />
            <div className="text-xs text-gray-600">{t('Premium')}</div>
            <div className="text-xs font-semibold text-orange-600">{t('Quality')}</div>
          </div>
          <div className="text-center p-3 bg-white/80 rounded-xl border border-orange-100">
            <div className="w-5 h-5 text-orange-500 mx-auto mb-2">🛡️</div>
            <div className="text-xs text-gray-600">{t('Secure')}</div>
            <div className="text-xs font-semibold text-orange-600">{t('Payment')}</div>
          </div>
        </motion.div>
      </motion.div>

      {/* Loading */}
      {loading && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="mt-12 flex justify-center"
        >
          <div className="text-center">
            <Spinner size={48} className="text-orange-500" />
            <p className="text-gray-500 text-sm mt-3">{t('Finding amazing products...')}</p>
          </div>
        </motion.div>
      )}

      {/* Error */}
      {error && (
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="mt-12 text-center"
        >
          <div className="bg-red-50 border border-red-200 rounded-2xl p-6 max-w-md mx-auto">
            <div className="text-red-500 text-lg mb-2">⚠️</div>
            <div className="text-red-600 font-medium mb-1">{t('Something went wrong')}</div>
            <div className="text-red-500 text-sm">{error}</div>
          </div>
        </motion.div>
      )}

      {/* Products Grid */}
      <AnimatePresence>
        {!loading && !error && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="max-w-6xl mx-auto"
          >
            {products.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex items-center justify-between mb-6"
              >
                <h2 className="text-xl font-semibold text-gray-900">
                  {/* Minimal: leave count message as-is or could add new keys */}
                  Found {products.length} product{products.length !== 1 ? 's' : ''}
                </h2>
                {q && (
                  <button
                    onClick={() => setQ("")}
                    className="text-sm text-orange-600 hover:text-orange-700 font-medium"
                  >
                    {t('Clear search')}
                  </button>
                )}
              </motion.div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {products.map((p, idx) => (
                <motion.div
                  key={p._id}
                  layout
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  transition={{ delay: idx * 0.05, type: "spring", stiffness: 300 }}
                  whileHover={{ y: -8, scale: 1.02 }}
                  className="group relative bg-white rounded-3xl border border-orange-100 overflow-hidden shadow-lg hover:shadow-2xl transition-all duration-500"
                >
                  {/* Image Container */}
                  <div className="relative overflow-hidden bg-gradient-to-br from-orange-50 to-amber-50">
                    {Array.isArray(p.images) && p.images.length ? (
                      <motion.img
                        src={p.images[0].url}
                        alt={p.images[0].alt || p.name}
                        className="w-full h-48 object-cover group-hover:scale-110 transition-transform duration-700"
                        whileHover={{ scale: 1.1 }}
                      />
                    ) : (
                      <div className="h-48 bg-gradient-to-br from-orange-100 to-amber-100 flex items-center justify-center">
                        <FiShoppingBag className="w-12 h-12 text-orange-300" />
                      </div>
                    )}

                    {/* Overlay Gradient */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/30 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

                    {/* Merchant Badge */}
                    {p?.merchant?.businessName && (
                      <div className="absolute top-3 left-3 bg-black/70 text-white text-xs px-2 py-1 rounded-full backdrop-blur-sm">
                        {p.merchant.businessName}
                      </div>
                    )}
                  </div>

                  {/* Content */}
                  <div className="p-4">
                    <h3 className="font-semibold text-gray-900 line-clamp-2 text-sm leading-tight mb-2">
                      {p.name}
                    </h3>

                    {/* Price & Add Button */}
                    <div className="flex items-center justify-between mt-4">
                      <div className="flex flex-col">
                        <span className="text-lg font-bold text-orange-600">
                          ${p.price.toFixed(2)}
                        </span>
                        {p.originalPrice && p.originalPrice > p.price && (
                          <span className="text-xs text-gray-400 line-through">
                            ${p.originalPrice.toFixed(2)}
                          </span>
                        )}
                      </div>

                      <motion.button
                        whileHover={{ scale: 1.05, backgroundColor: "#ea580c" }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => {
                          addItem(p, 1);
                          notify({
                            type: "success",
                            title: "Added to cart",
                            message: p.name,
                          });
                        }}
                        className="flex items-center gap-2 bg-orange-500 text-white rounded-xl px-4 py-2.5 text-sm font-semibold shadow-md hover:shadow-lg transition-all duration-300"
                      >
                          <FiPlus className="w-4 h-4" />
                          {t('Add')}
                      </motion.button>
                    </div>
                  </div>

                  {/* Hover Glow Effect */}
                  <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 bg-gradient-to-br from-orange-200/20 via-orange-300/10 to-white/5 rounded-3xl pointer-events-none" />
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* No Products */}
      {!loading && products.length === 0 && !error && (
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center mt-16"
        >
          <div className="bg-white/80 rounded-3xl p-8 max-w-md mx-auto border border-orange-100 shadow-lg">
            <div className="w-16 h-16 bg-orange-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <FiSearch className="w-8 h-8 text-orange-400" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">{t('No products found')}</h3>
            <p className="text-gray-500 text-sm mb-4">
              {q ? `${t('No results for')} "${q}"` : t("We couldn't find any products at the moment")}
            </p>
            {q && (
              <button
                onClick={() => setQ("")}
                className="px-6 py-2 bg-orange-500 text-white rounded-xl font-medium hover:bg-orange-600 transition-colors"
              >
                {t('Clear Search')}
              </button>
            )}
          </div>
        </motion.div>
      )}
    </div>
  );
}