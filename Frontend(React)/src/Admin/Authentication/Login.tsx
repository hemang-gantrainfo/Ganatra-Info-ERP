import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import API_URL from "../../config";
import { toast } from "react-toastify";
import AuthService from "../../Services/AuthService";
import { EyeIcon, EyeSlashIcon } from "@heroicons/react/24/outline";

const AdminLogin: React.FC = () => {
    const navigate = useNavigate();
    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");
    const [loading, setLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);

    useEffect(() => {
        try {
            localStorage.clear();
            sessionStorage.clear();
            document.cookie.split(";").forEach((c) => {
                document.cookie = c
                    .replace(/^ +/, "")
                    .replace(/=.*/, `=;expires=${new Date(0).toUTCString()};path=/`);
            });
        } catch { }
    }, []);

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!username || !password) {
            toast.error("Please enter username and password", { autoClose: 3000 });
            return;
        }

        try {
            setLoading(true);
            const response: any = await axios.post(`${API_URL}/login`, {
                login: username,
                password,
            });

            const { token, user } = response.data;
            if (token && user) {
                AuthService.login(token, {
                    name: `${user.first_name || ""} ${user.last_name || ""}`.trim(),
                    username: user.username,
                    email: user.email,
                    id: user.id,
                    role: user.role,
                });
                toast.success("🎉 Login Successful!", { autoClose: 3000 });
                navigate("/dashboard");
            } else {
                toast.error("⚠️ Invalid credentials", { autoClose: 3000 });
            }
        } catch (err: any) {
            const message = err.response?.data?.message || "Something went wrong";
            toast.error(`Error ⚠️ ${message}`, { autoClose: 3000 });
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#ffcc70] to-[#ff8177] px-4">
            <div className="flex flex-col md:flex-row bg-white rounded-2xl overflow-hidden max-w-5xl w-full shadow-[0_0_15px_rgba(0,0,0,0.2)]">
             <div className="hidden md:flex flex-1 items-center justify-center 
                bg-white rounded-2xl 
                shadow-[0_0_15px_rgba(0,0,0,0.2)]">
                    <img
                        src="../../img/login-banner.avif"
                        alt="Login Illustration"
                        className="w-full h-full object-cover"
                    />
                </div>

                <div className="flex flex-1 flex-col justify-center p-8 sm:p-12">
                    <h2 className="text-3xl sm:text-4xl font-bold text-center mb-8 text-gray-800">
                        Login
                    </h2>

                    <form onSubmit={handleLogin} className="space-y-5">
                        <div>
                            <label className="block text-gray-700 font-medium mb-1">
                                Username / Email
                            </label>
                            <input
                                type="text"
                                value={username}
                                onChange={(e) => setUsername(e.target.value)}
                                className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-orange-300 focus:border-orange-500 outline-none transition"
                                placeholder="Enter your username or email"
                            />
                        </div>

                        <div className="relative">
                            <label className="block text-gray-700 font-medium mb-1">
                                Password
                            </label>
                            <input
                                type={showPassword ? "text" : "password"}
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-orange-300 focus:border-orange-500 outline-none transition pr-10"
                                placeholder="Enter your password"
                            />
                            <button
                                type="button"
                                onClick={() => setShowPassword(!showPassword)}
                                className="absolute right-3 top-9 text-gray-500 hover:text-gray-700"
                            >
                                {showPassword ? (
                                    <EyeSlashIcon className="w-5 h-5" />
                                ) : (
                                    <EyeIcon className="w-5 h-5" />
                                )}
                            </button>
                        </div>

                        <div className="flex justify-center">
                            <button
                                type="submit"
                                disabled={loading}
                                className="w-full bg-orange-600 hover:bg-orange-700 text-white font-semibold py-3 rounded-full transition-all duration-300 disabled:opacity-60"
                            >
                                {loading ? "LOGIN..." : "LOGIN"}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default AdminLogin;
