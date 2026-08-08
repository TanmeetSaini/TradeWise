import json
import random
import subprocess
import time
from pathlib import Path

EVALUATOR = Path(__file__).parent / "cpp" / "evaluator"

def make_prices(count):
    random.seed(1)
    price = 60000.0
    prices = []
    for i in range(count):
        price = price * (1 + random.uniform(-0.03, 0.03))
        prices.append(round(price, 2))
    return prices

# run it a few times and take  middle one so a slow run doesn't ruiin accuracy
def time_run(prices, strategy):
    payload = json.dumps({"prices": prices, "strategy": strategy})
    times = []
    for i in range(5):
        start = time.perf_counter()
        subprocess.run([str(EVALUATOR)], input=payload, capture_output=True, text=True)
        times.append((time.perf_counter() - start) * 1000)
    times.sort()
    return times[len(times) // 2]

# uses every indicator so none of them get skipped
strategy = {
    "type": "and",
    "rules": [
        {"type": "rule", "indicator": "sma", "operator": ">", "value": 1, "period": 200},
        {"type": "rule", "indicator": "ema", "operator": ">", "value": 1, "period": 200},
        {"type": "rule", "indicator": "rsi", "operator": "<", "value": 99, "period": 14},
        {"type": "rule", "indicator": "bollinger", "operator": "<", "band": "upper",
         "multiplier": 2, "period": 20},
    ],
}

for count in [1000, 5000, 10000]:
    milliseconds = time_run(make_prices(count), strategy)
    print(count, "candles:", round(milliseconds, 1), "ms")
