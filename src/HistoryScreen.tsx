import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  Alert,
  Keyboard,
  TouchableWithoutFeedback
} from 'react-native';

// Dialog, Portal, TextInput, Button を追加インポート
import { Card, Title, List, IconButton, Searchbar, Dialog, Portal, TextInput, Button } from 'react-native-paper'; 
import { Calendar, LocaleConfig } from 'react-native-calendars';

LocaleConfig.locales['jp'] = {
  monthNames: ['1月', '2月', '3月', '4月', '5月', '6月', '7月', '8月', '9月', '10月', '11月', '12月'],
  monthNamesShort: ['1月', '2月', '3月', '4月', '5月', '6月', '7月', '8月', '9月', '10月', '11月', '12月'],
  dayNames: ['日曜日', '月曜日', '火曜日', '水曜日', '木曜日', '金曜日', '土曜日'],
  dayNamesShort: ['日', '月', '火', '水', '木', '金', '土'],
};
LocaleConfig.defaultLocale = 'jp';

interface HistoryScreenProps {
    expenses: Expense[];
    onDeleteExpense: (id: string) => void;
    onUpdateExpense: (expense: Expense) => void; // ★ 更新用の関数を受け取る
}

interface Expense {
    id: string;
    amount: number;
    category: string;
    memo: string;
    date: string; // 'YYYY-MM-DD'
}

const formatDate = (date: Date) => {
    return date.toISOString().split('T')[0];
};

const getCategoryIcon = (category: string) => {
    const lowerCat = category.toLowerCase();
    if (lowerCat.includes('食')) return 'food';
    if (lowerCat.includes('交通') || lowerCat.includes('バス') || lowerCat.includes('電車')) return 'train';
    if (lowerCat.includes('娯楽') || lowerCat.includes('趣味')) return 'gamepad-variant';
    if (lowerCat.includes('日用品')) return 'basket';
    if (lowerCat.includes('通信')) return 'phone';
    if (lowerCat.includes('家賃') || lowerCat.includes('住')) return 'home';
    return 'cash-multiple';
}

