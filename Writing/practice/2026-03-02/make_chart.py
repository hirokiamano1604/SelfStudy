#!/usr/bin/env python3
"""Generate line graph for 2026-03-02 Task 1 (museum visitors). Run: MPLCONFIGDIR=.venv/mplconfig .venv/bin/python3 make_chart.py"""
import matplotlib
matplotlib.use("Agg")
import matplotlib.pyplot as plt

years = [2015, 2017, 2020]
museum_a = [20, 26, 35]   # thousands
museum_b = [40, 34, 28]
museum_c = [15, 20, 26]

fig, ax = plt.subplots(figsize=(7, 4))
ax.plot(years, museum_a, marker='o', label='Museum A', linewidth=2)
ax.plot(years, museum_b, marker='s', label='Museum B', linewidth=2)
ax.plot(years, museum_c, marker='^', label='Museum C', linewidth=2)

# 各点に数値ラベルを表示（メモリから推定しなくてよいように）
for x, y in zip(years, museum_a):
    ax.annotate(str(y), (x, y), textcoords="offset points", xytext=(0, 8), ha='center', fontsize=9)
for x, y in zip(years, museum_b):
    ax.annotate(str(y), (x, y), textcoords="offset points", xytext=(0, -12), ha='center', fontsize=9)
for x, y in zip(years, museum_c):
    ax.annotate(str(y), (x, y), textcoords="offset points", xytext=(0, 8), ha='center', fontsize=9)

ax.set_xlabel('Year', fontsize=11)
ax.set_ylabel('Number of visitors (thousands)', fontsize=11)
ax.set_title('Visitor numbers to three museums (2015–2020)', fontsize=12)
ax.set_xticks(years)
ax.legend(loc='best', fontsize=10)
ax.grid(True, linestyle='--', alpha=0.6)
ax.set_ylim(0, 48)

plt.tight_layout()
plt.savefig('2026-03-02_task1_chart.png', dpi=120, bbox_inches='tight')
print('Saved: 2026-03-02_task1_chart.png')
