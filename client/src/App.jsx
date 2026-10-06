import { AnimatePresence, motion } from "framer-motion";
import { useAuth } from "./context/AuthContext.jsx";
import { AuthPage } from "./pages/AuthPage.jsx";
import { Dashboard } from "./pages/Dashboard.jsx";
import { IconLogo } from "./components/icons.jsx";

export default function App() {
  const { authed, booting } = useAuth();

  if (booting) {
    return (
      <div className="boot">
        <div className="boot-mark"><IconLogo width="38" height="38" /></div>
      </div>
    );
  }

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={authed ? "app" : "auth"}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0, transition: { duration: 0.2 } }}
        transition={{ duration: 0.35, ease: "easeOut" }}
      >
        {authed ? <Dashboard /> : <AuthPage />}
      </motion.div>
    </AnimatePresence>
  );
}
