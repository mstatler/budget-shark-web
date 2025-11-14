import { AppMDXProvider } from "@/components/MDXProvider";

export default function BlogLayout({ children }: { children: React.ReactNode }) {
  return (
    <AppMDXProvider>
      <div className="mx-auto max-w-3xl px-6 py-16">{children}</div>
    </AppMDXProvider>
  );
}
