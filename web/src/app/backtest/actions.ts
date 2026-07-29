"use server";

import { createClient } from "@/lib/supabase/server";

export async function saveStrategy(
  name: string,
  coin: string,
  days: number,
  strategy: any
) {
  const supabase = await createClient();

  const { error } = await supabase.from("strategies").insert({
    name: name,
    coin: coin,
    days: days,
    strategy: strategy,
  });

  if (error) {
    return false;
  }
  return true;
}

// newest first so the list on the page reads top down
export async function getStrategies() {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("strategies")
    .select()
    .order("created_at", { ascending: false });

  if (error) {
    return [];
  }
  return data;
}

export async function deleteStrategy(id: string) {
  const supabase = await createClient();
  const { error } = await supabase.from("strategies").delete().eq("id", id);

  if (error) {
    return false;
  }
  return true;
}
