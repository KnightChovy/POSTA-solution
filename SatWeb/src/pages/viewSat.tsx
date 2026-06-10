import React, { useEffect, useState } from "react";
import { ExternalLink, Eye, EyeOff, Copy, Globe, Settings } from "lucide-react";
import useSatelliteStore from "@/store/satetillite";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";

const ViewSat = ({ sites: initialSites } = {}) => {
  const { t } = useTranslation();
  const [visiblePasswordId, setVisiblePasswordId] = useState<
    string | number | null
  >(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const { satellites, getSatellite } = useSatelliteStore();

  useEffect(() => {
    getSatellite();
  }, [getSatellite]);

  const sites =
    Array.isArray(initialSites) && initialSites.length
      ? initialSites
      : satellites || [];

  const getUniqueId = (s: any, idx: number) => s._id || s.id || idx;

  const togglePassword = (uniqueId: string | number) => {
    setVisiblePasswordId((prev) => (prev === uniqueId ? null : uniqueId));
  };

  const handleCopy = async (text: string, id: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 1500);
    } catch (err) {
      console.error("Copy failed", err);
    }
  };

  const openSite = (url: string) => {
    const fixed =
      url.startsWith("http://") || url.startsWith("https://")
        ? url
        : `https://${url}`;
    window.open(fixed, "_blank", "noopener,noreferrer");
  };

  return (
    <div className="min-h-screen bg-gradient-subtle p-4 md:p-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-gradient-to-br from-amber-500 to-yellow-600 shadow-lg shadow-amber-500/25">
              <Globe className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-foreground">
                {t("sites.pageTitle")}
              </h2>
              <p className="text-sm text-muted-foreground">
                {t("sites.pageSubtitle")}
              </p>
            </div>
          </div>
          <Button
            asChild
            className="bg-gradient-to-r from-amber-500 to-yellow-600 hover:from-amber-600 hover:to-yellow-700 text-white shadow-md shadow-amber-500/25"
          >
            <Link to="/create-site">{t("sites.addNew")}</Link>
          </Button>
        </div>

        {/* Desktop table */}
        <div className="hidden md:block overflow-hidden bg-card border border-border rounded-xl shadow-sm">
          <table className="min-w-full">
            <thead className="bg-secondary/50 border-b border-border">
              <tr>
                <th className="px-5 py-4 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  #
                </th>
                <th className="px-5 py-4 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  {t("sites.colUrl")}
                </th>
                <th className="px-5 py-4 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  {t("sites.colUsername")}
                </th>
                <th className="px-5 py-4 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  {t("sites.colPassword")}
                </th>
                <th className="px-5 py-4 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  {t("sites.colDetail")}
                </th>
                <th className="px-5 py-4 text-right text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  {t("sites.colAction")}
                </th>
              </tr>
            </thead>

            <tbody className="divide-y divide-gray-50">
              {sites.map((s, idx) => {
                const uid = getUniqueId(s, idx);
                return (
                  <tr
                    key={uid}
                    className="hover:bg-amber-50/30 dark:hover:bg-amber-950/20 transition-colors duration-150"
                  >
                    <td className="px-5 py-4 text-sm font-medium text-muted-foreground">
                      {idx + 1}
                    </td>

                    {/* URL */}
                    <td className="px-5 py-4 text-sm">
                      <div className="flex items-center gap-2">
                        <a
                          href={s.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-amber-600 dark:text-amber-400 hover:text-amber-700 dark:hover:text-amber-300 hover:underline truncate max-w-[280px] font-medium"
                        >
                          {s.url}
                        </a>
                        <button
                          onClick={() => handleCopy(s.url, `url-${uid}`)}
                          className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors"
                          title={t("sites.copyUrl")}
                        >
                          <Copy className="h-4 w-4 text-gray-400 hover:text-gray-600" />
                        </button>
                        {copiedId === `url-${uid}` && (
                          <span className="text-xs text-emerald-600 font-medium">
                            {t("sites.copied")}
                          </span>
                        )}
                      </div>
                    </td>

                    {/* Username */}
                    <td className="px-5 py-4 text-sm">
                      <div className="flex items-center gap-2">
                        <span className="truncate max-w-[140px] text-foreground">
                          {s.username}
                        </span>
                        <button
                          onClick={() => handleCopy(s.username, `user-${uid}`)}
                          className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors"
                          title={t("sites.copyUsername")}
                        >
                          <Copy className="h-4 w-4 text-gray-400 hover:text-gray-600" />
                        </button>
                        {copiedId === `user-${uid}` && (
                          <span className="text-xs text-emerald-600 font-medium">
                            {t("sites.copied")}
                          </span>
                        )}
                      </div>
                    </td>

                    {/* Password */}
                    <td className="px-5 py-4 text-sm">
                      <div className="flex items-center gap-2">
                        <code className="block truncate max-w-[180px] bg-secondary px-3 py-1.5 rounded-lg text-muted-foreground font-mono text-xs">
                          {visiblePasswordId === uid
                            ? s.password
                            : "•".repeat(12)}
                        </code>
                        <button
                          onClick={() => togglePassword(uid)}
                          className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors"
                          title={
                            visiblePasswordId === uid
                              ? t("sites.hidePassword")
                              : t("sites.showPassword")
                          }
                        >
                          {visiblePasswordId === uid ? (
                            <EyeOff className="h-4 w-4 text-gray-400 hover:text-gray-600" />
                          ) : (
                            <Eye className="h-4 w-4 text-gray-400 hover:text-gray-600" />
                          )}
                        </button>
                        <button
                          onClick={() => handleCopy(s.password, `pass-${uid}`)}
                          className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors"
                          title={t("sites.copyPassword")}
                        >
                          <Copy className="h-4 w-4 text-gray-400 hover:text-gray-600" />
                        </button>
                        {copiedId === `pass-${uid}` && (
                          <span className="text-xs text-emerald-600 font-medium">
                            {t("sites.copied")}
                          </span>
                        )}
                      </div>
                    </td>

                    {/* Chỉnh sửa */}
                    <td className="px-5 py-4 text-sm text-gray-600">
                      <Button
                        asChild
                        size="sm"
                        variant="outline"
                        className="border-border hover:bg-amber-50 dark:hover:bg-amber-950/30 hover:text-amber-600 dark:hover:text-amber-400 hover:border-amber-200 dark:hover:border-amber-800 transition-all"
                      >
                        <Link to={`/viewSat/${uid}`}>
                          <Settings className="h-4 w-4 mr-1.5" />
                          {t("sites.colDetail")}
                        </Link>
                      </Button>
                    </td>

                    {/* Action */}
                    <td className="px-5 py-4 text-right">
                      <button
                        onClick={() => openSite(s.url)}
                        className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium border border-border rounded-lg bg-card hover:bg-secondary hover:border-border transition-all duration-200"
                      >
                        <ExternalLink className="h-4 w-4" />
                        {t("sites.openSite")}
                      </button>
                    </td>
                  </tr>
                );
              })}

              {sites.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-5 py-16 text-center">
                    <div className="flex flex-col items-center">
                      <div className="p-4 rounded-full bg-secondary mb-3">
                        <Globe className="h-8 w-8 text-muted-foreground/50" />
                      </div>
                      <p className="text-foreground font-medium">
                        {t("sites.emptyTitle")}
                      </p>
                      <p className="text-muted-foreground text-sm mt-1">
                        {t("sites.emptySubtitle")}
                      </p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Mobile cards */}
        <div className="md:hidden space-y-3">
          {sites.map((s, idx) => {
            const uid = getUniqueId(s, idx);
            return (
              <div
                key={uid}
                className="bg-card p-5 rounded-xl border border-border shadow-sm hover:shadow-md transition-all duration-200"
              >
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                      {t("sites.colUsername")}
                    </span>
                    <p className="font-medium text-foreground">{s.username}</p>
                  </div>
                  <button
                    onClick={() => openSite(s.url)}
                    className="text-amber-600 dark:text-amber-400 text-sm flex items-center gap-1 font-medium"
                  >
                    <ExternalLink className="h-4 w-4" />
                    {t("sites.open")}
                  </button>
                </div>
                <div className="text-sm mb-3">
                  <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    {t("sites.colUrl")}
                  </span>
                  <a
                    href={s.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block text-amber-600 dark:text-amber-400 break-all font-medium mt-0.5"
                  >
                    {s.url}
                  </a>
                </div>
                <div className="text-sm mb-4">
                  <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    {t("sites.colPassword")}
                  </span>
                  <div className="flex items-center gap-2 mt-0.5">
                    <code className="bg-secondary px-2 py-1 rounded-lg text-muted-foreground font-mono text-xs">
                      {visiblePasswordId === uid ? s.password : "••••••••••••"}
                    </code>
                    <button
                      onClick={() => togglePassword(uid)}
                      className="p-1 text-muted-foreground hover:text-foreground"
                    >
                      {visiblePasswordId === uid ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                    </button>
                  </div>
                </div>
                <div className="pt-3 border-t border-gray-100">
                  <Button
                    asChild
                    size="sm"
                    className="w-full bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-700 hover:to-indigo-800"
                  >
                    <Link to={`/viewSat/${uid}`}>{t("sites.viewDetail")}</Link>
                  </Button>
                </div>
              </div>
            );
          })}

          {sites.length === 0 && (
            <div className="bg-white p-8 rounded-xl border border-gray-100 text-center">
              <div className="p-4 rounded-full bg-gray-50 inline-block mb-3">
                <Globe className="h-8 w-8 text-gray-300" />
              </div>
              <p className="text-gray-500 font-medium">
                {t("sites.emptyTitle")}
              </p>
              <p className="text-gray-400 text-sm mt-1">
                {t("sites.emptySubtitle")}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ViewSat;
