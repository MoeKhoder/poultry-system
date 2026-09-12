import { createContext, useContext, useCallback, useEffect, useState } from "react";
import { settingsApi } from "../api/resources";
import { useAuth } from "./AuthContext";

const SettingsContext = createContext(null);

const FALLBACK = {
  companyName: "",
  vatNumber: "",
  commercialRegister: "",
  phone: "",
  city: "",
  address: "",
  email: "",
  currency: "ر.س",
  weightUnit: "كغ",
  fixedCageWeight: 8,
};

export function SettingsProvider({ children }) {
  const { user } = useAuth();
  const [settings, setSettings] = useState(FALLBACK);
  const [loading, setLoading] = useState(true);

  const reload = useCallback(async () => {
    try {
      const data = await settingsApi.get();
      setSettings(data);
    } catch {
      setSettings(FALLBACK);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (user) {
      reload();
    } else {
      setSettings(FALLBACK);
      setLoading(false);
    }
  }, [user, reload]);

  function fmtMoney(amount) {
    const value = Number(amount) || 0;
    return `${value.toLocaleString("ar-SA")} ${settings.currency || FALLBACK.currency}`;
  }

  function fmtWeight(amount) {
    const value = Number(amount) || 0;
    return `${value.toLocaleString("ar-SA")} ${settings.weightUnit || FALLBACK.weightUnit}`;
  }

  return (
    <SettingsContext.Provider value={{ settings, loading, reload, fmtMoney, fmtWeight }}>
      {children}
    </SettingsContext.Provider>
  );
}

export function useSettings() {
  return useContext(SettingsContext);
}
