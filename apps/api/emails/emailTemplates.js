/**
 * Branded email templates for Rural Link
 */

const BRAND_COLOR = '#007bff';
const FOOTER_TEXT = '© 2025 Rural Link. All rights reserved.';
const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:5173';

// Base layout wrapper
const emailLayout = (subject, bodyContent) => `
<div style="font-family: Arial, sans-serif; background-color:#f9f9f9; padding:20px;">
  <div style="max-width:600px; margin:0 auto; background-color:#fff; border-radius:10px; overflow:hidden; box-shadow:0 0 10px rgba(0,0,0,0.1);">
    <div style="background-color:${BRAND_COLOR}; color:#fff; padding:20px; text-align:center;">
      <h2>${subject}</h2>
    </div>
    <div style="padding:20px; color:#333; line-height:1.6;">
      ${bodyContent}
    </div>
    <div style="background-color:#f1f1f1; color:#555; padding:10px; text-align:center; font-size:12px;">
      ${FOOTER_TEXT}
    </div>
  </div>
</div>
`;

// ---------------------
// User Account Templates
// ---------------------
const verifyEmailTemplate = (verifyUrl, firstName) => `
  <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
    <h2>Hello ${firstName},</h2>
    <p>Thank you for registering on our platform. Please verify your email by clicking the button below:</p>
    <p>
      <a href="${verifyUrl}" 
         style="display: inline-block; padding: 10px 20px; color: #fff; background-color: #007bff; text-decoration: none; border-radius: 5px;">
         Verify Email
      </a>
    </p>
    <p>If you did not create an account, you can safely ignore this email.</p>
    <p>Regards,<br/>Rural Link Team</p>
  </div>
`;

const forgotPasswordTemplate = (resetUrl, firstName) => `
  <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
    <h2>Hello ${firstName},</h2>
    <p>You requested a password reset. Click the button below to reset your password:</p>
    <p>
      <a href="${resetUrl}" 
         style="display: inline-block; padding: 10px 20px; color: #fff; background-color: #dc3545; text-decoration: none; border-radius: 5px;">
         Reset Password
      </a>
    </p>
    <p>If you did not request this, please ignore this email.</p>
    <p>Regards,<br/>Rural Link Team</p>
  </div>
`;

const passwordChangedTemplate = (firstName) => `
  <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
    <h2>Hello ${firstName},</h2>
    <p>Your account password has been changed successfully.</p>
    <p>If you did not perform this change, please contact our support immediately.</p>
    <p>Regards,<br/>Rural Link Team</p>
  </div>
`;

const welcomeTemplate = (name = '', loginUrl = FRONTEND_URL) => {
  const body = `
    <p>Welcome ${name || 'User'}!</p>
    <p>Thank you for registering at Rural Link. You can log in using the link below:</p>
    <a href="${loginUrl}" target="_blank" style="display:inline-block;padding:10px 20px;background-color:${BRAND_COLOR};color:#fff;text-decoration:none;border-radius:5px;">Login Now</a>
    <p>We’re excited to have you onboard!</p>
  `;
  return emailLayout('Welcome to Rural Link', body);
};

// ---------------------
// Order Flow Templates
// ---------------------
const orderConfirmationTemplate = (orderDetails, name = '') => {
  const { orderNumber, items, shippingAddress, billingAddress, paymentMethod, subtotal, tax, shippingCost, discount, total, shipmentStatus } = orderDetails;

  const itemsHtml = items.map(item => `
    <tr>
      <td style="padding:8px; border:1px solid #ddd;">${item.name}</td>
      <td style="padding:8px; border:1px solid #ddd;">${item.quantity}</td>
      <td style="padding:8px; border:1px solid #ddd;">${item.price.toLocaleString()}</td>
      <td style="padding:8px; border:1px solid #ddd;">${(item.price * item.quantity).toLocaleString()}</td>
    </tr>
  `).join('');

  const shippingHtml = `
    ${shippingAddress.firstName} ${shippingAddress.lastName}<br>
    ${shippingAddress.street}, ${shippingAddress.city}, ${shippingAddress.state} - ${shippingAddress.zipCode}<br>
    ${shippingAddress.country}<br>
    Phone: ${shippingAddress.phone || 'N/A'}
  `;

  const billingHtml = `
    ${billingAddress.firstName} ${billingAddress.lastName}<br>
    ${billingAddress.street}, ${billingAddress.city}, ${billingAddress.state} - ${billingAddress.zipCode}<br>
    ${billingAddress.country}
  `;

  const body = `
    <p>Hi ${name || 'Customer'},</p>
    <p>Thank you for your order! Here are your order details:</p>

    <h3>Order #: ${orderNumber}</h3>

    <h4>Items:</h4>
    <table style="width:100%; border-collapse:collapse; margin-bottom:20px;">
      <thead>
        <tr>
          <th style="padding:8px; border:1px solid #ddd; text-align:left;">Product</th>
          <th style="padding:8px; border:1px solid #ddd; text-align:left;">Quantity</th>
          <th style="padding:8px; border:1px solid #ddd; text-align:left;">Price</th>
          <th style="padding:8px; border:1px solid #ddd; text-align:left;">Total</th>
        </tr>
      </thead>
      <tbody>
        ${itemsHtml}
      </tbody>
    </table>

    <h4>Shipping Address:</h4>
    <p>${shippingHtml}</p>

    <h4>Billing Address:</h4>
    <p>${billingHtml}</p>

    <h4>Payment & Summary:</h4>
    <p>Payment Method: ${paymentMethod}</p>
    <p>Subtotal: ${subtotal.toLocaleString()}</p>
    <p>Tax: ${tax.toLocaleString()}</p>
    <p>Shipping: ${shippingCost.toLocaleString()}</p>
    <p>Discount: ${discount?.amount?.toLocaleString() || 0}</p>
    <p><strong>Total: ${total.toLocaleString()}</strong></p>
    <p>Shipment Status: ${shipmentStatus}</p>

    <p>We will notify you once your order is shipped.</p>
  `;

  return emailLayout('Order Confirmation', body);
};

