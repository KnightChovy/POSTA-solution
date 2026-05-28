const login = async (req, res) => {
  try {
    console.log("Login request body:", req.body);
    const { username, password } = req.body;
    const validUser = username === process.env.APP_USERNAME;
    console.log("App username:", process.env.APP_USERNAME);
    console.log("username:", username);

    console.log("Valid user:", validUser);
    if (!validUser) {
      return res.json({
        error: true,
        message: "Thông tin đăng nhập không chính xác",
      });
    }

    if (
      username == process.env.APP_USERNAME &&
      password == process.env.APP_PASSWORD
    ) {
      console.log("Login successful for user:", username);
      return res.json({ error: false, message: "Đăng nhập thành công" });
    } else {
      return res.json({ error: true, message: "Sai mật khẩu" });
    }
  } catch (error) {
    console.log(error);
  }
};

module.exports = { login };
