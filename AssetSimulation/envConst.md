### 2. 資産運用シミュレーションの全体方針

- 目的 → データ取得 → シンプル戦略 → 評価、の順で進める方針を確認  
- データ取得は **yfinance（Yahoo Finance の Python ラッパー）** を使う形に決定  
- 最初は「単純な Buy & Hold（フルインベスト）戦略」を題材にすることに

### 3. Python 環境まわりの整理方針

- Mac に Python が複数入っている状況の相談  
- すべて削除はせず、 **Miniconda の Python を“本命”として使う** 方針に  
- `sim` という Conda 環境を作成して、その中に必要なライブラリを入れる流れに決定

### 4. Miniconda 環境のセットアップ手順

- 現状確認  
  - `which python3` → `/opt/miniconda3/bin/python3`  
  - `python3 --version` → `Python 3.13.2`
- 新しい Conda 環境を作成・有効化  
  - `conda create -n sim python=3.13.2`  
  - `conda activate sim` → プロンプト先頭が `(sim)` になったのを確認
- ライブラリのインストール  
  - `pip install yfinance`（あとから matplotlib 追加）  
  - yfinance と依存ライブラリ（pandas, numpy など）が正常にインストール

### 5. yfinance が本当に動くかの確認

- `(sim)` 環境で簡易チェックを実行  
  - `python -c "import yfinance as yf; data = yf.download('AAPL', period='1mo'); print(data.tail())"`  
- AAPL の株価データ（1ヶ月分）が取得できることを確認  
- この時点で **yfinance + pandas が正常動作**していることを確認

### 6. プロジェクトフォルダと最初のスクリプト作成

- 既存フォルダ `/Applications/SelfStudy/AssetSimulation` を利用することに決定  
- `cd /Applications/SelfStudy/AssetSimulation` で移動  
- `simple_backtest.py` を作成し、以下の内容を保存  
  - yfinance で AAPL の価格を取得  
  - 調整後終値（Adj Close）から日次リターンを計算  
  - 初期資産 100 でフルインベストした場合の資産曲線を計算  
  - 最後の数行を print＋matplotlib でグラフ表示するコード

### 7. 実行とエラー対応

1. **matplotlib が無いエラー**
   - `ModuleNotFoundError: No module named 'matplotlib'`  
   - 対応：`pip install matplotlib` を実行して解決

2. **Adj Close 列が無いエラー**
   - `KeyError: 'Adj Close'`  
   - `data.columns` を確認したところ、MultiIndex で  
     - `('Close', 'AAPL')`, `('High', 'AAPL')`, `('Low', 'AAPL')`, `('Open', 'AAPL')`, `('Volume', 'AAPL')`  
     という構造になっていることを確認
   - 今後の対応方針として、`prices = data["Adj Close"]` を  
     - `prices = data[("Close", "AAPL")].dropna()` のように MultiIndex に合わせて書き換える  
     流れに入ったところまで
