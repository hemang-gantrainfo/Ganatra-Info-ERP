import React, { ReactNode, useEffect, useRef } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import AuthService from "./AuthService";

interface PrivateRouteProps {
  children: ReactNode;
}

const PrivateRoute: React.FC<PrivateRouteProps> = ({ children }) => {
  const navigate = useNavigate();
  const logoutTimer = useRef<NodeJS.Timeout | null>(null);
  const midnightTimer = useRef<NodeJS.Timeout | null>(null);
  const startLogoutTimer = (seconds: number) => {
    if (logoutTimer.current) clearTimeout(logoutTimer.current);

    logoutTimer.current = setTimeout(() => {
      AuthService.logout();
      navigate("/login", { replace: true });
    }, seconds * 1000);
  };

  const setNightLogout = () => {
    if (midnightTimer.current) clearTimeout(midnightTimer.current);

    const now = new Date();
    const logoutTime = new Date();

    logoutTime.setHours(23, 59, 0, 0);

    if (logoutTime.getTime() <= now.getTime()) {
      logoutTime.setDate(logoutTime.getDate() + 1);
    }

    const timeToLogout = logoutTime.getTime() - now.getTime();

    midnightTimer.current = setTimeout(() => {
      AuthService.logout();
      navigate("/login", { replace: true });
    }, timeToLogout);
  };

  const setAutoLogout = () => {
    if (midnightTimer.current) clearTimeout(midnightTimer.current);

    const timeToLogout = 45 * 60 * 1000;

    midnightTimer.current = setTimeout(() => {
      AuthService.logout();
      navigate("/login", { replace: true });
    }, timeToLogout);
  };

  const resetTimerOnActivity = () => {
    const events = ["click", "keydown", "mousemove", "scroll"];
    const resetTimer = () => startLogoutTimer(45 * 60);

    events.forEach((event) => {
      window.addEventListener(event, resetTimer);
    });

    return () => {
      events.forEach((event) => {
        window.removeEventListener(event, resetTimer);
      });
    };
  };

  const AUTO_CLEAR_MINUTES = 45;
  const setAutoClearDataWithPersistence = () => {
    const clearDataAndLogout = () => {
      localStorage.clear();
      sessionStorage.clear();
      document.cookie.split(";").forEach((c) => {
        document.cookie = c
          .replace(/^ +/, "")
          .replace(/=.*/, "=;expires=" + new Date().toUTCString() + ";path=/");
      });

      AuthService.logout();
      navigate("/login", { replace: true });

      localStorage.setItem("lastActivity", Date.now().toString());
    };

    const scheduleClear = () => {
      const lastActivity = Number(localStorage.getItem("lastActivity") || Date.now());
      const elapsed = Date.now() - lastActivity;
      const remaining = AUTO_CLEAR_MINUTES * 60 * 1000 - elapsed;

      if (remaining <= 0) {
        clearDataAndLogout();
      } else {
        midnightTimer.current = setTimeout(clearDataAndLogout, remaining);
      }
    };

    scheduleClear();

    const events = ["click", "keydown", "mousemove", "scroll"];
    const resetTimer = () => {
      localStorage.setItem("lastActivity", Date.now().toString());
      if (midnightTimer.current) clearTimeout(midnightTimer.current);
      scheduleClear();
    };

    events.forEach((event) => window.addEventListener(event, resetTimer));

    return () => {
      events.forEach((event) => window.removeEventListener(event, resetTimer));
      if (midnightTimer.current) clearTimeout(midnightTimer.current);
    };
  };

  useEffect(() => {
    startLogoutTimer(45 * 60);
    setNightLogout();
    setAutoLogout();
    setAutoClearDataWithPersistence();
    const cleanupActivity = resetTimerOnActivity();

    return () => {
      if (logoutTimer.current) clearTimeout(logoutTimer.current);
      if (midnightTimer.current) clearTimeout(midnightTimer.current);
      cleanupActivity();
    };
  }, []);

  return AuthService.isLoggedIn() ? <>{children}</> : <Navigate to="/login" replace />;
};

export default PrivateRoute;
