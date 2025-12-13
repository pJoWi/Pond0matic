"use client";
import { useRouter } from "next/navigation";
import { Dashboard } from "@/components/Dashboard";

export default function HomePage() {
  const router = useRouter();

  return (
    <div className="pt-16 pb-8 min-h-screen">
      <Dashboard onOpenSwapper={() => router.push('/swapper')} />
    </div>
  );
}
