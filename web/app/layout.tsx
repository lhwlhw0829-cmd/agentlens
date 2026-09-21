import type { Metadata } from "next";
import "./globals.css";
import { Sidebar } from "@/components/Sidebar";

export const metadata: Metadata = {
  title: "AgentLens — AI Agent Observability",
  description:
    "Production observability and guardrails for LLM agents: traces, cost, anomaly detection.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="relative min-h-screen bg-bg font-sans text-white antialiased">
        <div className="pointer-events-none fixed inset-0 bg-mesh" />
        <div className="bg-noise pointer-events-none fixed inset-0" />
        <Sidebar />
        <div className="relative pl-60">{children}</div>
      </body>
    </html>
  );
}
