"use client";
import { useRouter } from "next/navigation";
import { ActivityMonitor } from "@/components/ActivityMonitor";

export default function ActivityPage() {
  const router = useRouter();

  return (
    <div className="pt-20 pb-8 min-h-screen">
      <ActivityMonitor onOpenSwapper={() => router.push('/swapper')} />
    </div>
  );
}
