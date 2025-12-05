import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Platform,
  Alert,
  ScrollView,
} from 'react-native';

import { Card, TextInput, Button, Title, Dialog, Portal, List, HelperText } from 'react-native-paper'; 
import DateTimePicker from '@react-native-community/datetimepicker';

// 親（App.tsx）から受け取るpropsの型を定義
interface InputScreenProps {
  onAddExpense: (expense: { amount: number; category: string; memo: string, date: Date }) => void;
}

// ★ 事前に登録されたカテゴリリスト (前回のものを使用)
const CATEGORIES = [
    '食費', '交通費', '日用品', '娯楽', '交際費', '自己投資', '住居費', '未分類'
];

// ★ 新機能: メモ内容からカテゴリを推測するロジック
const getCategoryFromMemo = (memo: string): string | null => {
    const lowerMemo = memo.toLowerCase();
    
    // 食費関連
    if (lowerMemo.includes('食') || lowerMemo.includes('コンビニ') || lowerMemo.includes('カフェ') || lowerMemo.includes('ラーメン') || lowerMemo.includes('スーパー')) {
        return '食費';
    }
    // 交通費関連
    if (lowerMemo.includes('電車') || lowerMemo.includes('バス') || lowerMemo.includes('タクシー') || lowerMemo.includes('ガソリン')) {
        return '交通費';
    }
    // 日用品関連
    if (lowerMemo.includes('薬') || lowerMemo.includes('ティッシュ') || lowerMemo.includes('洗剤') || lowerMemo.includes('雑貨')) {
        return '日用品';
    }
    // 娯楽関連
    if (lowerMemo.includes('映画') || lowerMemo.includes('ゲーム') || lowerMemo.includes('カラオケ') || lowerMemo.includes('旅行') || lowerMemo.includes('趣味')) {
        return '娯楽';
    }
    // 交際費関連
    if (lowerMemo.includes('会食') || lowerMemo.includes('飲み会') || lowerMemo.includes('プレゼント') || lowerMemo.includes('お祝い')) {
        return '交際費';
    }
    // 自己投資関連
    if (lowerMemo.includes('本') || lowerMemo.includes('スクール') || lowerMemo.includes('セミナー') || lowerMemo.includes('ジム')) {
        return '自己投資';
    }
    // 住居費関連
    if (lowerMemo.includes('家賃') || lowerMemo.includes('ローン') || lowerMemo.includes('電気') || lowerMemo.includes('ガス') || lowerMemo.includes('水道')) {
        return '住居費';
    }
    
    return null;
};


// 日付を 'YYYY-MM-DD' 形式に整形するヘルパー関数
const formatDate = (date: Date) => {
    return date.toISOString().split('T')[0];
};

