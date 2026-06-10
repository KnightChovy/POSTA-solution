import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { Form } from "../components/ui/form";
import { CustomFormField } from "../components/ui/FormField";
import { Button } from "../components/ui/button";
import * as z from "zod";
import { Globe } from "lucide-react";
import useSatelliteStore, {
  Satellite,
  Platform,
} from "@/store/satetillite";
import { useParams } from "react-router";
import { useTranslation } from "react-i18next";

// Các nền tảng vệ tinh có thể thêm.
const PLATFORM_OPTIONS: { value: Platform; label: string }[] = [
  { value: "WORDPRESS", label: "WordPress" },
  { value: "TWITTER", label: "Twitter (X)" },
  { value: "FACEBOOK", label: "Facebook" },
];

// Field nhập liệu theo từng nền tảng. WordPress dùng url/username/password,
// social dùng credentials.* (khớp REQUIRED_CREDENTIALS ở backend).
type FieldConfig = {
  name: string;
  label: string;
  placeholder: string;
  type?: "text" | "password";
};

const makePlatformFields = (
  t: (key: string) => string
): Record<Platform, FieldConfig[]> => ({
  WORDPRESS: [
    { name: "url", label: "Website URL", placeholder: "https://example.com" },
    { name: "username", label: "Username", placeholder: "admin_user" },
    {
      name: "password",
      label: "Application Password",
      placeholder: t("sites.passwordPlaceholder"),
      type: "password",
    },
  ],
  TWITTER: [
    {
      name: "credentials.clientId",
      label: "Client ID (OAuth 2.0)",
      placeholder: "Client ID",
    },
    {
      name: "credentials.clientSecret",
      label: "Client Secret (OAuth 2.0)",
      placeholder: "Client Secret",
      type: "password",
    },
    {
      name: "credentials.refreshToken",
      label: "Refresh Token",
      placeholder: "Refresh Token (từ nút Generate ở OAuth 2.0 Keys)",
      type: "password",
    },
  ],
  FACEBOOK: [
    { name: "credentials.pageId", label: "Page ID", placeholder: "123456789" },
    {
      name: "credentials.pageAccessToken",
      label: "Page Access Token",
      placeholder: "EAAB...",
      type: "password",
    },
  ],
});

// Schema động: bắt buộc field theo nền tảng đang chọn.
const makeSettingsSchema = (t: (key: string) => string) =>
  z
    .object({
      platform: z.enum(["WORDPRESS", "TWITTER", "FACEBOOK"]),
      url: z.string().optional(),
      username: z.string().optional(),
      password: z.string().optional(),
      credentials: z
        .object({
          // Twitter (OAuth 2.0)
          clientId: z.string().optional(),
          clientSecret: z.string().optional(),
          refreshToken: z.string().optional(),
          // Facebook
          pageId: z.string().optional(),
          pageAccessToken: z.string().optional(),
        })
        .partial()
        .optional(),
    })
    .superRefine((data, ctx) => {
      const required = (path: (string | number)[], value?: string) => {
        if (!value || !value.trim()) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            path,
            message: "Bắt buộc nhập",
          });
        }
      };

      // URL: vừa bắt buộc, vừa phải đúng định dạng.
      const requireUrl = (value?: string) => {
        if (!value || !value.trim()) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            path: ["url"],
            message: "Bắt buộc nhập",
          });
          return;
        }
        try {
          new URL(value);
        } catch {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            path: ["url"],
            message: t("sites.invalidUrl"),
          });
        }
      };

      if (data.platform === "WORDPRESS") {
        requireUrl(data.url);
        required(["username"], data.username);
        required(["password"], data.password);
      } else if (data.platform === "TWITTER") {
        (["clientId", "clientSecret", "refreshToken"] as const).forEach((k) =>
          required(["credentials", k], data.credentials?.[k])
        );
      }
      // FACEBOOK: không bắt buộc field nào — Page lấy từ .env ở server.
    });

type SettingsFormData = z.infer<ReturnType<typeof makeSettingsSchema>>;

