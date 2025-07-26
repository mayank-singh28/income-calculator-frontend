import { BASE_URL } from "@/constant";
export type IncomeSession = {
  id: string;
  startedAt: string;
  endedAt?: string;
  totalEarned?: number;
};

export async function fetchActiveIncomeSession(): Promise<IncomeSession | null> {
  const res = await fetch(`${BASE_URL}/api/income-sessions/active`);
  if (!res.ok) throw new Error("Failed to fetch active income session");
  const data = await res.json();
  return data || null;
}

export async function endIncomeSession(
  sessionId: string
): Promise<IncomeSession> {
  const res = await fetch(`${BASE_URL}/api/income-sessions/${sessionId}`, {
    method: "PATCH",
  });
  if (!res.ok) throw new Error("Failed to end income session");
  return res.json();
}
