const Post = require("../models/Post");
const Satellite = require("../models/Satellite");
const getQueue = require("../../config/queue/pqueue");
const {
  postToSatellite,
  checkSatelliteRestApi,
  errorCodeFromAxios,
} = require("../../apis/post");
const { convertErrorSatelliteToUrls } = require("../../utils/satelliteUtils");
const { createVariations } = require("../../utils/createVariations");
const { saveImageToServer } = require("./imageController");
const { replaceImagesInContent } = require("../../utils/postUtils");
const { incrementAiUsage } = require("../../utils/subscription");
const getAllPosts = async (req, res) => {
  try {
    const allPosts = await Post.find();
    return res.json({ allPosts });
  } catch (error) {
    res.status(500).json({ error });
  }
};

const trackProgress = async (req, res) => {
  try {
    const { postTitle } = req.query;
    if (!postTitle) {
      return res.status(400).json({ message: "Post title is required" });
    }
    const post = await Post.findOne({
      title: postTitle,
    }).sort({ createdAt: -1 });
    if (!post) {
      return res.status(404).json({ message: "Post not found" });
    }
    if (!post.totalSatellite || isNaN(post.totalSatellite)) {
      return res.status(400).json({ message: "Post progress not found" });
    }
    const numberOfApis = post.totalSatellite;
    const successfulPosts = post.postedSatellite
      ? post.postedSatellite.length
      : 0;
    const progress = (successfulPosts / numberOfApis).toFixed(2);
    res.status(200).json({ progress });
  } catch (error) {
    res.status(500).json(error);
  }
};
const createNewPost = async (req, res) => {
  try {
    const values = req.body.values;
    const siteInfoWithImageUrl = JSON.parse(req.body.siteInfoWithImageUrl);
    let { title, content } = JSON.parse(values);
    console.log("content: ", content)
    // content = `<h2 id="ftoc-heading-1" class="ftwp-heading" data-pm-slice="1 1 []">DIAMOND SKY &ndash; BIỂU TƯỢNG SỐNG CAO CẤP KHU Đ&Ocirc;NG</h2>
    // <p data-pm-slice="1 3 []"><a href="https://diamondskys.com.vn/"><strong>Diamond Sky</strong></a>&nbsp;l&agrave; dự &aacute;n căn hộ cao cấp được quy hoạch v&agrave; ph&aacute;t triển tại trung t&acirc;m phường Hiệp B&igrave;nh, TP.Thủ Đức. Sở hữu thiết kế hiện đại, hệ thống tiện &iacute;ch đẳng cấp v&agrave; vị tr&iacute; v&agrave;ng kế cận quận trung t&acirc;m, Diamond Sky hứa hẹn trở th&agrave;nh t&acirc;m điểm sống đẳng cấp của giới thượng lưu khu Đ&ocirc;ng TP.HCM.</p>
    // <ul data-spread="false">
    // <li><strong>T&ecirc;n dự &aacute;n</strong>: Diamond Sky</li>
    // <li><strong>Vị tr&iacute;</strong>: Đường Nguyễn Thị Nhung, Phường Hiệp B&igrave;nh, TP.Thủ Đức, TP.HCM</li>
    // <li><strong>Chủ đầu tư</strong>: Đang cập nhật</li>
    // <li><strong>Tổng diện t&iacute;ch</strong>: ~10.000 m&sup2;</li>
    // <li><strong>Mật độ x&acirc;y dựng</strong>: ~35%</li>
    // <li><strong>Loại h&igrave;nh sản phẩm</strong>: Căn hộ cao cấp, shophouse, officetel</li>
    // <li><strong>Số block</strong>: 2 block cao 25 tầng</li>
    // <li><strong>Tổng số căn hộ</strong>: Tr&ecirc;n 5000 căn</li>
    // <li><strong>Ph&aacute;p l&yacute;</strong>: Sở hồng l&acirc;u d&agrave;i</li>
    // <li><strong>Thời gian b&agrave;n giao</strong>: Dự kiến Qu&yacute; IV/2028</li>
    // </ul>
    // <p><img src="https://canho-bconssolary.com/wp-content/uploads/2025/11/0450c9c27e39c96790284.jpg" alt="0450c9c27e39c96790284.jpg" width="1280" height="960"></p>
    // <p><img src="https://canho-bconssolary.com/wp-content/uploads/2025/11/0450c9c27e39c96790284.jpg" alt="0450c9c27e39c96790284.jpg" width="1280" height="960"></p>
    // `
    // Chỉ đếm vệ tinh ACTIVE của chính user đang đăng (đa người dùng)
    const totalSatellite = await Satellite.countDocuments({ owner: req.user.id, status: "ACTIVE" });

    if (!title || !content) {
      return res
        .status(400)
        .json({ message: "Chưa nhập tiêu đề hoặc nội dung" });
    }

    const newPostId = await saveImageToServer(req, res);

    const newPost = await Post.findByIdAndUpdate(
      newPostId,
      {
        title,
        content,
        totalSatellite,
        postedSatellite: [],
        errorSatellite: [],
        successfulRate: 0,
        owner: req.user?.id, // gắn chủ sở hữu để đếm quota bài đăng theo user
      },
      { new: true }
    );

    // Đếm 1 lần dùng AI cho mỗi bài tạo (pipeline viết lại nội dung bằng AI).
    if (req.user?.id) {
      try { await incrementAiUsage(req.user.id); } catch (e) { console.error('[post] incrementAiUsage:', e.message); }
    }

    const { successfulSatelliteUrls, progress } = await pushToSatelliteWebsite(
      newPost,
      siteInfoWithImageUrl
    );

    // Cập nhật successfulRate sau khi post xong
    const successfulRate = totalSatellite > 0 ? progress / totalSatellite : 0;
    await Post.findByIdAndUpdate(
      newPost._id,
      { successfulRate },
      { new: true }
    );
    const post = await Post.findById(newPost._id);
    const updatedPost = await convertErrorSatelliteToUrls(post);
    return res
      .status(201)
      .json({ newPost: updatedPost, successfulSatelliteUrls });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
};

const pushToSatelliteWebsite = async (
  newPost,
  siteInfoWithImageUrl,
  progress = 0,
  isFirstSatellite = true,
  isRepost = false
) => {
  try {
    // Chỉ lấy vệ tinh ACTIVE CỦA CHỦ BÀI VIẾT — không đăng nhầm lên site của user khác
    const satellites = await Satellite.find({ owner: newPost.owner, status: "ACTIVE" });
    if (!satellites.length) {
      console.warn("⚠️ No ACTIVE satellite sites found in DB.");
      return { successfulSatelliteUrls: [], progress };
    }

    const queue = getQueue();
    const successfulSatelliteUrls = [];
    // Thu kết quả trực tiếp từ queue.add() thay vì queue.on() trên queue singleton:
    // listener đăng ký theo request sẽ rò rỉ và bắn nhầm vào request sau (gây crash).
    const tasks = [];
    // Site đầu tiên dùng nội dung gốc; các site sau tạo variation. Quyết định ngay
    // lúc enqueue (vòng for chạy tuần tự) để không bị race giữa các task song song.
    let useOriginalContent = isFirstSatellite;

    for (const satellite of satellites) {
      // So khớp theo hostname để bỏ qua khác biệt dấu "/" cuối hay http/https.
      // (new URL(x) ép sang chuỗi sẽ thêm "/" cuối khiến .includes() luôn fail)
      const siteMatch = Object.values(siteInfoWithImageUrl).find((site) => {
        try {
          return new URL(satellite.url).hostname === new URL(site.url).hostname;
        } catch (e) {
          return false;
        }
      });

      if (!siteMatch) {
        console.log(`⚠️ Không tìm thấy site tương ứng cho ${satellite.url}`);
        await Post.findByIdAndUpdate(
          newPost._id,
          {
            $addToSet: {
              errorSatellite: { satelliteId: satellite._id, errorCode: 404 },
            },
          },
          { new: true }
        );
        continue;
      }

      // Ảnh giờ được host trên server (URL công khai đã nằm sẵn trong <img src>),
      // không còn phụ thuộc upload ảnh vào media của từng WordPress nên không skip
      // site vì "thiếu ảnh" nữa — cứ đăng nội dung như đang có.
      let newContent = newPost.content;

      // Thay thế ảnh khi repost khác với khi đăng bài lần đầu
      if (!isRepost) {
        newContent = replaceImagesInContent(newContent, siteMatch.img);
      } else {
        const images = newPost.imagePath.map(
          (img) => `${process.env.SERVER_URL}/${img}`
        );
        newContent = replaceImagesInContent(newContent, images);
      }

      const sendOriginal = useOriginalContent;
      useOriginalContent = false; // các site tiếp theo sẽ tạo variation

      tasks.push(
        queue.add(async () => {
          try {
            const content = sendOriginal
              ? newContent
              : await createVariations(newContent);
            const post = { title: newPost.title, content, status: "publish" };
            return await postToSatellite(satellite, post);
          } catch (error) {
            await Post.findByIdAndUpdate(
              newPost._id,
              {
                $addToSet: {
                  errorSatellite: {
                    satelliteId: satellite._id,
                    errorCode: errorCodeFromAxios(error),
                  },
                },
              },
              { new: true }
            );
          }
        })
      );
    }

    // Chờ mọi task của riêng request này rồi xử lý kết quả (không qua listener toàn cục)
    const results = await Promise.all(tasks);
    for (const result of results) {
      if (result?.data?.link) {
        successfulSatelliteUrls.push(result.data.link);
        progress += 1;
        await Post.findOneAndUpdate(
          { _id: newPost._id },
          { $addToSet: { postedSatellite: result.data.link } }
        );
      }
    }

    return { successfulSatelliteUrls, progress };
  } catch (error) {
    console.log("Lỗi khi đẩy bài lên vệ tinh:", error);
    return { successfulSatelliteUrls: [], progress };
  }
};

const repostToErrorSatellitesOnePost = async (req, res) => {
  try {
    let formattedObj = [];
    const existingPost = await Post.findById(req.params.id).populate(
      "errorSatellite.satelliteId"
    );
    if (!existingPost) {
      return res.status(404).json({ message: "Không tìm thấy bài viết" });
    }
    // Chỉ chủ bài viết mới được đăng lại.
    if (String(existingPost.owner) !== String(req.user.id)) {
      return res.status(403).json({ message: "Bạn không có quyền đăng lại bài viết này" });
    }
    const errorSitesInfo = existingPost.errorSatellite;
    let siteInfoWithImageUrl = errorSitesInfo.map((site) => {
      formattedObj.push({
        url: site.satelliteId.url,
        username: site.satelliteId.username,
        password: site.satelliteId.password,
        img: existingPost.imagePath.map(
          (img) => `${process.env.SERVER_URL}/${img}`
        ),
      });

      return formattedObj[formattedObj.length - 1];
    });
    const { successfulRate } = existingPost;
    // Lấy totalSatellite ACTIVE hiện tại của chủ bài viết (có thể khác lúc tạo post)
    const currentTotalActiveSatellite = await Satellite.countDocuments({
      owner: existingPost.owner,
      status: "ACTIVE",
    });

    const existingProgress =
      currentTotalActiveSatellite > 0
        ? Math.round(successfulRate * currentTotalActiveSatellite)
        : 0;
    const { successfulSatelliteUrls, progress } = await pushToSatelliteWebsite(
      existingPost,
      siteInfoWithImageUrl,
      existingProgress,
      true,
      true
    );

    // Lọc ra những site error mà không có trong danh sách thành công
    const remainingErrorSatellites = existingPost.errorSatellite.filter(
      (err) => {
        // Kiểm tra xem URL của satellite có trong danh sách thành công không
        const isSuccessful = successfulSatelliteUrls.some((successUrl) =>
          err.satelliteId.url.includes(new URL(successUrl).hostname)
        );
        return !isSuccessful;
      }
    );

    // Cập nhật mảng errorSatellite với những site còn lại
    const newSuccessfulRate =
      currentTotalActiveSatellite > 0
        ? progress / currentTotalActiveSatellite
        : 0;

    await Post.findByIdAndUpdate(
      existingPost._id,
      {
        errorSatellite: remainingErrorSatellites,
        successfulRate: newSuccessfulRate,
        totalSatellite: currentTotalActiveSatellite, // Cập nhật lại totalSatellite với số active hiện tại
      },
      { new: true }
    );

    const updatedPost = await Post.findById(existingPost._id).populate(
      "errorSatellite.satelliteId"
    );

    return res.status(200).json({
      message: "Posts updated successfully",
      updatedPost,
      successfulSatelliteUrls,
      remainingErrors: remainingErrorSatellites.length,
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({ error: error.message });
  }
};

const getErrorPost = async (req, res) => {
  try {
    const postId = req.params.id;
    const post = await Post.findById(postId);
    if (!post) {
      return res.status(404).json({ message: "Không tìm thấy bài viết" });
    }
    const postContent = post.content;
    const images = post.imagePath.map(
      (img) => `${process.env.SERVER_URL}/${img}`
    );
    const contentWithImages = replaceImagesInContent(postContent, images);

    res.status(200).json({ contentWithImages });
  } catch (error) {
    res.status(500).json({ error });
  }
};

const getPostById = async (req, res) => {
  try {
    const { id } = req.params;
    const post = await Post.findById(id);
    if (!post) {
      return res.status(404).json({ message: "Post not found" });
    }
    returnedPost = await convertErrorSatelliteToUrls(post);
    res.status(200).json({ post: returnedPost });
  } catch (error) {
    res.status(500).json({ error });
  }
};

module.exports = {
  getAllPosts,
  getPostById,
  getErrorPost,
  trackProgress,
  createNewPost,
  pushToSatelliteWebsite,
  repostToErrorSatellitesOnePost,
};
