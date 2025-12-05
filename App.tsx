// App.tsx の中身をこれに全部書き換える！

import React, { useState, useMemo } from 'react';
import {
  SafeAreaView,
  View,
  Text,
  TextInput,
  Button,
  StyleSheet,
  Alert,
  FlatList,
  TouchableOpacity,
  ScrollView,
  Dimensions,
  Platform, // OS判定のために追加
} from 'react-native';

// ★ 新しくインポートしたカレンダーピッカー
import DateTimePicker from '@react-native-community/datetimepicker';

// グラフライブラリをインポート (前回と同じ)
import { PieChart } from 'react-native-chart-kit'; 

const screenWidth = Dimensions.get('window').width;

interface Expense {
  id: string;
  amount: number;
  category: string;
  memo: string;
  date: string; // ★ 日付を 'YYYY-MM-DD' 形式で保持
}

// 日付を 'YYYY-MM-DD' 形式に整形するヘルパー関数
const formatDate = (date: Date) => {
    return date.toISOString().split('T')[0];
};

const randomColor = () => `#${Math.floor(Math.random() * 16777215).toString(16).padStart(6, '0')}`;

function App(): React.JSX.Element {
  // 入力フォームのState
  const [amountInput, setAmountInput] = useState('');
  const [category, setCategory] = useState('');
  const [memo, setMemo] = useState('');
  const [date, setDate] = useState(new Date()); // ★ 日付 State
  const [showDatePicker, setShowDatePicker] = useState(false); // ★ DatePicker表示/非表示

  const [expenses, setExpenses] = useState<Expense[]>([]);

  // ★ 支出データを計算するロジック (グラフと合計支出用)
  const categoryData = useMemo(() => {
    const totals: { [key: string]: number } = {};
    expenses.forEach(expense => {
      const cat = expense.category || '未分類';
      totals[cat] = (totals[cat] || 0) + expense.amount;
    });

    const chartData = Object.keys(totals).map((cat) => {
      return {
        name: cat,
        population: totals[cat],
        color: randomColor(),
        legendFontColor: '#7F7F7F',
        legendFontSize: 14,
      };
    });
    
    const totalAmount = expenses.reduce((sum, expense) => sum + expense.amount, 0);

    return { chartData, totalAmount };
  }, [expenses]);

  const { chartData, totalAmount } = categoryData;


  // ★ DatePickerで日付が選択された時の処理
  const onChangeDate = (event: any, selectedDate?: Date) => {
    const currentDate = selectedDate || date;
    setShowDatePicker(Platform.OS === 'ios'); // iOSでは選択後も表示したままにするためfalse
    setDate(currentDate);
  };
  

  // ★ 登録ボタンを押した時の処理
  const handlePress = () => {
    const numAmount = parseInt(amountInput, 10);
    if (isNaN(numAmount) || numAmount <= 0) {
      Alert.alert('エラー', '有効な金額を入力してください！');
      return;
    }

    const newExpense: Expense = {
      id: Date.now().toString(),
      amount: numAmount,
      category: category.trim() || '未分類',
      memo: memo,
      date: formatDate(date), // ★ フォーマットされた日付を保存
    };

    // リストに新しいデータを追加し、日付順（新しいものが上）にソート
    const updatedExpenses = [newExpense, ...expenses];
    setExpenses(updatedExpenses.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()));
    
    // 入力欄をリセット
    setAmountInput('');
    setCategory('');
    setMemo('');
    setDate(new Date());
  };

  // 削除ボタンの処理 (変更なし)
  const handleDelete = (id: string) => {
    Alert.alert(
      '削除の確認', 
      'この支出を削除しますか？', 
      [
        { text: 'キャンセル', style: 'cancel' },
        { text: '削除', style: 'destructive', onPress: () => {
            setExpenses(expenses.filter(item => item.id !== id));
        }},
      ]
    );
  };
  
  // リストの各行を描画する関数
  const renderItem = ({ item }: { item: Expense }) => (
    <View style={styles.listItem}>
      <View style={styles.listTextContainer}>
        <Text style={styles.itemDate}>{item.date}</Text> {/* ★ 日付を表示 */}
        <Text style={styles.itemCategory}>{item.category}</Text>
        <Text style={styles.itemAmount}>- {item.amount.toLocaleString()}円</Text>
        {item.memo ? <Text style={styles.itemMemo}>{item.memo}</Text> : null}
      </View>
      <TouchableOpacity onPress={() => handleDelete(item.id)} style={styles.deleteButton}>
        <Text style={styles.deleteButtonText}>×</Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.container}>

            {/* ==================================== */}
            {/* 1. 分析エリア (グラフ)                  */}
            {/* ==================================== */}
            <View style={styles.analysisSection}>
                <Text style={styles.sectionTitle}>分析・ナビゲーター</Text>
                
                {totalAmount > 0 ? (
                    <View>
                        <Text style={styles.totalText}>合計支出: {totalAmount.toLocaleString()}円</Text>
                        <PieChart
                            data={chartData}
                            width={screenWidth - 40}
                            height={220}
                            chartConfig={{
                                color: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
                            }}
                            accessor={"population"}
                            backgroundColor={"transparent"}
                            paddingLeft={"15"}
                            center={[5, 0]}
                        />
                    </View>
                ) : (
                    <Text style={styles.noDataText}>データがありません。支出を登録しましょう！</Text>
                )}
            </View>


            {/* ==================================== */}
            {/* 2. 入力エリア                           */}
            {/* ==================================== */}
            <View style={styles.inputSection}>
                <Text style={styles.mainTitle}>支出入力</Text>
                
                {/* 日付入力（ボタンでカレンダーを開く） */}
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
                            maximumDate={new Date()} // 未来の日付は選択不可
                        />
                    )}
                </View>

                {/* 金額入力 */}
                <View style={styles.inputGroup}>
                    <Text style={styles.label}>金額 (円)</Text>
                    <TextInput
                    style={styles.input}
                    placeholder="1000"
                    keyboardType="numeric"
                    value={amountInput}
                    onChangeText={setAmountInput}
                    />
                </View>

                {/* カテゴリ入力 */}
                <View style={styles.inputGroup}>
                    <Text style={styles.label}>カテゴリ</Text>
                    <TextInput
                    style={styles.input}
                    placeholder="例：食費、交通費"
                    value={category}
                    onChangeText={setCategory}
                    />
                </View>
                
                {/* メモ入力 */}
                <View style={styles.inputGroup}>
                    <Text style={styles.label}>メモ</Text>
                    <TextInput
                    style={styles.input}
                    placeholder="例：コンビニでお菓子買った"
                    value={memo}
                    onChangeText={setMemo}
                    />
                </View>

                {/* 登録ボタン */}
                <View style={styles.buttonContainer}>
                    <Button title="登録する" onPress={handlePress} /> 
                </View>
            </View>


            {/* ==================================== */}
            {/* 3. 履歴リストエリア                      */}
            {/* ==================================== */}
            <View style={styles.listSection}>
                <Text style={styles.listTitle}>履歴 ({expenses.length}件)</Text>
                
                <FlatList
                    data={expenses}
                    renderItem={renderItem}
                    keyExtractor={item => item.id}
                    style={styles.list}
                    scrollEnabled={false} 
                />
            </View>

        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

