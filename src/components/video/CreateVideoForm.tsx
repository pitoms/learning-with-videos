import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Upload,
  Video,
  FileText,
  Link as LinkIcon,
  AlertCircle,
  Youtube,
  Film,
  CheckCircle2,
  ArrowLeft,
} from "lucide-react";
import { useCreateVideo } from "../../hooks";
import { Button, Input, Textarea } from "../ui";
import { DEFAULT_USER_ID } from "../../constants";
import { parseVideoUrl } from "../../utils";

export function CreateVideoForm() {
  const navigate = useNavigate();
  const createVideoMutation = useCreateVideo();

  const [formData, setFormData] = useState({
    title: "",
    description: "",
    video_url: "",
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};
    if (!formData.title.trim()) {
      newErrors.title = "Title is required";
    }
    if (!formData.description.trim()) {
      newErrors.description = "Description is required";
    }
    if (!formData.video_url.trim()) {
      newErrors.video_url = "Video URL is required";
    } else {
      const videoSource = parseVideoUrl(formData.video_url);
      if (videoSource.type === "invalid") {
        newErrors.video_url = videoSource.error;
      }
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;
    try {
      await createVideoMutation.mutateAsync({
        user_id: DEFAULT_USER_ID,
        title: formData.title.trim(),
        description: formData.description.trim(),
        video_url: formData.video_url.trim(),
      });
      navigate("/");
    } catch (err) {
      console.error("Failed to create video:", err);
      setErrors({ submit: "Failed to create video. Please try again." });
    }
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: "" }));
    }
  };

  return (
    <div className="max-w-2xl mx-auto animate-in">
      <button
        onClick={() => navigate("/")}
        className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground group text-sm mb-6"
      >
        <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
        Back to Videos
      </button>

      <div className="text-center mb-8">
        <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-primary/10 rounded-full text-primary text-sm font-medium mb-4">
          <Upload className="w-4 h-4" />
          Add New Video
        </div>
        <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-2">
          Share Your Content
        </h1>
        <p className="text-muted-foreground">
          Add a video to your learning library
        </p>
      </div>

      <div className="bg-card rounded-xl border border-border overflow-hidden">
        <form onSubmit={handleSubmit} className="p-6 md:p-8 space-y-6">
          <div>
            <label className="flex items-center gap-2 text-sm font-medium text-foreground mb-2">
              <Video className="w-4 h-4 text-muted-foreground" />
              Video Title
            </label>
            <Input
              name="title"
              placeholder="Enter a descriptive title"
              value={formData.title}
              onChange={handleChange}
              error={errors.title}
            />
          </div>

          <div>
            <label className="flex items-center gap-2 text-sm font-medium text-foreground mb-2">
              <FileText className="w-4 h-4 text-muted-foreground" />
              Description
            </label>
            <Textarea
              name="description"
              placeholder="What will viewers learn from this video?"
              value={formData.description}
              onChange={handleChange}
              rows={4}
              error={errors.description}
            />
          </div>

          <div>
            <label className="flex items-center gap-2 text-sm font-medium text-foreground mb-2">
              <LinkIcon className="w-4 h-4 text-muted-foreground" />
              Video URL
            </label>
            <Input
              name="video_url"
              type="url"
              placeholder="Paste YouTube or direct video URL"
              value={formData.video_url}
              onChange={handleChange}
              error={errors.video_url}
            />
            <div className="mt-2 flex flex-wrap gap-2">
              <span className="inline-flex items-center gap-1 text-xs text-muted-foreground bg-muted px-2 py-1 rounded-full">
                <Youtube className="w-3 h-3" /> YouTube
              </span>
              <span className="inline-flex items-center gap-1 text-xs text-muted-foreground bg-muted px-2 py-1 rounded-full">
                <Film className="w-3 h-3" /> Direct Link
              </span>
            </div>
          </div>

          <VideoPreview url={formData.video_url} error={errors.video_url} />

          {errors.submit && (
            <div className="flex items-center gap-2 p-4 bg-destructive/10 text-destructive rounded-lg">
              <AlertCircle className="w-5 h-5 shrink-0" />
              <p className="text-sm">{errors.submit}</p>
            </div>
          )}

          <div className="flex items-center justify-end gap-3 pt-2">
            <Button type="button" variant="ghost" onClick={() => navigate("/")}>
              Cancel
            </Button>
            <Button type="submit" isLoading={createVideoMutation.isPending}>
              <Upload className="w-4 h-4 mr-2" />
              Add Video
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}

interface VideoPreviewProps {
  url: string;
  error?: string;
}

function VideoPreview({ url, error }: VideoPreviewProps) {
  if (!url || error) return null;
  const videoSource = parseVideoUrl(url);
  if (videoSource.type === "invalid") return null;

  const getSourceIcon = () => {
    switch (videoSource.type) {
      case "youtube":
        return <Youtube className="w-4 h-4 text-red-500" />;
      case "direct":
        return <Film className="w-4 h-4 text-primary" />;
    }
  };

  const getSourceLabel = () => {
    switch (videoSource.type) {
      case "youtube":
        return "YouTube Video";
      case "direct":
        return "Direct Video Link";
    }
  };

  return (
    <div className="rounded-lg overflow-hidden border border-border">
      <div className="bg-muted px-4 py-2 flex items-center justify-between">
        <span className="text-sm font-medium text-muted-foreground">
          Preview
        </span>
        <span className="inline-flex items-center gap-1.5 text-xs font-medium text-foreground bg-background px-2 py-1 rounded-full border border-border">
          <CheckCircle2 className="w-3.5 h-3.5 text-green-500" />
          {getSourceIcon()}
          {getSourceLabel()}
        </span>
      </div>
      {videoSource.type === "youtube" && (
        <iframe
          src={videoSource.embedUrl}
          className="w-full aspect-video bg-black"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
          title="Video preview"
        />
      )}
      {videoSource.type === "direct" && (
        <video
          src={videoSource.url}
          className="w-full aspect-video bg-black"
          controls
          preload="metadata"
        />
      )}
    </div>
  );
}
