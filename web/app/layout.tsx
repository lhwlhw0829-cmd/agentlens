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
      <body className="min-h-screen bg-bg text-white antialiased">
        <Sidebar />
        <div className="pl-60">{children}</div>
      </body>
    </html>
  );
}
