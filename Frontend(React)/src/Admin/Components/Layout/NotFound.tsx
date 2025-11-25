import React from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Home } from "lucide-react";

const NotFound = () => {
  const navigate = useNavigate();

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-br from-orange-50 via-white to-gray-100 text-center px-4">
      <motion.h1 initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ duration: 0.6, ease: "easeOut" }} className="text-[8rem] sm:text-[10rem] font-extrabold text-orange-500 drop-shadow-md" >
        404
      </motion.h1>

      <motion.h2 initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.2, duration: 0.6 }} className="text-2xl sm:text-3xl font-semibold text-gray-800 mb-2" >
        Page Not Found
      </motion.h2>

      <motion.p initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.3, duration: 0.6 }} className="text-gray-600 mb-8 max-w-md" >
        The page you are looking for doesn’t exist or might have been moved.
      </motion.p>

      <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.97 }} onClick={() => navigate("/dashboard")} className="flex items-center gap-2 px-5 py-2.5 bg-orange-500 text-white rounded-md shadow-lg hover:bg-orange-600 transition-all" >
        <Home size={18} />
        Go to Dashboard
      </motion.button>

      <motion.div className="absolute bottom-10 text-gray-400 text-sm" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1.2 }} >
        © {new Date().getFullYear()} GanatraInfo
      </motion.div>
    </div>
  );
};

export default NotFound;