const HistoryScreen: React.FC<HistoryScreenProps> = ({ expenses, onDeleteExpense, onUpdateExpense }) => {
    const [selectedDate, setSelectedDate] = useState(formatDate(new Date()));
    const [searchQuery, setSearchQuery] = useState('');
    
    // ★ 編集ダイアログ用のState
    const [visible, setVisible] = useState(false);
    const [editId, setEditId] = useState('');
    const [editAmount, setEditAmount] = useState('');
    const [editMemo, setEditMemo] = useState('');
    const [editCategory, setEditCategory] = useState(''); // 表示用（変更不可にしておくか、簡易編集にするか）
    const [editDate, setEditDate] = useState('');

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

        marked[selectedDate] = {
            ...(marked[selectedDate] || {}),
            selected: true,
            selectedColor: '#3498db',
            selectedTextColor: 'white',
        };
        
        return { markedDates: marked, totalByDate: totals };
    }, [expenses, selectedDate]);

    const dailyExpenses = useMemo(() => {
        return expenses.filter(expense => expense.date === selectedDate);
    }, [expenses, selectedDate]);

    const filteredExpenses = useMemo(() => {
        if (!searchQuery) return [];
        const query = searchQuery.toLowerCase();
        return expenses.filter(expense => 
            expense.category.toLowerCase().includes(query) || 
            expense.memo.toLowerCase().includes(query)
        );
    }, [expenses, searchQuery]);


    const handleDelete = (id: string) => {
        Alert.alert(
            '削除の確認', 
            'この支出を削除しますか？', 
            [
                { text: 'キャンセル', style: 'cancel' },
                { text: '削除', style: 'destructive', onPress: () => onDeleteExpense(id) },
            ]
        );
    };

    // ★ 編集ボタンが押された時の処理
    const handleEdit = (item: Expense) => {
        setEditId(item.id);
        setEditAmount(item.amount.toString());
        setEditMemo(item.memo);
        setEditCategory(item.category);
        setEditDate(item.date);
        setVisible(true);
    };

    // ★ 保存処理
    const handleSave = () => {
        const amount = parseInt(editAmount, 10);
        if (isNaN(amount) || amount <= 0) {
            Alert.alert('エラー', '正しい金額を入力してください');
            return;
        }

        onUpdateExpense({
            id: editId,
            amount: amount,
            category: editCategory, // 今回はカテゴリ変更なし（必要ならPickerを追加）
            memo: editMemo,
            date: editDate
        });

        setVisible(false);
    };

    const renderItem = ({ item }: { item: Expense }) => (
        <Card style={styles.listItemCard}>
            <List.Item
                title={`${item.amount.toLocaleString()} 円`}
                titleStyle={styles.itemAmount}
                description={`${item.date} | ${item.category}${item.memo ? ' / ' + item.memo : ''}`}
                descriptionStyle={styles.itemDescription}
                left={(props) => (
                    <List.Icon 
                        icon={getCategoryIcon(item.category)}
                        color="#3498db"
                        style={props.style} 
                    />
                )}
                right={() => (
                    <IconButton
                        icon="delete"
                        iconColor="#aaa"
                        size={24}
                        onPress={() => handleDelete(item.id)}
                    />
                )}
                // ★ タップしたら編集画面へ
                onPress={() => handleEdit(item)}
            />
        </Card>
    );

    return (
        <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
            <View style={styles.container}>
                
                <View style={styles.searchContainer}>
                    <Searchbar
                        placeholder="カテゴリやメモで検索"
                        onChangeText={setSearchQuery}
                        value={searchQuery}
                        style={styles.searchBar}
                        inputStyle={{ fontSize: 16 }}
                        elevation={2}
                    />
                </View>

                {searchQuery.length > 0 ? (
                    <View style={styles.listSection}>
                        <Title style={styles.sectionTitle}>🔍 "{searchQuery}" の検索結果</Title>
                        {filteredExpenses.length > 0 ? (
                            <FlatList
                                data={filteredExpenses}
                                renderItem={renderItem}
                                keyExtractor={item => item.id}
                                contentContainerStyle={styles.listContent}
                            />
                        ) : (
                            <Text style={styles.noDataText}>見つかりませんでした。</Text>
                        )}
                    </View>
                ) : (
                    <>
                        <View style={styles.calendarContainer}>
                            <Calendar
                                onDayPress={day => setSelectedDate(day.dateString)}
                                markingType={'simple'} 
                                markedDates={markedDates}
                                theme={{
                                    todayTextColor: '#e67e22', 
                                    selectedDayBackgroundColor: '#3498db',
                                    selectedDayTextColor: 'white',
                                    arrowColor: '#3498db',
                                    textMonthFontWeight: 'bold',
                                    textDayHeaderFontWeight: 'bold',
                                }}
                            />
                        </View>

                        <View style={styles.listSection}>
                            <Title style={styles.sectionTitle}>{selectedDate} の支出</Title>
                            <Text style={styles.dailyTotal}>
                                合計: {totalByDate[selectedDate] ? totalByDate[selectedDate].toLocaleString() : 0} 円
                            </Text>

                            {dailyExpenses.length > 0 ? (
                                <FlatList
                                    data={dailyExpenses}
                                    renderItem={renderItem}
                                    keyExtractor={item => item.id}
                                    contentContainerStyle={styles.listContent}
                                />
                            ) : (
                                <Text style={styles.noDataText}>この日の支出記録はありません。</Text>
                            )}
                        </View>
                    </>
                )}

                {/* ★ 編集用ダイアログ */}
                <Portal>
                    <Dialog visible={visible} onDismiss={() => setVisible(false)}>
                        <Dialog.Title>支出の編集</Dialog.Title>
                        <Dialog.Content>
                            <Text style={{marginBottom: 10, color: '#666'}}>カテゴリ: {editCategory}</Text>
                            <TextInput
                                label="金額"
                                value={editAmount}
                                onChangeText={setEditAmount}
                                keyboardType="numeric"
                                mode="outlined"
                                style={styles.dialogInput}
                            />
                            <TextInput
                                label="メモ"
                                value={editMemo}
                                onChangeText={setEditMemo}
                                mode="outlined"
                                style={styles.dialogInput}
                            />
                        </Dialog.Content>
                        <Dialog.Actions>
                            <Button onPress={() => setVisible(false)}>キャンセル</Button>
                            <Button onPress={handleSave} mode="contained" style={{marginLeft: 10}}>保存</Button>
                        </Dialog.Actions>
                    </Dialog>
                </Portal>

            </View>
        </TouchableWithoutFeedback>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f5f5f5',
    },
    searchContainer: {
        padding: 10,
        backgroundColor: 'white',
        zIndex: 1,
    },
    searchBar: {
        borderRadius: 8,
        backgroundColor: '#f0f0f0',
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
    sectionTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#333',
        marginTop: 10,
        marginBottom: 5,
    },
    dailyTotal: {
        fontSize: 16,
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
    listContent: {
        paddingBottom: 20,
    },
    listItemCard: {
        marginBottom: 8,
        elevation: 2,
    },
    itemAmount: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#d9534f',
        marginTop: -5,
    },
    itemDescription: {
        fontSize: 12,
        color: '#666',
    },
    dialogInput: {
        marginBottom: 15,
        backgroundColor: 'white',
    }
});

export default HistoryScreen;