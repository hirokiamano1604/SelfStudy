
import yfinance as yf
import pandas as pd
import numpy as np
from scipy.optimize import minimize
import matplotlib.pyplot as plt

# 日経平均への寄与度や時価総額が高い主要20銘柄。AIに選定してもらいました。
major_20_tickers = [
    "9983.T", # ファーストリテイリング
    "8035.T", # 東京エレクトロン
    "6758.T", # ソニーグループ
    "7203.T", # トヨタ自動車
    "6857.T", # アドバンテスト
    "9984.T", # ソフトバンクグループ
    "4063.T", # 信越化学工業
    "6098.T", # リクルートホールディングス
    "8058.T", # 三菱商事
    "8306.T", # 三菱UFJフィナンシャル・グループ
    "6367.T", # ダイキン工業
    "4502.T", # 武田薬品工業
    "6501.T", # 日立製作所
    "6954.T", # ファナック
    "7741.T", # HOYA
    "4519.T", # 中外製薬
    "8001.T", # 伊藤忠商事
    "6981.T", # 村田製作所
    "2801.T", # キッコーマン
    "4901.T"  # 富士フイルムHLDG
]

# 該当銘柄データを取得
data = yf.download(major_20_tickers, period="10y")
closeData = data["Close"] #これが銘柄のデータ全体
returnData = data["Close"].pct_change().dropna() #これが%での変化
returnData["Cash"]=0

def findValues(rtrData: pd.DataFrame, target: float, rf: float):
    """
    3年分のデータを踏まえて初期時点でのウェイトを計算する。各銘柄の期待リターンと共分散行列から、目標リターンを実現する最小分散のウェイトを計算しspilts outする。
    rtrData: n銘柄のリターンのデータ
    target_return : 目標のリターン
    rf : リスクフリーレート
    """
    expectedReturn = rtrData.mean()
    expectedVariance = rtrData.cov()

    mu = expectedReturn.values
    Sigma = expectedVariance.values
    n_assets = len(mu)

    target_return = target/365

    # 目的関数: ポートフォリオ分散 w^T Σ w
    def portfolio_variance(w, Sigma):
        return w @ Sigma @ w

    # 制約1: 期待リターンが target_return
    def constraint_return(w, mu, target):
        return w @ mu - target

    # 制約2: 重みの合計が 1 （フルインベスト）
    def constraint_weight_sum(w):
        return np.sum(w) - 1.0

    # 初期値: 等ウェイト
    w0 = np.ones(n_assets) / n_assets

    # 制約設定
    constraints = [
        {
            "type": "eq",
            "fun": constraint_return,
            "args": (mu, target_return)
        },
        {
            "type": "eq",
            "fun": constraint_weight_sum
        }
    ]
    
    # 最適化実行
    result = minimize(
        fun=portfolio_variance,
        x0=w0,
        args=(Sigma,),
        method="SLSQP",
        constraints=constraints,
        bounds=tuple((0, 1) for _ in range(n_assets)) # 負の重みを防ぐための境界条件（任意）
    )

    if not result.success:
        raise RuntimeError("最適化に失敗しました: " + result.message)

    rf_daily = rf / 365
    w_opt = result.x
    return_opt = w_opt @ mu
    variance_opt = w_opt @ Sigma @ w_opt
    sharpRatio_opt = (return_opt - rf_daily) / np.sqrt(variance_opt)
    
    return w_opt, return_opt, variance_opt, sharpRatio_opt

def findSubsequentValue(rtrData: pd.DataFrame, explorationData: pd.DataFrame, backtestDates: pd.Index, target_return: float, rf: float):
    """
    初期のウェイトを踏まえて、その後そのポートフォリオの期待リターンをtarget_returnにして推移を確認する。
    rtrData: リターンの10年分のデータ
    explorationData: 探索期間のデータ
    backtestDates: バックテスト用期間の日にちデータ
    target_return: 初めのポートフォリオウェイト選定のための日次目標リターン
    rf : リスクフリーレート
    """
    all_dates = [explorationData.index[-1]] + list(backtestDates)
    
    weight_history = []
    return_history = pd.Series(index=all_dates, dtype=float)
    Var_history = pd.Series(index=all_dates, dtype=float)
    sharpRatio_history = pd.Series(index=all_dates, dtype=float)

    # 初期値の計算
    initialWeight, initialReturn, initialVar, initialSharpRatio = findValues(explorationData, target_return, rf)
    
    weight_history.append(initialWeight)
    return_history.iloc[0] = initialReturn
    Var_history.iloc[0] = initialVar
    sharpRatio_history.iloc[0] = initialSharpRatio

    # 以降の推移を計算
    for i, d in enumerate(backtestDates):
        testdata = rtrData.loc[:d]
        # 前回の期待リターン(initialReturn)を目標リターンとして再最適化
        nextWeight, nextReturn, nextVar, nextSharpRatio = findValues(testdata, initialReturn, rf)
        
        weight_history.append(nextWeight)
        return_history.iloc[i+1] = nextReturn
        Var_history.iloc[i+1] = nextVar
        sharpRatio_history.iloc[i+1] = nextSharpRatio

    return weight_history, return_history, Var_history, sharpRatio_history

