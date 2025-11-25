import React, { useEffect, useRef, useState } from "react";
import { ResponsiveContainer, Cell, BarChart, Bar, XAxis, YAxis } from "recharts";
import axiosInstance from "../../../Services/axiosInstance";
import AuthService from "../../../Services/AuthService";
import { People } from "@mui/icons-material";
import PersonIcon from "@mui/icons-material/Person";
import CategoryIcon from "@mui/icons-material/Category";
import NoAccountsIcon from "@mui/icons-material/NoAccounts";
import { closeLoading, showLoading } from "../../../General/Loader";

const userRole = AuthService.getUser()?.role;
const userColors = ["#fc4e15", "#272324"];

const AdminDashboard: React.FC = () => {
  const [totalUsers, setTotalUsers] = useState(0);
  const [activeUsers, setActiveUsers] = useState(0);
  const [inactiveUsers, setInactiveUsers] = useState(0);
  const [totalProducts, setTotalProducts] = useState(0);
  const [userPieData, setUserPieData] = useState([
    { name: "Active Users", value: 0 },
    { name: "Inactive Users", value: 0 },
  ]);

  const hasFetchedUserData = useRef(false);

  useEffect(() => {
    if (hasFetchedUserData.current) return;
    hasFetchedUserData.current = true;

    const fetchUserAndProducts = async () => {
      showLoading(3000);
      try {
        const [userRes, productRes]: any = await Promise.all([
          axiosInstance.get("/user"),
          axiosInstance.get("/products"),
        ]);

        const users = userRes.data?.data || [];
        const totalUsers = Number(userRes.data?.total) || users.length;
        const activeUsers = users.filter((u: any) => u.status === "active").length;
        const inactiveUsers = users.filter((u: any) => u.status !== "active").length;

        if (userRole === "admin") {
          setTotalUsers(totalUsers);
          setActiveUsers(activeUsers);
          setInactiveUsers(inactiveUsers);
          setUserPieData([
            { name: "Active Users", value: activeUsers },
            { name: "Inactive Users", value: inactiveUsers },
          ]);
        } else {
          setTotalUsers(1);
          setActiveUsers(1);
          setInactiveUsers(0);
          setUserPieData([
            { name: "Active Users", value: 1 },
            { name: "Inactive Users", value: 0 },
          ]);
        }

        const productCount = Number(productRes.data?.pagination?.total) || 0;
        setTotalProducts(productCount);
      } catch (error) {
      } finally{
        closeLoading();
      }
    };
    fetchUserAndProducts();
  }, []);

  return (
    <div className="w-full p-4">
      <div className="flex flex-col md:flex-row gap-4 h-[calc(100vh-270px)] max-h-[calc(100vh-270px)] overflow-y-auto scrollbar-thin scrollbar-thumb-gray-400 scrollbar-track-gray-100" >
        <div className="flex flex-col gap-4 w-full md:w-3/4">
          <div className="bg-white rounded-xl shadow-md p-4">
            <h2 className="text-lg font-semibold text-gray-800 mb-3">
              User Activity Overview
            </h2>

            <div className="w-full h-[250px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={userPieData} layout="vertical" margin={{ top: 10, right: 30, left: 40, bottom: 10 }} >
                  <XAxis type="number" allowDecimals={false} tick={{ fill: "#333", fontSize: 12 }} axisLine={{ stroke: "#ccc" }} tickLine={{ stroke: "#ccc" }} />
                  <YAxis type="category" dataKey="name" width={120} tick={{ fill: "#333", fontSize: 12 }} axisLine={{ stroke: "#ccc" }} tickLine={{ stroke: "#ccc" }} />
                  <Bar dataKey="value" radius={[10, 10, 10, 10]}
                    label={{ position: "right", fill: "#333", fontSize: 12, fontWeight: "bold", }} >
                    {userPieData.map((entry, index) => (
                      <Cell key={entry.name} fill={userColors[index]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>

            <div className="mt-4 space-y-2">
              {userPieData.map((entry, index) => (
                <div key={entry.name} className="flex items-center gap-2 text-sm text-gray-700" >
                  <div
                    className="w-4 h-4 rounded-full"
                    style={{ backgroundColor: userColors[index] }}
                  ></div>
                  <span>
                    {entry.name}: <strong>{entry.value}</strong>
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="w-full md:w-1/4 flex flex-col gap-4">
          <div className="bg-white rounded-xl shadow-md p-4">
            <h2 className="text-lg font-semibold text-gray-800 mb-3">
              User Statistics
            </h2>

            {[
              { icon: <People className="w-5 h-5 text-orange-500" />, label: "Total Users", value: totalUsers },
              { icon: <PersonIcon className="w-5 h-5 text-green-500" />, label: "Active Users", value: activeUsers },
              { icon: <NoAccountsIcon className="w-5 h-5 text-red-500" />, label: "Inactive Users", value: inactiveUsers },
            ].map((item) => (
              <div key={item.label} className="flex justify-between items-center py-2 border-b border-gray-100 last:border-0" >
                <div className="flex items-center gap-2">
                  {item.icon}
                  <span className="text-sm font-medium text-gray-700">{item.label}</span>
                </div>
                <span className="text-base font-bold text-gray-800">{item.value}</span>
              </div>
            ))}
          </div>

          <div className="bg-white rounded-xl shadow-md p-4">
            <div className="flex items-center gap-2 mb-2">
              <CategoryIcon className="w-5 h-5 text-gray-800" />
              <h2 className="text-lg font-semibold text-gray-800">Total Products</h2>
            </div>
            <p className="text-3xl font-bold text-gray-900">{totalProducts}</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;