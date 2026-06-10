import React, { useState, useRef, useEffect } from "react";
import axios from "axios";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useTranslation } from "react-i18next";
import type { TFunction } from "i18next";
import { toast } from "react-toastify";
import postStore from "@/store/postStore";
import { Editor } from "@tinymce/tinymce-react";
import { usePerformanceMonitor } from "@/hooks/usePerformanceMonitor";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router";
import wpSites from "@/state/wpSite";
import useProgressStore from "@/store/progress";
import { CheckCircle, Loader2, UploadCloud, Search, Globe } from "lucide-react";
import { PerformanceDisplay } from "@/components/ui/PerformanceDisplay";
import useSatelliteStore from "@/store/satetillite";
import { checkSitesFast } from "@/lib/utils";
import useSeoStore from "@/store/seoStore";
import SeoPanel from "@/components/posts/SeoPanel";

// Key TinyMCE (cloud): ưu tiên đọc từ env (VITE_TINYMCE_API_KEY), nếu chưa set
// (vd trên Vercel/preview chưa cấu hình env) thì fallback về key hardcode dưới đây
// để vẫn chạy được khi test. Key này được bảo vệ bằng Approved Domains, không phải
// secret. Muốn đổi key sạch sẽ thì set env, khỏi sửa code.
const TINYMCE_API_KEY = "wu0wd7sscidx08qfrcp0panj4v0sx7i5174yy8ehncu8jyhm";

// Nhãn + màu badge theo nền tảng. Hiện chỉ WordPress đăng được; social đang là stub.
const PLATFORM_META: Record<string, { label: string; badge: string }> = {
  WORDPRESS: { label: "WordPress", badge: "bg-blue-100 text-blue-700" },
  TWITTER: { label: "Twitter (X)", badge: "bg-sky-100 text-sky-700" },
  FACEBOOK: { label: "Facebook", badge: "bg-indigo-100 text-indigo-700" },
};

const makeSchema = (t: TFunction) =>
  z.object({
    title: z
      .string()
      .min(1, { message: t("posts.errTitleRequired") })
      .max(100, { message: t("posts.errTitleMax") }),
    content: z.string().min(1, { message: t("posts.errContentRequired") }),
    link: z
      .string()
      .url({ message: t("posts.errUrlInvalid") })
      .or(z.string().length(0)),
    image: z.string().optional(),
  });

type FormValues = z.infer<ReturnType<typeof makeSchema>>;

