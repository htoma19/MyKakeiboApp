import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  ScrollView,
  Alert, // Alertをインポート
} from 'react-native';

// react-native-paper からモダンなコンポーネントをインポート
import { Card, Title, Paragraph, Button, TextInput, ProgressBar } from 'react-native-paper';

import { PieChart } from 'react-native-chart-kit'; 

const screenWidth = Dimensions.get('window').width;

// 親（App.tsx）から受け取るpropsの型を定義
interface Budget {
    category: string;
    amount: number; // 月間予算額
}
interface AnalysisScreenProps {
    expenses: Expense[];
    budgets: Budget[];
    onSetBudget: (budget: Budget) => void;
}

// データ型を定義 (App.tsxと合わせる)
interface Expense {
    id: string;
    amount: number;
    category: string;
    memo: string;
    date: string;
}

// ランダムな色を生成するヘルパー関数
const randomColor = () => `#${Math.floor(Math.random() * 16777215).toString(16).padStart(6, '0')}`;

const AnalysisScreen: React.FC<AnalysisScreenProps> = ({ expenses, budgets, onSetBudget }) => {
    // 予算設定フォームのState
    const [budgetCategory, setBudgetCategory] = useState('');
    const [budgetAmountInput, setBudgetAmountInput] = useState('');

    // 現在の年と月を取得
    const currentYearMonth = useMemo(() => {
        const now = new Date();
        // 'YYYY-MM' 形式
        return `${now.getFullYear()}-${(now.getMonth() + 1).toString().padStart(2, '0')}`;
    }, []);


    // 月次分析ロジック (今月のデータだけを計算)
    const monthlyAnalysis = useMemo(() => {
        const totals: { [key: string]: number } = {};
        let monthlyTotal = 0;

        // 今月の支出だけをフィルタリング
        const monthlyExpenses = expenses.filter(expense => 
            expense.date.startsWith(currentYearMonth)
        );

        monthlyExpenses.forEach(expense => {
            const cat = expense.category || '未分類';
            totals[cat] = (totals[cat] || 0) + expense.amount;
            monthlyTotal += expense.amount;
        });

        // グラフ表示用にデータを整形
        const chartData = Object.keys(totals).map((cat) => {
            return {
                name: cat,
                population: totals[cat],
                color: randomColor(),
                legendFontColor: '#7F7F7F',
                legendFontSize: 14,
            };
        });
        
        return { chartData, monthlyTotal, categoryTotals: totals };
    }, [expenses, currentYearMonth]);

    const { chartData, monthlyTotal, categoryTotals } = monthlyAnalysis;


    // 予算設定ボタンのハンドラ
    const handleSetBudget = () => {
        const numAmount = parseInt(budgetAmountInput, 10);
        if (isNaN(numAmount) || numAmount <= 0 || budgetCategory.trim() === '') {
            Alert.alert('エラー', '有効なカテゴリと金額を入力してください！');
            return;
        }

        onSetBudget({ 
            category: budgetCategory.trim(), 
            amount: numAmount 
        });

        // 設定後、フォームをリセット
        setBudgetCategory('');
        setBudgetAmountInput('');
    };

    // 進捗バーの表示コンポーネント
    const renderBudgetProgress = (budget: Budget) => {
        const spent = categoryTotals[budget.category] || 0;
        const progress = budget.amount > 0 ? spent / budget.amount : 0;
        const progressColor = progress > 1 ? 'red' : progress > 0.8 ? 'orange' : '#4CAF50';
        const remaining = budget.amount - spent;
        
        return (
            <Card key={budget.category} style={styles.budgetCard}>
                <Card.Content>
                    <View style={styles.budgetHeader}>
                        <Text style={styles.budgetCatTitle}>{budget.category} 予算</Text>
                        <Text style={[styles.remainingText, { color: remaining < 0 ? 'red' : 'green' }]}>
                            残 {remaining.toLocaleString()} 円
                        </Text>
                    </View>
                    <ProgressBar 
                        progress={progress} 
                        color={progressColor} 
                        style={styles.progressBar} 
                    />
                    <View style={styles.progressDetail}>
                        <Text style={styles.progressText}>使用: {spent.toLocaleString()} 円</Text>
                        <Text style={styles.progressText}>予算: {budget.amount.toLocaleString()} 円</Text>
                    </View>
                </Card.Content>
            </Card>
        );
    };

    return (
        <ScrollView contentContainerStyle={styles.scrollContent}>
            <View style={styles.container}>
                <Title style={styles.pageTitle}>💸 {currentYearMonth} の支出分析</Title>
                
                {/* ==================================== */}
                {/* 1. 月次予算設定エリア */}
                {/* ==================================== */}
                <Card style={styles.inputCard}>
                    <Card.Title title="カテゴリ別 予算設定" subtitle="目標を設定して使いすぎを防止" />
                    <Card.Content>
                        <TextInput
                            label="カテゴリ名"
                            value={budgetCategory}
                            onChangeText={setBudgetCategory}
                            mode="outlined"
                            style={styles.textInput}
                        />
                        <TextInput
                            label="月間予算額 (円)"
                            value={budgetAmountInput}
                            onChangeText={setBudgetAmountInput}
                            keyboardType="numeric"
                            mode="outlined"
                            style={styles.textInput}
                        />
                        <Button 
                            mode="contained" 
                            onPress={handleSetBudget} 
                            style={styles.budgetButton}
                            icon="content-save"
                        >
                            予算を保存
                        </Button>
                    </Card.Content>
                </Card>

                {/* ==================================== */}
                {/* 2. 予算進捗ナビゲーターエリア */}
                {/* ==================================== */}
                <Title style={styles.sectionTitle}>🎯 予算進捗ナビゲーター</Title>
                {budgets.length > 0 ? (
                    budgets.map(renderBudgetProgress)
                ) : (
                    <Card style={styles.infoCard}><Card.Content><Text style={styles.noBudgetText}>先に予算を設定してください。</Text></Card.Content></Card>
                )}


                {/* ==================================== */}
                {/* 3. 月次分析 (グラフ)                  */}
                {/* ==================================== */}
                <Title style={styles.sectionTitle}>📊 {currentYearMonth} のカテゴリ分析</Title>
                <Card style={styles.chartCard}>
                    <Card.Content>
                        <Title style={styles.chartCardTitle}>合計支出: {monthlyTotal.toLocaleString()}円</Title>
                        
                        {monthlyTotal > 0 ? (
                            <PieChart
                                data={chartData}
                                width={screenWidth - 80}
                                height={220}
                                chartConfig={{
                                    color: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
                                }}
                                accessor={"population"}
                                backgroundColor={"transparent"}
                                paddingLeft={"0"}
                                center={[0, 0]}
                            />
                        ) : (
                            <Paragraph style={styles.noDataText}>今月の支出データがありません。</Paragraph>
                        )}
                    </Card.Content>
                </Card>

            </View>
        </ScrollView>
    );
};

