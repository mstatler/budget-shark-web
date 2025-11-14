// components/MDXProvider.tsx
"use client";

import Link from "next/link";
import { MDXProvider } from "@mdx-js/react";

const components = {
  a: (props: any) => <Link {...props} />,
  Link,
};

export function AppMDXProvider({ children }: { children: React.ReactNode }) {
  return <MDXProvider components={components}>{children}</MDXProvider>;
}
