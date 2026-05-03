const invoiceHTML = (order) => {
  const invoiceDate = new Date().toLocaleDateString("en-IN", {
    day: "2-digit", month: "long", year: "numeric"
  })

  const subtotal = order.products.reduce((sum, p) => sum + p.base, 0).toFixed(2)
  const totalGST = order.products.reduce((sum, p) => sum + p.gst, 0).toFixed(2)

  const rows = order.products.map(p => `
    <tr>
      <td>${p.ProductName}</td>
      <td style="text-align:center;">${p.quantity}</td>
      <td style="text-align:right;">₹${p.Price.toFixed(2)}</td>
      <td style="text-align:right;">₹${p.base}</td>
      <td style="text-align:right;">₹${p.gst}</td>
      <td style="text-align:right;">₹${p.total}</td>
    </tr>
  `).join("")

  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8"/>
  <title>Invoice</title>
  <style>
    body {
      font-family: Arial, sans-serif;
      font-size: 14px;
      color: #222;
      padding: 40px;
      max-width: 760px;
      margin: auto;
    }

    .top {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      margin-bottom: 32px;
    }

    .brand {
      font-size: 26px;
      font-weight: bold;
      color: #0046be;
    }
    .brand span { color: #f5a000; }

    .invoice-info { text-align: right; }
    .invoice-info h2 {
      font-size: 20px;
      color: #0046be;
      margin: 0 0 6px;
    }
    .invoice-info p {
      margin: 2px 0;
      color: #555;
      font-size: 13px;
    }

    hr { border: none; border-top: 2px solid #e0e0e0; margin: 20px 0; }

    table {
      width: 100%;
      border-collapse: collapse;
      margin-top: 16px;
    }
    thead tr {
      background: #0046be;
      color: white;
    }
    thead th {
      padding: 10px 12px;
      text-align: left;
      font-size: 13px;
      font-weight: 600;
    }
    thead th:not(:first-child) { text-align: right; }
    thead th:nth-child(2) { text-align: center; }

    tbody tr { border-bottom: 1px solid #eee; }
    tbody tr:nth-child(even) { background: #f9f9f9; }
    tbody td {
      padding: 10px 12px;
      font-size: 13px;
      color: #333;
    }

    .totals {
      margin-top: 20px;
      display: flex;
      justify-content: flex-end;
    }
    .totals-inner { width: 260px; }
    .totals-inner .row {
      display: flex;
      justify-content: space-between;
      padding: 6px 0;
      font-size: 13px;
      border-bottom: 1px solid #eee;
      color: #555;
    }
    .totals-inner .row.total {
      font-size: 15px;
      font-weight: bold;
      color: #0046be;
      border-bottom: none;
      padding-top: 10px;
    }

    .note {
      margin-top: 28px;
      font-size: 12px;
      color: #888;
      line-height: 1.7;
      border-top: 1px solid #eee;
      padding-top: 14px;
    }

    .signatory {
      margin-top: 48px;
      display: flex;
      justify-content: flex-end;
    }
    .signatory-box { text-align: center; width: 200px; }
    .sig-line {
      border-bottom: 1.5px solid #333;
      margin-bottom: 8px;
      height: 36px;
    }
    .signatory-box p {
      margin: 3px 0;
      font-size: 12px;
      color: #555;
    }
    .signatory-box .name {
      font-weight: bold;
      font-size: 13px;
      color: #222;
    }

    .footer {
      margin-top: 36px;
      text-align: center;
      font-size: 12px;
      color: #aaa;
      border-top: 1px solid #eee;
      padding-top: 14px;
    }
  </style>
</head>
<body>

  <div class="top">
    <div>
      <div class="brand">Best<span>Buy</span></div>
      <p style="margin:4px 0 0; font-size:12px; color:#888;">Tax Invoice</p>
    </div>
    <div class="invoice-info">
      <h2>INVOICE</h2>
      <p><strong>Order ID:</strong> ${order._id}</p>
      <p><strong>Date:</strong> ${invoiceDate}</p>
      <p><strong>Payment:</strong> Online · Razorpay</p>
    </div>
  </div>

  <hr/>

  <table>
    <thead>
      <tr>
        <th>Product</th>
        <th style="text-align:center;">Qty</th>
        <th style="text-align:right;">Unit Price</th>
        <th style="text-align:right;">Base Amt</th>
        <th style="text-align:right;">GST</th>
        <th style="text-align:right;">Total</th>
      </tr>
    </thead>
    <tbody>
      ${rows}
    </tbody>
  </table>

  <div class="totals">
    <div class="totals-inner">
      <div class="row">
        <span>Subtotal (excl. GST)</span>
        <span>₹${subtotal}</span>
      </div>
      <div class="row">
        <span>Total GST</span>
        <span>₹${totalGST}</span>
      </div>
      <div class="row total">
        <span>Grand Total</span>
        <span>₹${order.totalAmount}</span>
      </div>
    </div>
  </div>

  <div class="note">
    This is a computer-generated invoice and does not require a physical signature.
    GST is included in the product price and calculated as per applicable category rates.
    Please retain this invoice for warranty and return purposes.
  </div>

  <div class="signatory">
    <div class="signatory-box">
      <div class="sig-line"> <img src=""/></div>
      <p class="name">Authorized Signatory</p>
      <p>Finance &amp; Operations</p>
      <p>BestBuy Clone Pvt. Ltd.</p>
    </div>
  </div>

  <div class="footer">
    © BestBuy Clone &nbsp;·&nbsp; support@bestbuyclone.com
  </div>

</body>
</html>
  `
}

module.exports = invoiceHTML