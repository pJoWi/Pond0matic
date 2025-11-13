/**
 * Activity log hook for tracking events and messages
 */

import { useCallback, useState } from "react";
import { now } from "@/lib/utils";

export function useActivityLog() {
  const [activities, setActivities] = useState<string[]>([]);

  const log = useCallback((message: string) => {
    setActivities((prev) => [...prev, `[${now()}] ${message}`]);
  }, []);

  const clear = useCallback(() => {
    setActivities([]);
  }, []);

  return { activities, log, clear };
}
