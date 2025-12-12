export function Footer() {
  return (
    <footer className="border-t border-border py-6">
      <div className="w-full px-[5vw] sm:px-[8vw]">
        <p className="text-sm text-muted-foreground text-center">
          &copy; {new Date().getFullYear()} Learning with Videos
        </p>
      </div>
    </footer>
  );
}