const CreateSite = () => {
  const { t } = useTranslation();
  const settingsSchema = makeSettingsSchema(t);
  const platformFields = makePlatformFields(t);
  const { getSatellite, satellites, addNewSatellite, updateSatellite } =
    useSatelliteStore();
  const { id } = useParams();
  let sat: Satellite | undefined;
  if (id) {
    sat = satellites.find((s) => s._id === id);
  }
  const [editMode, setEditMode] = useState(sat ? false : true);

  useEffect(() => {
    getSatellite();
  }, [getSatellite]);

  const initialData: SettingsFormData = {
    platform: (sat?.platform as Platform) || "WORDPRESS",
    url: sat?.url || "",
    username: sat?.username || "",
    password: sat?.password || "",
    credentials: {
      clientId: sat?.credentials?.clientId || "",
      clientSecret: sat?.credentials?.clientSecret || "",
      refreshToken: sat?.credentials?.refreshToken || "",
      pageId: sat?.credentials?.pageId || "",
      pageAccessToken: sat?.credentials?.pageAccessToken || "",
    },
  };

  const form = useForm<SettingsFormData>({
    resolver: zodResolver(settingsSchema),
    defaultValues: initialData,
  });

  const platform = (form.watch("platform") as Platform) || "WORDPRESS";

  const toggleEditMode = () => {
    setEditMode(!editMode);
    if (editMode) form.reset(initialData);
  };

  const onSubmit = async (data: SettingsFormData) => {
    if (!sat) {
      await addNewSatellite(data as Satellite);
    } else {
      await updateSatellite(sat._id!, data as Satellite);
    }
  };

  const handleSubmit = async (data: SettingsFormData) => {
    await onSubmit(data);
    setEditMode(false);
  };


  return (
    <div className="min-h-screen bg-gradient-subtle py-8 px-4">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2.5 rounded-xl bg-gradient-to-br from-amber-500 to-yellow-600 shadow-lg shadow-amber-500/25">
              <Globe className="w-5 h-5 text-white" />
            </div>
            <h1 className="text-2xl font-bold text-foreground">
              {sat ? t("sites.editTitle") : t("sites.addTitle")}
            </h1>
          </div>
          <p className="text-muted-foreground text-sm ml-12">
            {sat ? t("sites.editSubtitle") : t("sites.addSubtitle")}
          </p>
        </div>

        {/* Card Form */}
        <div className="bg-card rounded-2xl border border-border shadow-sm hover:shadow-lg transition-all duration-300 overflow-hidden">
          <div className="p-8">
            <Form {...form}>
              <form
                onSubmit={form.handleSubmit(handleSubmit)}
                className="space-y-6"
              >
                <div className="grid grid-cols-1 gap-5">
                  {/* Chọn nền tảng */}
                  <CustomFormField
                    name="platform"
                    label="Nền tảng"
                    type="select"
                    placeholder="Chọn nền tảng"
                    options={PLATFORM_OPTIONS}
                    disabled={!editMode}
                  />

                  {/* Facebook: Page lấy từ cấu hình server (.env) — không cần nhập token */}
                  {platform === "FACEBOOK" && (
                    <div className="rounded-xl border border-blue-200 bg-blue-50/60 dark:border-blue-900 dark:bg-blue-950/20 p-4">
                      <p className="text-sm text-foreground font-medium mb-1">
                        Page Facebook lấy từ cấu hình server
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Bài sẽ đăng lên Page đã cấu hình ở server
                        (FB_PAGE_ID/FB_PAGE_ACCESS_TOKEN). Cứ để trống các ô bên
                        dưới — chỉ nhập nếu muốn dùng Page riêng cho vệ tinh này.
                      </p>
                    </div>
                  )}

                  {/* Field theo nền tảng đang chọn */}
                  {platformFields[platform].map((f) => (
                    <CustomFormField
                      key={f.name}
                      name={f.name}
                      label={f.label}
                      type={f.type || "text"}
                      placeholder={f.placeholder}
                      disabled={!editMode}
                    />
                  ))}
                </div>

                {/* Action Buttons */}
                <div className="pt-6 flex justify-end gap-3 border-t border-border mt-8">
                  <Button
                    type="button"
                    onClick={toggleEditMode}
                    variant="outline"
                    className="px-5 border-border text-muted-foreground hover:bg-secondary hover:text-foreground transition-all duration-200 cursor-pointer"
                  >
                    {editMode ? t("sites.cancel") : t("sites.edit")}
                  </Button>

                  {editMode && (
                    <Button
                      type="submit"
                      className="px-5 bg-gradient-to-r from-amber-500 to-yellow-600 hover:from-amber-600 hover:to-yellow-700 text-white shadow-md shadow-amber-500/25 transition-all duration-200 cursor-pointer"
                    >
                      {sat ? t("sites.update") : t("sites.create")}
                    </Button>
                  )}
                </div>
              </form>
            </Form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CreateSite;
