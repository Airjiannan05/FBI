const nodemailer = require('nodemailer');

// 创建邮件传输对象
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || 'smtp.qq.com',
  port: process.env.SMTP_PORT || 587,
  secure: false, // true for 465, false for other ports
  auth: {
    user: process.env.SMTP_USER, // 发件邮箱
    pass: process.env.SMTP_PASS  // 邮箱授权码
  }
});

/**
 * 发送订单确认邮件
 * @param {string} to - 收件人邮箱
 * @param {Object} orderInfo - 订单信息
 * @returns {Promise}
 */
exports.sendOrderConfirmation = async (to, orderInfo) => {
  const { orderId, totalPrice, items, orderTime } = orderInfo;
  
  // 生成商品列表HTML
  const itemsHtml = items.map(item => `
    <tr>
      <td style="padding: 10px; border-bottom: 1px solid #ddd;">${item.name}</td>
      <td style="padding: 10px; border-bottom: 1px solid #ddd; text-align: center;">x${item.quantity}</td>
      <td style="padding: 10px; border-bottom: 1px solid #ddd; text-align: right;">￥${item.price}</td>
    </tr>
  `).join('');

  const mailOptions = {
    from: `"购物网站" <${process.env.SMTP_USER}>`,
    to: to,
    subject: `订单确认 - 订单号 #${orderId}`,
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #1e90ff, #a855f7); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
          .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
          .order-info { background: white; padding: 20px; border-radius: 8px; margin: 20px 0; }
          .table { width: 100%; border-collapse: collapse; margin: 20px 0; }
          .total { font-size: 1.3em; font-weight: bold; color: #1e90ff; text-align: right; padding: 20px 0; }
          .footer { text-align: center; padding: 20px; color: #666; font-size: 0.9em; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🎉 订单支付成功！</h1>
            <p>感谢您的购买，我们将尽快为您发货</p>
          </div>
          <div class="content">
            <div class="order-info">
              <h2>订单信息</h2>
              <p><strong>订单号：</strong>#${orderId}</p>
              <p><strong>下单时间：</strong>${orderTime}</p>
              <p><strong>订单状态：</strong><span style="color: #10b981;">已支付，待发货</span></p>
            </div>
            
            <h3>商品清单</h3>
            <table class="table">
              <thead>
                <tr style="background: #f0f0f0;">
                  <th style="padding: 10px; text-align: left;">商品名称</th>
                  <th style="padding: 10px; text-align: center;">数量</th>
                  <th style="padding: 10px; text-align: right;">单价</th>
                </tr>
              </thead>
              <tbody>
                ${itemsHtml}
              </tbody>
            </table>
            
            <div class="total">
              订单总额：￥${totalPrice}
            </div>
            
            <div style="background: #e3f2fd; padding: 15px; border-radius: 8px; margin-top: 20px;">
              <p style="margin: 0;"><strong>💡 温馨提示：</strong></p>
              <p style="margin: 5px 0;">• 我们将在1-3个工作日内为您发货</p>
              <p style="margin: 5px 0;">• 发货后会通过邮件通知您物流信息</p>
              <p style="margin: 5px 0;">• 如有任何问题，请联系客服</p>
            </div>
          </div>
          <div class="footer">
            <p>此邮件由系统自动发送，请勿直接回复</p>
            <p>© 2025 购物网站 | 品质生活</p>
          </div>
        </div>
      </body>
      </html>
    `
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    console.log('邮件发送成功:', info.messageId);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error('邮件发送失败:', error);
    throw error;
  }
};

/**
 * 发送发货通知邮件
 * @param {string} to - 收件人邮箱
 * @param {Object} shipInfo - 发货信息
 * @returns {Promise}
 */
exports.sendShippingNotification = async (to, shipInfo) => {
  const { orderId, trackingNumber, carrier, estimatedDelivery } = shipInfo;

  const mailOptions = {
    from: `"购物网站" <${process.env.SMTP_USER}>`,
    to: to,
    subject: `订单已发货 - 订单号 #${orderId}`,
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #10b981, #3b82f6); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
          .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
          .tracking-box { background: white; padding: 25px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #10b981; }
          .tracking-number { font-size: 1.5em; color: #1e90ff; font-weight: bold; margin: 10px 0; }
          .footer { text-align: center; padding: 20px; color: #666; font-size: 0.9em; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>📦 您的订单已发货！</h1>
            <p>商品正在路上，请注意查收</p>
          </div>
          <div class="content">
            <div class="tracking-box">
              <h2>物流信息</h2>
              <p><strong>订单号：</strong>#${orderId}</p>
              <p><strong>物流公司：</strong>${carrier || '顺丰速运'}</p>
              <p><strong>运单号：</strong></p>
              <div class="tracking-number">${trackingNumber || '暂无'}</div>
              <p><strong>预计送达：</strong>${estimatedDelivery || '3-5个工作日'}</p>
            </div>
            
            <div style="background: #fef3c7; padding: 15px; border-radius: 8px; margin-top: 20px;">
              <p style="margin: 0;"><strong>📌 配送提醒：</strong></p>
              <p style="margin: 5px 0;">• 请保持手机畅通，快递员会提前联系您</p>
              <p style="margin: 5px 0;">• 签收时请检查包裹是否完好</p>
              <p style="margin: 5px 0;">• 如有问题请及时联系客服</p>
            </div>
          </div>
          <div class="footer">
            <p>感谢您的购买，期待再次为您服务！</p>
            <p>© 2025 购物网站 | 品质生活</p>
          </div>
        </div>
      </body>
      </html>
    `
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    console.log('发货通知邮件发送成功:', info.messageId);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error('发货通知邮件发送失败:', error);
    throw error;
  }
};
