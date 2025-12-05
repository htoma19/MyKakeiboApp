import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ScrollView,
} from 'react-native';

// ★ react-native-paper からコンポーネントをインポート
import { Card, Title, List, IconButton } from 'react-native-paper'; 
import { Calendar } from 'react-native-calendars';

// 親（App.tsx）から受け取るpropsの型を定義
interface HistoryScreenProps {
    expenses: Expense[];
    onDeleteExpense: (id: string) => void;
}

// データ型を定義 (App.tsxと合わせる)
interface Expense {
    id: string;
    amount: number;
    category: string;
    memo: string;
    date: string; // 'YYYY-MM-DD'
}

// 日付を 'YYYY-MM-DD' 形式に整形するヘルパー関数
const formatDate = (date: Date) => {
    return date.toISOString().split('T')[0];
};

// カテゴリに応じたアイコン名を取得するヘルパー関数
const getCategoryIcon = (category: string) => {
    const lowerCat = category.toLowerCase();
    if (lowerCat.includes('食')) return 'food';
    if (lowerCat.includes('交通') || lowerCat.includes('バス') || lowerCat.includes('電車')) return 'train';
    if (lowerCat.includes('娯楽') || lowerCat.includes('趣味')) return 'gamepad-variant';
    if (lowerCat.includes('日用品')) return 'basket';
    if (lowerCat.includes('通信')) return 'phone';
    if (lowerCat.includes('家賃')) return 'home';
    return 'cash-multiple'; // デフォルト
}


const HistoryScreen: React.FC<HistoryScreenProps> = ({ expenses, onDeleteExpense }) => {
    // 選択された日付を保持するState
    const [selectedDate, setSelectedDate] = useState(formatDate(new Date()));

    // ★ 1. カレンダーのマーキングデータと合計値を計算するロジック
    const { markedDates, totalByDate } = useMemo(() => {
        const marked: { [key: string]: any } = {};
        const totals: { [key: string]: number } = {};

        expenses.forEach(expense => {
            const dateStr = expense.date;
            totals[dateStr] = (totals[dateStr] || 0) + expense.amount;
        });

        Object.keys(totals).forEach(dateStr => {
            marked[dateStr] = {
                marked: true,
                dotColor: totals[dateStr] > 5000 ? '#d9534f' : '#007aff',
            };
        });

        // 選択された日付のスタイルを設定
        marked[selectedDate] = {
            ...(marked[selectedDate] || {}),
            selected: true,
            selectedColor: '#3498db',
            selectedTextColor: 'white',
        };
        
        return { markedDates: marked, totalByDate: totals };
    }, [expenses, selectedDate]);


    // ★ 2. 選択された日の支出リストをフィルタリング
    const dailyExpenses = useMemo(() => {
        return expenses.filter(expense => expense.date === selectedDate);
    }, [expenses, selectedDate]);

    // 削除ボタンの処理
    const handleDelete = (id: string) => {
        Alert.alert(
            '削除の確認', 
            'この支出を削除しますか？', 
            [
                { text: 'キャンセル', style: 'cancel' },
                { text: '削除', style: 'destructive', onPress: () => {
                    onDeleteExpense(id);
                }},
            ]
        );
    };

    // リストの各行を描画する関数 (モダンUIに変更)
    const renderItem = ({ item }: { item: Expense }) => (
    <Card style={styles.listItemCard}>
        {/* ★ List.Item を使用 */}
        <List.Item
            title={`${item.amount.toLocaleString()} 円`}
            titleStyle={styles.itemAmount}
            description={item.memo ? `${item.category} / ${item.memo}` : item.category}
            descriptionStyle={styles.itemDescription}
            // List.Icon を使用することで、型の問題を解決
            left={props => (
                <List.Icon 
                    {...props} 
                    icon={getCategoryIcon(item.category)}
                    color="#3498db"
                    style={{ justifyContent: 'center' }} // アイコンを中央寄せ
                />
            )}
            right={() => (
                <IconButton
                    icon="delete"
                    color="#aaa"
                    size={24}
                    onPress={() => handleDelete(item.id)}
                />
            )}
        />
    </Card>
);

    return (
        <View style={styles.container}>
            {/* --- 1. カレンダー表示エリア --- */}
            <View style={styles.calendarContainer}>
                <Calendar
                    onDayPress={day => {
                        setSelectedDate(day.dateString);
                    }}
                    //markingType={'null'} 
                    markedDates={markedDates}
                    theme={{
                        todayTextColor: '#e67e22', 
                        selectedDayBackgroundColor: '#3498db',
                        selectedDayTextColor: 'white',
                        arrowColor: '#3498db',
                    }}
                />
            </View>

            {/* --- 2. 選択日別の合計値とリスト --- */}
            <View style={styles.listSection}>
                <Title style={styles.dailyTitle}>{selectedDate} の支出</Title>
                <Text style={styles.dailyTotal}>
                    合計: {totalByDate[selectedDate] ? totalByDate[selectedDate].toLocaleString() : 0} 円
                </Text>

                {dailyExpenses.length > 0 ? (
                    <FlatList
                        data={dailyExpenses}
                        renderItem={renderItem}
                        keyExtractor={item => item.id}
                        style={styles.list}
                        contentContainerStyle={styles.listContent}
                    />
                ) : (
                    <Text style={styles.noDataText}>この日の支出記録はありません。</Text>
                )}
            </View>
        </View>
    );
};

// スタイル (モダンUIに合わせて調整)
const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f5f5f5',
    },
    calendarContainer: {
        backgroundColor: 'white',
        borderBottomWidth: 1,
        borderBottomColor: '#eee',
        marginBottom: 10,
    },
    listSection: {
        flex: 1,
        paddingHorizontal: 15,
    },
    dailyTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#333',
        marginTop: 5,
        marginBottom: 5,
    },
    dailyTotal: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#d9534f',
        marginBottom: 10,
        borderBottomWidth: 1,
        borderBottomColor: '#ddd',
        paddingBottom: 10,
    },
    noDataText: {
        textAlign: 'center',
        marginTop: 20,
        color: '#999',
    },
    list: {
        flex: 1,
    },
    listContent: {
        paddingBottom: 20,
    },
    // ★ リストアイテムのモダンなスタイル
    listItemCard: {
        marginBottom: 8,
        elevation: 2, // 影をつける
    },
    itemAmount: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#d9534f', // 支出カラー
        marginTop: -5,
    },
    itemDescription: {
        fontSize: 12,
        color: '#666',
    },
    iconContainer: {
        justifyContent: 'center',
        alignItems: 'center',
        paddingRight: 10,
    }
});

export default HistoryScreen;