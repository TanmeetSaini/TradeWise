import json
import subprocess
from pathlib import Path

EVALUATOR = Path(__file__).parent / "cpp" / "evaluator"

# send prices and a strategy to the c++ program and read back what it says
def run(prices, strategy):
    payload = json.dumps({"prices": prices, "strategy": strategy})
    proc = subprocess.run([str(EVALUATOR)], input=payload, capture_output=True, text=True)
    return json.loads(proc.stdout)

# compare what it said to the answer we worked out ourselves
def check(name, got, expected):
    if abs(got - expected) < 0.01:
        print("pass:", name)
    else:
        print("FAIL:", name, "got", got, "expected", expected)


# the price is always above 0 so this buys on day 0, but the price drops to 50
# the next day and we buy at the next day's close, so we pay 50 and not 100.
# after the 0.1% fee we have 9990, with slippage the price is 50.025, so we get
# 199.7 coins and they are worth 9985 at the end. paying 100 would give 4992
prices = [100, 50, 50]
strategy = {"type": "rule", "indicator": "price", "operator": ">", "value": 0}
result = run(prices, strategy)
check("buys at the next day's price", result["final_value"], 9985.01)

# the price is never above 1000 so it should never buy
prices = [100, 50, 50]
strategy = {"type": "rule", "indicator": "price", "operator": ">", "value": 1000}
result = run(prices, strategy)
check("a rule that is never true does not trade", result["trades"], 0)

# a 50 day average needs 50 days behind it so it can never be true on 4 days
prices = [100, 110, 120, 130]
strategy = {"type": "rule", "indicator": "sma", "operator": ">", "value": 0, "period": 50}
result = run(prices, strategy)
check("an indicator waits for enough history", result["trades"], 0)

# the 3 day average of 10, 20 and 30 is 20 so it is above 19
prices = [10, 20, 30, 100]
strategy = {"type": "rule", "indicator": "sma", "operator": ">", "value": 19, "period": 3}
result = run(prices, strategy)
check("the 3 day average is above 19", result["trades"], 1)

# the same average of 20 is not above 21
prices = [10, 20, 30, 100]
strategy = {"type": "rule", "indicator": "sma", "operator": ">", "value": 21, "period": 3}
result = run(prices, strategy)
check("the 3 day average is not above 21", result["trades"], 0)

# first rule is true, second is false so AND should not buy
prices = [100, 110, 120]
strategy = {
    "type": "and",
    "rules": [
        {"type": "rule", "indicator": "price", "operator": ">", "value": 0},
        {"type": "rule", "indicator": "price", "operator": ">", "value": 1000},
    ],
}
result = run(prices, strategy)
check("and is false when one rule is false", result["trades"], 0)

# both rules are true so AND should buy
prices = [100, 110, 120]
strategy = {
    "type": "and",
    "rules": [
        {"type": "rule", "indicator": "price", "operator": ">", "value": 0},
        {"type": "rule", "indicator": "price", "operator": ">", "value": 0},
    ],
}
result = run(prices, strategy)
check("and is true when every rule is true", result["trades"], 1)

# first rule is true second is false so OR should still buy
prices = [100, 110, 120]
strategy = {
    "type": "or",
    "rules": [
        {"type": "rule", "indicator": "price", "operator": ">", "value": 0},
        {"type": "rule", "indicator": "price", "operator": ">", "value": 1000},
    ],
}
result = run(prices, strategy)
check("or is true when one rule is true", result["trades"], 1)

# both rules are false so OR should not buy
prices = [100, 110, 120]
strategy = {
    "type": "or",
    "rules": [
        {"type": "rule", "indicator": "price", "operator": ">", "value": 1000},
        {"type": "rule", "indicator": "price", "operator": ">", "value": 1000},
    ],
}
result = run(prices, strategy)
check("or is false when every rule is false", result["trades"], 0)
