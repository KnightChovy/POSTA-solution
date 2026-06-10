import React from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import PostForm from "@/components/posts/PostForm";
import { Button } from "@/components/ui/button";
import { ArrowLeft, PenLine } from "lucide-react";
import { Post } from "../../index";
// interface Post {
//   id: string;
//   title: string;
//   content: string;
//   urls: string[];
// }

const CreatePost = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();

  const handleCreatePost = (values: any) => {
    const newPost: Post = {
      title: values.title,
      content: values.content,
    };

    navigate("/progress", { state: { post: newPost } });
  };

  return (
    <div className="min-h-screen bg-gradient-subtle">
      <div className="max-w-5xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2.5 rounded-xl bg-gradient-to-br from-amber-500 to-yellow-600 shadow-lg shadow-amber-500/25">
              <PenLine className="w-5 h-5 text-white" />
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
              {t("posts.createTitle")}
            </h1>
          </div>
          <p className="text-muted-foreground ml-12">
            {t("posts.createSubtitle")}
          </p>
        </div>

        <div className="flex justify-center">
          <PostForm onSubmit={handleCreatePost} />
        </div>
      </div>
    </div>
  );
};

export default CreatePost;
