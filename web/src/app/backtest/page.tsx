"use client";
import { useState, useEffect } from "react";

// one row in the form
type Rule = {
  indicator: string;
  period: string;
  operator: string;
  value: string;
  band: string;
  multiplier: string;
};

// a row turned into json for the tree
type RuleNode = {
  type: string;
  indicator: string;
  operator: string;
  value?: number;
  period?: number;
  band?: string;
  multiplier?: number;
};

// a coin for the dropdown
type CoinOption = {
  id: string;
  name: string;
};

export default function BacktestPage() {
  const [coins, setCoins] = useState<CoinOption[]>([]);
  const [coin, setCoin] = useState("bitcoin");
  const [days, setDays] = useState(30);
  const [logic, setLogic] = useState("and");
  const [rules, setRules] = useState<Rule[]>([
    { indicator: "price", period: "20", operator: ">", value: "60000", band: "lower", multiplier: "2" },
  ]);

  // load the coins once when the page opens
  useEffect(() => {
    async function loadCoins() {
      const res = await fetch("/api/markets");
      const data: CoinOption[] = await res.json();
      const list: CoinOption[] = [];
      for (let i = 0; i < data.length; i++) {
        list.push({ id: data[i].id, name: data[i].name });
      }
      setCoins(list);
    }
    loadCoins();
  }, []);

  // add a new row
  function addRule() {
    const blank = { indicator: "price", period: "20", operator: ">", value: "60000", band: "lower", multiplier: "2" };
    const updated = [];
    for (let i = 0; i < rules.length; i++) {
      updated.push(rules[i]);
    }
    updated.push(blank);
    setRules(updated);
  }

  // change one field of a row when the user edits it
  function updateRule(index: number, key: string, newValue: string) {
    const updated: Rule[] = [];
    for (let i = 0; i < rules.length; i++) {
      if (i === index) {
        // copy the row before changing it
        const row = { ...rules[i] };
        if (key === "indicator") {
          row.indicator = newValue;
          // rsi is 0-100, the price based ones use a dollar value
          if (newValue === "rsi") {
            row.value = "30";
          } else {
            row.value = "60000";
          }
        } else if (key === "period") {
          row.period = newValue;
        } else if (key === "operator") {
          row.operator = newValue;
        } else if (key === "band") {
          row.band = newValue;
        } else if (key === "multiplier") {
          row.multiplier = newValue;
        } else {
          row.value = newValue;
        }
        updated.push(row);
      } else {
        updated.push(rules[i]);
      }
    }
    setRules(updated);
  }

  // remove the row at this index
  function removeRule(index: number) {
    const updated: Rule[] = [];
    for (let i = 0; i < rules.length; i++) {
      if (i !== index) {
        updated.push(rules[i]);
      }
    }
    setRules(updated);
  }

  // build the nodes from the rows
  const nodes: RuleNode[] = [];
  for (let i = 0; i < rules.length; i++) {
    const rule = rules[i];
    const node: RuleNode = {
      type: "rule",
      indicator: rule.indicator,
      operator: rule.operator,
    };
    if (rule.indicator === "bollinger") {
      // bollinger checks a band, not a plain number
      node.period = Number(rule.period);
      node.band = rule.band;
      node.multiplier = Number(rule.multiplier);
    } else {
      node.value = Number(rule.value);
      // indicators need a period, price doesn't
      if (rule.indicator !== "price") {
        node.period = Number(rule.period);
      }
    }
    nodes.push(node);
  }

  // single node, or wrap them with and/or
  let strategy;
  if (nodes.length === 1) {
    strategy = nodes[0];
  } else {
    strategy = { type: logic, rules: nodes };
  }

  // this gets sent to the backend later
  const request = { coin, days, strategy };

  // the engine isnt built yet so just log the request for now
  function runBacktest() {
    console.log(request);
  }

  return (
    <main className="mx-auto w-full max-w-7xl flex-1 px-6 py-12">
      <h1 className="text-2xl font-semibold tracking-tight">Backtest</h1>
      <p className="mt-2 text-muted">Build a strategy and test it on past prices.</p>

      <div className="mt-8 flex flex-wrap items-center gap-2 text-sm">
        <span className="text-muted">Test</span>
        <select
          value={coin}
          onChange={(event) => setCoin(event.target.value)}
          className="w-48 rounded border border-border bg-surface px-3 py-1"
        >
          {coins.map((coinOption) => (
            <option key={coinOption.id} value={coinOption.id}>
              {coinOption.name}
            </option>
          ))}
        </select>
        <span className="text-muted">over the last</span>
        <select
          value={days}
          onChange={(event) => setDays(Number(event.target.value))}
          className="rounded border border-border bg-surface px-3 py-1"
        >
          <option value={30}>30 days</option>
          <option value={90}>90 days</option>
          <option value={365}>1 year</option>
        </select>
      </div>

      <h2 className="mt-10 text-sm font-medium uppercase tracking-wide text-muted">Strategy</h2>

      <div className="mt-4 space-y-3">
        {rules.map((rule, index) => (
          <div key={index}>
            {index === 0 && <p className="mb-3 text-sm text-muted">If...</p>}
            {index > 0 && (
              <select
                value={logic}
                onChange={(event) => setLogic(event.target.value)}
                className="my-3 rounded border border-border bg-surface px-2 py-1 text-xs uppercase text-muted"
              >
                <option value="and">and</option>
                <option value="or">or</option>
              </select>
            )}
            <div className="flex items-center gap-2 text-sm">
              {/* bollinger reads "Price is above Lower Bollinger Band over 20 days, 2 multiplier" */}
              {rule.indicator === "bollinger" && (
                <div className="flex items-center gap-2">
                  <span className="text-muted">Price</span>

                  <select
                    value={rule.operator}
                    onChange={(event) => updateRule(index, "operator", event.target.value)}
                    className="rounded border border-border bg-surface px-3 py-1"
                  >
                    <option value=">">is above</option>
                    <option value="<">is below</option>
                  </select>

                  <select
                    value={rule.band}
                    onChange={(event) => updateRule(index, "band", event.target.value)}
                    className="rounded border border-border bg-surface px-3 py-1"
                  >
                    <option value="upper">Upper</option>
                    <option value="middle">Middle</option>
                    <option value="lower">Lower</option>
                  </select>

                  <select
                    value={rule.indicator}
                    onChange={(event) => updateRule(index, "indicator", event.target.value)}
                    className="rounded border border-border bg-surface px-3 py-1"
                  >
                    <option value="price">Price</option>
                    <option value="sma">SMA</option>
                    <option value="ema">EMA</option>
                    <option value="rsi">RSI</option>
                    <option value="bollinger">Bollinger</option>
                  </select>

                  <span className="text-muted">Band over</span>

                  <input
                    type="number"
                    value={rule.period}
                    onChange={(event) => updateRule(index, "period", event.target.value)}
                    className="w-16 rounded border border-border bg-surface px-3 py-1 tabular-nums"
                  />
                  <span className="text-muted">days,</span>
                  <input
                    type="number"
                    value={rule.multiplier}
                    onChange={(event) => updateRule(index, "multiplier", event.target.value)}
                    className="w-16 rounded border border-border bg-surface px-3 py-1 tabular-nums"
                  />
                  <span className="text-muted">multiplier</span>
                </div>
              )}

              {/* every other indicator reads "SMA over 20 days is above $60000" */}
              {rule.indicator !== "bollinger" && (
                <div className="flex items-center gap-2">
                  <select
                    value={rule.indicator}
                    onChange={(event) => updateRule(index, "indicator", event.target.value)}
                    className="rounded border border-border bg-surface px-3 py-1"
                  >
                    <option value="price">Price</option>
                    <option value="sma">SMA</option>
                    <option value="ema">EMA</option>
                    <option value="rsi">RSI</option>
                    <option value="bollinger">Bollinger</option>
                  </select>

                  {rule.indicator !== "price" && (
                    <div className="flex items-center gap-2">
                      <span className="text-muted">over</span>
                      <input
                        type="number"
                        value={rule.period}
                        onChange={(event) => updateRule(index, "period", event.target.value)}
                        className="w-20 rounded border border-border bg-surface px-3 py-1 tabular-nums"
                      />
                      <span className="text-muted">days</span>
                    </div>
                  )}

                  <select
                    value={rule.operator}
                    onChange={(event) => updateRule(index, "operator", event.target.value)}
                    className="rounded border border-border bg-surface px-3 py-1"
                  >
                    <option value=">">is above</option>
                    <option value="<">is below</option>
                  </select>

                  {/* rsi is a 0-100 level, the others are a dollar price */}
                  {rule.indicator !== "rsi" && <span className="text-muted">$</span>}
                  <input
                    type="number"
                    value={rule.value}
                    onChange={(event) => updateRule(index, "value", event.target.value)}
                    className="w-32 rounded border border-border bg-surface px-3 py-1 tabular-nums"
                  />
                </div>
              )}

              {rules.length > 1 && (
                <button
                  onClick={() => removeRule(index)}
                  className="text-muted transition-colors hover:text-foreground"
                >
                  remove
                </button>
              )}
            </div>
          </div>
        ))}
      </div>

      <button
        onClick={addRule}
        className="mt-4 text-sm text-muted transition-colors hover:text-foreground"
      >
        + Add rule
      </button>

      <div className="mt-8">
        <button
          onClick={runBacktest}
          className="rounded border border-border bg-surface px-4 py-2 text-sm transition-colors hover:border-foreground"
        >
          Run backtest
        </button>
      </div>
    </main>
  );
}
