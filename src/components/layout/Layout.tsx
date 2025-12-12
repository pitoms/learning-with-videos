import { type ReactNode } from "react";
import { Header } from "./Header";
import { Footer } from "./Footer";
import { MiniPlayer } from "../video";

interface LayoutProps {
  children: ReactNode;
  hideHeader?: boolean;
  hideFooter?: boolean;
  noPadding?: boolean;
}

export function Layout({
  children,
  hideHeader,
  hideFooter,
  noPadding,
}: LayoutProps) {
  const mainClassName = noPadding
    ? "flex-1 w-full overflow-y-auto lg:overflow-hidden"
    : "flex-1 w-full px-[5vw] sm:px-[8vw] overflow-y-auto";

  return (
    <div className="min-h-screen flex flex-col bg-background">
      {!hideHeader && <Header />}
      <main className={mainClassName}>{children}</main>
      {!hideFooter && <Footer />}
      <MiniPlayer />
    </div>
  );
}
