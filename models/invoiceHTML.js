const invoiceHTML = (order) => {
  return `
  <div style="font-family: Arial; padding:20px;">
    
    <h2 style="color:#0046be;">Invoice</h2>
    <p><strong>Order ID:</strong> ${order._id}</p>

    <table style="width:100%; border-collapse:collapse; margin-top:20px;">
      <thead>
        <tr style="background:#f2f2f2;">
          <th style="padding:10px; border:1px solid #ddd;">Product</th>
          <th style="border:1px solid #ddd;">Qty</th>
          <th style="border:1px solid #ddd;">Price</th>
          <th style="border:1px solid #ddd;">GST</th>
          <th style="border:1px solid #ddd;">Total</th>
        </tr>
      </thead>

      <tbody>
        ${order.products.map(p => `
          <tr>
            <td style="padding:10px; border:1px solid #ddd;">${p.ProductName}</td>
            <td style="text-align:center; border:1px solid #ddd;">${p.quantity}</td>
            <td style="text-align:center; border:1px solid #ddd;">₹${p.Price}</td>
            <td style="text-align:center; border:1px solid #ddd;">₹${p.gst}</td>
            <td style="text-align:center; border:1px solid #ddd;">₹${p.total}</td>
          </tr>
        `).join("")}
      </tbody>
    </table>

    <h3 style="text-align:right; margin-top:20px;">
      Total: ₹${order.totalAmount}
    </h3>

  </div>
  `
}

module.exports = invoiceHTML