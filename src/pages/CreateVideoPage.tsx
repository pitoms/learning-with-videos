import { CreateVideoForm } from "../components/video";

export function CreateVideoPage() {
  return (
    <div className="py-8 md:py-12 bg-linear-to-b from-background via-background to-muted/20 min-h-[calc(100vh-4rem)]">
      <CreateVideoForm />
    </div>
  );
}
