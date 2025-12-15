import { useState } from "react";
import { Link } from "react-router-dom";
import { Play, Plus, Menu, X } from "lucide-react";
import { Avatar } from "../ui/Avatar";
import { DEFAULT_USER_ID } from "../../constants";

export function Header() {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <header className="bg-background/80 backdrop-blur-md border-b border-border/50 sticky top-0 z-50">
      <div className="w-full px-[5vw] sm:px-[8vw]">
        <div className="flex items-center justify-between h-16">
          <Link to="/" className="flex items-center gap-2.5 group">
            <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center shadow-sm group-hover:shadow-md transition-all duration-200">
              <Play
                className="w-4 h-4 text-primary-foreground"
                fill="currentColor"
              />
            </div>
            <div className="flex flex-col">
              <span className="font-bold text-foreground text-lg leading-tight">
                OpenBook
              </span>
              <span className="text-xs text-muted-foreground">
                Learn Through Video
              </span>
            </div>
          </Link>

          <nav className="hidden sm:flex items-center gap-3">
            <div className="flex items-center gap-3 px-3 py-2 rounded-lg bg-muted/50 border border-border/50">
              <Avatar userId={DEFAULT_USER_ID} size="sm" />
              <div className="hidden md:block">
                <div className="text-sm font-medium text-foreground">
                  {DEFAULT_USER_ID}
                </div>
                <div className="text-xs text-muted-foreground">Learner</div>
              </div>
            </div>
            <Link
              to="/create"
              className="inline-flex items-center gap-2 px-4 py-2.5 bg-primary text-primary-foreground text-sm font-medium rounded-lg hover:bg-primary/90 shadow-sm hover:shadow-md transition-all duration-200"
            >
              <Plus className="w-4 h-4" />
              Add Video
            </Link>
          </nav>

          <button
            onClick={() => setMobileOpen(!mobileOpen)}
            className="sm:hidden p-2.5 text-foreground hover:bg-accent/50 rounded-lg transition-colors"
          >
            {mobileOpen ? (
              <X className="w-5 h-5" />
            ) : (
              <Menu className="w-5 h-5" />
            )}
          </button>
        </div>

        {mobileOpen && (
          <nav className="sm:hidden py-4 border-t border-border/50 animate-in slide-in-from-top duration-200">
            <div className="flex items-center gap-3 px-4 py-3 rounded-lg bg-muted/50 border border-border/50 mb-2">
              <Avatar userId={DEFAULT_USER_ID} size="sm" />
              <div className="flex-1">
                <div className="text-sm font-medium text-foreground">
                  {DEFAULT_USER_ID}
                </div>
                <div className="text-xs text-muted-foreground">Learner</div>
              </div>
            </div>
            <Link
              to="/create"
              onClick={() => setMobileOpen(false)}
              className="flex items-center gap-3 px-4 py-3 text-sm font-medium text-foreground hover:bg-accent/50 rounded-lg transition-colors"
            >
              <Plus className="w-4 h-4" />
              Add New Video
            </Link>
          </nav>
        )}
      </div>
    </header>
  );
}
