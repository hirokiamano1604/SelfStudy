#!/usr/bin/env python3
"""Generate bar chart for 2026-03-04 Task 1 (household internet access %).
Run from this folder:
  python3 make_chart.py   # または ../../practice/2026-03-02/.venv/bin/python make_chart.py
Requires: matplotlib"""
import matplotlib
matplotlib.use("Agg")
import matplotlib.pyplot as plt
import numpy as np

countries = ["Country A", "Country B", "Country C"]
pct_2010 = [42, 28, 58]
pct_2020 = [81, 64, 85]

x = np.arange(len(countries))
width = 0.35

fig, ax = plt.subplots(figsize=(7, 4))
bars1 = ax.bar(x - width/2, pct_2010, width, label="2010", color="steelblue")
bars2 = ax.bar(x + width/2, pct_2020, width, label="2020", color="coral")

# 各棒の上に数値ラベルを表示
def add_labels(bars):
    for bar in bars:
        h = bar.get_height()
        ax.annotate(f"{int(h)}%", xy=(bar.get_x() + bar.get_width()/2, h),
                    xytext=(0, 4), textcoords="offset points", ha="center", fontsize=10)
add_labels(bars1)
add_labels(bars2)

ax.set_ylabel("Percentage of households (%)", fontsize=11)
ax.set_title("Households with internet access in three countries (2010 and 2020)", fontsize=12)
ax.set_xticks(x)
ax.set_xticklabels(countries)
ax.legend(loc="upper right", fontsize=10)
ax.set_ylim(0, 100)
ax.grid(True, axis="y", linestyle="--", alpha=0.6)

plt.tight_layout()
plt.savefig("2026-03-04_task1_chart.png", dpi=120, bbox_inches="tight")
print("Saved: 2026-03-04_task1_chart.png")