interface PostFormProps {
  initialValues?: FormValues;
  onSubmit: (values: FormValues) => void;
  isEditing?: boolean;
}
interface SatelliteAccount {
  _id: string;
  username: string;
  password: string;
  url: string;
  status: string;
  img: string[];
}
const PostForm = ({
  initialValues,
  onSubmit,
  isEditing = false,
}: PostFormProps) => {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [showMetrics, setShowMetrics] = useState(false);
  const [uploading, setUploading] = useState(false);
  const { addPost } = postStore();
  const { setProgress } = useProgressStore();
  const { measureAsync, clearMetrics, metrics } = usePerformanceMonitor();
  const { getSatellite, satellites } = useSatelliteStore();
  const {
    evaluate,
    optimize,
    evaluation,
    metrics: seoMetrics,
    evaluating,
    optimizing,
    reset: resetSeo,
  } = useSeoStore();
  const [selectedSites, setSelectedSites] = useState<string[]>([]);
  const [keyword, setKeyword] = useState("");
  const [publishing, setPublishing] = useState(false);

  const didInitSelection = useRef(false);
  const siteInfoWithImageUrl = useRef<SatelliteAccount[]>([]);

  // Mặc định chọn tất cả vệ tinh (mọi nền tảng) khi tải xong — giữ hành vi fan-out cũ.
  useEffect(() => {
    if (!didInitSelection.current && satellites.length) {
      didInitSelection.current = true;
      setSelectedSites(satellites.map((s) => s._id || ""));
    }
  }, [satellites]);

  // Dựng danh sách site sẽ đăng từ các site được chọn (nguồn dữ liệu gửi lên backend).
  useEffect(() => {
    siteInfoWithImageUrl.current = satellites
      .filter((site) => selectedSites.includes(site._id || ""))
      .map((site) => ({
        _id: site._id || "",
        username: site.username || "",
        password: site.password || "",
        url: site.url || "",
        status: site.status || "pending",
        img: [] as string[],
      }));
  }, [selectedSites, satellites]);

  // Tiện ích chọn/bỏ chọn site.
  const allSelected =
    satellites.length > 0 && selectedSites.length === satellites.length;
  const toggleSite = (id: string) =>
    setSelectedSites((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  const toggleSelectAll = () =>
    setSelectedSites(allSelected ? [] : satellites.map((s) => s._id || ""));

  useEffect(() => {
    getSatellite();
  }, []);

  // Xóa kết quả chấm SEO khi mở/rời trang soạn bài để bài mới không "dính" điểm
  // của bài trước (seoStore là store toàn cục, không tự reset).
  useEffect(() => {
    resetSeo();
    return () => resetSeo();
  }, []);

  // useEffect(() => {
  //   async function runCheck() {
  //     const results = await checkSitesFast(satellites);
  //     console.log("Kết quả kiểm tra:", results);
  //   }

  //   runCheck();
  // }, [satellites]);

  const defaultValues: FormValues = initialValues || {
    title: "",
    content: "",
    link: "",
  };

  const form = useForm<FormValues>({
    resolver: zodResolver(makeSchema(t)),
    defaultValues,
  });

  // Đăng bài thật (fan-out lên các site vệ tinh). Chỉ chạy sau khi đã chấm SEO,
  // được gọi từ nút "Đăng bài ngay" trong SeoPanel.
  const doPublish = async (values: FormValues) => {
    if (!siteInfoWithImageUrl.current.length) {
      toast.warning("Vui lòng chọn ít nhất 1 WordPress để đăng.");
      return;
    }
    setPublishing(true);
    const toastId = toast.info(t("posts.toastCloneStart"), {
      autoClose: false,
    });

    setProgress({
      status: "in-progress",
      message: t("posts.progressSending"),
      percent: 10,
    });

    const fakeStep = async (message: string, percent: number, delay = 3000) => {
      let icon, color;
      if (percent < 20) {
        icon = "";
        color = "bg-red-200";
      } else if (percent < 40) {
        icon = "";
        color = "bg-blue-50";
      } else if (percent < 70) {
        icon = "";
        color = "bg-amber-50";
      } else {
        icon = "";
        color = "bg-green-50";
      }

      setProgress({ status: "in-progress", message, percent });
      toast.update(toastId, {
        render: (
          <div className={`flex items-center gap-3 ${color} rounded-md w-full`}>
            <span className="text-gray-800">{message}</span>
            <span className="ml-auto text-primary-600">{percent}%</span>
          </div>
        ),
        type: "info",
        autoClose: 4000,
      });

      await new Promise((res) => setTimeout(res, delay));
    };

    await fakeStep(t("posts.progressProcessing"), 25);
    await fakeStep(t("posts.progressLoadingAssets"), 45);
    await fakeStep(t("posts.progressSendingServer"), 65);

    try {
      const formData = new FormData();
      formData.append("values", JSON.stringify(values));
      formData.append(
        "siteInfoWithImageUrl",
        JSON.stringify(siteInfoWithImageUrl.current),
      );

      // Dùng axios (global) để interceptor tự gắn "Authorization: Bearer" +
      // tự refresh khi 401. fetch trần trước đây không có token nên /api/post
      // (sau authenticateJWT) luôn trả 401.
      const response = await axios.post(`/api/post`, formData, {
        withCredentials: true,
      });
      const data = response.data;
      const { newPost } = data;
      if (data.successfulSatelliteUrls.length === 0) {
        toast.error(t("posts.createNoSite"), {
          autoClose: 5000,
        });
      } else {
        toast.success(t("posts.createSuccess"), { autoClose: 3000 });
      }
      addPost(newPost);
      navigate("/progress", { state: { newPost: newPost } });
      return newPost;
    } catch (error) {
      toast.dismiss(toastId);
      toast.error(t("posts.createFailed"), { autoClose: 3000 });
    } finally {
      setUploading(false);
      setPublishing(false);
    }
  };

  // Bước trước khi đăng: chấm điểm SEO (tự nhận diện từ khóa nếu để trống) rồi
  // hiện panel để người dùng xem điểm, tối ưu, rồi mới bấm "Đăng bài ngay".
  const handlePrePublish = async (values: FormValues) => {
    const result = await evaluate({
      title: values.title,
      content: values.content,
      keyword: keyword.trim(),
    });
    if (result) {
      toast.info(
        `Đã chấm điểm SEO: ${result.score}/100. Xem đánh giá bên dưới rồi bấm "Đăng bài ngay".`,
      );
    }
  };

  // Chấm điểm SEO nội dung đang soạn theo từ khóa chính.
  const handleCheckSeo = async () => {
    const title = form.getValues("title");
    const content = form.getValues("content");
    if (!content?.trim()) {
      toast.warning(t("posts.seoEmptyContent"));
      return;
    }
    // keyword để trống -> AI tự nhận diện từ khóa chính.
    await evaluate({ title, content, keyword: keyword.trim() });
  };

  // Nhờ AI viết lại nội dung cho chuẩn SEO rồi ghi đè vào editor + chấm lại.
  const handleOptimizeSeo = async () => {
    const title = form.getValues("title");
    const content = form.getValues("content");
    // Đưa các tiêu chí chưa đạt + gợi ý sang cho AI tối ưu trúng đích.
    const issues = evaluation
      ? [
          ...evaluation.checks
            .filter((c) => c.status !== "pass")
            .map((c) => `${c.label}: ${c.detail}`),
          ...evaluation.suggestions,
        ]
      : [];

    const result = await optimize({
      title,
      content,
      keyword: keyword.trim(),
      issues,
    });
    if (!result) return;

    form.setValue("content", result.content, { shouldValidate: true });
    if (result.title) {
      form.setValue("title", result.title, { shouldValidate: true });
    }
    toast.success(t("posts.seoOptimized"));
    // Chấm lại để người dùng thấy điểm mới ngay.
    await evaluate({
      title: result.title || title,
      content: result.content,
      keyword: keyword.trim(),
    });
  };

  // Upload 1 ảnh lên server của mình -> trả URL công khai (phục vụ qua /uploads).
  // Editor chèn thẳng URL này vào <img>, dùng chung cho mọi site vệ tinh — không
  // upload vào media của từng WordPress nữa (tránh CORS + không lộ app password).
  const uploadImageToServer = async (
    file: Blob,
    filename?: string,
  ): Promise<string> => {
    const type = file.type || "image/png";
    const ext = type.split("/")[1] || "png";
    const name =
      filename && /\.[a-z0-9]+$/i.test(filename)
        ? filename
        : `image-${Date.now()}.${ext}`;
    const formData = new FormData();
    formData.append("image", file, name);
    const res = await axios.post(`/api/image/upload`, formData, {
      withCredentials: true,
    });
    if (!res.data?.url) throw new Error(t("posts.uploadFailed"));
    return res.data.url as string;
  };

  const file_picker_callback = (callback, value, meta) => {
    if (meta.filetype === "image") {
      const input = document.createElement("input");
      input.type = "file";
      input.accept = "image/*";

      input.onchange = async function () {
        const file = (this as HTMLInputElement).files?.[0];
        if (!file) return;
        try {
          const url = await uploadImageToServer(file, file.name);
          callback(url, { alt: file.name });
        } catch (err) {
          toast.error(t("posts.uploadRetry"));
        }
      };

      input.click();
    }
  };

  return (
    <div className="space-y-4">
      {/* Chọn nơi đăng bài (WordPress / Twitter / Facebook). */}
      {satellites.length > 0 && (
        <div className="w-full max-w-4xl mx-auto bg-white border-[2px] p-4 space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-semibold text-gray-800 flex items-center gap-2">
              <Globe className="w-4 h-4 text-amber-500" />
              Chọn nơi đăng bài
              <span className="text-xs font-normal text-gray-500">
                ({selectedSites.length}/{satellites.length})
              </span>
            </h2>
            <button
              type="button"
              onClick={toggleSelectAll}
              className="text-sm text-amber-600 hover:underline cursor-pointer"
            >
              {allSelected ? "Bỏ chọn tất cả" : "Chọn tất cả"}
            </button>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {satellites.map((site) => {
              const id = site._id || "";
              const platform = site.platform || "WORDPRESS";
              const checked = selectedSites.includes(id);
              const meta = PLATFORM_META[platform] || PLATFORM_META.WORDPRESS;
              return (
                <label
                  key={id}
                  className={`flex items-center gap-2 p-2.5 border rounded-lg cursor-pointer transition-colors ${
                    checked
                      ? "border-amber-400 bg-amber-50"
                      : "border-gray-200 hover:bg-gray-50"
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={checked}
                    onChange={() => toggleSite(id)}
                    className="accent-amber-500 cursor-pointer"
                  />
                  <span
                    className={`text-[11px] font-medium px-1.5 py-0.5 rounded ${meta.badge}`}
                  >
                    {meta.label}
                  </span>
                  <span className="text-sm text-gray-700 truncate">
                    {site.url || meta.label}
                  </span>
                </label>
              );
            })}
          </div>
        </div>
      )}
      {showMetrics && (
        <PerformanceDisplay metrics={metrics} onClear={clearMetrics} />
      )}
      <div className="w-full border-[2px] max-w-4xl mx-auto bg-white">
        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(handlePrePublish)}
            className="space-y-6 p-6">
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("posts.titleLabel")}</FormLabel>
                  <FormControl>
                    <Input placeholder={t("posts.titlePlaceholder")} {...field} />
                  </FormControl>
                  <FormDescription>{t("posts.titleDescription")}</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="content"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("posts.contentLabel")}</FormLabel>
                  <FormControl>
                    <Editor
                      apiKey={TINYMCE_API_KEY}
                      value={field.value}
                      onEditorChange={(v) => field.onChange(v)}
                      init={{
                        height: 600,
                        menubar: true,
                        width: "100%",
                        language: "vi",
                        language_url: `https://cdn.tiny.cloud/1/${TINYMCE_API_KEY}/tinymce/8/langs/vi.js`,
                        plugins: [
                          "advlist",
                          "autolink",
                          "lists",
                          "link",
                          "image",
                          "charmap",
                          "preview",
                          "anchor",
                          "searchreplace",
                          "visualblocks",
                          "code",
                          "fullscreen",
                          "insertdatetime",
                          "media",
                          "table",
                          "help",
                          "wordcount",
                        ],
                        toolbar:
                          "undo redo | formatselect | bold italic underline | " +
                          "alignleft aligncenter alignright alignjustify | " +
                          "bullist numlist outdent indent | link unlink image media table | removeformat | help",
                        file_picker_callback: file_picker_callback,
                        images_upload_handler: async (blobInfo) =>
                          uploadImageToServer(
                            blobInfo.blob(),
                            blobInfo.filename(),
                          ),
                        automatic_uploads: true,
                        file_picker_types: "image",
                        image_advtab: true,
                        image_dimensions: true,
                        image_caption: true,
                        object_resizing: true,
                        paste_data_images: true,
                        draggable_modal: true,
                        contextmenu: "link image table",
                        content_style: `
                          body { font-family: Helvetica, Arial, sans-serif; font-size: 14px; }
                          img { max-width: 100%; height: auto; cursor: move; }
                          figure.image { display: inline-block; margin: 0 auto; }
                        `,
                      }}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Từ khóa SEO + nút chấm điểm */}
            <div className="space-y-2 pt-4 border-t">
              <FormLabel>{t("posts.seoKeywordLabel")}</FormLabel>
              <div className="flex gap-2">
                <Input
                  placeholder={t("posts.seoKeywordPlaceholder")}
                  value={keyword}
                  onChange={(e) => setKeyword(e.target.value)}
                />
                <Button
                  type="button"
                  variant="secondary"
                  className="cursor-pointer shrink-0"
                  onClick={handleCheckSeo}
                  disabled={evaluating}>
                  {evaluating ? (
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  ) : (
                    <Search className="w-4 h-4 mr-2" />
                  )}
                  {t("posts.checkSeoButton")}
                </Button>
              </div>
              <FormDescription>
                {t("posts.seoKeywordDescription")}
              </FormDescription>
            </div>

            <div className="flex justify-between items-center space-x-2 pt-4 border-t">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  form.reset();
                  setKeyword("");
                  resetSeo();
                }}>
                Hủy
              </Button>
              <Button
                disabled={uploading || evaluating || publishing}
                type="submit"
                className="cursor-pointer">
                {evaluating ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    {t("posts.scoringInProgress")}
                  </>
                ) : isEditing ? (
                  t("posts.saveChanges")
                ) : (
                  t("posts.scorePrepareButton")
                )}
              </Button>
            </div>
          </form>
        </Form>
      </div>

      {/* Kết quả đánh giá SEO + nút tối ưu lại */}
      {evaluation && (
        <SeoPanel
          evaluation={evaluation}
          metrics={seoMetrics}
          optimizing={optimizing}
          onOptimize={handleOptimizeSeo}
          onPublish={() => doPublish(form.getValues())}
          publishing={publishing}
        />
      )}
    </div>
  );
};

export default PostForm;