const orderShippedTemplate = (orderDetails, name = '', trackingNumber = '') => {
  const body = `
    <p>Hi ${name || 'Customer'},</p>
    <p>Your order <strong>${orderDetails.orderNumber}</strong> has been shipped!</p>
    ${trackingNumber ? `<p>Tracking Number: <strong>${trackingNumber}</strong></p>` : ''}
    <p>You can track your order status on your account dashboard.</p>
  `;
  return emailLayout('Your Order is Shipped', body);
};

const orderDeliveredTemplate = (orderDetails, name = '') => {
  const body = `
    <p>Hi ${name || 'Customer'},</p>
    <p>Your order <strong>${orderDetails.orderNumber}</strong> has been delivered successfully.</p>
    <p>Thank you for shopping with us! We hope to see you again.</p>
  `;
  return emailLayout('Order Delivered', body);
};

const orderCancelledTemplate = (orderDetails, name = '', reason = '') => {
  const body = `
    <p>Hi ${name || 'Customer'},</p>
    <p>Your order <strong>${orderDetails.orderNumber}</strong> has been cancelled.</p>
    ${reason ? `<p>Reason: ${reason}</p>` : ''}
    <p>If you have any questions, please contact support.</p>
  `;
  return emailLayout('Order Cancelled', body);
};

// ---------------------
// Supplier Flow Templates
// ---------------------
const supplierApprovalTemplate = (supplierName = '', approved = true, notes = '') => {
  const body = `
    <p>Hello ${supplierName},</p>
    <p>Your supplier account has been <strong>${approved ? 'approved' : 'rejected'}</strong>.</p>
    ${notes ? `<p>Notes from admin: ${notes}</p>` : ''}
    ${approved ? '<p>You can now start adding products to the platform.</p>' : ''}
  `;
  return emailLayout('Supplier Account Status', body);
};

const supplierPaymentTemplate = (supplierName = '', amount = 0, ordersPaid = []) => {
  const body = `
    <p>Hello ${supplierName},</p>
    <p>You have received payment of <strong>$${amount.toFixed(2)}</strong> for your delivered products.</p>
    ${ordersPaid.length ? `<p>Orders Paid:</p><ul>${ordersPaid.map(o => `<li>${o.orderNumber}</li>`).join('')}</ul>` : ''}
    <p>Thank you for your partnership!</p>
  `;
  return emailLayout('Supplier Payment Received', body);
};

// ---------------------
// Generic / Payment Templates
// ---------------------
const genericNotificationTemplate = (subject = '', message = '') => {
  const body = `<p>${message}</p>`;
  return emailLayout(subject, body);
};

const paymentConfirmationTemplate = (paymentDetails, name = '') => {
  const body = `
    <p>Hi ${name || 'Customer'},</p>
    <p>Your payment has been successfully received. Here are the details:</p>
    <pre style="background-color:#f1f1f1; padding:10px; border-radius:5px;">${JSON.stringify(paymentDetails, null, 2)}</pre>
    <p>Thank you for shopping with Rural Link!</p>
  `;
  return emailLayout('Payment Confirmation', body);
};

// Low Stock Email Template for Supplier
const lowStockTemplate = (product, inventory, supplierName = '') => {
  const body = `
    <p>Hello ${supplierName || 'Supplier'},</p>
    <p>We want to notify you that the following product you supply is low in stock:</p>
    <ul>
      <li><b>Product Name:</b> ${product.name}</li>
      <li><b>SKU:</b> ${product.sku || 'N/A'}</li>
      <li><b>Current Stock:</b> ${inventory.currentStock}</li>
      <li><b>Reserved Stock:</b> ${inventory.reservedStock}</li>
      <li><b>Reorder Point:</b> ${inventory.reorderPoint || 0}</li>
    </ul>
    <p>Please restock this item promptly to ensure uninterrupted supply to customers.</p>
    <p>Regards,<br/>Rural Link Inventory System</p>
  `;

  return emailLayout(`Low Stock Alert: ${product.name}`, body);
};




module.exports = {
    verifyEmailTemplate,
    forgotPasswordTemplate,
    passwordChangedTemplate,
    welcomeTemplate,
    orderConfirmationTemplate,
    orderShippedTemplate,
    orderDeliveredTemplate,
    orderCancelledTemplate,
    supplierApprovalTemplate,
    supplierPaymentTemplate,
    genericNotificationTemplate,
    paymentConfirmationTemplate,
    lowStockTemplate
};
