const nodemailer = require('nodemailer');

// Chỉ tạo transporter khi đã cấu hình SMTP trong .env.
// Thiếu cấu hình thì trả null để đăng ký vẫn chạy được (chỉ bỏ qua email).
// Hỗ trợ cả 2 bộ tên biến: SMTP_* (mới) và EMAIL_* (cũ).
function smtpConfig() {
  const host = process.env.SMTP_HOST || process.env.EMAIL_HOST || 'smtp.gmail.com';
  const port = Number(process.env.SMTP_PORT || process.env.EMAIL_PORT) || 587;
  const user = process.env.SMTP_USERNAME || process.env.EMAIL_USER;
  const pass = process.env.SMTP_PASSWORD || process.env.EMAIL_PASS;
  return { host, port, user, pass };
}

function mailFrom() {
  const { user } = smtpConfig();
  return process.env.EMAIL_FROM || `POSTA <${user}>`;
}

function createTransporter() {
  const { host, port, user, pass } = smtpConfig();
  if (!user || !pass) return null;

  return nodemailer.createTransport({
    host,
    port,
    secure: port === 465, // 465 dùng SSL, còn lại STARTTLS
    auth: { user, pass },
  });
}

// URL của frontend để dựng link trong email (đổi qua env khi deploy).
// FE_URL ưu tiên; nếu không có, CLIENT_URL có thể là DANH SÁCH nhiều origin
// (ngăn cách dấu phẩy) → chọn origin https (production) thay vì localhost.
function getFrontendUrl() {
  if (process.env.FE_URL) return process.env.FE_URL.trim().replace(/\/$/, '');
  const origins = (process.env.CLIENT_URL || '')
    .split(',')
    .map((o) => o.trim().replace(/\/$/, ''))
    .filter(Boolean);
  return origins.find((o) => o.startsWith('https://')) || origins[0] || 'http://localhost:5173';
}

// Khung email chung mang nhận diện POSTA.
function wrapEmail(bodyHtml) {
  return `
    <div style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 560px; margin: 0 auto; color: #2A170F;">
      <div style="background: #FF6B00; padding: 28px 24px; border-radius: 16px 16px 0 0;">
        <h1 style="margin: 0; color: #fff; font-size: 24px;">POSTA</h1>
      </div>
      <div style="border: 1px solid #eee; border-top: none; padding: 24px; border-radius: 0 0 16px 16px;">
        ${bodyHtml}
      </div>
    </div>
  `;
}

/**
 * Gửi email xác thực kèm link chứa token. Người dùng phải bấm link để kích hoạt tài khoản.
 * Ném lỗi ra ngoài để controller quyết định (controller bắt và không chặn đăng ký).
 */
async function sendVerificationEmail(to, name, token) {
  const transporter = createTransporter();
  if (!transporter) {
    console.warn('[mailer] Chưa cấu hình EMAIL_USER/EMAIL_PASS — bỏ qua gửi email xác thực.');
    return;
  }

  const from = mailFrom();
  const verifyUrl = `${getFrontendUrl()}/verify-email?token=${token}`;

  await transporter.sendMail({
    from,
    to,
    subject: 'Xác thực tài khoản POSTA của bạn',
    html: wrapEmail(`
      <p style="font-size: 16px;">Xin chào <strong>${name}</strong>,</p>
      <p style="font-size: 15px; line-height: 1.6;">
        Cảm ơn bạn đã đăng ký <strong>POSTA</strong>. Vui lòng bấm nút bên dưới để xác thực
        email và kích hoạt tài khoản. Liên kết có hiệu lực trong <strong>24 giờ</strong>.
      </p>
      <p style="text-align: center; margin: 28px 0;">
        <a href="${verifyUrl}"
           style="background: #FF6B00; color: #fff; text-decoration: none; padding: 12px 28px; border-radius: 10px; font-weight: 700; display: inline-block;">
          Xác thực email
        </a>
      </p>
      <p style="font-size: 13px; color: #777;">
        Hoặc sao chép liên kết này vào trình duyệt:<br />
        <a href="${verifyUrl}" style="color: #FF6B00; word-break: break-all;">${verifyUrl}</a>
      </p>
      <p style="font-size: 13px; color: #777;">Nếu bạn không đăng ký POSTA, vui lòng bỏ qua email này.</p>
    `),
  });
}

/** Gửi email chào mừng sau khi xác thực thành công. Không chặn luồng nếu lỗi. */
async function sendWelcomeEmail(to, name) {
  const transporter = createTransporter();
  if (!transporter) return;

  const from = mailFrom();
  const loginUrl = `${getFrontendUrl()}/login`;

  await transporter.sendMail({
    from,
    to,
    subject: 'Chào mừng bạn đến với POSTA 🎉',
    html: wrapEmail(`
      <p style="font-size: 16px;">Xin chào <strong>${name}</strong>,</p>
      <p style="font-size: 15px; line-height: 1.6;">
        Tài khoản của bạn đã được <strong>xác thực thành công</strong>. Đăng nhập ngay để bắt đầu
        tự động hóa đăng bài vệ tinh cùng POSTA!
      </p>
      <p style="text-align: center; margin: 28px 0;">
        <a href="${loginUrl}"
           style="background: #FF6B00; color: #fff; text-decoration: none; padding: 12px 28px; border-radius: 10px; font-weight: 700; display: inline-block;">
          Đăng nhập ngay
        </a>
      </p>
    `),
  });
}

/** Gửi email kèm link đặt lại mật khẩu (hạn 1 giờ). */
async function sendResetPasswordEmail(to, name, token) {
  const transporter = createTransporter();
  if (!transporter) {
    console.warn('[mailer] Chưa cấu hình EMAIL_USER/EMAIL_PASS — bỏ qua gửi email đặt lại mật khẩu.');
    return;
  }

  const from = mailFrom();
  const resetUrl = `${getFrontendUrl()}/reset-password?token=${token}`;

  await transporter.sendMail({
    from,
    to,
    subject: 'Đặt lại mật khẩu POSTA',
    html: wrapEmail(`
      <p style="font-size: 16px;">Xin chào <strong>${name}</strong>,</p>
      <p style="font-size: 15px; line-height: 1.6;">
        Bạn (hoặc ai đó) vừa yêu cầu đặt lại mật khẩu. Bấm nút bên dưới để tạo mật khẩu mới.
        Liên kết có hiệu lực trong <strong>1 giờ</strong>.
      </p>
      <p style="text-align: center; margin: 28px 0;">
        <a href="${resetUrl}"
           style="background: #FF6B00; color: #fff; text-decoration: none; padding: 12px 28px; border-radius: 10px; font-weight: 700; display: inline-block;">
          Đặt lại mật khẩu
        </a>
      </p>
      <p style="font-size: 13px; color: #777;">
        Nếu bạn không yêu cầu, hãy bỏ qua email này — mật khẩu của bạn vẫn an toàn.
      </p>
    `),
  });
}

module.exports = { sendVerificationEmail, sendWelcomeEmail, sendResetPasswordEmail };
