import { motion, AnimatePresence } from "framer-motion";
import { useEffect, useState } from "react";
import { WifiOff, Wifi } from "lucide-react";

function OfflineBanner() {
  const [offline, setOffline] = useState(false);
  const [justOnline, setJustOnline] = useState(false);

  useEffect(() => {
    if (localStorage.getItem("iot_offline")) setOffline(true);

    const handleOffline = () => setOffline(true);
    const handleOnline = () => {
      setOffline(false);
      setJustOnline(true);
      setTimeout(() => setJustOnline(false), 3000);
    };

    window.addEventListener("iot_offline", handleOffline);
    window.addEventListener("iot_online", handleOnline);
    return () => {
      window.removeEventListener("iot_offline", handleOffline);
      window.removeEventListener("iot_online", handleOnline);
    };
  }, []);

  return (
    <AnimatePresence>
      {offline && (
        <motion.div
          key="offline"
          initial={{ opacity: 0, y: -40 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -40 }}
          transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            zIndex: 999998,
            background: "rgba(251,191,36,0.12)",
            backdropFilter: "blur(12px)",
            borderBottom: "1px solid rgba(251,191,36,0.25)",
            padding: "10px 20px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 10,
          }}
        >
          <WifiOff size={15} color="#fbbf24" />
          <span style={{ fontSize: 13, color: "#fbbf24", fontWeight: 600 }}>
            Sin conexión — mostrando datos guardados
          </span>
          <motion.div
            animate={{ opacity: [1, 0.3, 1] }}
            transition={{ duration: 1.5, repeat: Infinity }}
            style={{ width: 7, height: 7, borderRadius: "50%", background: "#fbbf24" }}
          />
        </motion.div>
      )}

      {justOnline && (
        <motion.div
          key="online"
          initial={{ opacity: 0, y: 60, scale: 0.9 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 40, scale: 0.95 }}
          transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
          style={{
            position: "fixed",
            bottom: 28,
            left: "50%",
            transform: "translateX(-50%)",
            zIndex: 999998,
            pointerEvents: "none",
            background: "rgba(8,14,10,0.97)",
            border: "1px solid rgba(52,211,153,0.25)",
            borderRadius: 16,
            padding: "12px 20px",
            display: "flex",
            alignItems: "center",
            gap: 10,
            boxShadow: "0 16px 48px rgba(0,0,0,0.7)",
          }}
        >
          <Wifi size={16} color="#34d399" />
          <span style={{ fontSize: 13, color: "#34d399", fontWeight: 600 }}>
            Conexión restaurada ✓
          </span>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

export default OfflineBanner;
