import { API_URL } from "./config.js";
import { createContext, useContext, useEffect, useState } from "react";

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState({
    user: null,

  });
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    console.log("AuthProvider user updated 👉", user);
  }, [user]);


  const checkAuth = async () => {
    try {
      const res = await fetch(`${API_URL}/api/me`, {
        method: "GET",
        credentials: "include", // IMPORTANT for cookies
      });

      if (res.ok) {
        const data = await res.json();
        setUser({
          user: data.user,

        });
      } else {
        setUser(null);
      }
    } catch (err) {
      console.error("Auth check failed", err);
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    checkAuth(); // 🔥 runs ONLY once
  }, []);

  const providerValues = {
    user, setUser,
    loading, setLoading,
    checkAuth,
  }

  return (
    <AuthContext.Provider value={providerValues}>
      {children}
    </AuthContext.Provider>
  );
};

// custom hook
export const useAuth = () => useContext(AuthContext);

