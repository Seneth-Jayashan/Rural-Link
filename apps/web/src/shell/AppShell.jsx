import { Outlet, Link, useLocation } from "react-router-dom";
import { useEffect, useState } from "react";
import { useI18n } from "../shared/i18n/LanguageContext.jsx";
import { useAuth } from "../shared/auth/AuthContext.jsx";
import { motion } from "framer-motion";
import { Home, Store, Truck, PlusCircle, ShoppingCart, User2 } from "lucide-react";

export function AppShell() {
  const location = useLocation();
  const { user, logout } = useAuth();
  const { t } = useI18n();

  return (
    <div className="min-h-dvh flex flex-col font-inter relative">
      {/* Header */}
      <motion.header
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.3 }}
        className="fixed top-0 left-0 right-0 z-20 bg-gradient-to-b from-black/40 to-transparent backdrop-blur-md px-5 py-4 flex items-center justify-between shadow-md"
      >
        <Link
          to="/"
          className="text-2xl font-bold text-[#f97316] hover:text-white transition-all duration-200 tracking-wide"
        >
          Rural Link
        </Link>

        <nav className="flex items-center gap-4 text-sm font-medium">
          {!user && (
            <>
              <Link
                to="/login"
                className="text-white hover:text-[#f97316] transition-all duration-200"
              >
                {t("Login")}
              </Link>
              <Link
                to="/register"
                className="text-white hover:text-[#f97316] transition-all duration-200"
              >
                {t("Register")}
              </Link>
            </>
          )}

          {user && (
            <motion.button
              whileHover={{ scale: 1.05 }}
              onClick={logout}
              className="px-3 py-1.5 bg-[#f97316]/20 rounded-md text-[#f97316] hover:bg-[#f97316]/30 hover:text-white font-semibold transition-all duration-200"
            >
              {t("Logout")}
            </motion.button>
          )}

          <LanguageSwitcher />
        </nav>
      </motion.header>

      {/* Main Content */}
      <main className="flex-1 pt-16 pb-20">
        <Outlet />
      </main>

      {/* Bottom Navigation */}
      {user && (
        <motion.nav
          initial={{ y: 30, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.3 }}
          className="fixed bottom-4 inset-x-4 
            bg-white/90 backdrop-blur-xl rounded-2xl py-3 
            flex justify-around shadow-lg border border-orange-100"
        >
          {user.role === "customer" && (
            <>
              <NavItem
                to="/"
                icon={<Home size={22} />}
                label={t("Home")}
                active={location.pathname === "/"}
              />
              <NavItem
                to="/cart"
                icon={<ShoppingCart size={22} />}
                label={t("Cart")}
                active={location.pathname.startsWith("/cart")}
              />
              <NavItem
                to="/track"
                icon={<Truck size={22} />}
                label={t("Track")}
                active={location.pathname.startsWith("/track")}
              />
              <NavItem
                to="/account"
                icon={<User2 size={22} />}
                label={t("Account")}
                active={location.pathname.startsWith("/account")}
              />
            </>
          )}

          {user.role === "merchant" && (
            <>
              <NavItem
                to="/merchant/orders"
                icon={<ShoppingCart size={22} />}
                label={t("Orders")}
                active={location.pathname.startsWith("/merchant/orders")}
              />
              <NavItem
                to="/merchant/products"
                icon={<Store size={22} />}
                label={t("Products")}
                active={
                  location.pathname.startsWith("/merchant/products") &&
                  !location.pathname.endsWith("/new")
                }
              />
              <NavItem
                to="/merchant/products/new"
                icon={<PlusCircle size={22} />}
                label={t("Add")}
                active={location.pathname === "/merchant/products/new"}
              />
              <NavItem
                to="/account"
                icon={<User2 size={22} />}
                label={t("Account")}
                active={location.pathname.startsWith("/account")}
              />
            </>
          )}

          {user.role === "deliver" && (
            <>
              <NavItem
                to="/deliver"
                icon={<Truck size={22} />}
                label={t("Deliver")}
                active={location.pathname.startsWith("/deliver")}
              />
              <NavItem
                to="/account"
                icon={<User2 size={22} />}
                label={t("Account")}
                active={location.pathname.startsWith("/account")}
              />
            </>
          )}
        </motion.nav>
      )}
    </div>
  );
}

function NavItem({ to, icon, label, active }) {
  return (
    <Link
      to={to}
      className={`flex flex-col items-center gap-1 text-xs font-medium transition-all duration-200 ${
        active
          ? "text-orange-600 scale-110"
          : "text-gray-600 hover:text-orange-500"
      }`}
    >
      <div className={`p-2 rounded-xl transition-all duration-200 ${
        active 
          ? "bg-orange-100 shadow-inner" 
          : "bg-transparent"
      }`}>
        {icon}
      </div>
      <span className="font-semibold">{label}</span>
    </Link>
  );
}

function LanguageSwitcher() {
  const { lang: ctxLang, setLang } = useI18n();
  const [lang, setLocalLang] = useState(
    localStorage.getItem("lang") || ctxLang || "en"
  );

  useEffect(() => {
    localStorage.setItem("lang", lang);
    setLang(lang);
  }, [lang]);

  return (
    <motion.select
      whileHover={{ scale: 1.05 }}
      value={lang}
      onChange={(e) => setLocalLang(e.target.value)}
      className="bg-white/80 border border-orange-200 text-gray-700 text-sm rounded-xl px-3 py-2 focus:outline-none cursor-pointer focus:border-orange-300 focus:ring-2 focus:ring-orange-200 transition-all duration-200"
    >
      <option value="en" className="bg-white text-gray-900">
        EN
      </option>
      <option value="si" className="bg-white text-gray-900">
        SI
      </option>
      <option value="ta" className="bg-white text-gray-900">
        TA
      </option>
    </motion.select>
  );
}