import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { motion, AnimatePresence, Reorder, useReducedMotion, useScroll, useTransform } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { Search, SlidersHorizontal, ArrowLeft, Plus, GripVertical, Droplets, Thermometer, Zap } from "lucide-react";
import api from "../api";
import Navbar    from "../components/layout/Navbar";
import PlantCard from "../components/plant/PlantCard";
import PlantModal from "../components/plant/PlantModal";
import { PlantGridSkeleton } from "../components/plant/PlantCardSkeleton";
import EmptyPlants from "../components/plant/EmptyPlants";
import AlertHistoryModal from "../components/plant/AlertHistoryModal";
import { useToast } from "../context/ToastProvider";
import { useNotifications } from "../hooks/useNotifications";
import { useSocket } from "../hooks/useSocket";

// ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚ÂÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚ÂÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ Opciones de filtro ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚ÂÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚ÂÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚ÂÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚ÂÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚ÂÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚ÂÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚ÂÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚ÂÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚ÂÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚ÂÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚ÂÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚ÂÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚ÂÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚ÂÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚ÂÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚ÂÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚ÂÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚ÂÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚ÂÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚ÂÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚ÂÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚ÂÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚ÂÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚ÂÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚ÂÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚ÂÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚ÂÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚ÂÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚ÂÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚ÂÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚ÂÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚ÂÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚ÂÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚ÂÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚ÂÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚ÂÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚ÂÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬
const SORT_OPTIONS = [
  { value: "order",         label: "Personalizado" },
  { value: "name-asc",      label: "Nombre A-Z"    },
  { value: "name-desc",     label: "Nombre Z-A"    },
  { value: "humidity-asc",  label: "Humedad \u2191" },
  { value: "humidity-desc", label: "Humedad \u2193" },
];

const STATUS_CHIPS = [
  { value: "all",      label: "Todas",     icon: null },
  { value: "active",   label: "Regando",   icon: "\uD83D\uDCA7" },
  { value: "inactive", label: "Inactivas", icon: "\u23F8" },
  { value: "alert",    label: "Alerta",    icon: "\u26A0" },
];

// ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚ÂÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚ÂÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ Tema por sector ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚ÂÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚ÂÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚ÂÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚ÂÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚ÂÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚ÂÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚ÂÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚ÂÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚ÂÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚ÂÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚ÂÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚ÂÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚ÂÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚ÂÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚ÂÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚ÂÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚ÂÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚ÂÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚ÂÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚ÂÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚ÂÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚ÂÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚ÂÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚ÂÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚ÂÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚ÂÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚ÂÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚ÂÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚ÂÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚ÂÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚ÂÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚ÂÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚ÂÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚ÂÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚ÂÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚ÂÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚ÂÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚ÂÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚ÂÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚ÂÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬
const SECTOR_THEME = {
  Superior: {
    gradient:     "linear-gradient(135deg, #064e3b 0%, #065f46 40%, #0f172a 100%)",
    gradientHero: "linear-gradient(160deg, #022c22 0%, #064e3b 35%, #0a3d2e 65%, #050d0a 100%)",
    accent:       "#34d399",
    accentDim:    "rgba(52,211,153,0.15)",
    accentBorder: "rgba(52,211,153,0.30)",
    glow:         "rgba(52,211,153,0.20)",
    glowStrong:   "rgba(52,211,153,0.45)",
    orb1:         "rgba(52,211,153,0.18)",
    orb2:         "rgba(16,185,129,0.12)",
    orb3:         "rgba(5,150,105,0.10)",
    particle:     "rgba(52,211,153,0.6)",
    icon:         "\uD83C\uDF3F",
    label:        "Patio Superior",
    sublabel:     "Zona verde principal",
    img:          "https://images.unsplash.com/photo-1416879595882-3373a0480b5b?w=1200&q=60",
  },
  Inferior: {
    gradient:     "linear-gradient(135deg, #1e1b4b 0%, #312e81 40%, #0f172a 100%)",
    gradientHero: "linear-gradient(160deg, #0f0e1f 0%, #1e1b4b 35%, #252060 65%, #0a0918 100%)",
    accent:       "#818cf8",
    accentDim:    "rgba(129,140,248,0.15)",
    accentBorder: "rgba(129,140,248,0.30)",
    glow:         "rgba(129,140,248,0.20)",
    glowStrong:   "rgba(129,140,248,0.45)",
    orb1:         "rgba(129,140,248,0.18)",
    orb2:         "rgba(99,102,241,0.12)",
    orb3:         "rgba(167,139,250,0.10)",
    particle:     "rgba(129,140,248,0.6)",
    icon:         "\uD83C\uDF31",
    label:        "Patio Inferior",
    sublabel:     "Zona de cultivo interior",
    img:          "https://images.unsplash.com/photo-1585320806297-9794b3e4eeae?w=1200&q=60",
  },
};

// ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚ÂÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚ÂÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ Componente de partÃƒÆ’Ã‚Â­culas flotantes ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚ÂÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚ÂÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚ÂÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚ÂÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚ÂÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚ÂÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚ÂÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚ÂÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚ÂÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚ÂÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚ÂÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚ÂÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚ÂÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚ÂÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚ÂÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚ÂÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚ÂÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚ÂÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚ÂÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚ÂÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚ÂÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬
function FloatingParticles({ color, count = 18, reducedMotion = false }) {
  const particles = useMemo(() =>
    Array.from({ length: count }, (_, i) => ({
      id: i,
      x:    Math.random() * 100,
      y:    Math.random() * 100,
      size: Math.random() * 4 + 1.5,
      dur:  Math.random() * 8 + 6,
      del:  Math.random() * 4,
      dx:   (Math.random() - 0.5) * 60,
      dy:   -(Math.random() * 80 + 40),
    })),
  [count]);

  if (reducedMotion || count <= 0) return null;

  return (
    <div className="sp-particles" aria-hidden>
      {particles.map(p => (
        <motion.div
          key={p.id}
          className="sp-particle"
          style={{
            left:   `${p.x}%`,
            top:    `${p.y}%`,
            width:  p.size,
            height: p.size,
            background: color,
          }}
          animate={{
            x:       [0, p.dx, 0],
            y:       [0, p.dy, 0],
            opacity: [0, 0.8, 0],
            scale:   [0.5, 1.2, 0.5],
          }}
          transition={{
            duration: p.dur,
            delay:    p.del,
            repeat:   Infinity,
            ease:     "easeInOut",
          }}
        />
      ))}
    </div>
  );
}

// ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚ÂÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚ÂÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ Orbs de fondo animados ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚ÂÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚ÂÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚ÂÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚ÂÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚ÂÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚ÂÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚ÂÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚ÂÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚ÂÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚ÂÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚ÂÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚ÂÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚ÂÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚ÂÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚ÂÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚ÂÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚ÂÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚ÂÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚ÂÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚ÂÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚ÂÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚ÂÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚ÂÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚ÂÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚ÂÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚ÂÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚ÂÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚ÂÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚ÂÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚ÂÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚ÂÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚ÂÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚ÂÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬
function BackgroundOrbs({ theme, compact = false, reducedMotion = false }) {
  const orbMotion = reducedMotion
    ? {}
    : {
        orb1: { scale: [1, compact ? 1.06 : 1.15, 1], x: [0, compact ? 14 : 30, 0], y: [0, compact ? -10 : -20, 0] },
        orb2: { scale: [1, compact ? 1.08 : 1.2, 1], x: [0, compact ? -12 : -25, 0], y: [0, compact ? 14 : 30, 0] },
        orb3: { scale: [1, compact ? 1.05 : 1.1, 1], x: [0, compact ? 10 : 20, 0], y: [0, compact ? 10 : 20, 0] },
      };

  return (
    <>
      <motion.div
        className="sp-orb sp-orb-1"
        style={{ background: `radial-gradient(circle, ${theme.orb1} 0%, transparent 70%)` }}
        animate={orbMotion.orb1}
        transition={reducedMotion ? undefined : { duration: 12, repeat: Infinity, ease: "easeInOut" }}
      />
      <motion.div
        className="sp-orb sp-orb-2"
        style={{ background: `radial-gradient(circle, ${theme.orb2} 0%, transparent 70%)` }}
        animate={orbMotion.orb2}
        transition={reducedMotion ? undefined : { duration: 9, repeat: Infinity, ease: "easeInOut", delay: 2 }}
      />
      <motion.div
        className="sp-orb sp-orb-3"
        style={{ background: `radial-gradient(circle, ${theme.orb3} 0%, transparent 70%)` }}
        animate={orbMotion.orb3}
        transition={reducedMotion ? undefined : { duration: 14, repeat: Infinity, ease: "easeInOut", delay: 5 }}
      />
    </>
  );
}

// ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚ÂÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚ÂÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ Stat card del hero ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚ÂÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚ÂÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚ÂÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚ÂÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚ÂÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚ÂÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚ÂÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚ÂÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚ÂÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚ÂÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚ÂÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚ÂÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚ÂÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚ÂÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚ÂÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚ÂÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚ÂÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚ÂÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚ÂÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚ÂÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚ÂÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚ÂÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚ÂÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚ÂÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚ÂÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚ÂÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚ÂÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚ÂÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚ÂÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚ÂÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚ÂÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚ÂÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚ÂÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚ÂÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚ÂÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚ÂÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚ÂÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬
function HeroStat({ label, value, color, icon: Icon, index }) {
  return (
    <motion.div
      className="sp-hero-stat"
      initial={{ opacity: 0, y: 20, scale: 0.85 }}
      animate={{ opacity: 1, y: 0,  scale: 1 }}
      transition={{ delay: 0.35 + index * 0.08, ease: [0.34, 1.56, 0.64, 1] }}
      style={{ "--stat-color": color }}
      whileHover={{ y: -4, scale: 1.04 }}
    >
      {Icon && (
        <div className="sp-hero-stat-icon">
          <Icon size={14} strokeWidth={2} />
        </div>
      )}
      <span className="sp-hero-stat-val">{value}</span>
      <span className="sp-hero-stat-lbl">{label}</span>
    </motion.div>
  );
}

// ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚ÂÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚ÂÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ Componente principal ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚ÂÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚ÂÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚ÂÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚ÂÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚ÂÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚ÂÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚ÂÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚ÂÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚ÂÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚ÂÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚ÂÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚ÂÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚ÂÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚ÂÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚ÂÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚ÂÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚ÂÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚ÂÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚ÂÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚ÂÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚ÂÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚ÂÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚ÂÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚ÂÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚ÂÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚ÂÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚ÂÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚ÂÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚ÂÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚ÂÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚ÂÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚ÂÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚ÂÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚ÂÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚ÂÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬
function SectorPage({ sector }) {
  const toast    = useToast();
  const navigate = useNavigate();
  const theme    = SECTOR_THEME[sector] || SECTOR_THEME.Superior;
  const heroRef  = useRef(null);
  const prefersReducedMotion = useReducedMotion();
  const { requestPermission, checkPlants } = useNotifications();
  const [viewport, setViewport] = useState(() => ({
    width: typeof window !== "undefined" ? window.innerWidth : 1280,
    height: typeof window !== "undefined" ? window.innerHeight : 800,
  }));

  const [plants,        setPlants]        = useState([]);
  const [loading,       setLoading]       = useState(true);
  const [showModal,     setShowModal]     = useState(false);
  const [editingPlant,  setEditingPlant]  = useState(null);
  const [alertPlant,    setAlertPlant]    = useState(null);
  const [search,        setSearch]        = useState("");
  const [sort,          setSort]          = useState("order");
  const [status,        setStatus]        = useState("all");
  const [dragEnabled,   setDragEnabled]   = useState(false);
  const [orderedPlants, setOrderedPlants] = useState([]);
  const compactMotion = viewport.width < 900;
  const particleCount = prefersReducedMotion ? 0 : viewport.width < 640 ? 8 : viewport.width < 1024 ? 12 : 18;
  const viewportKey = `${Math.round(viewport.width / 120)}-${Math.round(viewport.height / 120)}`;

  // Parallax del hero
  const { scrollY } = useScroll();
  const heroY       = useTransform(scrollY, [0, 300], [0, compactMotion ? 18 : 60]);
  const heroOpacity = useTransform(scrollY, [0, 200], [1, compactMotion ? 0.86 : 0.6]);

  useEffect(() => { requestPermission(); }, [requestPermission]);

  useEffect(() => {
    let frame = null;
    const handleResize = () => {
      if (frame) cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => {
        setViewport({
          width: window.innerWidth,
          height: window.innerHeight,
        });
      });
    };

    window.addEventListener("resize", handleResize);
    return () => {
      if (frame) cancelAnimationFrame(frame);
      window.removeEventListener("resize", handleResize);
    };
  }, []);

  const fetchPlants = useCallback(async () => {
    try {
      const res = await api.get("/api/plants");
      setPlants(res.data);
      checkPlants(res.data.filter(p => p.sector === sector));
    } catch {}
    finally { setLoading(false); }
  }, [checkPlants, sector]);

  useEffect(() => {
    fetchPlants();
    const interval = setInterval(fetchPlants, 30000);
    return () => clearInterval(interval);
  }, [fetchPlants]);

  useSocket({
    onPlantUpdate: useCallback((data) => {
      if (data.sector !== sector) return;
      setPlants(prev => prev.map(p => p._id === data._id ? { ...p, ...data } : p));
    }, [sector]),
    onPlantDeleted: useCallback((data) => {
      setPlants(prev => prev.filter(p => p._id !== data._id));
    }, []),
    onAlert: useCallback((data) => {
      if (data.sector !== sector) return;
      toast(`\u26A0\uFE0F ${data.name} \u2014 humedad cr\u00EDtica: ${data.humidity}%`, "error");
    }, [sector, toast]),
    onScheduleTriggered: useCallback((data) => {
      if (data.sector !== sector) return;
      toast(`\u23F0 Riego autom\u00E1tico \u2014 ${data.name}`, "info");
    }, [sector, toast]),
  });

  const sectorPlants = useMemo(() => plants.filter(p => p.sector === sector), [plants, sector]);

  useEffect(() => {
  setOrderedPlants(prev => {
    const sorted  = [...sectorPlants].sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
 
    // ÃƒÂ¢Ã…â€œÃ¢â‚¬Â¦ FIX: incluir currentHumidity en la comparaciÃƒÆ’Ã‚Â³n
    // Sin esto el grid no re-renderiza cuando llega nueva lectura del sensor
    const prevKey = prev.map(p =>
      `${p._id}|${p.order}|${p.valveStatus}|${p.currentHumidity ?? 0}`
    ).join(",");
    const nextKey = sorted.map(p =>
      `${p._id}|${p.order}|${p.valveStatus}|${p.currentHumidity ?? 0}`
    ).join(",");
 
    if (prevKey === nextKey) return prev;
    return sorted;
  });
}, [sectorPlants]);

  const handleSave = async (data) => {
    try {
      if (editingPlant) {
        const res = await api.put(`/api/plants/${editingPlant._id}`, data);
        setPlants(prev => prev.map(p => p._id === editingPlant._id ? res.data : p));
        toast(`${data.name} actualizada \u2713`, "success");
      } else {
        const res = await api.post("/api/plants", { ...data, sector });
        setPlants(prev => [...prev, res.data]);
        toast(`${data.name} agregada \u2713`, "success");
      }
    } catch (err) {
      toast(err.response?.data?.error || "Error al guardar", "error");
    }
    setShowModal(false);
    setEditingPlant(null);
  };

  const handleDelete = async (id) => {
    try {
      await api.delete(`/api/plants/${id}`);
      setPlants(prev => prev.filter(p => p._id !== id));
    } catch { toast("Error al eliminar", "error"); }
  };

  const handleToggleValve = async (plant) => {
    const newStatus = plant.valveStatus === "OPEN" ? "CLOSED" : "OPEN";
    const applyUpdate = prev => prev.map(p => p._id === plant._id ? { ...p, valveStatus: newStatus } : p);
    setPlants(applyUpdate);
    setOrderedPlants(applyUpdate);
    try {
      const res = await api.put(`/api/plants/${plant._id}`, { valveStatus: newStatus });
      const applySync = prev => prev.map(p => p._id === plant._id ? { ...p, ...res.data } : p);
      setPlants(applySync);
      setOrderedPlants(applySync);
      toast(
        newStatus === "OPEN" ? `\uD83D\uDCA7 Riego iniciado \u2014 ${plant.name}` : `\u23F9 Riego detenido \u2014 ${plant.name}`,
        newStatus === "OPEN" ? "info" : "warning"
      );
    } catch {
      const applyRevert = prev => prev.map(p => p._id === plant._id ? { ...p, valveStatus: plant.valveStatus } : p);
      setPlants(applyRevert);
      setOrderedPlants(applyRevert);
      toast("Error al controlar la v\u00E1lvula", "error");
    }
  };

  const handleMaintenanceUpdate = useCallback((updatedPlant) => {
    const syncPlant = (prev) => prev.map((plant) => (
      plant._id === updatedPlant._id ? { ...plant, ...updatedPlant } : plant
    ));
    setPlants(syncPlant);
    setOrderedPlants(syncPlant);
  }, []);

  const handleReorderEnd = useCallback(async (newOrder) => {
    setOrderedPlants(newOrder);
    try {
      await Promise.all(newOrder.map((p, i) =>
        p.order !== i ? api.put(`/api/plants/${p._id}`, { order: i }) : Promise.resolve()
      ));
      setPlants(prev => prev.map(p => {
        const idx = newOrder.findIndex(o => o._id === p._id);
        return idx !== -1 ? { ...p, order: idx } : p;
      }));
    } catch { toast("Error al guardar orden", "error"); }
  }, [toast]);

  const avgHum        = sectorPlants.length ? Math.round(sectorPlants.reduce((s, p) => s + (p.currentHumidity || 0), 0) / sectorPlants.length) : 0;
  const alertCount    = sectorPlants.filter(p => (p.currentHumidity ?? 0) < p.minHumidity).length;
  const wateringCount = sectorPlants.filter(p => p.valveStatus === "OPEN").length;
  const maintenanceCount = sectorPlants.filter((plant) => plant.maintenanceMode).length;
  const filteredPlants = [...orderedPlants]
    .filter(p => {
      const q = search.toLowerCase();
      return p.name?.toLowerCase().includes(q) || p.irrigationType?.toLowerCase().includes(q);
    })
    .filter(p => {
      if (status === "all")      return true;
      if (status === "active")   return p.valveStatus === "OPEN";
      if (status === "inactive") return p.valveStatus !== "OPEN" && (p.currentHumidity ?? 0) >= p.minHumidity;
      if (status === "alert")    return (p.currentHumidity ?? 0) < p.minHumidity;
      return true;
    })
    .sort((a, b) => {
      if (sort === "order")         return (a.order ?? 0) - (b.order ?? 0);
      if (sort === "name-asc")      return a.name?.localeCompare(b.name);
      if (sort === "name-desc")     return b.name?.localeCompare(a.name);
      if (sort === "humidity-asc")  return (a.currentHumidity || 0) - (b.currentHumidity || 0);
      if (sort === "humidity-desc") return (b.currentHumidity || 0) - (a.currentHumidity || 0);
      return 0;
    });

  const hasFilters = search !== "" || status !== "all";
  const isDragging = dragEnabled && sort === "order" && !hasFilters;

  return (
    <div
      className="sp-page"
      style={{
        "--sp-accent":        theme.accent,
        "--sp-accent-dim":    theme.accentDim,
        "--sp-accent-border": theme.accentBorder,
        "--sp-glow":          theme.glow,
        "--sp-glow-strong":   theme.glowStrong,
        "--sp-particle":      theme.particle,
      }}
    >
      <Navbar plants={plants} />

      <div className="sp-hero-wrapper" ref={heroRef}>
        <motion.div
          className="sp-hero"
          style={{ y: heroY, opacity: heroOpacity }}
        >
          <div className="sp-hero-bg">
            <img src={theme.img} alt="" className="sp-hero-img" />
            <div className="sp-hero-overlay" style={{ background: theme.gradientHero }} />
          </div>

          <BackgroundOrbs
            theme={theme}
            compact={compactMotion}
            reducedMotion={Boolean(prefersReducedMotion)}
          />
          <FloatingParticles
            key={viewportKey}
            color={theme.particle}
            count={particleCount}
            reducedMotion={Boolean(prefersReducedMotion)}
          />
          <div className="sp-hero-topline" style={{ background: `linear-gradient(90deg, transparent, ${theme.accent}, transparent)` }} />

          <div className="sp-hero-content">
            <motion.button
              className="sp-back-btn"
              onClick={() => navigate("/")}
              whileHover={{ x: -4, scale: 1.02 }}
              whileTap={{ scale: 0.96 }}
              initial={{ opacity: 0, x: -16 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.1 }}
            >
              <ArrowLeft size={14} />
              <span>Dashboard</span>
            </motion.button>

            <div className="sp-hero-head">
              <motion.div
                className="sp-hero-title-row"
                initial={{ opacity: 0, y: 24 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.18, duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
              >
                <motion.div
                  className="sp-hero-icon-wrap"
                  animate={{ scale: [1, 1.08, 1], filter: [`drop-shadow(0 0 12px ${theme.accent}99)`, `drop-shadow(0 0 28px ${theme.accent})`, `drop-shadow(0 0 12px ${theme.accent}99)`] }}
                  transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
                >
                  <span className="sp-hero-icon">{theme.icon}</span>
                </motion.div>

                <div className="sp-hero-text">
                  <h1
                    className="sp-hero-title"
                    style={{
                      backgroundImage: `linear-gradient(135deg, #ffffff 20%, ${theme.accent} 60%, ${theme.accent}cc 100%)`,
                      WebkitBackgroundClip: "text",
                      WebkitTextFillColor: "transparent",
                      backgroundClip: "text",
                    }}
                  >
                    {theme.label}
                  </h1>
                  <p className="sp-hero-sub">
                    <span className="sp-hero-sub-dot" style={{ background: theme.accent }} />
                    {theme.sublabel} {"\u2022"} {sectorPlants.length} plantas
                  </p>
                </div>
              </motion.div>

              <motion.div
                className="sp-hero-sidecards"
                initial={{ opacity: 0, x: 18 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.34, duration: 0.45 }}
              >
                {[
                  { label: "Plantas visibles", value: filteredPlants.length },
                  { label: "En mantenimiento", value: maintenanceCount },
                  { label: "Sin alertas", value: Math.max(sectorPlants.length - alertCount, 0) },
                ].map((item) => (
                  <div key={item.label} className="sp-side-stat">
                    <div className="sp-side-stat-label">{item.label}</div>
                    <div className="sp-side-stat-value">{item.value}</div>
                  </div>
                ))}
              </motion.div>
            </div>

            <motion.div
              className="sp-stats-bar"
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.30, duration: 0.45 }}
            >
              <HeroStat label="Total" value={sectorPlants.length} color={theme.accent} icon={Zap} index={0} />
              <HeroStat label="Regando" value={wateringCount} color="#60a5fa" icon={Droplets} index={1} />
              <HeroStat label="Alertas" value={alertCount} color={alertCount > 0 ? "#f87171" : theme.accent} icon={Thermometer} index={2} />
              <HeroStat label="Hum. Prom." value={`${avgHum}%`} color={theme.accent} icon={null} index={3} />
            </motion.div>
          </div>

          <div className="sp-hero-bottomline" style={{ background: `linear-gradient(90deg, transparent, ${theme.accentBorder}, transparent)` }} />
        </motion.div>
      </div>

      <motion.div
        className="sp-filters"
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.42, ease: [0.22, 1, 0.36, 1] }}
      >
        <div className="sp-search-wrap">
          <Search size={14} className="sp-search-icon" />
          <input
            className="sp-search"
            placeholder="Buscar planta..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
          {search && (
            <button className="sp-search-clear" onClick={() => setSearch("")}>{"\u00D7"}</button>
          )}
        </div>

        <div className="sp-sort-wrap">
          <SlidersHorizontal size={13} className="sp-sort-icon" />
          <select className="sp-sort" value={sort} onChange={e => setSort(e.target.value)}>
            {SORT_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
          </select>
        </div>

        <div className="sp-chips">
          {STATUS_CHIPS.map(chip => (
            <motion.button
              key={chip.value}
              className={`sp-chip ${status === chip.value ? "active" : ""}`}
              onClick={() => setStatus(chip.value)}
              whileTap={{ scale: 0.94 }}
            >
              {chip.icon && <span>{chip.icon}</span>}
              {chip.label}
              {chip.value !== "all" && (
                <span className="sp-chip-count">
                  {chip.value === "active" ? wateringCount :
                   chip.value === "alert" ? alertCount :
                   sectorPlants.filter(p => p.valveStatus !== "OPEN" && (p.currentHumidity ?? 0) >= p.minHumidity).length}
                </span>
              )}
            </motion.button>
          ))}
        </div>

        {sectorPlants.length > 1 && (
          <motion.button
            className={`sp-drag-btn ${dragEnabled ? "active" : ""}`}
            onClick={() => setDragEnabled(d => !d)}
            whileTap={{ scale: 0.94 }}
          >
            <GripVertical size={13} />
            {dragEnabled ? "Listo" : "Ordenar"}
          </motion.button>
        )}

        <span className="sp-count">
          {filteredPlants.length} / {sectorPlants.length}
        </span>
      </motion.div>

      <div className="sp-grid-wrap">
        <AnimatePresence>
          {isDragging && (
            <motion.div
              className="sp-drag-banner"
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
            >
              <GripVertical size={14} />
              Arrastra las tarjetas para reorganizar el orden
            </motion.div>
          )}
        </AnimatePresence>

        {loading ? (
          <div className="plant-grid"><PlantGridSkeleton count={4} /></div>
        ) : sectorPlants.length === 0 ? (
          <EmptyPlants sector={sector} onAdd={() => { setEditingPlant(null); setShowModal(true); }} />
        ) : filteredPlants.length === 0 ? (
          <motion.div className="sp-empty" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}>
            <span className="sp-empty-icon">{"\uD83D\uDD0D"}</span>
            <p>No hay plantas con esos filtros</p>
            {hasFilters && (
              <button className="sp-empty-reset" onClick={() => { setSearch(""); setStatus("all"); }}>
                Limpiar filtros
              </button>
            )}
          </motion.div>
        ) : isDragging ? (
          <Reorder.Group
            axis="x" values={orderedPlants} onReorder={setOrderedPlants}
            className="plant-grid" style={{ listStyle: "none", padding: 0, margin: 0 }} as="div"
          >
            {orderedPlants.map((plant, i) => (
              <Reorder.Item
                key={plant._id} value={plant}
                onDragEnd={() => handleReorderEnd(orderedPlants)}
                style={{ cursor: "grab" }}
                whileDrag={{ scale: 1.04, zIndex: 50, boxShadow: `0 20px 60px ${theme.glow}` }}
              >
                <div style={{ position: "relative" }}>
                  <div className="sp-drag-handle" style={{ background: theme.accentDim, border: `1px solid ${theme.accentBorder}`, color: theme.accent }}>
                    <GripVertical size={12} />
                  </div>
                  <PlantCard
                    plant={plant}
                    index={i}
                    onEdit={p => { setEditingPlant(p); setShowModal(true); }}
                    onDelete={handleDelete}
                    onToggleValve={handleToggleValve}
                    onShowAlerts={p => setAlertPlant(p)}
                    onMaintenanceUpdate={handleMaintenanceUpdate}
                  />
                </div>
              </Reorder.Item>
            ))}
          </Reorder.Group>
        ) : (
          <AnimatePresence mode="popLayout">
            <div className="plant-grid">
              {filteredPlants.map((plant, i) => (
                <motion.div
                  key={plant._id}
                  initial={{ opacity: 0, y: 24, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -16, scale: 0.95 }}
                  transition={{ delay: i * 0.06, duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
                >
                  <PlantCard
                    plant={plant}
                    index={i}
                    onEdit={p => { setEditingPlant(p); setShowModal(true); }}
                    onDelete={handleDelete}
                    onToggleValve={handleToggleValve}
                    onShowAlerts={p => setAlertPlant(p)}
                    onMaintenanceUpdate={handleMaintenanceUpdate}
                  />
                </motion.div>
              ))}
            </div>
          </AnimatePresence>
        )}
      </div>

      <motion.button
        className="sp-fab"
        onClick={() => { setEditingPlant(null); setShowModal(true); }}
        style={{
          background: `linear-gradient(135deg, ${theme.accent}, ${theme.accent}bb)`,
          boxShadow: `0 8px 32px ${theme.glow}, 0 0 0 1px ${theme.accentBorder}` ,
        }}
        whileHover={{ scale: 1.12, boxShadow: `0 12px 40px ${theme.glowStrong}` }}
        whileTap={{ scale: 0.92 }}
        initial={{ opacity: 0, scale: 0, rotate: -180 }}
        animate={{ opacity: 1, scale: 1, rotate: 0 }}
        transition={{ delay: 0.65, type: "spring", bounce: 0.5 }}
      >
        <Plus size={22} color="#000" strokeWidth={2.5} />
      </motion.button>

      <PlantModal
        isOpen={showModal}
        onClose={() => { setShowModal(false); setEditingPlant(null); }}
        onSave={handleSave}
        plant={editingPlant}
        defaultSector={sector}
      />
      <AnimatePresence>
        {alertPlant && <AlertHistoryModal plant={alertPlant} onClose={() => setAlertPlant(null)} />}
      </AnimatePresence>
    </div>
  );
}

export default SectorPage;


