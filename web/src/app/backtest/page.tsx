"use client";
import { useState, useEffect } from "react";
import { saveStrategy, getStrategies, deleteStrategy } from "./actions";

// one row in the form
type Rule = {
  indicator: string;
  period: string;
  operator: string;
  value: string;
  band: string;
  multiplier: string;
};

// a row turned into json
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

// what the engine sends back
type BacktestResult = {
  final_value: number;
  return_pct: number;
  trades: number;
  hold_value: number;
  hold_return_pct: number;
};

// one saved row from the db, strategy is one rule or a group
type SavedStrategy = {
  id: string;
  name: string;
  coin: string;
  days: number;
  strategy: any;
};

export default function BacktestPage() {
  const [coins, setCoins] = useState<CoinOption[]>([]);
  const [coin, setCoin] = useState("bitcoin");
  const [days, setDays] = useState(30);
  const [logic, setLogic] = useState("and");
  const [name, setName] = useState("");
  const [saved, setSaved] = useState(false);
  const [running, setRunning] = useState(false);
  const [strategies, setStrategies] = useState<SavedStrategy[]>([]);
  const [result, setResult] = useState<BacktestResult | null>(null);
  const [rules, setRules] = useState<Rule[]>([
    { indicator: "price", period: "20", operator: ">", value: "60000", band: "lower", multiplier: "2" },
  ]);

  // load coins once when page opens
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

  async function loadStrategies() {
    const saved = await getStrategies();
    setStrategies(saved);
  }
  useEffect(() => {
    loadStrategies();
  }, []);

  function addRule() {
    const blank = { indicator: "price", period: "20", operator: ">", value: "60000", band: "lower", multiplier: "2" };
    const updated = [];
    for (let i = 0; i < rules.length; i++) {
      updated.push(rules[i]);
    }
    updated.push(blank);
    setRules(updated);
  }

  function updateRule(index: number, key: string, newValue: string) {
    const updated: Rule[] = [];
    for (let i = 0; i < rules.length; i++) {
      if (i === index) {
        const row = { ...rules[i] };
        if (key === "indicator") {
          row.indicator = newValue;
          // default value for the new indicator
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

  function removeRule(index: number) {
    const updated: Rule[] = [];
    for (let i = 0; i < rules.length; i++) {
      if (i !== index) {
        updated.push(rules[i]);
      }
    }
    setRules(updated);
  }

  // build nodes from the rows
  const nodes: RuleNode[] = [];
  for (let i = 0; i < rules.length; i++) {
    const rule = rules[i];
    const node: RuleNode = {
      type: "rule",
      indicator: rule.indicator,
      operator: rule.operator,
    };
    if (rule.indicator === "bollinger") {
      // bollinger fields
      node.period = Number(rule.period);
      node.band = rule.band;
      node.multiplier = Number(rule.multiplier);
    } else {
      node.value = Number(rule.value);
      // add a period unless it's price
      if (rule.indicator !== "price") {
        node.period = Number(rule.period);
      }
    }
    nodes.push(node);
  }

  // wrap in a group if more than one rule
  let strategy: any;
  if (nodes.length === 1) {
    strategy = nodes[0];
  } else {
    strategy = { type: logic, rules: nodes };
  }

  async function runBacktest() {
    setRunning(true);
    const res = await fetch(`/api/prices?id=${coin}&days=${days}`);
    const prices = await res.json();
    const engineUrl = process.env.NEXT_PUBLIC_ENGINE_URL || "http://localhost:8000";
    // send prices and strategy to engine
    const engineRes = await fetch(`${engineUrl}/backtest`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ prices: prices, strategy: strategy }),
    });
    const data = await engineRes.json();
    setResult(data);
    setRunning(false);
  }

  async function saveThisStrategy() {
    // need a name to save
    if (name === "") {
      return;
    }
    const result = await saveStrategy(name, coin, days, strategy);
    if (result) {
      setSaved(true);
      setName("");
      // refresh so new one shows up
      loadStrategies();
    }
  }

  function loadStrategy(item: SavedStrategy) {
    setCoin(item.coin);
    setDays(item.days);

    const saved = item.strategy;

    // group has a rules array
    let savedNodes;
    if (saved.rules) {
      setLogic(saved.type);
      savedNodes = saved.rules;
    } else {
      savedNodes = [saved];
    }

    // turn each node back into a row
    const newRules: Rule[] = [];
    for (let i = 0; i < savedNodes.length; i++) {
      const node = savedNodes[i];
      // start blank then fill it in
      const row: Rule = { indicator: "price", period: "20", operator: ">", value: "60000", band: "lower", multiplier: "2" };
      row.indicator = node.indicator;
      row.operator = node.operator;
      if (node.indicator === "bollinger") {
        row.period = String(node.period);
        row.band = String(node.band);
        row.multiplier = String(node.multiplier);
      } else {
        row.value = String(node.value);
        if (node.indicator !== "price") {
          row.period = String(node.period);
        }
      }
      newRules.push(row);
    }
    setRules(newRules);
  }

  // delete one then refresh the list
  async function removeStrategy(id: string) {
    await deleteStrategy(id);
    loadStrategies();
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
              {/* the bollinger version of the row */}
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

              {/* the normal version of the row */}
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

                  {/* rsi is a 0-100 level, others are a dollar price */}
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

      <div className="mt-8 flex items-center gap-2">
        <button
          onClick={runBacktest}
          className="rounded border border-border bg-surface px-4 py-2 text-sm transition-colors hover:border-foreground"
        >
          Run backtest
        </button>

        <input
          type="text"
          value={name}
          onChange={(event) => {
            setName(event.target.value);
            setSaved(false);
          }}
          placeholder="Strategy name"
          className="rounded border border-border bg-surface px-3 py-2 text-sm"
        />
        <button
          onClick={saveThisStrategy}
          className="rounded border border-border bg-surface px-4 py-2 text-sm transition-colors hover:border-foreground"
        >
          Save
        </button>
        {saved && <span className="text-sm text-muted">Saved</span>}
      </div>

      {running && <p className="mt-3 text-sm text-muted">Running backtest...</p>}

      {result && (
        <div className="mt-6">
          <p className="text-2xl font-semibold tabular-nums">${result.final_value.toFixed(2)}</p>
          <p className="mt-1 text-sm text-muted">
            Return{" "}
            <span className={result.return_pct >= 0 ? "text-up" : "text-down"}>
              {result.return_pct >= 0 ? "+" : ""}
              {result.return_pct.toFixed(2)}%
            </span>{" "}
            on a $10,000 start
          </p>
          <p className="mt-1 text-sm text-muted">
            {result.trades} trades, after 0.1% fees and 0.05% slippage
          </p>
          <p className="mt-1 text-sm text-muted">
            Buy and hold would have returned{" "}
            <span className={result.hold_return_pct >= 0 ? "text-up" : "text-down"}>
              {result.hold_return_pct >= 0 ? "+" : ""}
              {result.hold_return_pct.toFixed(2)}%
            </span>
          </p>
          <p className="mt-2 text-sm">
            {result.return_pct >= result.hold_return_pct
              ? "This strategy beat buy and hold"
              : "This strategy did not beat buy and hold"}
          </p>
        </div>
      )}

      {strategies.length > 0 && (
        <div className="mt-12">
          <h2 className="text-sm font-medium uppercase tracking-wide text-muted">
            Saved strategies
          </h2>
          <div className="mt-4 space-y-2">
            {strategies.map((item) => (
              <div key={item.id} className="flex items-center gap-3 text-sm">
                <span>
                  {item.name} ({item.coin}, {item.days} days)
                </span>
                <button
                  onClick={() => loadStrategy(item)}
                  className="text-muted transition-colors hover:text-foreground"
                >
                  load
                </button>
                <button
                  onClick={() => removeStrategy(item.id)}
                  className="text-muted transition-colors hover:text-foreground"
                >
                  remove
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </main>
  );
}
