import React, { useState, useRef, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
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
import { CheckCircle, Loader2, UploadCloud } from "lucide-react";
import { PerformanceDisplay } from "@/components/ui/PerformanceDisplay";
import useSatelliteStore from "@/store/satetillite";
import { checkSitesFast } from "@/lib/utils";

const formSchema = z.object({
  title: z
    .string()
    .min(1, { message: "Tiêu đề không được để trống" })
    .max(100, { message: "Tiêu đề phải ít hơn 100 ký tự" }),
  content: z.string().min(1, { message: "Nội dung không được để trống" }),
  link: z
    .string()
    .url({ message: "Vui lòng nhập URL hợp lệ" })
    .or(z.string().length(0)),
  image: z.string().optional(),
});

type FormValues = z.infer<typeof formSchema>;

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
  const [showMetrics, setShowMetrics] = useState(false);
  const [uploading, setUploading] = useState(false);
  const { addPost } = postStore();
  const { setProgress } = useProgressStore();
  const { measureAsync, clearMetrics, metrics } = usePerformanceMonitor();
  const { getSatellite, satellites } = useSatelliteStore();
  const [images, setImages] = useState<File[]>([]);
  const [selectedSites, setSelectedSites] = useState<string[]>([]);

  const storeImgTemp = satellites.map((site) => {
    return {
      _id: site._id || "",
      username: site.username,
      password: site.password,
      url: site.url,
      status: site.status || "pending",
      img: [] as string[],
    };
  });
  const siteInfoWithImageUrl = useRef<SatelliteAccount[]>([...storeImgTemp]);

  useEffect(() => {
    siteInfoWithImageUrl.current = [...storeImgTemp];
  }, [satellites]);

  useEffect(() => {
    const filtered = satellites
      .filter((site) => selectedSites.includes(site._id))
      .map((site) => ({
        _id: site._id || "",
        username: site.username,
        password: site.password,
        url: site.url,
        status: site.status || "pending",
        img: [] as string[],
      }));

    siteInfoWithImageUrl.current = filtered;
  }, [selectedSites]);

  useEffect(() => {
    getSatellite();
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
    resolver: zodResolver(formSchema),
    defaultValues,
  });

  const handleSubmit = async (values: FormValues) => {
    const toastId = toast.info("🔄 Bắt đầu clone bài viết...", {
      autoClose: false,
    });

    setProgress({
      status: "in-progress",
      message: "Đang gửi yêu cầu tạo bài viết...",
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

    await fakeStep("Đang xử lý nội dung bài viết...", 25);
    await fakeStep("Đang tải ảnh và dữ liệu...", 45);
    await fakeStep("Gửi yêu cầu đến máy chủ...", 65);

    try {
      const url = `${import.meta.env.VITE_API_BASE_URL}/api/post`;
      const formData = new FormData();
      formData.append("values", JSON.stringify(values));
      formData.append(
        "siteInfoWithImageUrl",
        JSON.stringify(siteInfoWithImageUrl.current)
      );

      images.forEach((file) => formData.append("images", file));

      const response = await fetch(url, {
        method: "POST",
        body: formData,
      });
      const data = await response.json();
      const { newPost } = data;
      if (data.successfulSatelliteUrls.length === 0) {
        toast.error("Không thể tạo bài viết trên bất kỳ trang vệ tinh nào.", {
          autoClose: 5000,
        });
      } else {
        toast.success("Tạo bài viết thành công!", { autoClose: 3000 });
      }
      addPost(newPost);
      navigate("/progress", { state: { newPost: newPost } });
      return newPost;
    } catch (error) {
      toast.dismiss(toastId);
      toast.error("Tạo bài viết thất bại!", { autoClose: 3000 });
    } finally {
      setUploading(false);
    }
  };

  // Upload ảnh lên nhiều WordPress site
  const uploadImageToMultipleWordPress = async (file: File) => {
    setImages((prev) => [...prev, file]);
    const uploadPromises = siteInfoWithImageUrl.current.map(async (site) => {
      let count = 0;
      const url = `${site.url}wp-json/wp/v2/media`;
      const appPassword = site.password.replace(/\s+/g, "");
      const formData = new FormData();
      formData.append("file", file, file.name);
      const auth = btoa(`${site.username}:${appPassword}`);
      try {
        let data = null;
        const check = await fetch(url, { method: "HEAD" });
        if (check.ok) {
          const res = await fetch(url, {
            method: "POST",
            headers: { Authorization: `Basic ${auth}` },
            body: formData,
          });

          if (!res.ok) {
            toast.error(`Upload ảnh lên ${site.url} thất bại!`);
            return null;
          }
          data = await res.json();
          siteInfoWithImageUrl.current = siteInfoWithImageUrl.current.map(
            (c) => {
              if (c.url.includes(site.url)) {
                return { ...c, img: [...c.img, data.source_url] };
              }
              return c;
            }
          );
          toast.success(`Upload ảnh lên ${site.url} thành công!`);
        }
        return { link: data?.source_url };
      } catch (error) {
        toast.error(`Upload ảnh lên ${site.url} thất bại!`);
        return null;
      }
    });
    return await Promise.all(uploadPromises);
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
          const results = await uploadImageToMultipleWordPress(file);

          const validResults = Array.isArray(results)
            ? results.filter((r) => r && r.link)
            : [];

          if (validResults.length === 0) {
            alert("Không thể upload ảnh lên bất kỳ site nào.");
            return;
          }

          const firstResult = validResults[0];

          callback(firstResult.link, { alt: file.name });
        } catch (err) {
          alert("Upload ảnh thất bại. Vui lòng thử lại.");
        }
      };

      input.click();
    }
  };

  return (
    <div className="space-y-4">
      {/* <div className="space-y-2">
        <h1 className=" text-blue-600 text-xl font-bold m-4">
          Chọn các site để đăng bài
        </h1>
        {satellites.map((site) => {
          const checked = selectedSites.includes(site._id);

          return (
            <label
              key={site._id}
              className="flex items-center gap-2 p-2 border rounded cursor-pointer"
            >
              <input
                type="checkbox"
                checked={checked}
                onChange={() => {
                  setSelectedSites((prev) =>
                    checked
                      ? prev.filter((id) => id !== site._id)
                      : [...prev, site._id]
                  );
                }}
              />

              <span className="text-sm">{site.url}</span>
            </label>
          );
        })}
      </div> */}
      {showMetrics && (
        <PerformanceDisplay metrics={metrics} onClear={clearMetrics} />
      )}
      <div className="w-full border-[2px] max-w-4xl mx-auto bg-white">
        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(handleSubmit)}
            className="space-y-6 p-6"
          >
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Tiêu đề</FormLabel>
                  <FormControl>
                    <Input placeholder="Nhập tiêu đề bài viết" {...field} />
                  </FormControl>
                  <FormDescription>Tiêu đề của bài viết</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="content"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nội dung</FormLabel>
                  <FormControl>
                    <Editor
                      apiKey="de7eylucb6hopyd8di8ruii0oabt5ylm78zmnnw9dgahz07g"
                      value={field.value}
                      onEditorChange={(v) => field.onChange(v)}
                      init={{
                        height: 600,
                        menubar: true,
                        width: "100%",
                        language: "vi",
                        language_url:
                          "https://cdn.tiny.cloud/1/de7eylucb6hopyd8di8ruii0oabt5ylm78zmnnw9dgahz07g/tinymce/8/langs/vi.js",
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
                          "bullist numlist outdent indent | image media table | removeformat | help",
                        file_picker_callback: file_picker_callback,
                        images_upload_handler: async (blobInfo) => {
                          const file = blobInfo.blob();
                          // const blob = blobInfo.blob();
                          // const filev2 = new File([blob], blobInfo.filename(), {
                          //   type: blob.type,
                          // });

                          // setImages((prev) => [...prev, filev2]);
                          const urls = await uploadImageToMultipleWordPress(
                            file
                          );
                          const valid = Array.isArray(urls)
                            ? urls.filter((r) => r && r.link)
                            : [];
                          if (valid.length === 0)
                            throw new Error(
                              "Không có site nào upload thành công"
                            );
                          return valid[0].link;
                        },
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

            <div className="flex justify-between items-center space-x-2 pt-4 border-t">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  form.reset();
                }}
              >
                Hủy
              </Button>
              <Button disabled={uploading} type="submit">
                {isEditing ? "Lưu thay đổi" : "Tạo bài viết"}
              </Button>
            </div>
          </form>
        </Form>
      </div>
    </div>
  );
};

export default PostForm;
