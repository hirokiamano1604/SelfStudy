import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  Modal,
  Image,
  Dimensions,
  Platform
} from 'react-native';
import { ALL_HAND_RANGES, PositionID, ActionType, RangeEntry } from '../../constants/pokerData';
import { evaluateAction } from '../../utils/gameLogic';

const POSITIONS: PositionID[] = ['UTG', 'EP', 'LJ', 'HJ', 'CO', 'BTN'];

export default function GtoTrainerScreen() {
  const [currentPosition, setCurrentPosition] = useState<PositionID>('UTG');
  const [currentHandEntry, setCurrentHandEntry] = useState<RangeEntry | null>(null);
  const [feedbackMessage, setFeedbackMessage] = useState<string>(' ');
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [modalVisible, setModalVisible] = useState<boolean>(false);
  const [lastResultCorrect, setLastResultCorrect] = useState<boolean | null>(null);

  // 初期化関数を定義
  const generateNewHand = () => {
    if (ALL_HAND_RANGES && ALL_HAND_RANGES.length > 0) {
      const randomIndex = Math.floor(Math.random() * ALL_HAND_RANGES.length);
      setCurrentHandEntry(ALL_HAND_RANGES[randomIndex]);
      setFeedbackMessage(' ');
      setLastResultCorrect(null);
      setIsProcessing(false);
    }
  };

  // オンライン上でのロードを確実にするため
  useEffect(() => {
    generateNewHand();
  }, []);

  // currentHandEntryがセットされていない時のフォールバックUI
  if (!currentHandEntry) {
    return (
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <Text style={{ color: '#fff' }}>Initializing Data...</Text>
        <TouchableOpacity onPress={generateNewHand} style={styles.nextButton}>
          <Text style={styles.nextButtonText}>Force Start</Text>
        </TouchableOpacity>
      </View>
    );
  }

  // ... (handleAction, handleNext は以前と同じ)
  const handleAction = (action: ActionType) => {
    if (isProcessing || !currentHandEntry) return;
    const result = evaluateAction(currentPosition, currentHandEntry.rank, action);
    setFeedbackMessage(result.message);
    setLastResultCorrect(result.isCorrect);
    setIsProcessing(true);
    if (result.isCorrect) {
      setTimeout(() => generateNewHand(), 1000);
    }
  };

  const handleNext = () => generateNewHand();

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>GTO Trainer</Text>
        <TouchableOpacity style={styles.chartButton} onPress={() => setModalVisible(true)}>
          <Text style={styles.chartButtonText}>📊 Chart</Text>
        </TouchableOpacity>
      </View>

      {/* Position Selector */}
      <View style={styles.positionContainer}>
        {POSITIONS.map((pos) => (
          <TouchableOpacity
            key={pos}
            style={[styles.posButton, currentPosition === pos && styles.posButtonSelected]}
            onPress={() => {
              setCurrentPosition(pos);
              generateNewHand();
            }}
          >
            <Text style={[styles.posText, currentPosition === pos && styles.posTextSelected]}>{pos}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Game Board */}
      <View style={styles.boardContainer}>
        <Text style={styles.handText}>{currentHandEntry.hand}</Text>
        <View style={styles.feedbackContainer}>
          <Text style={[styles.feedbackText, { color: lastResultCorrect === true ? '#4caf50' : '#f44336' }]}>
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

      {/* Image Modal (GitHub Pagesではパスに注意) */}
      <Modal visible={modalVisible} transparent={true} animationType="fade">
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            {/* 画像が見つからない場合のエラー回避 */}
            <Image 
              source={require('../../assets/images/table.jpg')} 
              style={styles.chartImage} 
              resizeMode="contain" 
            />
            <TouchableOpacity style={styles.closeButton} onPress={() => setModalVisible(false)}>
              <Text style={styles.closeButtonText}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

// ボタンコンポーネントの共通化
const ActionBtn = ({ color, label, onPress }: { color: string, label: string, onPress: () => void }) => (
  <TouchableOpacity style={[styles.actionBtn, { backgroundColor: color }]} onPress={onPress}>
    <Text style={styles.actionBtnText}>{label}</Text>
  </TouchableOpacity>
);

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#1e1e1e', paddingTop: Platform.OS === 'ios' ? 50 : 0 },
  header: { flexDirection: 'row', justifyContent: 'space-between', padding: 20, alignItems: 'center' },
  headerTitle: { color: '#fff', fontSize: 22, fontWeight: 'bold' },
  chartButton: { padding: 10, backgroundColor: '#333', borderRadius: 8 },
  chartButtonText: { color: '#4fc3f7' },
  positionContainer: { flexDirection: 'row', justifyContent: 'space-around', backgroundColor: '#252525', paddingVertical: 10 },
  posButton: { padding: 8, borderRadius: 5, borderWidth: 1, borderColor: '#444' },
  posButtonSelected: { backgroundColor: '#4fc3f7' },
  posText: { color: '#aaa' },
  posTextSelected: { color: '#000', fontWeight: 'bold' },
  boardContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  handText: { color: '#fff', fontSize: 70, fontWeight: 'bold' },
  feedbackContainer: { height: 100, alignItems: 'center' },
  feedbackText: { fontSize: 24, fontWeight: 'bold', height: 40 },
  nextButton: { backgroundColor: '#444', padding: 12, borderRadius: 20, marginTop: 10 },
  nextButtonText: { color: '#fff' },
  actionsContainer: { padding: 20 },
  actionsRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 15 },
  actionBtn: { width: '48%', paddingVertical: 20, borderRadius: 12, alignItems: 'center' },
  actionBtnText: { color: '#fff', fontSize: 20, fontWeight: 'bold' },
  modalContainer: { flex: 1, backgroundColor: 'rgba(0,0,0,0.9)', justifyContent: 'center', alignItems: 'center' },
  modalContent: { width: '90%', height: '80%', alignItems: 'center' },
  chartImage: { width: '100%', height: '90%' },
  closeButton: { padding: 15, backgroundColor: '#444', borderRadius: 8, marginTop: 10 },
  closeButtonText: { color: '#fff' }
});