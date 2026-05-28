import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Pencil,
  Trash2,
  ExternalLink,
  Send,
  FileText,
  Eye,
  ArrowRight,
} from "lucide-react";
import { Post } from "../../../index";
import { useSearchParams } from "react-router-dom";
import { useNavigate } from "react-router-dom";
import { title } from "process";
import { stripHtmlTags } from "@/lib/utils";
interface PostTableProps {
  posts?: Post[];
  onEdit?: (post: Post) => void;
  onDelete?: (postId: string) => void;
  onPublish?: (postId: string) => void;
}

const PostTable = ({
  posts,
  onEdit = () => {},
  onDelete = () => {},
  onPublish = () => {},
}: PostTableProps) => {
  const navigate = useNavigate();
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [previewDialogOpen, setPreviewDialogOpen] = useState(false);
  const [postToDelete, setPostToDelete] = useState<string | null>(null);
  const [previewPost, setPreviewPost] = useState<Post | null>(null);

  const handlePublish = (post: Post) => {
    onPublish(post._id);
    navigate(`/progress`, { state: { post } });
  };

  const truncateContent = (content: string, maxLength = 100) => {
    if (!content) return "";
    const textOnly = stripHtmlTags(content);
    return textOnly.length > maxLength
      ? `${textOnly.substring(0, maxLength)}...`
      : textOnly;
  };

  const hasImages = (content: string) => {
    return /!\[([^\]]*)\]\(([^)]+)\)/g.test(content);
  };

  return (
    <div className="w-full">
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow className="bg-secondary/50 border-b border-border">
              <TableHead className="min-w-[200px] font-semibold text-muted-foreground text-xs uppercase tracking-wider py-4">
                Tiêu đề
              </TableHead>
              <TableHead className="min-w-[300px] font-semibold text-muted-foreground text-xs uppercase tracking-wider py-4">
                Nội dung
              </TableHead>
              <TableHead className="min-w-[150px] font-semibold text-muted-foreground text-xs uppercase tracking-wider py-4">
                Thao tác
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {posts.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={5}
                  className="text-center py-16 text-gray-500"
                >
                  <div className="flex flex-col items-center space-y-3">
                    <div className="p-4 rounded-full bg-gray-50">
                      <FileText className="h-8 w-8 text-gray-300" />
                    </div>
                    <div>
                      <p className="font-medium text-gray-600">
                        Chưa có bài viết nào
                      </p>
                      <p className="text-sm text-gray-400 mt-1">
                        Tạo bài viết đầu tiên để bắt đầu
                      </p>
                    </div>
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              posts
                .slice()
                .sort((a, b) => b._id.localeCompare(a._id))
                .map((post) => (
                  <TableRow
                    key={post._id}
                    className="hover:bg-amber-50/30 dark:hover:bg-amber-950/20 transition-colors duration-150 border-b border-border/50"
                  >
                    <TableCell className="py-4">
                      <div className="font-medium text-foreground leading-tight">
                        {post.title}
                      </div>
                    </TableCell>
                    <TableCell className="py-4">
                      <div className="text-sm text-muted-foreground leading-relaxed">
                        {truncateContent(post.content)}
                        {hasImages(post.content) && (
                          <div className="mt-2">
                            <Badge
                              variant="outline"
                              className="text-xs bg-amber-50 dark:bg-amber-950/50 text-amber-600 dark:text-amber-400 border-amber-200 dark:border-amber-800"
                            >
                              Có hình ảnh
                            </Badge>
                          </div>
                        )}
                      </div>
                    </TableCell>

                    <TableCell className="py-4">
                      <Button
                        size="sm"
                        onClick={() => handlePublish(post)}
                        className="h-9 px-4 bg-gradient-to-r from-amber-500 to-yellow-600 hover:from-amber-600 hover:to-yellow-700 text-white shadow-sm hover:shadow-md transition-all duration-200 gap-2"
                      >
                        <span>Xem tiến trình</span>
                        <ArrowRight className="h-3.5 w-3.5" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
};

export default PostTable;