const InputScreen: React.FC<InputScreenProps> = ({ onAddExpense }) => {
  const [amountInput, setAmountInput] = useState('');
  const [category, setCategory] = useState(''); 
  const [memo, setMemo] = useState('');
  const [date, setDate] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showCategoryDialog, setShowCategoryDialog] = useState(false);
  
  // ★ メモ入力時のハンドラ: カテゴリの自動分類を行う
  const handleMemoChange = (text: string) => {
    setMemo(text);
    const suggestedCategory = getCategoryFromMemo(text);
    
    // カテゴリが未選択の場合、または自動分類の提案がリストに存在する場合にのみ自動設定
    if (suggestedCategory && category === '') {
        setCategory(suggestedCategory);
    }
  }


  // 日付ピッカーのハンドラ
  const onChangeDate = (event: any, selectedDate?: Date) => {
    const currentDate = selectedDate || date;
    setShowDatePicker(Platform.OS === 'ios');
    setDate(currentDate);
  };
  
  // 登録ボタンの処理
  const handlePress = () => {
    const numAmount = parseInt(amountInput, 10);
    if (isNaN(numAmount) || numAmount <= 0) {
      Alert.alert('エラー', '有効な金額を入力してください！');
      return;
    }
    if (category.trim() === '') {
        Alert.alert('エラー', 'カテゴリを選択してください！');
        return;
    }

    onAddExpense({
        amount: numAmount,
        category: category,
        memo: memo,
        date: date,
    });
    
    // リセット
    setAmountInput('');
    setCategory('');
    setMemo('');
    setDate(new Date());
    Alert.alert('登録完了', `${numAmount.toLocaleString()}円を登録しました！`);
  };

  const handleCategorySelect = (selectedCat: string) => {
      setCategory(selectedCat);
      setShowCategoryDialog(false); 
  }

  return (
    <ScrollView contentContainerStyle={styles.scrollContainer}>
      <View style={styles.container}>
        <Title style={styles.pageTitle}>💰 支出を登録</Title>

        {/* 登録フォーム本体 (Card) */}
        <Card style={styles.inputCard} elevation={4}> 
          <Card.Content>
            
            {/* 日付入力（モダンなボタン） */}
            <View style={styles.inputGroup}>
                <Text style={styles.label}>日付</Text>
                <TouchableOpacity 
                    style={styles.dateButton} 
                    onPress={() => setShowDatePicker(true)}
                >
                    <Text style={styles.dateButtonText}>{formatDate(date)}</Text>
                </TouchableOpacity>

                {/* カレンダーピッカー本体 */}
                {showDatePicker && (
                    <DateTimePicker
                        value={date}
                        mode="date"
                        display="default"
                        onChange={onChangeDate}
                        maximumDate={new Date()}
                        locale="ja" // 日本語化設定
                    />
                )}
            </View>

            {/* 金額入力 (Paper TextInput) */}
            <TextInput
              label="金額 (円)"
              placeholder="例: 1000"
              keyboardType="numeric"
              value={amountInput}
              onChangeText={setAmountInput}
              mode="outlined"
              style={styles.textInput}
            />

            {/* カテゴリ選択 (TextInput風ボタン) */}
            <TouchableOpacity 
                onPress={() => setShowCategoryDialog(true)}
                style={styles.categorySelectGroup}
            >
                <TextInput
                    label="カテゴリ"
                    value={category || 'タップして選択'}
                    mode="outlined"
                    editable={false}
                    right={<TextInput.Icon icon="menu-down" />}
                    style={styles.textInput}
                />
            </TouchableOpacity>

            {/* メモ入力 (Paper TextInput) */}
            <TextInput
              label="メモ"
              placeholder="例: コンビニでお菓子"
              value={memo}
              onChangeText={handleMemoChange} // ★ 新機能のハンドラを使用
              mode="outlined"
              style={[styles.textInput, { marginBottom: 5 }]}
            />
            <HelperText type="info" visible={true} style={{ marginBottom: 15 }}>
                メモを入力すると、カテゴリが自動で提案されます
            </HelperText>

            {/* 登録ボタン (Paper Button) */}
            <Button 
                mode="contained" 
                onPress={handlePress} 
                icon="check"
                contentStyle={styles.buttonContent}
            >
                支出を登録
            </Button>
          </Card.Content>
        </Card>

        {/* カテゴリ選択ダイアログ (Modal) */}
        <Portal>
            <Dialog visible={showCategoryDialog} onDismiss={() => setShowCategoryDialog(false)}>
                <Dialog.Title>カテゴリを選択</Dialog.Title>
                <Dialog.ScrollArea style={styles.dialogScrollArea}>
                    <ScrollView contentContainerStyle={styles.dialogContent}>
                        {CATEGORIES.map((cat) => (
                            <List.Item
                                key={cat}
                                title={cat}
                                onPress={() => handleCategorySelect(cat)}
                                style={styles.dialogListItem}
                            />
                        ))}
                    </ScrollView>
                </Dialog.ScrollArea>
                <Dialog.Actions>
                    <Button onPress={() => setShowCategoryDialog(false)}>キャンセル</Button>
                </Dialog.Actions>
            </Dialog>
        </Portal>

      </View>
    </ScrollView>
  );
};

// ... (Styles are omitted for brevity, assume they are the same)
const styles = StyleSheet.create({
    scrollContainer: { flexGrow: 1, backgroundColor: '#f5f5f5', },
    container: { padding: 20, flex: 1, },
    pageTitle: { fontSize: 26, fontWeight: 'bold', textAlign: 'center', marginBottom: 20, color: '#1a1a1a', },
    inputCard: { padding: 10, elevation: 4, },
    inputGroup: { marginBottom: 15, },
    label: { fontSize: 14, marginBottom: 4, fontWeight: '500', color: '#555', },
    textInput: { marginBottom: 0, backgroundColor: 'white', },
    categorySelectGroup: { marginBottom: 15, },
    dateButton: { backgroundColor: 'white', borderWidth: 1, borderColor: '#ddd', borderRadius: 6, padding: 15, alignItems: 'center', },
    dateButtonText: { fontSize: 16, color: '#333', fontWeight: '600', },
    buttonContent: { paddingVertical: 8, },
    dialogScrollArea: { maxHeight: 300, paddingHorizontal: 0, },
    dialogContent: { paddingTop: 0, },
    dialogListItem: { paddingHorizontal: 20, }
});

export default InputScreen;