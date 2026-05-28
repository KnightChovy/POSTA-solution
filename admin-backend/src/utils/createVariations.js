const axios = require('axios');
require("dotenv").config();

const API_URL = 'https://api.openai.com/v1/chat/completions';
const API_KEY = process.env.OPENAI_API_KEY;


const createVariations = async (inputContent) => {
  try {
    const prompt = `
    Bạn là chuyên gia biên tập nội dung marketing bất động sản.
    Nhiệm vụ của bạn: viết lại toàn bộ phần nội dung VĂN BẢN trong bài viết tôi cung cấp, tạo ra một phiên bản mới hoàn toàn, câu chữ khác nhưng giữ nguyên thông điệp và thông tin.

    YÊU CẦU QUAN TRỌNG:
    1. Tuyệt đối GIỮ NGUYÊN và KHÔNG THAY ĐỔI:
      - Bất kỳ thẻ HTML nào: <img>, <figure>, <a>, <iframe>, <picture>, <strong>, <em>, <h2>, <h3>, <p>, <ul>, <li>, ...
      - Vị trí xuất hiện của các thẻ HTML.
      - Nội dung trong thuộc tính HTML (src, alt, href, width, height…).

    2. Chỉ được phép viết lại phần text bên ngoài HTML tags:
      - Viết lại câu văn khác hoàn toàn bản gốc.
      - Thay đổi cấu trúc câu, từ ngữ, thể hiện sáng tạo.
      - Giữ nguyên ý nghĩa, không thêm thông tin không có trong bài.
      - Không được làm mất định dạng HTML.

    3. Văn phong:
      - Chuyên nghiệp, trau chuốt, phù hợp lĩnh vực bất động sản.
      - Dễ đọc, mạch lạc, có tính marketing nhẹ nhàng.

    4. Định dạng trả về:
      - Xuất ra toàn bộ bài viết hoàn chỉnh dưới dạng HTML (giống cấu trúc bài gốc).
      - Tuyệt đối không giải thích gì thêm.
      - Không được wrap nội dung trong <code> hoặc Markdown.

    ---

    ĐÂY LÀ NỘI DUNG BÀI GỐC:
    ${inputContent}
  `;
    const response = await axios.post(
      API_URL,
      {
        model: "gpt-4o-mini",
        messages: [{ role: "user", content: prompt }],
        // max_tokens: 100,
      },
      {
        headers: {
          'Authorization': `Bearer ${API_KEY}`,
          'Content-Type': 'application/json',
        },
      }
    )

    // console.log("kết quả chatgpt nè: ", response.data.choices[0].message.content);
    return response.data.choices[0].message.content;
  } catch (error) {
    console.error("Lỗi khi tạo biến thể nội dung:", error);
    throw error;
  }
};

module.exports = { createVariations };
