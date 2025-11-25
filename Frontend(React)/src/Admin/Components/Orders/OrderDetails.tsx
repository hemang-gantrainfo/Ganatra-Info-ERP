import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import axios from "axios";
import { Box, Typography, Paper, Divider, TableCell, TableRow, Table, TableContainer, TableBody, TableHead } from "@mui/material";
import API_URL from "../../../config";
import { closeLoading, showLoading } from "../../../General/Loader";
import PrintInvoice from "./PrintInvoice";
import DownloadInvoice from "./DownloadInvoice";

const OrderDetails: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [order, setOrder] = useState<any>(null);
  const [loading, setLoading] = useState<boolean>(false);

  useEffect(() => {
    let hasFetched = false;
    setLoading(true);
    showLoading(3000);

    const fetchOrder = async () => {
      if (hasFetched) return;
      hasFetched = true;

      try {
        const response: any = await axios.get(`${API_URL}/getorder/${id}`);
        if (response.data.status) {
          setOrder(response.data.data || response.data.order || response.data);
        }
      } catch (err) {
      } finally {
        setLoading(false);
        closeLoading();
      }
    };

    fetchOrder();
  }, [id]);

  const boldFont = { fontWeight: "bold" }
  return (
    <>
      {!loading && (
        <Box sx={{ gap: 2, display: "flex", }}>
          <Box sx={{
            maxHeight: "calc(100vh - 160px)", height: "calc(100vh - 160px)", width: "100%", p: 3, overflowY: "auto", backgroundColor: "#ffffff", "&::-webkit-scrollbar-button": {
              display: "none",
              width: 0,
              height: 0,
            },
            "&::-webkit-scrollbar": {
              width: "4px",
            },
            "&::-webkit-scrollbar-thumb": {
              backgroundColor: "#c1c1c1",
              borderRadius: "4px",
            },
            "&::-webkit-scrollbar-track": {
              backgroundColor: "#fff",
            },
          }} >
            <Typography sx={{ fontSize: "14px", fontWeight: "bold", color: "#333", pl: 1, mb: 1 }} >
              Order Details
            </Typography>
            <Divider sx={{ mb: 2 }} />
            <Box sx={{ display: "flex", justifyContent: "space-between", py: 0.8, borderBottom: "1px solid #eee", }} >
              <Box sx={{ display: "flex", width: "50%" }}>
                <Typography sx={{ fontSize: "13px", color: "#555", pl: 1, width: "40%" }}>
                  ORDER ID
                </Typography>
                <Typography sx={{ fontSize: "13px", color: "#000", pl: 1 }}>
                  {order?.order_id}
                </Typography>
              </Box>
              <Box sx={{ display: "flex", width: "50%" }}>
                <Typography sx={{ fontSize: "13px", color: "#555", pl: 1, width: "40%" }}>
                  Status
                </Typography>

                <Typography sx={{
                  fontSize: "13px", color: "#fff", px: 1.5,
                  borderRadius: "4px", fontWeight: 500, alignSelf: "center", backgroundColor:
                    order?.order_status === "New" ? "#9E9E9E"
                      : order?.order_status === "Pick" ? "#2196F3"
                        : order?.order_status === "Pack" ? "#FF9800"
                          : order?.order_status === "Ship" ? "#3F51B5"
                            : order?.order_status === "Delivered" ? "#4CAF50" : "#757575",
                }} >
                  {order?.order_status}
                </Typography>
              </Box>

            </Box>
            <Box sx={{ display: "flex", justifyContent: "space-between", py: 0.8, borderBottom: "1px solid #eee", }} >
              <Box sx={{ display: "flex", width: "50%" }}>
                <Typography sx={{ fontSize: "13px", color: "#555", pl: 1, width: "40%" }}>
                  Customer
                </Typography>
                <Typography sx={{ fontSize: "13px", color: "#000", pl: 1 }}>
                  {order?.customer_name}
                </Typography>
              </Box>

              <Box sx={{ display: "flex", width: "50%" }}>
                <Typography sx={{ fontSize: "13px", color: "#555", pl: 1, width: "40%" }}>
                  Customer Email
                </Typography>
                <Typography sx={{ fontSize: "13px", color: "#000", pl: 1 }}>
                  {order?.customer_email}
                </Typography>
              </Box>
            </Box>
            <Box sx={{ display: "flex", justifyContent: "space-between", py: 0.8, borderBottom: "1px solid #eee", }} >
              <Box sx={{ display: "flex", width: "50%" }}>
                <Typography sx={{ fontSize: "13px", color: "#555", pl: 1, width: "40%" }}>
                  Date Placed
                </Typography>
                <Typography sx={{ fontSize: "13px", color: "#000", pl: 1 }}>
                  {order?.date_placed}
                </Typography>
              </Box>

              <Box sx={{ display: "flex", width: "50%" }}>
                <Typography sx={{ fontSize: "13px", color: "#555", pl: 1, width: "40%" }}>
                  Sales Channel
                </Typography>
                <Typography sx={{ fontSize: "13px", color: "#000", pl: 1 }}>{order?.sales_channel}</Typography>
              </Box>
            </Box>
            <Box sx={{ display: "flex", justifyContent: "space-between", py: 0.8, borderBottom: "1px solid #eee", }} >
              <Box sx={{ display: "flex", width: "50%" }}>
                <Typography sx={{ fontSize: "13px", color: "#555", pl: 1, width: "40%" }}>
                  Date Paid
                </Typography>
                <Typography sx={{ fontSize: "13px", color: "#000", pl: 1 }}>
                  {order?.date_paid}
                </Typography>
              </Box>

              <Box sx={{ display: "flex", width: "50%" }}>
                <Typography sx={{ fontSize: "13px", color: "#555", pl: 1, width: "40%" }}>
                  Shipping Signature
                </Typography>
                <Typography sx={{ fontSize: "13px", color: "#000", pl: 1 }}>
                  {order?.shipping_signature}
                </Typography>
              </Box>
            </Box>
            <Box sx={{ display: "flex", justifyContent: "space-between", py: 0.8, borderBottom: "1px solid #eee", }} >
              <Box sx={{ display: "flex", width: "50%" }}>
                <Typography sx={{ fontSize: "13px", color: "#555", pl: 1, width: "40%" }}>
                  Delivery Instruction
                </Typography>
                <Typography sx={{ fontSize: "13px", color: "#000", pl: 1 }}>
                  {order?.delivery_instruction}
                </Typography>
              </Box>

              <Box sx={{ display: "flex", width: "50%" }}>
                <Typography sx={{ fontSize: "13px", color: "#555", pl: 1, width: "40%" }}>
                  Sales Person
                </Typography>
                <Typography sx={{ fontSize: "13px", color: "#000", pl: 1 }}>  </Typography>
              </Box>
            </Box>
            <Box sx={{ display: "flex", justifyContent: "space-between", py: 0.8, borderBottom: "1px solid #eee", }} >
              <Box sx={{ display: "flex", width: "50%" }}>
                <Typography sx={{ fontSize: "13px", color: "#555", pl: 1, width: "40%" }}>
                  Order Type
                </Typography>
                <Typography sx={{ fontSize: "13px", color: "#000", pl: 1 }}>
                  {order?.order_type}
                </Typography>
              </Box>
            </Box>

            <Box sx={{ display: "flex", justifyContent: "space-between", gap: 2, mt: 3, }}>
              <Box sx={{ width: "50%", backgroundColor: "#fff", border: "1px solid #ddd", borderRadius: "6px", p: 2, }} >
                <Typography sx={{ fontSize: "14px", fontWeight: "bold", color: "#333", mb: 1, }} >
                  Billing Address
                </Typography>

                <Box sx={{ display: "flex", mb: 0.5 }}>
                  <Typography sx={{ width: "40%", color: "#555", fontSize: "13px" }}>
                    Order Type
                  </Typography>
                  <Typography sx={{ fontSize: "13px", color: "#000" }}>
                    {order?.order_type || "-"}
                  </Typography>
                </Box>

                <Box sx={{ display: "flex", mb: 0.5 }}>
                  <Typography sx={{ width: "40%", color: "#555", fontSize: "13px" }}>
                    Name
                  </Typography>
                  <Typography sx={{ fontSize: "13px", color: "#000" }}>
                    {order?.bill_address?.Name || "-"}
                  </Typography>
                </Box>

                <Box sx={{ display: "flex", mb: 0.5 }}>
                  <Typography sx={{ width: "40%", color: "#555", fontSize: "13px" }}>
                    Address
                  </Typography>
                  <Typography sx={{ fontSize: "13px", color: "#000" }}>
                    {order?.bill_address?.Street || "-"}
                  </Typography>
                </Box>

                <Box sx={{ display: "flex", mb: 0.5 }}>
                  <Typography sx={{ width: "40%", color: "#555", fontSize: "13px" }}>
                    City
                  </Typography>
                  <Typography sx={{ fontSize: "13px", color: "#000" }}>
                    {order?.bill_address?.City || "-"}
                  </Typography>
                </Box>

                <Box sx={{ display: "flex", mb: 0.5 }}>
                  <Typography sx={{ width: "40%", color: "#555", fontSize: "13px" }}>
                    State
                  </Typography>
                  <Typography sx={{ fontSize: "13px", color: "#000" }}>
                    {order?.bill_address?.State || "-"}
                  </Typography>
                </Box>

                <Box sx={{ display: "flex", mb: 0.5 }}>
                  <Typography sx={{ width: "40%", color: "#555", fontSize: "13px" }}>
                    Postal Code
                  </Typography>
                  <Typography sx={{ fontSize: "13px", color: "#000" }}>
                    {order?.bill_address?.PostalCode || "-"}
                  </Typography>
                </Box>

                <Box sx={{ display: "flex", mb: 0.5 }}>
                  <Typography sx={{ width: "40%", color: "#555", fontSize: "13px" }}>
                    Country
                  </Typography>
                  <Typography sx={{ fontSize: "13px", color: "#000" }}>
                    {order?.bill_address?.Country || "-"}
                  </Typography>
                </Box>

                <Box sx={{ display: "flex", mb: 0.5 }}>
                  <Typography sx={{ width: "40%", color: "#555", fontSize: "13px" }}>
                    E-mail
                  </Typography>
                  <Typography sx={{ fontSize: "13px", color: "#000" }}>
                    {order?.customer_email || "-"}
                  </Typography>
                </Box>
              </Box>
              <Box
                sx={{ width: "50%", backgroundColor: "#fff", border: "1px solid #ddd", borderRadius: "6px", p: 2, }} >
                <Typography sx={{ fontSize: "14px", fontWeight: "bold", color: "#333", mb: 1, }} >
                  Shipping Address
                </Typography>

                <Box sx={{ display: "flex", mb: 0.5 }}>
                  <Typography sx={{ width: "40%", color: "#555", fontSize: "13px" }}>
                    Shipping Option
                  </Typography>
                  <Typography sx={{ fontSize: "13px", color: "#000" }}>
                    {order?.shipping_option || "-"}
                  </Typography>
                </Box>

                <Box sx={{ display: "flex", mb: 0.5 }}>
                  <Typography sx={{ width: "40%", color: "#555", fontSize: "13px" }}>
                    Name
                  </Typography>
                  <Typography sx={{ fontSize: "13px", color: "#000" }}>
                    {order?.ship_address?.Name || "-"}
                  </Typography>
                </Box>

                <Box sx={{ display: "flex", mb: 0.5 }}>
                  <Typography sx={{ width: "40%", color: "#555", fontSize: "13px" }}>
                    Address
                  </Typography>
                  <Typography sx={{ fontSize: "13px", color: "#000" }}>
                    {order?.ship_address?.Street || "-"}
                  </Typography>
                </Box>

                <Box sx={{ display: "flex", mb: 0.5 }}>
                  <Typography sx={{ width: "40%", color: "#555", fontSize: "13px" }}>
                    City
                  </Typography>
                  <Typography sx={{ fontSize: "13px", color: "#000" }}>
                    {order?.ship_address?.City || "-"}
                  </Typography>
                </Box>

                <Box sx={{ display: "flex", mb: 0.5 }}>
                  <Typography sx={{ width: "40%", color: "#555", fontSize: "13px" }}>
                    State
                  </Typography>
                  <Typography sx={{ fontSize: "13px", color: "#000" }}>
                    {order?.ship_address?.State || "-"}
                  </Typography>
                </Box>

                <Box sx={{ display: "flex", mb: 0.5 }}>
                  <Typography sx={{ width: "40%", color: "#555", fontSize: "13px" }}>
                    Postal Code
                  </Typography>
                  <Typography sx={{ fontSize: "13px", color: "#000" }}>
                    {order?.ship_address?.PostalCode || "-"}
                  </Typography>
                </Box>

                <Box sx={{ display: "flex", mb: 0.5 }}>
                  <Typography sx={{ width: "40%", color: "#555", fontSize: "13px" }}>
                    Country
                  </Typography>
                  <Typography sx={{ fontSize: "13px", color: "#000" }}>
                    {order?.ship_address?.Country || "-"}
                  </Typography>
                </Box>
              </Box>
            </Box>

            <Box sx={{ mt: 3 }}>
              <Typography sx={{ fontSize: "14px", fontWeight: "bold", color: "#333", mb: 1 }} >
                Order Items
              </Typography>
              <TableContainer component={Paper} sx={{ boxShadow: 3 }}>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell sx={boldFont}>Order ID</TableCell>
                      <TableCell sx={boldFont}>Name</TableCell>
                      <TableCell sx={boldFont}>SKU</TableCell>
                      <TableCell sx={boldFont}>Qty</TableCell>
                      <TableCell sx={boldFont}>Cost Price</TableCell>
                      <TableCell sx={boldFont}>Shipping Tracking</TableCell>
                      <TableCell sx={boldFont}>Product Discount</TableCell>
                      <TableCell sx={boldFont}>Percent Discount</TableCell>
                    </TableRow>
                  </TableHead>

                  <TableBody>
                    {order?.order_lines.map((line: any, index: any) => (
                      <TableRow key={index} sx={{ "&:nth-of-type(odd)": { backgroundColor: "#f9f9f9" }, }} >
                        <TableCell>{order.order_id}</TableCell>
                        <TableCell>{line.product_name}</TableCell>
                        <TableCell>{line.sku}</TableCell>
                        <TableCell>{line.quantity}</TableCell>
                        <TableCell>${line.cost_price}</TableCell>
                        <TableCell>{line.shipping_tracking}</TableCell>
                        <TableCell>${line.product_discount}</TableCell>
                        <TableCell>{line.percent_discount}%</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </Box>

            <Box sx={{ mt: 3 }}>
              <Typography sx={{ fontSize: "14px", fontWeight: "bold", color: "#333", mb: 1 }} >
                Payment
              </Typography>

              <Box sx={{ display: "flex", mb: 0.5 }}>
                <Typography sx={{ width: "20%", color: "#555", fontSize: "13px" }}>
                  Payment Type
                </Typography>
                <Typography sx={{ fontSize: "13px", color: "#000" }}>
                  {order?.order_payment?.PaymentType || "-"}
                </Typography>
              </Box>
              <Box sx={{ display: "flex", mb: 0.5 }}>
                <Typography sx={{ width: "20%", color: "#555", fontSize: "13px" }}>
                  Payment Paid Date
                </Typography>
                <Typography sx={{ fontSize: "13px", color: "#000" }}>
                  {order?.order_payment?.DatePaid || "-"}
                </Typography>
              </Box>
            </Box>
          </Box>
          <Box sx={{ display: "flex", flexDirection: "column", gap: 1.5, p: 1, width: 320, borderRadius: 2, }} >
            <DownloadInvoice orderId={order?.order_id} orderData={order} />
            <PrintInvoice orderId={order?.order_id} orderData={order} />
          </Box>

        </Box >
      )}
    </>
  );
};

export default OrderDetails;