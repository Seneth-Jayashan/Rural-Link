import { useEffect, useRef, useState } from "react";
import { get, uploadFormData, del, getImageUrl } from "../../shared/api.js";
import { motion, AnimatePresence } from "framer-motion";
import { FiSave, FiTrash2, FiImage, FiX, FiDollarSign, FiBox, FiArrowLeft, FiTag, FiChevronDown } from 'react-icons/fi'
import { useToast } from "../../shared/ui/Toast.jsx";
import { useNavigate, useParams } from "react-router-dom";
import { useI18n } from "../../shared/i18n/LanguageContext.jsx";

export default function ProductEdit() {
  const { id } = useParams();
  const { t } = useI18n();
  const [name, setName] = useState("");
  const [price, setPrice] = useState("");
  const [stock, setStock] = useState("");
  const [desc, setDesc] = useState("");
  const [category, setCategory] = useState("food");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [imageDataUrl, setImageDataUrl] = useState("");
  const [existingImageUrl, setExistingImageUrl] = useState("");
  const [imageError, setImageError] = useState("");
  const [showDropdown, setShowDropdown] = useState(false);
  const fileInputRef = useRef(null);
  const { notify } = useToast();
  const navigate = useNavigate();
  const categories = [
    { id: "food", name: t("Food"), icon: <span className="w-2 h-2 rounded-full bg-orange-500 inline-block" /> },
    { id: "groceries", name: t("Groceries"), icon: <span className="w-2 h-2 rounded-full bg-green-500 inline-block" /> },
    { id: "pharmacy", name: t("Pharmacy"), icon: <span className="w-2 h-2 rounded-full bg-pink-500 inline-block" /> },
    { id: "electronics", name: t("Electronics"), icon: <span className="w-2 h-2 rounded-full bg-blue-500 inline-block" /> },
    { id: "clothing", name: t("Clothing"), icon: <span className="w-2 h-2 rounded-full bg-purple-500 inline-block" /> },
    { id: "books", name: t("Books"), icon: <span className="w-2 h-2 rounded-full bg-amber-500 inline-block" /> },
    { id: "other", name: t("Other"), icon: <span className="w-2 h-2 rounded-full bg-gray-500 inline-block" /> },
  ];
  const selectedCategory = categories.find((c) => c.id === category);

  useEffect(() => {
    async function load() {
      try {
        const d = await get(`/api/products/${id}`);
        const p = d.data;
        setName(p?.name || "");
        setPrice(String(p?.price || ""));
        setStock(String(p?.stock || ""));
        setDesc(p?.description || "");
        setCategory(p?.category || "food");
        const firstImg =
          Array.isArray(p?.images) && p.images.length ? p.images[0] : null;
        setExistingImageUrl(firstImg?.url ? getImageUrl(firstImg.url) : "");
      } catch (err) {
        notify({
          type: "error",
          title: "Failed to load",
          message: err.message,
        });
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [id]);

  function onPickImage() {
    fileInputRef.current?.click();
  }

  function onFileChange(e) {
    setImageError("");
    const file = e.target.files?.[0];
    if (!file) return;
    const isImage = /^image\/(png|jpe?g|webp|gif)$/i.test(file.type);
    if (!isImage) {
      setImageError("Please select a valid image file");
      return;
    }
    const maxBytes = 5 * 1024 * 1024;
    if (file.size > maxBytes) {
      setImageError("Image must be under 5MB");
      return;
    }
    const reader = new FileReader();
    reader.onload = () => setImageDataUrl(String(reader.result || ""));
    reader.readAsDataURL(file);
  }

  function removeImage() {
    setImageDataUrl("");
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  async function save(e) {
    e.preventDefault();

    // Validate required fields
    if (!name.trim()) {
      notify({
        type: "error",
        title: "Validation Error",
        message: "Product name is required",
      });
      return;
    }

    if (!price.trim()) {
      notify({
        type: "error",
        title: "Validation Error",
        message: "Product price is required",
      });
      return;
    }

    // Validate price is a positive number
    const priceValue = parseFloat(price);
    if (isNaN(priceValue) || priceValue <= 0) {
      notify({
        type: "error",
        title: "Validation Error",
        message: "Please enter a valid price greater than 0",
      });
      return;
    }

    if (!stock.trim()) {
      notify({
        type: "error",
        title: "Validation Error",
        message: "Stock quantity is required",
      });
      return;
    }

    // Validate stock is a positive integer
    const stockValue = parseInt(stock);
    if (isNaN(stockValue) || stockValue < 0) {
      notify({
        type: "error",
        title: "Validation Error",
        message: "Please enter a valid stock quantity (0 or greater)",
      });
      return;
    }

    if (!category) {
      notify({
        type: "error",
        title: "Validation Error",
        message: "Please select a category",
      });
      return;
    }

    try {
      setSaving(true);

      // Create FormData for file upload
      const formData = new FormData();
      formData.append("name", name);
      formData.append("description", desc);
      formData.append("category", category);
      formData.append("price", parseFloat(price || 0));
      formData.append("stock", parseInt(stock || 0));

      // Add image file if a new one was selected
      if (fileInputRef.current?.files?.[0]) {
        formData.append("image", fileInputRef.current.files[0]);
      }

      // Use the uploadFormData helper
      await uploadFormData(`/api/products/${id}`, formData, "PUT");

      notify({ type: "success", title: "Saved" });
      navigate("/merchant/products");
    } catch (err) {
      notify({ type: "error", title: "Save failed", message: err.message });
    } finally {
      setSaving(false);
    }
  }

  async function remove() {
    try {
      await del(`/api/products/${id}`);
      notify({ type: "success", title: "Deleted" });
      navigate("/merchant/products");
    } catch (err) {
      notify({ type: "error", title: "Delete failed", message: err.message });
    }
  }

  if (loading) return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 to-amber-50/30 flex items-center justify-center p-4">
      <div className="text-center">
        <div className="w-12 h-12 border-4 border-orange-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
        <p className="text-gray-600">{t("Loading...")}</p>
      </div>
    </div>
  );

  const isFormValid = name && price && stock;

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 to-amber-50/30 p-4 pb-24">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-2xl mx-auto mb-6"
      >
        <div className="flex items-center gap-3 mb-2">
          <button
            onClick={() => navigate("/merchant/products")}
            className="p-2 bg-white rounded-2xl shadow-lg border border-orange-100 hover:shadow-xl transition-all"
          >
            <FiArrowLeft className="w-5 h-5 text-orange-600" />
          </button>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">{t("Edit Product")}</h1>
            <p className="text-gray-600 text-sm mt-1">{name || t("Update your product details")}</p>
          </div>
          <div className="ml-auto">
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={remove}
              className="flex items-center justify-center gap-2 bg-white text-red-600 rounded-2xl px-4 py-2 border border-red-200 hover:bg-red-50 transition-all"
            >
              <FiTrash2 className="w-4 h-4" /> {t("Delete")}
            </motion.button>
          </div>
        </div>
      </motion.div>

      <div className="max-w-2xl mx-auto">
        <motion.form
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          onSubmit={save}
          className="bg-white/80 backdrop-blur-sm rounded-3xl shadow-lg border border-orange-100 p-6 space-y-6"
        >
          <div>
            <div className="flex items-center gap-2 mb-4">
              <div className="p-2 bg-orange-100 rounded-xl">
                <FiImage className="w-4 h-4 text-orange-600" />
              </div>
              <h2 className="text-lg font-semibold text-gray-900">{t("Product Image")}</h2>
            </div>

            <AnimatePresence>
              {!(imageDataUrl || existingImageUrl) ? (
                <motion.button
                  type="button"
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={onPickImage}
                  className="w-full border-2 border-dashed border-gray-300 hover:border-orange-400 rounded-2xl p-8 bg-gray-50/50 text-gray-600 flex flex-col items-center justify-center gap-3 transition-all hover:bg-orange-50/50"
                >
                  <div className="p-3 bg-orange-100 rounded-xl">
                    <FiImage className="w-6 h-6 text-orange-600" />
                  </div>
                  <div className="text-center">
                    <div className="font-medium text-gray-900">{t("Upload Product Image")}</div>
                    <div className="text-sm text-gray-500 mt-1">PNG, JPG, WEBP, GIF • Max 5MB</div>
                  </div>
                </motion.button>
              ) : (
                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  className="relative"
                >
                  <img
                    src={imageDataUrl || existingImageUrl}
                    alt="Preview"
                    className="w-full h-64 object-cover rounded-2xl border-2 border-orange-200 shadow-md"
                  />
                  <motion.button
                    type="button"
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    onClick={removeImage}
                    className="absolute top-3 right-3 bg-white/90 text-red-600 rounded-full p-2 border border-red-200 shadow-lg hover:bg-red-50"
                  >
                    <FiX className="w-4 h-4" />
                  </motion.button>
                </motion.div>
              )}
            </AnimatePresence>

            {imageError && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="mt-2 p-3 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm"
              >
                {imageError}
              </motion.div>
            )}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/png,image/jpeg,image/webp,image/gif"
              className="hidden"
              onChange={onFileChange}
            />
          </div>

          <div>
            <div className="flex items-center gap-2 mb-4">
              <div className="p-2 bg-blue-100 rounded-xl">
                <FiTag className="w-4 h-4 text-blue-600" />
              </div>
              <h2 className="text-lg font-semibold text-gray-900">{t("Basic Information")}</h2>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">{t("Product Name")} *</label>
                <input
                  className="w-full border border-gray-200 rounded-2xl px-4 py-3 bg-gray-50/50 focus:bg-white focus:border-orange-300 focus:ring-2 focus:ring-orange-200 transition-all outline-none placeholder-gray-400"
                  placeholder={t("Enter product name")}
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="relative">
                  <label className="block text-sm font-medium text-gray-700 mb-2">{t("Category")} *</label>
                  <button
                    type="button"
                    onClick={() => setShowDropdown(!showDropdown)}
                    className="w-full flex items-center justify-between border border-gray-200 rounded-2xl pl-10 pr-4 py-3 bg-gray-50/50 focus:bg-white focus:border-orange-300 focus:ring-2 focus:ring-orange-200 transition-all relative"
                  >
                    <div className="flex items-center gap-2 text-gray-700">
                      {selectedCategory?.icon}
                      <span>{selectedCategory?.name}</span>
                    </div>
                    <FiChevronDown className={`w-4 h-4 text-gray-500 transition-transform ${showDropdown ? "rotate-180" : ""}`} />
                    <FiTag className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  </button>
                  <AnimatePresence>
                    {showDropdown && (
                      <motion.div
                        initial={{ opacity: 0, y: -5 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -5 }}
                        className="absolute z-20 mt-2 w-full bg-white border border-orange-100 rounded-2xl shadow-lg overflow-hidden"
                      >
                        {categories.map((c) => (
                          <button
                            key={c.id}
                            type="button"
                            onClick={() => {
                              setCategory(c.id);
                              setShowDropdown(false);
                            }}
                            className={`w-full flex items-center gap-2 px-4 py-3 text-left hover:bg-orange-50 transition-colors ${
                              c.id === category ? "bg-orange-100/60" : ""
                            }`}
                          >
                            {c.icon}
                            <span className="text-gray-700">{c.name}</span>
                          </button>
                        ))}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                {/* Price */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Price *</label>
                  <div className="relative">
                    <FiDollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                    <input
                      className="w-full border border-gray-200 rounded-2xl pl-10 pr-4 py-3 bg-gray-50/50 focus:bg-white focus:border-orange-300 focus:ring-2 focus:ring-orange-200 transition-all outline-none placeholder-gray-400"
                      placeholder="0.00"
                      inputMode="decimal"
                      value={price}
                      onChange={(e) => {
                        const value = e.target.value;
                        if (/^\d*\.?\d*$/.test(value)) {
                          setPrice(value);
                        }
                      }}
                    />
                  </div>
                </div>

                {/* Stock */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Stock *
                  </label>
                  <div className="relative">
                    <FiBox className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                    <input
                      className="w-full border border-gray-200 rounded-2xl pl-10 pr-4 py-3 bg-gray-50/50 focus:bg-white focus:border-orange-300 focus:ring-2 focus:ring-orange-200 transition-all outline-none placeholder-gray-400"
                      placeholder="0"
                      inputMode="decimal"
                      value={stock}
                      onChange={(e) => {
                        const value = e.target.value;
                        if (/^\d*\.?\d*$/.test(value)) {
                          setStock(value);
                        }
                      }}
                    />
                  </div>
                </div>
              </div>

              <textarea
                className="w-full border border-gray-200 rounded-2xl px-4 py-3 bg-gray-50/50 focus:bg-white focus:border-orange-300 focus:ring-2 focus:ring-orange-200 transition-all outline-none placeholder-gray-400 resize-none"
                rows={4}
                placeholder={t("Description")}
                value={desc}
                onChange={(e) => setDesc(e.target.value)}
              />
            </div>
          </div>

          <motion.button
            whileHover={{ scale: isFormValid && !saving ? 1.02 : 1 }}
            whileTap={{ scale: isFormValid && !saving ? 0.98 : 1 }}
            disabled={saving || !isFormValid}
            className={`w-full flex items-center justify-center gap-3 rounded-2xl py-4 font-semibold text-lg shadow-lg transition-all ${
              isFormValid && !saving
                ? "bg-gradient-to-r from-orange-500 to-amber-500 text-white hover:shadow-xl hover:from-orange-600 hover:to-amber-600"
                : "bg-gray-300 text-gray-500 cursor-not-allowed"
            }`}
          >
            <FiSave className="w-5 h-5" /> {saving ? t("Saving...") : t("Save Changes")}
          </motion.button>
        </motion.form>
      </div>
    </div>
  );
}
