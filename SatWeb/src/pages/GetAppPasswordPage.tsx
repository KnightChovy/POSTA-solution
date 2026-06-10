import React, { useState } from "react";
import { Copy, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useTranslation, Trans } from "react-i18next";

const GetAppPasswordPage: React.FC = () => {
  const { t } = useTranslation();
  const [copied, setCopied] = useState<string | null>(null);

  const copyToClipboard = async (text: string, id: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(id);
      setTimeout(() => setCopied(null), 1500);
    } catch (err) {
      console.error("Copy failed", err);
    }
  };

  const curlExample = `curl -X POST "https://your-site.com/wp-json/wp/v2/media" \\
  -H "Authorization: Basic $(echo -n 'username:application_password' | base64)" \\
  -F "file=@/path/to/file.jpg"`;

  const fetchExample = `await fetch("https://your-site.com/wp-json/wp/v2/media", {
  method: "POST",
  headers: {
    "Authorization": "Basic " + btoa("username:application_password")
  },
  body: formData
});`;

  return (
    <div className="p-4 md:p-8 bg-gradient-subtle min-h-screen">
      <div className="max-w-3xl mx-auto">
        <h1 className="text-2xl font-semibold mb-6 text-foreground">
          <Trans
            i18nKey="sites.guideHeading"
            components={{
              accent: (
                <span className="text-primary bg-gradient-to-r from-amber-500 to-yellow-600 bg-clip-text text-transparent" />
              ),
            }}
          />
        </h1>

        <section className="bg-card border border-border rounded-xl p-5 mb-5 shadow-sm hover:shadow-md transition-shadow duration-300">
          <h2 className="text-lg font-medium mb-3 text-foreground">
            {t("sites.section1Title")}
          </h2>
          <p className="text-sm text-muted-foreground leading-relaxed">
            <Trans
              i18nKey="sites.section1Body"
              components={{
                b: <strong className="text-foreground" />,
              }}
            />
          </p>
        </section>

        <section className="bg-card border border-border rounded-xl p-5 mb-5 shadow-sm hover:shadow-md transition-shadow duration-300">
          <h2 className="text-lg font-medium mb-3 text-foreground">
            {t("sites.section2Title")}
          </h2>
          <ol className="list-decimal list-inside space-y-3 text-sm text-muted-foreground leading-relaxed">
            <li>{t("sites.step1")}</li>
            <li>
              <Trans
                i18nKey="sites.step2"
                components={{ b: <strong className="text-foreground" /> }}
              />
            </li>
            <li>
              <Trans
                i18nKey="sites.step3"
                components={{ b: <strong className="text-foreground" /> }}
              />
            </li>
            <li>
              <Trans
                i18nKey="sites.step4"
                components={{
                  b: <strong className="text-foreground" />,
                  i: <em className="text-amber-600 dark:text-amber-400" />,
                }}
              />
            </li>
            <li>
              <Trans
                i18nKey="sites.step5"
                components={{ b: <strong className="text-foreground" /> }}
              />
            </li>
            <li>{t("sites.step6")}</li>
          </ol>
        </section>
      </div>
    </div>
  );
};

export default GetAppPasswordPage;