// スタイル
const styles = StyleSheet.create({
    scrollContent: {
        paddingBottom: 50,
        paddingHorizontal: 10,
    },
    container: {
        flex: 1,
    },
    pageTitle: {
        fontSize: 26,
        fontWeight: 'bold',
        textAlign: 'center',
        marginVertical: 20,
        color: '#1a1a1a',
    },
    sectionTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        marginTop: 20,
        marginBottom: 10,
        paddingHorizontal: 10,
        color: '#333',
    },
    inputCard: {
        marginHorizontal: 10,
        marginBottom: 20,
        elevation: 4,
    },
    textInput: {
        marginBottom: 10,
        backgroundColor: 'white',
    },
    budgetButton: {
        marginTop: 10,
        paddingVertical: 4,
    },
    chartCard: {
        marginHorizontal: 10,
        marginBottom: 20,
        alignItems: 'center',
        elevation: 4,
    },
    chartCardTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        textAlign: 'center',
        marginTop: 5,
        marginBottom: 10,
    },
    noDataText: {
        textAlign: 'center',
        paddingVertical: 20,
        color: '#999',
    },
    budgetCard: {
        marginHorizontal: 10,
        marginBottom: 10,
        elevation: 2,
    },
    budgetHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 8,
    },
    budgetCatTitle: {
        fontSize: 16,
        fontWeight: '600',
    },
    remainingText: {
        fontSize: 16,
        fontWeight: 'bold',
    },
    progressBar: {
        height: 10,
        borderRadius: 5,
        marginBottom: 8,
    },
    progressDetail: {
        flexDirection: 'row',
        justifyContent: 'space-between',
    },
    progressText: {
        fontSize: 12,
        color: '#666',
    },
    infoCard: {
        marginHorizontal: 10,
    },
    noBudgetText: {
        textAlign: 'center',
        color: '#999',
    }
});

export default AnalysisScreen;