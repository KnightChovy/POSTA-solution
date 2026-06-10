const crypto = require("crypto");

// Mã hoá đối xứng AES-256-GCM cho secret nhạy cảm (vd Facebook Page Access Token)
// trước khi lưu DB. Khoá lấy từ ENCRYPTION_KEY (64 ký tự hex = 32 byte).
//
// Định dạng chuỗi mã hoá: "enc:v1:" + base64(iv | authTag | ciphertext)
//   iv = 12 byte, authTag = 16 byte.
// decrypt() trả nguyên văn nếu chuỗi KHÔNG có tiền tố "enc:v1:" → tương thích
// token nhập tay (plaintext) lẫn token cũ chưa mã hoá.

const PREFIX = "enc:v1:";
const IV_LEN = 12;
const TAG_LEN = 16;

function getKey() {
  const hex = process.env.ENCRYPTION_KEY || "";
  const key = Buffer.from(hex, "hex");
  if (key.length !== 32) {
    throw new Error("ENCRYPTION_KEY phải là 64 ký tự hex (32 byte)");
  }
  return key;
}

function encrypt(plain) {
  if (plain == null || plain === "") return plain;
  const iv = crypto.randomBytes(IV_LEN);
  const cipher = crypto.createCipheriv("aes-256-gcm", getKey(), iv);
  const ct = Buffer.concat([cipher.update(String(plain), "utf8"), cipher.final()]);
  const tag = cipher.getAuthTag();
  return PREFIX + Buffer.concat([iv, tag, ct]).toString("base64");
}

function decrypt(payload) {
  // Không phải chuỗi mã hoá của ta → coi như plaintext, trả nguyên.
  if (typeof payload !== "string" || !payload.startsWith(PREFIX)) return payload;
  const raw = Buffer.from(payload.slice(PREFIX.length), "base64");
  const iv = raw.subarray(0, IV_LEN);
  const tag = raw.subarray(IV_LEN, IV_LEN + TAG_LEN);
  const ct = raw.subarray(IV_LEN + TAG_LEN);
  const decipher = crypto.createDecipheriv("aes-256-gcm", getKey(), iv);
  decipher.setAuthTag(tag);
  return Buffer.concat([decipher.update(ct), decipher.final()]).toString("utf8");
}

module.exports = { encrypt, decrypt };
