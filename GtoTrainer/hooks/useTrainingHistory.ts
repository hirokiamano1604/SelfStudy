import { useState, useEffect, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { PositionID } from '../constants/pokerData';

const STORAGE_KEY = 'gto_trainer_history';
export const MASTERY_THRESHOLD = 3; // N回連続正解で習得済み

type HistoryMap = Record<string, boolean[]>; // key: "UTG:AKs" → 直近の正誤 (最大N件)

export function useTrainingHistory() {
  const [history, setHistory] = useState<HistoryMap>({});
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY).then((raw) => {
      if (raw) {
        try {
          setHistory(JSON.parse(raw));
        } catch {
          // 破損データは無視して空スタート
        }
      }
      setLoaded(true);
    });
  }, []);

  const recordResult = useCallback((position: PositionID, hand: string, isCorrect: boolean) => {
    setHistory((prev) => {
      const key = `${position}:${hand}`;
      const existing = prev[key] ?? [];
      const updated = [...existing, isCorrect].slice(-MASTERY_THRESHOLD);
      const next = { ...prev, [key]: updated };
      AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      return next;
    });
  }, []);

  const isMastered = useCallback((position: PositionID, hand: string, hist: HistoryMap = history): boolean => {
    const key = `${position}:${hand}`;
    const results = hist[key];
    if (!results || results.length < MASTERY_THRESHOLD) return false;
    return results.slice(-MASTERY_THRESHOLD).every(Boolean);
  }, [history]);

  const getMasteredCount = useCallback((position: PositionID): number => {
    let count = 0;
    for (const key of Object.keys(history)) {
      if (!key.startsWith(`${position}:`)) continue;
      const hand = key.slice(position.length + 1);
      if (isMastered(position, hand)) count++;
    }
    return count;
  }, [history, isMastered]);

  const resetHistory = useCallback(() => {
    setHistory({});
    AsyncStorage.removeItem(STORAGE_KEY);
  }, []);

  return { history, loaded, recordResult, isMastered, getMasteredCount, resetHistory };
}
