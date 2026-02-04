import React, { createContext, useContext, useEffect, useState } from "react";

const LoginContext = createContext();

export const LoginProvider = ({ children }) => {
  // load user + token from localStorage (if present)
  const [user, setUser] = useState(() => {
    try {
      const stored = localStorage.getItem("user");
      return stored ? JSON.parse(stored) : null;
    } catch {
      return null;
    }
  });

  const [token, setToken] = useState(() => {
    try {
      return localStorage.getItem("token") || null;
    } catch {
      return null;
    }
  });

  // convenience flag
  const isAuthenticated = !!token;

  // login can be called as login(userData) OR login(userData, token)
  const login = (userData, jwtToken) => {
    try {
      if (userData) {
        setUser(userData);
        localStorage.setItem("user", JSON.stringify(userData));
      }
      if (jwtToken) {
        setToken(jwtToken);
        localStorage.setItem("token", jwtToken);
      }
    } catch (e) {
      // ignore localStorage errors
      console.warn("LoginContext login warning:", e);
    }
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem("user");
    localStorage.removeItem("token");
  };

  // small helper to return auth header object
  const authHeaders = () => {
    return token ? { Authorization: `Bearer ${token}` } : {};
  };

  // keep context in sync across tabs/windows
  useEffect(() => {
    const syncUser = (e) => {
      // storage event fires on other windows; if key changed reload values
      if (e.key === "user" || e.key === "token") {
        try {
          const storedUser = localStorage.getItem("user");
          setUser(storedUser ? JSON.parse(storedUser) : null);
          setToken(localStorage.getItem("token") || null);
        } catch {
          setUser(null);
          setToken(null);
        }
      }
    };
    window.addEventListener("storage", syncUser);
    return () => window.removeEventListener("storage", syncUser);
  }, []);

  return (
    <LoginContext.Provider
      value={{
        user,
        token,
        isAuthenticated,
        login,
        logout,
        setUser,
        setToken,
        authHeaders,
      }}
    >
      {children}
    </LoginContext.Provider>
  );
};

// custom hook
export const useLogin = () => useContext(LoginContext);
export default LoginContext;
