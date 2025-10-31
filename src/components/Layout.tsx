import { ReactNode } from "react";

interface LayoutProps {
  children: ReactNode;
}

export default function Layout({ children }: LayoutProps) {
  return (
    <div className="min-h-screen flex flex-col">
      <header className="border-b bg-white shadow-sm">
        <img src="/logo.svg" alt="ClickStagePro" className="h-10 mx-auto my-4" />
      </header>
      <main className="flex-1">{children}</main>
      <footer className="border-t py-4 text-center text-sm text-gray-500">
        © {new Date().getFullYear()} ClickStagePro
      </footer>
    </div>
  );
}
