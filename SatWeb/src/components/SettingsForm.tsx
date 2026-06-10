import { zodResolver } from "@hookform/resolvers/zod";
import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { useTranslation } from "react-i18next";
import { Form } from "./ui/form";
import { CustomFormField } from "./ui/FormField";
import { Button } from "./ui/button";
import * as z from "zod";
const settingsSchema = z.object({
  url: z.string().url("Invalid URL"),
  username: z.string().min(3, "Username must be at least 3 characters"),
  password: z.string().min(10, "Password must be at least 10 characters"),
});

type SettingsFormData = z.infer<typeof settingsSchema>;

interface SettingsFormProps {
  initialData: SettingsFormData;
  onSubmit: (data: SettingsFormData) => Promise<void>;
}
const SettingsForm = ({ initialData, onSubmit }: SettingsFormProps) => {
  const { t } = useTranslation();
  const [editMode, setEditMode] = useState(false);
  const form = useForm<SettingsFormData>({
    resolver: zodResolver(settingsSchema),
    defaultValues: initialData,
  });

  const toggleEditMode = () => {
    setEditMode(!editMode);
    if (editMode) {
      form.reset(initialData);
    }
  };

  const handleSubmit = async (data: SettingsFormData) => {
    await onSubmit(data);
    setEditMode(false);
  };

  return (
    <div className="mt-5 bg-white rounded-xl border border-gray-200 shadow-md p-6 hover:shadow-lg transition-shadow duration-300">
      <div className="mb-5">
        <h1 className="text-sm text-gray-500">{t("dashboard.addSatelliteSite")}</h1>
      </div>
      <div className="bg-white rounded-xl p-6">
        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(handleSubmit)}
            className="space-y-6"
          >
            <CustomFormField name="url" label="URL" disabled={!editMode} />
            <CustomFormField
              name="username"
              label="User Name"
              type="text"
              disabled={!editMode}
            />
            <CustomFormField
              name="password"
              label="Password"
              type="password"
              disabled={!editMode}
            />

            <div className="pt-4 flex justify-between">
              <Button
                type="button"
                onClick={toggleEditMode}
                className="bg-secondary-500 text-white hover:bg-secondary-600"
              >
                {editMode ? t("dashboard.cancel") : t("dashboard.edit")}
              </Button>
              {editMode && (
                <Button
                  type="submit"
                  className="bg-primary-700 text-white hover:bg-primary-800"
                >
                  {t("dashboard.saveChangesBtn")}
                </Button>
              )}
            </div>
          </form>
        </Form>
      </div>
    </div>
  );
};

export default SettingsForm;