def runBackTest_Q1(rtrData: pd.DataFrame, target_return: float, rf: float):
    """
    1問目についてバックテストを回す。
    ポートフォリオの期待リターン、期待リスク、シャープレシオの推移をグラフで表示する。
    rtrData: リターンの10年分のデータ
    target_return: 初めのポートフォリオウェイト選定のための日次目標リターン
    rf : リスクフリーレート
    """
    beginingYear = rtrData.index[0].year
    explorationData = rtrData.loc[f"{beginingYear}":f"{beginingYear+2}"]
    backtestDates = rtrData.loc[f"{beginingYear+3}":].index

    weight_history, return_history, Var_history, sharpRatio_history = findSubsequentValue(
        rtrData, explorationData, backtestDates, target_return, rf
    )
     
    fig, axes = plt.subplots(3, 1, figsize=(10, 10), sharex=True)

    axes[0].plot(return_history.index, return_history.values, label="Expected Return", color="tab:orange")
    axes[0].set_ylabel("Exp. Return")
    axes[0].legend()
    axes[0].set_ylim(0, 0.0001)

    axes[1].plot(Var_history.index, Var_history.values, label="Variance", color="tab:green")
    axes[1].set_ylabel("Variance")
    axes[1].legend()

    axes[2].plot(sharpRatio_history.index, sharpRatio_history.values, label="Sharpe Ratio", color="tab:blue")
    axes[2].set_ylabel("Sharpe Ratio")
    axes[2].set_xlabel("Date")
    axes[2].legend()

    plt.tight_layout()
    plt.show()

    return weight_history, return_history, Var_history


def findTaxLossHarvestingValue(rtrData: pd.DataFrame, explorationData: pd.DataFrame, backtestData: pd.DataFrame, target_return: float, rf: float):
    """
    初期ウェイトをもとに、Tax Loss Harvesting戦略の推移を計算する。
    rtrData: リターンのデータ
    explorationData: 探索期間のデータ
    backtestData: バックテスト期間のデータ
    target_return: 初期ウェイト計算用の目標リターン
    rf: リスクフリーレート
    """
    backtestDates = backtestData.index
    all_dates = [explorationData.index[-1]] + list(backtestDates)
    
    # 3年目終了時点を基準とした累積リターン
    cumReturn = (1 + backtestData).cumprod()

    weight_history = []
    return_history = pd.Series(index=all_dates, dtype=float)
    Var_history = pd.Series(index=all_dates, dtype=float)
    sharpRatio_history = pd.Series(index=all_dates, dtype=float)

    # 初期ウェイトの計算
    initialWeight, initialReturn, initialVar, initialSharpRatio = findValues(explorationData, target_return, rf)
    
    weight_history.append(initialWeight.copy())
    return_history.iloc[0] = initialReturn
    Var_history.iloc[0] = initialVar
    sharpRatio_history.iloc[0] = initialSharpRatio

    rf_daily = rf / 365

    for i, d in enumerate(backtestDates):
        # その時点までの統計量を取得
        testdata = rtrData.loc[:d]
        mu = testdata.mean().values
        Sigma = testdata.cov().values

        # 含み損が発生している銘柄の特定
        current_cum_returns = cumReturn.loc[d]
        fallenComp = np.where(current_cum_returns < 1)[0]

        # ウェイトの調整
        currentWeight = weight_history[-1].copy()
        for idx in fallenComp:
            if currentWeight[idx] > 0:
                # 銘柄のウェイトをCashに移動
                currentWeight[-1] += currentWeight[idx]
                currentWeight[idx] = 0.0

        # 指標の算出
        port_return = currentWeight @ mu
        port_var = currentWeight @ Sigma @ currentWeight
        port_sharp = (port_return - rf_daily) / np.sqrt(port_var)

        weight_history.append(currentWeight.copy())
        return_history.iloc[i+1] = port_return
        Var_history.iloc[i+1] = port_var
        sharpRatio_history.iloc[i+1] = port_sharp

    return weight_history, return_history, Var_history, sharpRatio_history

def runBackTest_Q2(rtrData: pd.DataFrame, target_return: float, rf: float):
    """
    2問目についてバックテストを回す。
    先に3年分のデータを用いて初期のウェイトを計算し、tax Loss Harvestingに移行する。
    3年目データ終了時の株価を保持しておき、各日付においての株価と初期時点株価を比較する。
    もし初期時点株価を下回っていたら、その銘柄のウェイトを0にし、現金にその銘柄のウェイト分を移動させる。
    時系列データとしてポートフォリオの期待リターン、期待リスク、シャープレシオをグラフで表示する。
    returnData: リターンの10年分のデータ
    target_return: 初めのポートフォリオウェイト選定のための日次目標リターン
    rf : リスクフリーレート
    """
    beginingYear = rtrData.index[0].year
    explorationData = rtrData.loc[f"{beginingYear}":f"{beginingYear+2}"]
    backtestData = rtrData.loc[f"{beginingYear+3}":]

    # 数値計算部分の呼び出し
    weight_history, return_history, Var_history, sharpRatio_history = findTaxLossHarvestingValue(
        rtrData, explorationData, backtestData, target_return, rf
    )
    
    fig, axes = plt.subplots(3, 1, figsize=(10, 8), sharex=True)

    axes[0].plot(return_history.index, return_history.values, label="Expected Return", color="tab:orange")
    axes[0].set_ylabel("Exp. Return")
    axes[0].legend()
    axes[0].set_ylim(0, 0.0001)

    axes[1].plot(Var_history.index, Var_history.values, label="Variance", color="tab:green")
    axes[1].set_ylabel("Variance")
    axes[1].legend()

    axes[2].plot(sharpRatio_history.index, sharpRatio_history.values, label="Sharp Ratio", color="tab:blue")
    axes[2].set_ylabel("Sharp Ratio")
    axes[2].set_xlabel("Step")
    axes[2].legend()

    plt.tight_layout()
    plt.show()

    return weight_history, return_history, Var_history