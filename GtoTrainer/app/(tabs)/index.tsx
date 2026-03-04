import React, { useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  Modal,
  Platform,
  ScrollView,
  Alert,
} from 'react-native';
import { Image } from 'expo-image';
import { ALL_HAND_RANGES, PositionID, ActionType, RangeEntry } from '../../constants/pokerData';
import { evaluateAction } from '../../utils/gameLogic';
import { useTrainingHistory } from '../../hooks/useTrainingHistory';

const POSITIONS: PositionID[] = ['UTG', 'EP', 'LJ', 'HJ', 'CO', 'BTN'];
const FALLBACK_HAND: RangeEntry = { hand: 'AA', rank: 'R_PURPLE' };

export default function GtoTrainerScreen() {
  const { recordResult, isMastered, getMasteredCount, resetHistory } = useTrainingHistory();

  const [currentPosition, setCurrentPosition] = useState<PositionID>('UTG');

  const [currentHandEntry, setCurrentHandEntry] = useState<RangeEntry>(() => {
    if (ALL_HAND_RANGES && ALL_HAND_RANGES.length > 0) {
      return ALL_HAND_RANGES[Math.floor(Math.random() * ALL_HAND_RANGES.length)];
    }
    return FALLBACK_HAND;
  });

  const [feedbackMessage, setFeedbackMessage] = useState<string>(' ');
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [modalVisible, setModalVisible] = useState<boolean>(false);
  const [lastResultCorrect, setLastResultCorrect] = useState<boolean | null>(null);

  // 指定ポジションの未習得ハンドから1つランダムに選ぶ。全習得済みなら全体から選ぶ。
  const generateNewHand = (position: PositionID = currentPosition) => {
    const pool = ALL_HAND_RANGES.filter((entry) => !isMastered(position, entry.hand));
    const source = pool.length > 0 ? pool : ALL_HAND_RANGES;
    setCurrentHandEntry(source[Math.floor(Math.random() * source.length)]);
    setFeedbackMessage(' ');
    setLastResultCorrect(null);
    setIsProcessing(false);
  };

  const handleAction = (action: ActionType) => {
    if (isProcessing) return;

    const handToCheck = currentHandEntry ? currentHandEntry.hand : FALLBACK_HAND.hand;
    const result = evaluateAction(currentPosition, handToCheck, action);

    // 結果を記録（正誤にかかわらず記録する）
    recordResult(currentPosition, handToCheck, result.isCorrect);

    setFeedbackMessage(result.message);
    setLastResultCorrect(result.isCorrect);
    setIsProcessing(true);

    if (result.isCorrect) {
      setTimeout(() => generateNewHand(), 1000);
    }
  };

  const handleNext = () => generateNewHand();

  const getFeedbackColor = () => {
    if (lastResultCorrect === true) return '#4caf50';
    if (lastResultCorrect === false) return '#f44336';
    return 'transparent';
  };

  const handleReset = () => {
    Alert.alert(
      'Reset Progress',
      '全ての習得履歴をリセットしますか？',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Reset',
          style: 'destructive',
          onPress: () => {
            resetHistory();
            generateNewHand();
          },
        },
      ]
    );
  };

  const masteredCount = getMasteredCount(currentPosition);
  const totalHands = ALL_HAND_RANGES.length;

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>GTO Trainer</Text>
          <Text style={styles.masteredLabel}>
            Mastered: {masteredCount}/{totalHands}
          </Text>
        </View>
        <View style={styles.headerRight}>
          <TouchableOpacity style={styles.resetButton} onPress={handleReset}>
            <Text style={styles.resetButtonText}>Reset</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.chartButton} onPress={() => setModalVisible(true)}>
            <Text style={styles.chartButtonText}>📊 Chart</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Position Selector */}
      <View style={styles.positionContainer}>
        {POSITIONS.map((pos) => (
          <TouchableOpacity
            key={pos}
            style={[styles.posButton, currentPosition === pos && styles.posButtonSelected]}
            onPress={() => {
              setCurrentPosition(pos);
              generateNewHand(pos);
            }}
          >
            <Text style={[styles.posText, currentPosition === pos && styles.posTextSelected]}>
              {pos}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Game Board */}
      <View style={styles.boardContainer}>
        <Text style={styles.handText}>
          {currentHandEntry ? currentHandEntry.hand : 'AA'}
        </Text>

        <View style={styles.feedbackContainer}>
          <Text style={[styles.feedbackText, { color: getFeedbackColor() }]}>
            {feedbackMessage}
          </Text>
          {lastResultCorrect === false && (
            <TouchableOpacity style={styles.nextButton} onPress={handleNext}>
              <Text style={styles.nextButtonText}>Next Hand →</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Actions */}
      <View style={styles.actionsContainer}>
        <View style={styles.actionsRow}>
          <ActionBtn color="#d32f2f" label="Fold" onPress={() => handleAction('Fold')} />
          <ActionBtn color="#ffa000" label="Call" onPress={() => handleAction('Call')} />
        </View>
        <View style={styles.actionsRow}>
          <ActionBtn color="#388e3c" label="Open" onPress={() => handleAction('Open')} />
          <ActionBtn color="#7b1fa2" label="Raise" onPress={() => handleAction('Raise')} />
        </View>
      </View>

      {/* Modal - ヨコサワハンドレンジ表（table.jpg） */}
      <Modal
        visible={modalVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>📊 リングゲームのヨコサワハンドレンジ表</Text>
            <ScrollView style={styles.chartScroll} contentContainerStyle={styles.chartScrollContent}>
              <Image
                source={require('@/assets/images/table.jpg')}
                style={styles.chartImage}
                contentFit="contain"
              />
            </ScrollView>
            <TouchableOpacity style={styles.closeButton} onPress={() => setModalVisible(false)}>
              <Text style={styles.closeButtonText}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const ActionBtn = ({ color, label, onPress }: { color: string, label: string, onPress: () => void }) => (
  <TouchableOpacity style={[styles.actionBtn, { backgroundColor: color }]} onPress={onPress}>
    <Text style={styles.actionBtnText}>{label}</Text>
  </TouchableOpacity>
);

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#1e1e1e', paddingTop: Platform.OS === 'web' ? 0 : 50 },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#333',
  },
  headerTitle: { color: '#fff', fontSize: 22, fontWeight: 'bold' },
  masteredLabel: { color: '#888', fontSize: 11, marginTop: 2 },
  headerRight: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  resetButton: { padding: 8, backgroundColor: '#333', borderRadius: 8 },
  resetButtonText: { color: '#f44336', fontWeight: 'bold', fontSize: 12 },
  chartButton: { padding: 8, backgroundColor: '#333', borderRadius: 8 },
  chartButtonText: { color: '#4fc3f7', fontWeight: 'bold' },
  positionContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    backgroundColor: '#252525',
    paddingVertical: 10,
  },
  posButton: { paddingVertical: 8, paddingHorizontal: 10, borderRadius: 5, borderWidth: 1, borderColor: '#444' },
  posButtonSelected: { backgroundColor: '#4fc3f7', borderColor: '#4fc3f7' },
  posText: { color: '#aaa', fontSize: 12, fontWeight: '600' },
  posTextSelected: { color: '#000' },
  boardContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  handText: { color: '#fff', fontSize: 70, fontWeight: 'bold', letterSpacing: 2 },
  feedbackContainer: { height: 100, alignItems: 'center', justifyContent: 'center', width: '100%', marginTop: 20 },
  feedbackText: { fontSize: 24, fontWeight: 'bold', height: 40, textAlign: 'center' },
  nextButton: { backgroundColor: '#444', paddingHorizontal: 20, paddingVertical: 10, borderRadius: 20, marginTop: 10 },
  nextButtonText: { color: '#fff', fontSize: 16 },
  actionsContainer: { padding: 20, paddingBottom: 40 },
  actionsRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 15 },
  actionBtn: { width: '48%', paddingVertical: 20, borderRadius: 12, alignItems: 'center', cursor: 'pointer' },
  actionBtnText: { color: '#fff', fontSize: 20, fontWeight: 'bold' },
  modalContainer: { flex: 1, backgroundColor: 'rgba(0,0,0,0.9)', justifyContent: 'center', alignItems: 'center' },
  modalContent: { width: '95%', maxHeight: '90%', backgroundColor: '#1a1a1a', borderRadius: 10, padding: 16, alignItems: 'center' },
  modalTitle: { color: '#fff', fontSize: 14, fontWeight: 'bold', marginBottom: 10 },
  chartScroll: { flex: 1, width: '100%', maxHeight: 450 },
  chartScrollContent: { paddingBottom: 12 },
  chartImage: { width: '100%', minHeight: 400 },
  closeButton: { marginTop: 12, paddingVertical: 10, paddingHorizontal: 30, backgroundColor: '#444', borderRadius: 8 },
  closeButtonText: { color: '#fff', fontSize: 16 },
});