// スタイル (日付ボタン周りを追加)
const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#f5f5f5' },
  scrollContent: { paddingBottom: 50 },
  container: { flex: 1, paddingHorizontal: 20 },
  // --- 分析エリア ---
  analysisSection: {
    paddingVertical: 20,
    marginBottom: 20,
    backgroundColor: 'white',
    borderRadius: 10,
    paddingHorizontal: 15,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 5,
    elevation: 3,
  },
  totalText: { fontSize: 16, fontWeight: 'bold', marginBottom: 10, textAlign: 'center', color: '#333' },
  noDataText: { textAlign: 'center', color: '#999', paddingVertical: 20 },
  // --- 入力エリア ---
  inputSection: { paddingBottom: 20, borderBottomWidth: 1, borderBottomColor: '#eee', marginBottom: 20 },
  mainTitle: { fontSize: 24, fontWeight: 'bold', marginBottom: 20, textAlign: 'center' },
  sectionTitle: { fontSize: 20, fontWeight: 'bold', marginBottom: 10, color: '#1a1a1a' },
  inputGroup: { marginBottom: 10 },
  label: { fontSize: 14, marginBottom: 4, fontWeight: '500', color: '#333' },
  input: { backgroundColor: 'white', borderWidth: 1, borderColor: '#ddd', borderRadius: 6, padding: 10, fontSize: 16 },
  buttonContainer: { marginTop: 10 },
  // ★ 日付ボタンのスタイル
  dateButton: {
    backgroundColor: 'white',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 6,
    padding: 10,
  },
  dateButtonText: {
    fontSize: 16,
    color: '#333',
  },
  // --- リストエリア ---
  listSection: { flex: 1 },
  listTitle: { fontSize: 18, fontWeight: 'bold', marginBottom: 10, color: '#555' },
  list: { flex: 1 },
  listItem: {
    backgroundColor: 'white',
    padding: 15,
    borderRadius: 8,
    marginBottom: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  listTextContainer: { flex: 1 },
  itemAmount: { fontSize: 18, fontWeight: 'bold', color: '#d9534f' },
  itemCategory: { fontSize: 12, color: '#999', marginBottom: 2 },
  itemMemo: { fontSize: 12, color: '#666', marginTop: 4 },
  // ★ 日付表示のスタイル
  itemDate: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#007aff', // 青色で日付を強調
    marginBottom: 4,
  },
  deleteButton: { marginLeft: 10, padding: 5 },
  deleteButtonText: { fontSize: 20, color: '#aaa' }
});

export default App;