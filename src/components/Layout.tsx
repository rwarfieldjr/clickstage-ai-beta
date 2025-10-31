import { ReactNode } from "react";

interface LayoutProps {
  children: ReactNode;
}

export default function Layout({ children }: LayoutProps) {
  return (
    <div className="min-h-screen flex flex-col">
      <main className="flex-1">{children}</main>
      <footer className="border-t py-4 text-center text-sm text-gray-500">
        © {new Date().getFullYear()} ClickStagePro
      </footer>
    </div>
  );
}
