"use server";

import { createClient } from "@/lib/supabase/server";

// get the coins we own
export async function getHoldings() {
  const supabase = await createClient();
  const { data, error } = await supabase.from("holdings").select();

  if (error) {
    return [];
  }

  // turn each row into what the page uses
  const list = [];
  for (let i = 0; i < data.length; i++) {
    list.push({
      id: data[i].coin_id,
      name: data[i].name,
      quantity: Number(data[i].quantity),
      cost: Number(data[i].cost),
    });
  }
  return list;
}

// buying, add to it if we already own it, else make a new row
export async function saveHolding(coinId: string, name: string, quantity: number, cost: number) {
  const supabase = await createClient();

  // already own this coin?
  const { data } = await supabase.from("holdings").select().eq("coin_id", coinId);

  if (data && data.length > 0) {
    // bump up what we have
    const row = data[0];
    await supabase
      .from("holdings")
      .update({
        quantity: Number(row.quantity) + quantity,
        cost: Number(row.cost) + cost,
      })
      .eq("coin_id", coinId);
  } else {
    // first time buying it
    await supabase.from("holdings").insert({
      coin_id: coinId,
      name: name,
      quantity: quantity,
      cost: cost,
    });
  }
}

// selling, just remove its row
export async function deleteHolding(coinId: string) {
  const supabase = await createClient();
  await supabase.from("holdings").delete().eq("coin_id", coinId);
}

// get their cash, or make an account if they don't have one yet
export async function getAccount() {
  const supabase = await createClient();
  const { data } = await supabase.from("accounts").select();

  if (data && data.length > 0) {
    return Number(data[0].cash);
  }

  // no account yet, start them with 10000
  await supabase.from("accounts").insert({ cash: 10000 });
  return 10000;
}

// save their cash
export async function saveCash(cash: number) {
  const supabase = await createClient();
  const { data: claims } = await supabase.auth.getClaims();
  const userId = claims?.claims?.sub;
  await supabase.from("accounts").update({ cash: cash }).eq("user_id", userId);
}
