import type { Metadata } from "next";
import PortfelLayoutClient from "./PortfelLayoutClient";

export const metadata: Metadata = {
  title: "Portfel podróżniczy",
  description: "Planuj i kontroluj budżet podróży",
};

export default function PortfelLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <PortfelLayoutClient>{children}</PortfelLayoutClient>;
}
