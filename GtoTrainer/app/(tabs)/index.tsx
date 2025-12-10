import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  Modal,
  Platform
  // Image, // ★画像は一旦コメントアウト（エラー原因の切り分けのため）
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
  const [debugInfo, setDebugInfo] = useState<string>('Initializing...');

  // --- 初期化ロジック ---
  const generateNewHand = () => {
    try {
      if (!ALL_HAND_RANGES || ALL_HAND_RANGES.length === 0) {
        setDebugInfo('Error: ALL_HAND_RANGES is empty or undefined.');
        return;
      }
      
      const randomIndex = Math.floor(Math.random() * ALL_HAND_RANGES.length);
      const hand = ALL_HAND_RANGES[randomIndex];
      
      if (!hand) {
        setDebugInfo('Error: Hand object is invalid.');
        return;
      }

      setCurrentHandEntry(hand);
      setFeedbackMessage(' ');
      setLastResultCorrect(null);
      setIsProcessing(false);
      setDebugInfo('Ready'); // 正常ロード完了
    } catch (e: any) {
      setDebugInfo(`Error in generateNewHand: ${e.message}`);
    }
  };

  useEffect(() => {
    // マウント時に少し遅延させて実行（Webでのレンダリング競合回避）
    const timer = setTimeout(() => {
        generateNewHand();
    }, 100);
    return () => clearTimeout(timer);
  }, []);

  // --- Loading / Debug View ---
  // currentHandEntryがない場合に表示される画面
  if (!currentHandEntry) {
    return (
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center', padding: 20 }]}>
        <Text style={{ color: '#fff', fontSize: 20, fontWeight: 'bold', marginBottom: 20 }}>
          System Status
        </Text>
        <Text style={{ color: '#ff5252', marginBottom: 20, textAlign: 'center' }}>
          {debugInfo}
        </Text>
        <Text style={{ color: '#aaa', marginBottom: 10 }}>
          Data Count: {ALL_HAND_RANGES ? ALL_HAND_RANGES.length : 'undefined'}
        </Text>
        
        {/* 強制スタートボタン */}
        <TouchableOpacity 
          onPress={generateNewHand} 
          style={{ backgroundColor: '#4fc3f7', padding: 15, borderRadius: 8 }}
        >
          <Text style={{ color: '#000', fontWeight: 'bold' }}>Force Start / Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  // --- Main Game View ---
  const handleAction = (action: ActionType) => {
    if (isProcessing || !currentHandEntry) return;

    try {
      const result = evaluateAction(currentPosition, currentHandEntry.rank, action);
      
      setFeedbackMessage(result.message);
      setLastResultCorrect(result.isCorrect);
      setIsProcessing(true);

      if (result.isCorrect) {
        setTimeout(() => generateNewHand(), 1000);
      }
    } catch (e: any) {
      setFeedbackMessage(`Error: ${e.message}`);
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
          <Text style={[styles.feedbackText, { color: lastResultCorrect === true ? '#4caf50' : (lastResultCorrect === false ? '#f44336' : 'transparent') }]}>
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

      {/* Image Modal (Safe Mode: 画像表示をテキストに置き換え) */}
      <Modal visible={modalVisible} transparent={true} animationType="fade">
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            
            {/* ★重要: 画像読み込みエラー回避のため、一旦テキストのみ表示します。
               これで動くなら、原因は画像のパス間違い（大文字小文字）です。
               確認できたらコメントアウトを外してパスを修正してください。
            */}
            <View style={{flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#222'}}>
               <Text style={{color: '#fff'}}>Image temporarily disabled for debugging.</Text>
               <Text style={{color: '#aaa', marginTop: 10, textAlign: 'center'}}>
                 If you see this, the app logic is working.{'\n'}Check your image filename case (table.jpg vs Table.jpg).
               </Text>
            </View>

            {/* <Image 
              source={require('../../assets/images/table.jpg')} 
              style={styles.chartImage} 
              resizeMode="contain" 
            /> 
            */}
            
            <TouchableOpacity style={styles.closeButton} onPress={() => setModalVisible(false)}>
              <Text style={styles.closeButtonText}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

// Helper Component
const ActionBtn = ({ color, label, onPress }: { color: string, label: string, onPress: () => void }) => (
  <TouchableOpacity style={[styles.actionBtn, { backgroundColor: color }]} onPress={onPress}>
    <Text style={styles.actionBtnText}>{label}</Text>
  </TouchableOpacity>
);

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#1e1e1e', paddingTop: Platform.OS === 'ios' ? 50 : 0 },
  header: { flexDirection: 'row', justifyContent: 'space-between', padding: 20, alignItems: 'center', borderBottomWidth: 1, borderBottomColor: '#333' },
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
  feedbackContainer: { height: 100, alignItems: 'center', justifyContent: 'center', width: '100%' },
  feedbackText: { fontSize: 24, fontWeight: 'bold', height: 40, textAlign: 'center' },
  nextButton: { backgroundColor: '#444', padding: 12, borderRadius: 20, marginTop: 10 },
  nextButtonText: { color: '#fff' },
  actionsContainer: { padding: 20 },
  actionsRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 15 },
  actionBtn: { width: '48%', paddingVertical: 20, borderRadius: 12, alignItems: 'center' },
  actionBtnText: { color: '#fff', fontSize: 20, fontWeight: 'bold' },
  modalContainer: { flex: 1, backgroundColor: 'rgba(0,0,0,0.9)', justifyContent: 'center', alignItems: 'center' },
  modalContent: { width: '90%', height: '80%', backgroundColor: '#000', borderRadius: 10, padding: 10 },
  chartImage: { width: '100%', height: '85%' },
  closeButton: { marginTop: 10, padding: 15, backgroundColor: '#444', borderRadius: 8, alignItems: 'center' },
  closeButtonText: { color: '#fff', fontSize: 16 }
});