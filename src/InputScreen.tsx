import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Platform,
  Alert,
  ScrollView,
} from 'react-native';

// useTheme を追加して、色情報を取得できるようにする
import { Card, TextInput, Button, Title, Dialog, Portal, List, HelperText, useTheme } from 'react-native-paper'; 
import DateTimePicker from '@react-native-community/datetimepicker';

interface InputScreenProps {
  onAddExpense: (expense: { amount: number; category: string; memo: string, date: Date }) => void;
  categories: string[]; 
}

const getCategoryFromMemo = (memo: string): string | null => {
    const lowerMemo = memo.toLowerCase();
    if (lowerMemo.includes('食') || lowerMemo.includes('コンビニ') || lowerMemo.includes('スーパー')) return '食費';
    if (lowerMemo.includes('電車') || lowerMemo.includes('バス') || lowerMemo.includes('タクシー')) return '交通費';
    if (lowerMemo.includes('薬') || lowerMemo.includes('日用品')) return '日用品';
    if (lowerMemo.includes('ゲーム') || lowerMemo.includes('趣味')) return '娯楽';
    if (lowerMemo.includes('家賃') || lowerMemo.includes('電気')) return '住居費';
    return null;
};

const formatDate = (date: Date) => {
    return date.toISOString().split('T')[0];
};

const InputScreen: React.FC<InputScreenProps> = ({ onAddExpense, categories }) => {
  const theme = useTheme(); // ★ 現在のテーマ（ライトorダーク）を取得

  const [amountInput, setAmountInput] = useState('');
  const [category, setCategory] = useState(''); 
  const [memo, setMemo] = useState('');
  const [date, setDate] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showCategoryDialog, setShowCategoryDialog] = useState(false);
  
  const handleMemoChange = (text: string) => {
    setMemo(text);
    const suggestedCategory = getCategoryFromMemo(text);
    if (suggestedCategory && categories.includes(suggestedCategory) && category === '') {
        setCategory(suggestedCategory);
    }
  }

  const onChangeDate = (event: any, selectedDate?: Date) => {
    const currentDate = selectedDate || date;
    setShowDatePicker(Platform.OS === 'ios');
    setDate(currentDate);
  };
  
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
    // 背景色を動的に変更
    <ScrollView contentContainerStyle={[styles.scrollContainer, { backgroundColor: theme.colors.background }]}>
      <View style={styles.container}>
        <Title style={[styles.pageTitle, { color: theme.colors.onBackground }]}>💰 支出を登録</Title>

        <Card style={styles.inputCard} elevation={2}> 
          <Card.Content>
            
            <View style={styles.inputGroup}>
                <Text style={[styles.label, { color: theme.colors.onSurface }]}>日付</Text>
                <TouchableOpacity 
                    style={[styles.dateButton, { backgroundColor: theme.colors.surface, borderColor: theme.colors.outline }]} 
                    onPress={() => setShowDatePicker(true)}
                >
                    <Text style={[styles.dateButtonText, { color: theme.colors.onSurface }]}>{formatDate(date)}</Text>
                </TouchableOpacity>

                {showDatePicker && (
                    <DateTimePicker
                        value={date}
                        mode="date"
                        display="default"
                        onChange={onChangeDate}
                        maximumDate={new Date()}
                        locale="ja" 
                    />
                )}
            </View>

            <TextInput
              label="金額 (円)"
              placeholder="例: 1000"
              keyboardType="numeric"
              value={amountInput}
              onChangeText={setAmountInput}
              mode="outlined"
              style={[styles.textInput, { backgroundColor: theme.colors.surface }]}
            />

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
                    style={[styles.textInput, { backgroundColor: theme.colors.surface }]}
                />
            </TouchableOpacity>

            <TextInput
              label="メモ"
              placeholder="例: コンビニでお菓子"
              value={memo}
              onChangeText={handleMemoChange}
              mode="outlined"
              style={[styles.textInput, { marginBottom: 5, backgroundColor: theme.colors.surface }]}
            />
            <HelperText type="info" visible={true} style={{ marginBottom: 15 }}>
                メモを入力すると、カテゴリが自動で提案されます
            </HelperText>

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

        <Portal>
            <Dialog visible={showCategoryDialog} onDismiss={() => setShowCategoryDialog(false)}>
                <Dialog.Title>カテゴリを選択</Dialog.Title>
                <Dialog.ScrollArea style={styles.dialogScrollArea}>
                    <ScrollView contentContainerStyle={styles.dialogContent}>
                        {categories.map((cat) => (
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

const styles = StyleSheet.create({
  scrollContainer: { flexGrow: 1 },
  container: { padding: 20, flex: 1, },
  pageTitle: { fontSize: 26, fontWeight: 'bold', textAlign: 'center', marginBottom: 20 },
  inputCard: { padding: 10, elevation: 2 }, // elevationを少し下げる
  inputGroup: { marginBottom: 15, },
  label: { fontSize: 14, marginBottom: 4, fontWeight: '500' },
  textInput: { marginBottom: 0 },
  categorySelectGroup: { marginBottom: 15, marginTop: 15 },
  dateButton: { borderWidth: 1, borderRadius: 6, padding: 15, alignItems: 'center', },
  dateButtonText: { fontSize: 16, fontWeight: '600', },
  buttonContent: { paddingVertical: 8, },
  dialogScrollArea: { maxHeight: 300, paddingHorizontal: 0, },
  dialogContent: { paddingTop: 0, },
  dialogListItem: { paddingHorizontal: 20, }
});

export default InputScreen;