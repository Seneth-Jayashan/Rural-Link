import { Outlet, Link, useLocation } from "react-router-dom";
import { useEffect, useState } from "react";
import { useI18n } from "../shared/i18n/LanguageContext.jsx";
import { useAuth } from "../shared/auth/AuthContext.jsx";
import { motion } from "framer-motion";
import { Home, Store, Truck, PlusCircle, ShoppingCart } from "lucide-react";

export function AppShell() {
  const location = useLocation();
  const { user, logout } = useAuth();
  const { t } = useI18n();

  return (
    <div className="min-h-dvh flex flex-col bg-black text-black font-inter">
      {/* Header */}
      <motion.header
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.3 }}
        className="sticky top-0 z-20 bg-black/95 backdrop-blur-sm px-5 py-3 flex items-center justify-between"
      >
        <Link
          to="/"
          className="text-2xl font-bold text-[#f97316] hover:text-white transition-all duration-200"
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
                {t('Login')}
              </Link>
              <Link
                to="/register"
                className="text-white hover:text-[#f97316] transition-all duration-200"
              >
                {t('Register')}
              </Link>
            </>
          )}

          {user && (
            <button
              onClick={logout}
              className="text-[#f97316] hover:text-white font-semibold transition-all duration-200"
            >
              {t('Logout')}
            </button>
          )}

          <LanguageSwitcher />
        </nav>
      </motion.header>

      {/* Main Content */}
      <main className="flex-1 px-5 py-4 bg-white">
        <Outlet />
      </main>

      {/* Bottom Navigation */}
      {user && (
        <motion.nav
          initial={{ y: 30, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.3 }}
          className="fixed bottom-0 inset-x-0 bg-white border-t border-gray-300 py-2 flex justify-around"
        >
          {user.role === "customer" && (
            <>
              <NavItem
                to="/"
                icon={<Home size={20} />}
                label={t("Home")}
                active={location.pathname === "/"}
              />
              <NavItem
                to="/cart"
                icon={<ShoppingCart size={20} />}
                label={t("Cart")}
                active={location.pathname.startsWith("/cart")}
              />
              <NavItem
                to="/track/last"
                icon={<Truck size={20} />}
                label={t("Track")}
                active={location.pathname.startsWith("/track")}
              />
            </>
          )}

          {user.role === "merchant" && (
            <>
              <NavItem
                to="/merchant/orders"
                icon={<ShoppingCart size={20} />}
                label={t("Orders")}
                active={location.pathname.startsWith("/merchant/orders")}
              />
              <NavItem
                to="/merchant/products"
                icon={<Store size={20} />}
                label={t("Products")}
                active={location.pathname.startsWith("/merchant/products") && !location.pathname.endsWith('/new')}
              />
              <NavItem
                to="/merchant/products/new"
                icon={<PlusCircle size={20} />}
                label={t("Add")}
                active={location.pathname === "/merchant/products/new"}
              />
            </>
          )}

          {user.role === "deliver" && (
            <NavItem
              to="/deliver"
              icon={<Truck size={20} />}
              label={t("Deliver")}
              active={location.pathname.startsWith("/deliver")}
            />
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
          ? "text-[#f97316] scale-105"
          : "text-gray-500 hover:text-[#f97316] hover:scale-105"
      }`}
    >
      {icon}
      <span>{label}</span>
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
      className="bg-white text-black text-sm border border-gray-300 rounded px-2 py-1 focus:outline-none cursor-pointer"
    >
      <option value="en">EN</option>
      <option value="si">SI</option>
      <option value="ta">TA</option>
    </motion.select>
  );
}
