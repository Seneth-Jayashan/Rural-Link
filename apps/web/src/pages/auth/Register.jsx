import { useState, useRef } from "react";
import { useI18n } from "../../shared/i18n/LanguageContext.jsx";
import { useAuth } from "../../shared/auth/AuthContext.jsx";
import { motion } from "framer-motion";
import {
  FiUser,
  FiMail,
  FiLock,
  FiUserCheck,
  FiChevronDown,
  FiPhone,
  FiBriefcase,
  FiFileText,
  FiEye,
  FiEyeOff,
  FiCamera,
  FiX,
  FiMapPin,
  FiHome,
  FiNavigation,
} from "react-icons/fi";
import { useToast } from "../../shared/ui/Toast.jsx";
import { useNavigate } from "react-router-dom";
import MapLocationSelector from "../../shared/ui/MapLocationSelector.jsx";

export default function Register() {
  const { t } = useI18n();
  const { register: registerUser } = useAuth();
  const { notify } = useToast();
  const navigate = useNavigate();

  const [form, setForm] = useState({
    firstName: "",
    lastName: "",
    email: "",
    password: "",
    confirmPassword: "",
    role: "customer",
    phone: "",
    businessName: "",
    profilePic: null,
    vehicleNumber: "",
    vehicleType: "",
    address: {
      street: "",
      city: "",
      state: "",
      zipCode: "",
      country: "Sri Lanka",
    },
    shopLocation: {
      street: "",
      city: "",
      state: "",
      zipCode: "",
      country: "Sri Lanka",
      coordinates: {
        latitude: null,
        longitude: null,
      },
      fullAddress: "",
    },
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [profilePicPreview, setProfilePicPreview] = useState(null);
  const profilePicRef = useRef(null);
  const [showShopLocationSelector, setShowShopLocationSelector] = useState(false);

  function update(k, v) {
    if (k.startsWith("address.")) {
      const addressField = k.split(".")[1];
      setForm((prev) => ({
        ...prev,
        address: {
          ...prev.address,
          [addressField]: v,
        },
      }));
    } else if (k.startsWith("shopLocation.")) {
      const shopLocationField = k.split(".")[1];
      setForm((prev) => ({
        ...prev,
        shopLocation: {
          ...prev.shopLocation,
          [shopLocationField]: v,
        },
      }));
    } else {
      setForm((prev) => ({ ...prev, [k]: v }));
    }
  }

  function handleProfilePicChange(e) {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        // 5MB limit
        notify({
          type: "error",
          title: t("Validation Error"),
          message: "Please select an image smaller than 5MB.",
        });
        return;
      }

      if (!file.type.startsWith("image/")) {
        notify({
          type: "error",
          title: t("Validation Error"),
          message: "Please select an image file.",
        });
        return;
      }

      setForm((prev) => ({ ...prev, profilePic: file }));

      // Create preview URL
      const reader = new FileReader();
      reader.onload = (e) => {
        setProfilePicPreview(e.target.result);
      };
      reader.readAsDataURL(file);
    }
  }

  function removeProfilePic() {
    setForm((prev) => ({ ...prev, profilePic: null }));
    setProfilePicPreview(null);
    // Clear the file input so the same file can be re-selected and to avoid stale file references
    try {
      if (profilePicRef && profilePicRef.current) profilePicRef.current.value = "";
    } catch (e) {
      // ignore
    }
  }

  function handleShopLocationSelect(location, address) {
    setForm((prev) => ({
      ...prev,
      shopLocation: {
        ...prev.shopLocation,
        coordinates: {
          latitude: location.latitude,
          longitude: location.longitude,
        },
        fullAddress: address,
      },
    }));
    setShowShopLocationSelector(false);
  }

  async function submit(e) {
    e.preventDefault();
    setLoading(true);
    setError("");
    setMessage("");

    // Validate required fields
    if (!form.firstName.trim()) {
      setError(t("First name is required"));
      notify({
        type: "error",
        title: t("Validation Error"),
        message: t("Please enter your first name"),
      });
      setLoading(false);
      return;
    }

    if (!form.lastName.trim()) {
      setError(t("Last name is required"));
      notify({
        type: "error",
        title: t("Validation Error"),
        message: t("Please enter your last name"),
      });
      setLoading(false);
      return;
    }

    if (!form.email.trim()) {
      setError(t("Email is required"));
      notify({
        type: "error",
        title: t("Validation Error"),
        message: t("Please enter your email address"),
      });
      setLoading(false);
      return;
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(form.email)) {
      setError(t("Invalid email format"));
      notify({
        type: "error",
        title: t("Validation Error"),
        message: t("Please enter a valid email address"),
      });
      setLoading(false);
      return;
    }

    if (!form.password.trim()) {
      setError(t("Password is required"));
      notify({
        type: "error",
        title: t("Validation Error"),
        message: t("Please enter a password"),
      });
      setLoading(false);
      return;
    }

    // Validate password strength
    if (form.password.length < 6) {
      setError(t("Password must be at least 6 characters long"));
      notify({
        type: "error",
        title: t("Validation Error"),
        message: t("Password must be at least 6 characters long"),
      });
      setLoading(false);
      return;
    }

    // Validate password confirmation
    if (form.password !== form.confirmPassword) {
      setError(t("Passwords do not match"));
      notify({
        type: "error",
        title: t("Validation Error"),
        message: t("Passwords do not match"),
      });
      setLoading(false);
      return;
    }

    if (!form.phone.trim()) {
      setError(t("Phone number is required"));
      notify({
        type: "error",
        title: t("Validation Error"),
        message: t("Please enter your phone number"),
      });
      setLoading(false);
      return;
    }

    // Validate phone number format (basic validation)
    const phoneRegex = /^[\+]?[0-9\s\-\(\)]{7,15}$/;
    if (!phoneRegex.test(form.phone)) {
      setError(t("Invalid phone number format"));
      notify({
        type: "error",
        title: t("Validation Error"),
        message: t("Please enter a valid phone number"),
      });
      setLoading(false);
      return;
    }

    // Validate address fields
    if (!form.address.street.trim()) {
      setError(t("Street address is required"));
      notify({
        type: "error",
        title: t("Validation Error"),
        message: t("Please enter your street address"),
      });
      setLoading(false);
      return;
    }

    if (!form.address.city.trim()) {
      setError(t("City is required"));
      notify({
        type: "error",
        title: t("Validation Error"),
        message: t("Please enter your city"),
      });
      setLoading(false);
      return;
    }

    if (!form.address.state.trim()) {
      setError(t("State/Province is required"));
      notify({
        type: "error",
        title: t("Validation Error"),
        message: t("Please enter your state or province"),
      });
      setLoading(false);
      return;
    }

    if (!form.address.zipCode.trim()) {
      setError(t("Postal code is required"));
      notify({
        type: "error",
        title: t("Validation Error"),
        message: t("Please enter your postal code"),
      });
      setLoading(false);
      return;
    }

    if (!form.address.country.trim()) {
      setError(t("Country is required"));
      notify({
        type: "error",
        title: t("Validation Error"),
        message: t("Please enter your country"),
      });
      setLoading(false);
      return;
    }

    // Validate business name for merchants
    if (form.role === "merchant" && !form.businessName.trim()) {
      setError(t("Business name is required for merchants"));
      notify({
        type: "error",
        title: t("Validation Error"),
        message: t("Please enter your business name"),
      });
      setLoading(false);
      return;
    }

    // Validate shop location for merchants
    if (form.role === "merchant" && (!form.shopLocation.coordinates.latitude || !form.shopLocation.coordinates.longitude)) {
      setError(t("Shop location is required for merchants"));
      notify({
        type: "error",
        title: t("Validation Error"),
        message: t("Please select your shop location on the map"),
      });
      setLoading(false);
      return;
    }

    // Validate vehicle details for deliver role
    if (form.role === "deliver") {
      if (!form.vehicleNumber.trim()) {
        setError(t("Vehicle number is required for deliver"))
        notify({ type: "error", title: t("Validation Error"), message: t("Please enter your vehicle number") })
        setLoading(false)
        return
      }
      if (!form.vehicleType.trim()) {
        setError(t("Vehicle type is required for deliver"))
        notify({ type: "error", title: t("Validation Error"), message: t("Please select your vehicle type") })
        setLoading(false)
        return
      }
    }

    try {
      await registerUser(form);
      setMessage(t("Registered successfully. Please verify your email."));
      notify({
        type: "success",
        title: t("Registration complete"),
        message: t("Check your email to verify your account."),
      });
      setTimeout(() => navigate("/login"), 1500);
    } catch (err) {
      setError(err.message);
      notify({
        type: "error",
        title: t("Registration failed"),
        message: err.message,
      });
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="relative min-h-screen bg-gradient-to-br from-orange-50 via-white to-orange-100 flex items-center justify-center px-5 py-10 text-black">
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="w-full max-w-sm bg-white rounded-3xl shadow-xl p-8 border border-orange-100 flex flex-col items-center"
      >
        {/* App header */}
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.3 }}
          className="flex flex-col items-center mb-6"
        >
          <div className="w-16 h-16 rounded-full bg-gradient-to-r from-orange-500 to-orange-600 flex items-center justify-center shadow-lg mb-3">
            <FiUser className="text-white text-2xl" />
          </div>
          <h1 className="text-2xl font-bold text-gray-800">
            {t("Create Account")}
          </h1>
          <p className="text-gray-500 text-sm mt-1">
            {t("Join us and start exploring")}
          </p>
        </motion.div>

        {/* Profile Picture Upload */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.3, delay: 0.1 }}
          className="flex flex-col items-center mb-6"
        >
          <div className="relative">
            <div className="w-24 h-24 rounded-full bg-gray-100 border-4 border-orange-200 flex items-center justify-center overflow-hidden">
              {profilePicPreview ? (
                <img
                  src={profilePicPreview}
                  alt="Profile preview"
                  className="w-full h-full object-cover"
                />
              ) : (
                <FiUser className="text-gray-400 text-3xl" />
              )}
            </div>

            <label
              htmlFor="profilePic"
              className="absolute -bottom-1 -right-1 w-8 h-8 bg-orange-500 rounded-full flex items-center justify-center cursor-pointer hover:bg-orange-600 transition-colors shadow-lg"
            >
              <FiCamera className="text-white text-sm" />
            </label>

            {profilePicPreview && (
              <button
                type="button"
                onClick={removeProfilePic}
                className="absolute -top-1 -right-1 w-6 h-6 bg-red-500 rounded-full flex items-center justify-center cursor-pointer hover:bg-red-600 transition-colors shadow-lg"
              >
                <FiX className="text-white text-xs" />
              </button>
            )}
          </div>

          <input
            id="profilePic"
            type="file"
            accept="image/*"
            onChange={handleProfilePicChange}
            ref={profilePicRef}
            className="hidden"
          />

          <p className="text-xs text-gray-500 mt-2 text-center">
            {t("Upload profile picture (optional)")}
          </p>
        </motion.div>

        {/* Form */}
        <form onSubmit={submit} className="w-full space-y-4">
          {/* Name fields */}
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-gray-50 rounded-2xl px-4 py-3 flex items-center gap-2 shadow-sm focus-within:ring-2 ring-orange-400 transition">
              <FiUser className="text-orange-500 text-lg" />
              <input
                className="flex-1 bg-transparent placeholder-gray-400 text-sm outline-none"
                placeholder={t("First name")}
                value={form.firstName}
                onChange={(e) => update("firstName", e.target.value)}
              />
            </div>
            <div className="bg-gray-50 rounded-2xl px-4 py-3 flex items-center gap-2 shadow-sm focus-within:ring-2 ring-orange-400 transition">
              <FiUser className="text-orange-500 text-lg" />
              <input
                className="flex-1 bg-transparent placeholder-gray-400 text-sm outline-none"
                placeholder={t("Last name")}
                value={form.lastName}
                onChange={(e) => update("lastName", e.target.value)}
              />
            </div>
          </div>

          <div className="bg-gray-50 rounded-2xl px-4 py-3 flex items-center gap-2 shadow-sm focus-within:ring-2 ring-orange-400 transition">
            <FiMail className="text-orange-500 text-lg" />
            <input
              className="flex-1 bg-transparent placeholder-gray-400 text-sm outline-none"
              placeholder={t("Email")}
              type="email"
              value={form.email}
              onChange={(e) => update("email", e.target.value)}
            />
          </div>

          <div className="bg-gray-50 rounded-2xl px-4 py-3 flex items-center gap-2 shadow-sm focus-within:ring-2 ring-orange-400 transition">
            <FiLock className="text-orange-500 text-lg" />
            <input
              className="flex-1 bg-transparent placeholder-gray-400 text-sm outline-none"
              placeholder={t("Password")}
              type={showPassword ? "text" : "password"}
              value={form.password}
              onChange={(e) => update("password", e.target.value)}
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="text-orange-500 hover:text-orange-600 transition-colors"
            >
              {showPassword ? (
                <FiEyeOff className="text-lg" />
              ) : (
                <FiEye className="text-lg" />
              )}
            </button>
          </div>

          <div className="bg-gray-50 rounded-2xl px-4 py-3 flex items-center gap-2 shadow-sm focus-within:ring-2 ring-orange-400 transition">
            <FiLock className="text-orange-500 text-lg" />
            <input
              className="flex-1 bg-transparent placeholder-gray-400 text-sm outline-none"
              placeholder={t("Confirm Password")}
              type={showConfirmPassword ? "text" : "password"}
              value={form.confirmPassword}
              onChange={(e) => update("confirmPassword", e.target.value)}
            />
            <button
              type="button"
              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
              className="text-orange-500 hover:text-orange-600 transition-colors"
            >
              {showConfirmPassword ? (
                <FiEyeOff className="text-lg" />
              ) : (
                <FiEye className="text-lg" />
              )}
            </button>
          </div>

          <div className="bg-gray-50 rounded-2xl px-4 py-3 flex items-center gap-2 shadow-sm focus-within:ring-2 ring-orange-400 transition">
            <FiPhone className="text-orange-500 text-lg" />
            <input
              className="flex-1 bg-transparent placeholder-gray-400 text-sm outline-none"
              placeholder={t("Phone number")}
              inputMode="numeric"
              value={form.phone}
              onChange={(e) => {
                const value = e.target.value;
                if (/^\d*$/.test(value)) {
                  update("phone", value);
                }
              }}
            />
          </div>

          {/* Address Section */}
          <div className="space-y-3">
            <div className="flex items-center gap-2 mb-2">
              <FiHome className="text-orange-500 text-lg" />
              <h3 className="text-sm font-medium text-gray-700">
                {t("Address Information")}
              </h3>
            </div>

            <div className="bg-gray-50 rounded-2xl px-4 py-3 flex items-center gap-2 shadow-sm focus-within:ring-2 ring-orange-400 transition">
              <FiMapPin className="text-orange-500 text-lg" />
              <input
                className="flex-1 bg-transparent placeholder-gray-400 text-sm outline-none"
                placeholder={t("Street Address")}
                value={form.address.street}
                onChange={(e) => update("address.street", e.target.value)}
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="bg-gray-50 rounded-2xl px-4 py-3 flex items-center gap-2 shadow-sm focus-within:ring-2 ring-orange-400 transition">
                <FiMapPin className="text-orange-500 text-lg" />
                <input
                  className="flex-1 bg-transparent placeholder-gray-400 text-sm outline-none"
                  placeholder={t("City")}
                  value={form.address.city}
                  onChange={(e) => update("address.city", e.target.value)}
                />
              </div>
              <div className="bg-gray-50 rounded-2xl px-4 py-3 flex items-center gap-2 shadow-sm focus-within:ring-2 ring-orange-400 transition">
                <FiMapPin className="text-orange-500 text-lg" />
                <input
                  className="flex-1 bg-transparent placeholder-gray-400 text-sm outline-none"
                  placeholder={t("State/Province")}
                  value={form.address.state}
                  onChange={(e) => update("address.state", e.target.value)}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="bg-gray-50 rounded-2xl px-4 py-3 flex items-center gap-2 shadow-sm focus-within:ring-2 ring-orange-400 transition">
                <FiMapPin className="text-orange-500 text-lg" />
                <input
                  className="flex-1 bg-transparent placeholder-gray-400 text-sm outline-none"
                  placeholder={t("Postal Code")}
                  value={form.address.zipCode}
                  onChange={(e) => update("address.zipCode", e.target.value)}
                />
              </div>
              <div className="bg-gray-50 rounded-2xl px-4 py-3 flex items-center gap-2 shadow-sm focus-within:ring-2 ring-orange-400 transition">
                <FiMapPin className="text-orange-500 text-lg" />
                <input
                  className="flex-1 bg-transparent placeholder-gray-400 text-sm outline-none"
                  placeholder={t("Country")}
                  value={form.address.country}
                  onChange={(e) => update("address.country", e.target.value)}
                />
              </div>
            </div>
          </div>

          {/* Role Dropdown */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setDropdownOpen(!dropdownOpen)}
              className="w-full bg-gray-50 rounded-2xl px-4 py-3 flex items-center justify-between shadow-sm focus-within:ring-2 ring-orange-400 transition text-sm text-black"
            >
              <div className="flex items-center gap-2">
                <FiUserCheck className="text-orange-500 text-lg" />
                <span className="capitalize">{t(form.role)}</span>
              </div>
              <FiChevronDown
                className={`text-orange-500 transition-transform duration-200 ${
                  dropdownOpen ? "rotate-180" : ""
                }`}
              />
            </button>

            {dropdownOpen && (
              <motion.div
                initial={{ opacity: 0, y: -5 }}
                animate={{ opacity: 1, y: 0 }}
                className="absolute w-full bg-white border border-gray-200 rounded-xl shadow-md mt-2 overflow-hidden z-10"
              >
                {["customer", "merchant", "deliver"].map((r) => (
                  <button
                    key={r}
                    type="button"
                    onClick={() => {
                      update("role", r);
                      setDropdownOpen(false);
                    }}
                    className={`w-full text-left px-4 py-3 text-sm capitalize ${
                      form.role === r
                        ? "bg-orange-50 text-orange-600 font-medium"
                        : "text-gray-700 hover:bg-gray-100"
                    }`}
                  >
                    {t(r)}
                  </button>
                ))}
              </motion.div>
            )}
          </div>

          {/* Merchant fields */}
          {form.role === "merchant" && (
            <div className="space-y-3">
              <div className="bg-gray-50 rounded-2xl px-4 py-3 flex items-center gap-2 shadow-sm focus-within:ring-2 ring-orange-400 transition">
                <FiBriefcase className="text-orange-500 text-lg" />
                <input
                  className="flex-1 bg-transparent placeholder-gray-400 text-sm outline-none"
                  placeholder={t("Business name")}
                  value={form.businessName}
                  onChange={(e) => update("businessName", e.target.value)}
                />
              </div>

              {/* Shop Location Section */}
              <div className="space-y-3">
                <div className="flex items-center gap-2 mb-2">
                  <FiMapPin className="text-orange-500 text-lg" />
                  <h3 className="text-sm font-medium text-gray-700">
                    {t("Shop Location")}
                  </h3>
                </div>

                <button
                  type="button"
                  onClick={() => setShowShopLocationSelector(true)}
                  className="w-full bg-gray-50 rounded-2xl px-4 py-3 flex items-center gap-2 shadow-sm hover:bg-gray-100 transition-colors text-left overflow-hidden"
                  title={form.shopLocation.fullAddress || (form.shopLocation.coordinates.latitude ? `${form.shopLocation.coordinates.latitude.toFixed(6)}, ${form.shopLocation.coordinates.longitude.toFixed(6)}` : '')}
                >
                  <FiNavigation className="text-orange-500 text-lg" />
                  <div className="flex-1">
                    {form.shopLocation.coordinates.latitude ? (
                      <div>
                        <div className="text-sm font-medium text-gray-900">
                          {t("Shop location selected")}
                        </div>
                        <div className="text-xs text-gray-600 truncate overflow-hidden whitespace-nowrap">
                          {form.shopLocation.fullAddress || 
                           `${form.shopLocation.coordinates.latitude.toFixed(6)}, ${form.shopLocation.coordinates.longitude.toFixed(6)}`}
                        </div>
                      </div>
                    ) : (
                      <div className="text-sm text-gray-500">
                        {t("Click to select shop location on map")}
                      </div>
                    )}
                  </div>
                  <FiMapPin className="text-orange-500 text-lg" />
                </button>
              </div>
            </div>
          )}

          {/* Deliver fields */}
          {form.role === "deliver" && (
            <div className="space-y-3">
              <div className="bg-gray-50 rounded-2xl px-4 py-3 flex items-center gap-2 shadow-sm focus-within:ring-2 ring-orange-400 transition">
                <FiFileText className="text-orange-500 text-lg" />
                <input
                  className="flex-1 bg-transparent placeholder-gray-400 text-sm outline-none"
                  placeholder={t("Vehicle number (e.g., ABC-1234)")}
                  value={form.vehicleNumber}
                  onChange={(e) => update("vehicleNumber", e.target.value)}
                />
              </div>
              <div className="bg-gray-50 rounded-2xl px-4 py-3 flex items-center gap-2 shadow-sm focus-within:ring-2 ring-orange-400 transition">
                <FiBriefcase className="text-orange-500 text-lg" />
                <select
                  className="flex-1 bg-transparent text-sm outline-none"
                  value={form.vehicleType}
                  onChange={(e) => update("vehicleType", e.target.value)}
                >
                  <option value="">{t("Select vehicle type")}</option>
                  <option value="motor_bike">{t("Motor Bike")}</option>
                  <option value="car">{t("Car")}</option>
                  <option value="three_wheel">{t("Three Wheel")}</option>
                </select>
              </div>
            </div>
          )}

          {error && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-red-500 text-sm text-center"
            >
              {error}
            </motion.div>
          )}

          {message && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-green-600 text-sm text-center"
            >
              {message}
            </motion.div>
          )}

          <motion.button
            whileTap={{ scale: 0.97 }}
            disabled={loading}
            className="w-full bg-gradient-to-r from-orange-500 to-orange-600 text-white font-semibold py-3 rounded-2xl mt-2 shadow-md hover:shadow-lg transition-all disabled:opacity-70 active:scale-95"
          >
            {loading ? t("Registering...") : t("Register")}
          </motion.button>
        </form>

        <div className="flex flex-col items-center mt-5">
          <p className="text-center text-sm text-gray-600">
            {t("Already have an account?")}{" "}
            <a
              href="/login"
              className="text-orange-600 font-medium hover:underline"
            >
              {t("Login")}
            </a>
          </p>
        </div>
      </motion.div>

      {/* Background glow accent */}
      <motion.div
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ duration: 1 }}
        className="absolute bottom-0 left-0 w-40 h-40 bg-orange-200 rounded-full blur-3xl opacity-30"
      />

      {/* Shop Location Selector Modal */}
      {showShopLocationSelector && (
        <MapLocationSelector
          onLocationSelect={handleShopLocationSelect}
          initialLocation={form.shopLocation.coordinates.latitude ? form.shopLocation.coordinates : null}
          onClose={() => setShowShopLocationSelector(false)}
        />
      )}
    </div>
  );
}
