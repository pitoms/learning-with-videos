import { useState, useMemo } from "react";
import { MessageCircle, Send, Sparkles } from "lucide-react";
import { useComments, useCreateComment } from "../../hooks";
import { LoadingSpinner, ErrorMessage, Button, Textarea, Avatar } from "../ui";
import type { Comment } from "../../types";

const COMMENT_COLORS = [
  "from-pink-500/10 to-purple-500/10 border-pink-500/20",
  "from-blue-500/10 to-cyan-500/10 border-blue-500/20",
  "from-green-500/10 to-emerald-500/10 border-green-500/20",
  "from-orange-500/10 to-yellow-500/10 border-orange-500/20",
  "from-violet-500/10 to-indigo-500/10 border-violet-500/20",
  "from-rose-500/10 to-pink-500/10 border-rose-500/20",
  "from-teal-500/10 to-cyan-500/10 border-teal-500/20",
  "from-amber-500/10 to-orange-500/10 border-amber-500/20",
];

interface CommentSectionProps {
  videoId: string;
}

const FIRST_NAMES = [
  "Alex",
  "Jordan",
  "Taylor",
  "Morgan",
  "Casey",
  "Riley",
  "Quinn",
  "Avery",
  "Sage",
  "River",
  "Phoenix",
  "Skyler",
  "Dakota",
  "Reese",
  "Finley",
  "Rowan",
];

const LAST_NAMES = [
  "Smith",
  "Johnson",
  "Chen",
  "Garcia",
  "Kim",
  "Patel",
  "Wilson",
  "Lee",
  "Martinez",
  "Anderson",
  "Taylor",
  "Thomas",
  "Moore",
  "Jackson",
  "White",
  "Harris",
];

function generateRandomUsername(): string {
  const first = FIRST_NAMES[Math.floor(Math.random() * FIRST_NAMES.length)];
  const last = LAST_NAMES[Math.floor(Math.random() * LAST_NAMES.length)];
  return `${first}_${last}`.toLowerCase();
}

interface CommentCardProps {
  comment: Comment;
  colorClass: string;
}

function CommentCard({ comment, colorClass }: CommentCardProps) {
  return (
    <div
      className={`group relative p-4 rounded-2xl bg-linear-to-br ${colorClass} border backdrop-blur-sm hover:scale-[1.02] transition-all duration-200 cursor-default`}
    >
      <div className="flex items-start gap-3">
        <Avatar userId={comment.user_id} size="sm" />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-2">
            <span className="font-semibold text-foreground text-sm">
              @{comment.user_id}
            </span>
            {comment.created_at && (
              <span className="text-xs text-muted-foreground">
                {new Date(comment.created_at).toLocaleDateString()}
              </span>
            )}
          </div>
          <p className="text-foreground text-sm leading-relaxed whitespace-pre-wrap wrap-break-word">
            {comment.content}
          </p>
        </div>
      </div>
    </div>
  );
}

function getColorForComment(index: number): string {
  return COMMENT_COLORS[index % COMMENT_COLORS.length];
}

export function CommentSection({ videoId }: CommentSectionProps) {
  const [newComment, setNewComment] = useState("");
  const {
    data: comments = [],
    isLoading,
    error,
    refetch,
  } = useComments(videoId);
  const createCommentMutation = useCreateComment();
  const shuffledColors = useMemo(() => {
    return comments.map((_, i) => getColorForComment(i + Math.floor(i / 3)));
  }, [comments.length]);
  const currentUserId = useMemo(() => generateRandomUsername(), []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!newComment.trim()) return;

    try {
      await createCommentMutation.mutateAsync({
        video_id: videoId,
        content: newComment.trim(),
        user_id: currentUserId,
      });
      setNewComment("");
    } catch (err) {
      console.error("Failed to create comment:", err);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2 text-foreground">
          <Sparkles className="w-5 h-5 text-primary" />
          <h3 className="text-lg font-semibold">Community Vibes</h3>
        </div>
        {comments.length > 0 && (
          <span className="px-2.5 py-1 text-xs font-medium bg-primary/10 text-primary rounded-full">
            {comments.length} comment{comments.length !== 1 && "s"}
          </span>
        )}
      </div>
      {/* Comments Grid */}
      <div>
        {isLoading ? (
          <div className="py-8">
            <LoadingSpinner />
          </div>
        ) : error ? (
          <div className="py-4">
            <ErrorMessage
              message="Failed to load comments"
              onRetry={() => refetch()}
            />
          </div>
        ) : comments.length === 0 ? (
          <div className="py-12 text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-muted/50 mb-4">
              <MessageCircle className="w-8 h-8 text-muted-foreground" />
            </div>
            <p className="text-muted-foreground font-medium">No comments yet</p>
            <p className="text-sm text-muted-foreground/70 mt-1">
              Be the first to share your thoughts!
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {comments.map((comment, index) => (
              <CommentCard
                key={comment.id}
                comment={comment}
                colorClass={shuffledColors[index]}
              />
            ))}
          </div>
        )}
      </div>
      {/* Add Comment Form */}
      <form
        onSubmit={handleSubmit}
        className="p-4 rounded-2xl bg-linear-to-br from-primary/5 to-primary/10 border border-primary/20"
      >
        <div className="flex gap-3">
          <Avatar userId={currentUserId} size="sm" />
          <div className="flex-1 space-y-3">
            <Textarea
              placeholder="Drop a comment..."
              value={newComment}
              onChange={(e) => setNewComment(e.target.value.slice(0, 100))}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  if (newComment.trim()) {
                    handleSubmit(e);
                  }
                }
              }}
              rows={1}
              maxLength={100}
              className="text-sm bg-background/50 border-border/50 resize-none"
            />
            <div className="flex justify-end">
              <Button
                type="submit"
                size="sm"
                isLoading={createCommentMutation.isPending}
                disabled={!newComment.trim()}
              >
                <Send className="w-4 h-4 mr-2" />
                Post
              </Button>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
}
