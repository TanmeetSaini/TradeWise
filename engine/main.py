import json
import subprocess
from pathlib import Path

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

app = FastAPI()

# let the next.js dev server call us
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# path to the compiled c++ program
EVALUATOR = Path(__file__).parent / "cpp" / "evaluator"


# what the frontend sends us
class BacktestRequest(BaseModel):
    prices: list[float]
    strategy: dict


@app.post("/backtest")
def backtest(req: BacktestRequest):
    # send the prices and strategy to the c++ program on stdin
    payload = json.dumps({"prices": req.prices, "strategy": req.strategy})
    proc = subprocess.run(
        [str(EVALUATOR)],
        input=payload,
        capture_output=True,
        text=True,
    )
    # it prints the result back as json on stdout
    result = json.loads(proc.stdout)
    return result
