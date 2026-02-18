# simple_backtest.py

import yfinance as yf
import pandas as pd
import matplotlib.pyplot as plt

# 設定
ticker = "AAPL"
start = "2015-01-01"
end = "2026-01-01"
initial_capital = 100.0  # 初期資産

# データ取得
data = yf.download(ticker, start=start, end=end)

# 今回の yfinance は MultiIndex で列が返ってくる:
# MultiIndex([('Close','AAPL'), ('High','AAPL'), ...], names=['Price','Ticker'])
# なので「終値」は ("Close", ticker) で取る
prices = data[("Close", ticker)].dropna()

# 日次リターン
returns = prices.pct_change().dropna()

# 常にフルインベストする戦略
equity_curve = (1 + returns).cumprod() * initial_capital

print(equity_curve.tail())

# グラフ表示
plt.figure(figsize=(10, 5))
equity_curve.plot()
plt.title(f"Buy & Hold Strategy on {ticker}")
plt.xlabel("Date")
plt.ylabel("Portfolio Value")
plt.grid(True)
plt.tight_layout()
plt.show()
