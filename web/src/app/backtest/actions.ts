"use server";

import { createClient } from "@/lib/supabase/server";

// save a strategy
export async function saveStrategy(
  name: string,
  coin: string,
  days: number,
  strategy: any
) {
  const supabase = await createClient();

  // add the new strategy row
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

// get the saved strategies
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

// delete a strategy by id
export async function deleteStrategy(id: string) {
  const supabase = await createClient();
  const { error } = await supabase.from("strategies").delete().eq("id", id);

  if (error) {
    return false;
  }
  return true;
}
