import json
import os
import subprocess
from pathlib import Path
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

app = FastAPI()

allowed = ["http://localhost:3000"]
site = os.environ.get("SITE_URL")
if site:
    allowed.append(site)

app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed,
    allow_methods=["*"],
    allow_headers=["*"],
)

# path to the compiled c++ program
EVALUATOR = Path(__file__).parent / "cpp" / "evaluator"


# what the frontend sends us
class BacktestRequest(BaseModel):
    prices: list[float]
    strategy: dict
    stop_loss: float = 0
    take_profit: float = 0


@app.post("/backtest")
def backtest(req: BacktestRequest):
    # send the prices and strategy
    payload = json.dumps({
        "prices": req.prices,
        "strategy": req.strategy,
        "stop_loss": req.stop_loss,
        "take_profit": req.take_profit,
    })
    proc = subprocess.run(
        [str(EVALUATOR)],
        input=payload,
        capture_output=True,
        text=True,
    )
    if proc.returncode != 0:
        raise HTTPException(status_code=400, detail=proc.stderr.strip())
    result = json.loads(proc.stdout)
    return result
