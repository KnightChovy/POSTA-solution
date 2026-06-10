import { zodResolver } from "@hookform/resolvers/zod";
import React, { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { Form } from "../components/ui/form";
import { CustomFormField } from "../components/ui/FormField";
import { Button } from "../components/ui/button";
import * as z from "zod";
import { Globe, Lock, User } from "lucide-react";
import useSatelliteStore, { Satellite } from "@/store/satetillite";
import { useParams } from "react-router";
import { useTranslation } from "react-i18next";

const makeSettingsSchema = (t: (key: string) => string) =>
  z.object({
    url: z.string().url(t("sites.invalidUrl")),
    username: z.string(),
    password: z.string(),
  });

type SettingsFormData = z.infer<ReturnType<typeof makeSettingsSchema>>;

interface SettingsFormProps {
  initialData: SettingsFormData;
  onSubmit: (data: SettingsFormData) => Promise<void>;
}

const CreateSite = () => {
  const { t } = useTranslation();
  const settingsSchema = makeSettingsSchema(t);
  const {
    getSatellite,
    satellites,
    loading,
    addNewSatellite,
    updateSatellite,
  } = useSatelliteStore();
  const { id } = useParams();
  let sat;
  if (id) {
    sat = satellites.find((s) => s._id === id);
  }
  const [editMode, setEditMode] = useState(sat ? false : true);

  useEffect(() => {
    getSatellite();
  }, [getSatellite]);

  // useEffect(() => {
  //   return () => {
  //     form.reset({
  //       url: "",
  //       username: "",
  //       password: "",
  //     });
  //   };
  // }, []);
  const initialData: SettingsFormData = {
    url: sat ? sat.url : "",
    username: sat ? sat.username : "",
    password: sat ? sat.password : "",
  };

  const form = useForm<SettingsFormData>({
    resolver: zodResolver(settingsSchema),
    defaultValues: initialData,
  });

  const toggleEditMode = () => {
    setEditMode(!editMode);
    if (editMode) form.reset(initialData);
  };

  const handleSubmit = async (data: SettingsFormData) => {
    await onSubmit(data);
    setEditMode(false);
  };
  const onSubmit = async (data: SettingsFormData) => {
    if (!sat) {
      await addNewSatellite(data as Satellite);
    } else {
      await updateSatellite(sat._id, data as Satellite);
    }
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
                  <CustomFormField
                    name="url"
                    label={t("sites.formUrlLabel")}
                    placeholder="https://example.com"
                    disabled={!editMode}
                  />
                  <CustomFormField
                    name="username"
                    label={t("sites.formUsernameLabel")}
                    placeholder="admin_user"
                    disabled={!editMode}
                  />

                  <CustomFormField
                    name="password"
                    label={t("sites.formPasswordLabel")}
                    type="password"
                    placeholder={t("sites.passwordPlaceholder")}
                    disabled={!editMode}
                  />
                </div>

                {/* Action Buttons */}
                <div className="pt-6 flex justify-end gap-3 border-t border-border mt-8">
                  <Button
                    type="button"
                    onClick={toggleEditMode}
                    variant="outline"
                    className="px-5 border-border text-muted-foreground hover:bg-secondary hover:text-foreground transition-all duration-200"
                  >
                    {editMode ? t("sites.cancel") : t("sites.edit")}
                  </Button>

                  {editMode && (
                    <Button
                      type="submit"
                      className="px-5 bg-gradient-to-r from-amber-500 to-yellow-600 hover:from-amber-600 hover:to-yellow-700 text-white shadow-md shadow-amber-500/25 transition-all duration-200"
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
