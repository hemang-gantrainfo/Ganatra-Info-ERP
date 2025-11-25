import React from "react";
import { Button } from "@mui/material";
import PrintIcon from "@mui/icons-material/Print";

interface PrintInvoiceProps {
  orderId?: string;
  orderData?: any;
}

const PrintInvoice: React.FC<PrintInvoiceProps> = ({ orderId, orderData }) => {

  const handlePrint = () => {
    if (!orderData) {
      alert("Order data not found!");
      return;
    }

    const {
      order_status,
      date_placed,
      order_payment,
      ship_address,
      bill_address,
      grand_total,
      shipping_total,
      order_lines = [],
    } = orderData;

    const formatDate = (dateStr?: string) =>
      dateStr ? new Date(dateStr).toLocaleDateString("en-IN") : "-";

    const tableRows = order_lines.map(
      (line: any) => `
        <tr>
          <td>${line.quantity}</td>
          <td>${line.sku}</td>
          <td>${line.product_name}</td>
          <td>$${line.cost_price}</td>
          <td>${line.percent_discount || "0"}%</td>
          <td>$${(
          Number(line.cost_price) * Number(line.quantity)
        ).toFixed(2)}</td>
        </tr>`
    )
      .join("");

    const printWindow = window.open("", "_blank");
    if (!printWindow) return;

    printWindow.document.write(`
      <html>
        <head>
          <title>Tax Invoice - ${orderId}</title>
            <style>
                @page {
                    size: A4;
                    margin: 15mm;
                }

                body {
                    font-family: 'Arial', sans-serif;
                    color: #333;
                    margin: 0;
                    background: #f7f7f7; 
                    -webkit-print-color-adjust: exact !important;
                    print-color-adjust: exact !important;
                }

                .invoice-container {
                    width: 750px; 
                    margin: 30px auto; 
                    padding: 30px 40px;
                    border-radius: 6px;
                }

                .header {
                    display: flex;
                    justify-content: space-between;
                    align-items: flex-start;
                }

                .invoice-title { font-size: 28px; font-weight: bold; }
                .invoice-id { font-size: 18px; color: #2e7d32; font-weight: 600; }

                .company-logo img {
                    width: 140px;
                    background: #333 !important;
                    border-radius: 5px;
                    padding: 5px 10px;
                }

                .company-abn { font-size: 13px; color: #777; margin-top: 10px; }

                .addresses {
                    display: flex;
                    justify-content: space-between;
                    margin-top: 30px;
                }

                .address-block {
                    width: 48%;
                    font-size: 13px;
                    line-height: 1.6;
                }

                table {
                    width: 100%;
                    border-collapse: collapse;
                    margin: 20px 0;
                    font-size: 13px;
                }

                th, td { border: 1px solid #ddd; padding: 8px; }
                th {
                    background: #f8f8f8 !important;
                    -webkit-print-color-adjust: exact !important;
                    print-color-adjust: exact !important;
                }

                .payment-section { font-size: 13px; }
                .payment-title { font-size: 16px; font-weight: bold; }
                .amount-summary { text-align: right; margin-top: 20px; font-size: 13px; }
                .balance { font-weight: bold; color: #2e7d32; font-size: 16px; }

                @media print {
                    body {
                    background: #fff;
                    margin: 0;
                    }
                    .invoice-container {
                    width: auto;   
                    margin: 0;
                    padding: 5mm 8mm;
                    box-shadow: none;
                    border-radius: 0;
                    }
                    table, th, td {
                    page-break-inside: avoid;
                    }
                }
            </style>
        </head>
        <body>
         <div class="invoice-container">
          <div class="header">
            <div>
              <div class="invoice-title">Tax Invoice</div>
              <div>Invoice <span class="invoice-id">#${orderId}</span></div>
              <div>Status: <b>${order_status}</b></div>
            </div>
            <div class="company-logo">
              <img src="/img/logo.png" alt="Company Logo" />
            </div>
          </div>

          <div class="addresses">
            <div class="address-block">
              <strong>Ship to</strong><br/>
              ${ship_address?.Name || ""}<br/>
              ${ship_address?.Street || ""}<br/>
              ${ship_address?.City || ""}, ${ship_address?.State || ""} ${ship_address?.PostalCode}<br/>
              ${ship_address?.Country || ""}<br/>
              <div style="margin-top: 5px;">Date placed: ${formatDate(date_placed)}</div>
            </div>

            <div class="address-block">
              <strong>Billed to</strong><br/>
              ${bill_address?.Name || ""}<br/>
              ${bill_address?.Street || ""}<br/>
              ${bill_address?.City || ""}, ${bill_address?.State || ""} ${bill_address?.PostalCode}<br/>
              ${bill_address?.Country || ""}<br/>
              <div style="color: red; font-weight: 600;">Paid</div>
              <div>Date invoiced: ${formatDate(order_payment?.DatePaid)}</div>
            </div>
          </div>

            <table>
              <thead>
                <tr>
                  <th>QTY</th>
                  <th>SKU</th>
                  <th>Name</th>
                  <th>Unit Price</th>
                  <th>Discount</th>
                  <th>Subtotal</th>
                </tr>
              </thead>
              <tbody>
                ${tableRows}
              </tbody>
            </table>

          <div class="payment-section">
            <div class="payment-title">Payment Summary</div>
            <p>Payment Type: <b>${order_payment?.PaymentType || "-"}</b></p>
            <p>Date Paid: ${formatDate(order_payment?.DatePaid)}</p>

            <div class="amount-summary">
              <p>Shipping Total: $${shipping_total}</p>
              <p><b>Grand Total: $${grand_total}</b></p>
            </div>
          </div>
            </div>
        </body>
      </html>
    `);

    printWindow.document.close();
    printWindow.focus();
    setTimeout(() => printWindow.print(), 800);
  };

  return (
    <Button variant="contained" startIcon={<PrintIcon />} onClick={handlePrint}
      sx={{ textTransform: "none", backgroundColor: "#f5f5f5", color: "#333", justifyContent: "flex-start", "&:hover": { backgroundColor: "#e0e0e0" }, }} fullWidth >
      Print Docs
    </Button>
  );
};

export default PrintInvoice;
