const invoiceHTML = (order) => {
  return `
    <h2>Invoice</h2>
    <p>Order ID: ${order._id}</p>
    <table border="1" width="100%">
      <tr>
        <th>Product</th>
        <th>Qty</th>
        <th>Price</th>
      </tr>
      ${order.products.map(p => `
        <tr>
          <td>${p.ProductName}</td>
          <td>${p.quantity}</td>
          <td>${p.Price}</td>
        </tr>
      `).join("")}
    </table>
    <h3>Total: US $${order.totalAmount}</h3>
  `
}
module.exports = invoiceHTML