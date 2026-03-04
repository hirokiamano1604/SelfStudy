import { PositionID, ActionType } from '../constants/pokerData';
import { getRfiAction } from '../constants/rfiRanges';

// --- Evaluation Logic (RFI: Raise First In) ---

export interface EvaluationResult {
  isCorrect: boolean;
  message: string;
  correctAction: ActionType;
}

/**
 * RFI シナリオでの正解判定。
 * ポジションとハンドから「Open」か「Fold」を正解とし、ユーザーの選択と照合する。
 * Call / Raise は RFI では使わないため、正解は常に Open または Fold。
 */
export function evaluateAction(
  position: PositionID,
  hand: string,
  userAction: ActionType
): EvaluationResult {
  const correctAction: ActionType = getRfiAction(position, hand);

  const isCorrect = userAction === correctAction;

  let message = '';
  if (isCorrect) {
    message = 'Correct!';
  } else {
    message = `Wrong! Correct was ${correctAction}`;
  }

  return {
    isCorrect,
    message,
    correctAction,
  };
}
