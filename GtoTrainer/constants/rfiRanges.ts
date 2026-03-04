/**
 * ポジション（色）別ハンドレンジ対応表
 * 基準: 「後ろに何人いるか」でレンジを覚える
 *
 * 後ろに8人   → UTG   → 紫 + 赤 で Open
 * 後ろに6〜7人 → EP    → 紫 + 赤 + 黄 で Open
 * 後ろに4〜5人 → LJ,HJ → 紫 + 赤 + 黄 + 緑 で Open
 * 後ろに3人   → CO    → 紫 + 赤 + 黄 + 緑 + 水色 で Open
 * 後ろに0〜2人 → BTN   → 紫 + 赤 + 黄 + 緑 + 水色 + 白 で Open
 * ピンク枠・グレー → Open しない（Fold）
 */

import type { PositionID } from './pokerData';

// --- 色別ハンドセット（画像の表に準拠） ---

/** 紫: UTG（後ろに8人）の強ハンド */
const PURPLE = new Set<string>([
  'AA', 'KK', 'QQ',
  'AKs', 'AKo',
]);

/** 赤: UTG（後ろに8人）のハンド */
const RED = new Set<string>([
  'JJ', 'TT', '99',
  'AQs', 'AJs', 'ATs', 'KQs', 'AQo',
]);

/** 黄: EP（後ろに6〜7人）のハンド */
const YELLOW = new Set<string>([
  '88', '77',
  'KJs', 'QJs', 'JTs', 'KQo', 'AJo',
]);

/** 緑: LJ、HJ（後ろに4〜5人）のハンド */
const GREEN = new Set<string>([
  '66', '55',
  'A9s', 'A8s', 'A7s', 'A6s', 'A5s', 'A4s', 'A3s', 'A2s',
  'KTs', 'K9s', 'QTs', 'T9s',
  'ATo', 'KJo',
]);

/** 水色: CO（後ろに3人）のハンド */
const CYAN = new Set<string>([
  '44', '33', '22',
  'Q9s', 'J8s', 'T8s', '98s', '87s',
  'A9o', 'KTo', 'JTo',
]);

/** 白: BTN（後ろに0〜2人）のハンド */
const WHITE = new Set<string>([
  'K8s', 'K7s', 'K6s', 'K5s', 'K4s', 'K3s', 'K2s',
  'Q8s', 'Q7s', 'Q6s', 'J8s', 'J7s', '97s', '87s', '76s', '65s',
  'A8o', 'A7o', 'K9o', 'QTo', 'Q9o', 'J9o', 'T9o',
]);

/** 色のセットをまとめて Open ハンドの Set を返す */
function union(...sets: Set<string>[]): Set<string> {
  const out = new Set<string>();
  for (const s of sets) for (const h of s) out.add(h);
  return out;
}

// --- ポジション別 Open レンジ（後ろに何人 → どの色まで Open するか） ---

const RFI_OPEN: Record<PositionID, ReadonlySet<string>> = {
  UTG: union(PURPLE, RED),                                    // 後ろに8人
  EP: union(PURPLE, RED, YELLOW),                             // 後ろに6〜7人
  LJ: union(PURPLE, RED, YELLOW, GREEN),                      // 後ろに4〜5人
  HJ: union(PURPLE, RED, YELLOW, GREEN),                      // 後ろに4〜5人
  CO: union(PURPLE, RED, YELLOW, GREEN, CYAN),               // 後ろに3人
  BTN: union(PURPLE, RED, YELLOW, GREEN, CYAN, WHITE),       // 後ろに0〜2人
};

/**
 * RFI シナリオでの正解アクションを返す。
 * 全ポジションで「Open」か「Fold」のみ。
 */
export function getRfiAction(position: PositionID, hand: string): 'Open' | 'Fold' {
  const openSet = RFI_OPEN[position];
  if (!openSet) return 'Fold';
  return openSet.has(hand) ? 'Open' : 'Fold';
}

export { RFI_OPEN, PURPLE, RED, YELLOW, GREEN, CYAN, WHITE };
