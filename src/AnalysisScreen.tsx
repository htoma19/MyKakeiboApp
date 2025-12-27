import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  ScrollView,
  Alert,
} from 'react-native';

// useTheme を追加
import { Card, Title, Paragraph, Button, TextInput, ProgressBar, useTheme } from 'react-native-paper';

import { PieChart } from 'react-native-chart-kit'; 

const screenWidth = Dimensions.get('window').width;

interface Budget {
    category: string;
    amount: number;
}
interface AnalysisScreenProps {
    expenses: Expense[];
    budgets: Budget[];
    onSetBudget: (budget: Budget) => void;
}

interface Expense {
    id: string;
    amount: number;
    category: string;
    memo: string;
    date: string;
}

const randomColor = () => `#${Math.floor(Math.random() * 16777215).toString(16).padStart(6, '0')}`;

const AnalysisScreen: React.FC<AnalysisScreenProps> = ({ expenses, budgets, onSetBudget }) => {
    const theme = useTheme(); // ★ テーマ取得

    const [budgetCategory, setBudgetCategory] = useState('');
    const [budgetAmountInput, setBudgetAmountInput] = useState('');

    const currentYearMonth = useMemo(() => {
        const now = new Date();
        return `${now.getFullYear()}-${(now.getMonth() + 1).toString().padStart(2, '0')}`;
    }, []);

    const monthlyAnalysis = useMemo(() => {
        const totals: { [key: string]: number } = {};
        let monthlyTotal = 0;

        const monthlyExpenses = expenses.filter(expense => 
            expense.date.startsWith(currentYearMonth)
        );

        monthlyExpenses.forEach(expense => {
            const cat = expense.category || '未分類';
            totals[cat] = (totals[cat] || 0) + expense.amount;
            monthlyTotal += expense.amount;
        });

        const chartData = Object.keys(totals).map((cat) => {
            return {
                name: cat,
                population: totals[cat],
                color: randomColor(),
                legendFontColor: theme.colors.onSurface, // ★ グラフの文字色をテーマに合わせる
                legendFontSize: 14,
            };
        });
        
        return { chartData, monthlyTotal, categoryTotals: totals };
    }, [expenses, currentYearMonth, theme]); // themeを依存配列に追加

    const { chartData, monthlyTotal, categoryTotals } = monthlyAnalysis;


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

        setBudgetCategory('');
        setBudgetAmountInput('');
    };

    const renderBudgetProgress = (budget: Budget) => {
        const spent = categoryTotals[budget.category] || 0;
        const progress = budget.amount > 0 ? spent / budget.amount : 0;
        const progressColor = progress > 1 ? theme.colors.error : progress > 0.8 ? 'orange' : '#4CAF50';
        const remaining = budget.amount - spent;
        
        return (
            <Card key={budget.category} style={styles.budgetCard}>
                <Card.Content>
                    <View style={styles.budgetHeader}>
                        <Text style={[styles.budgetCatTitle, { color: theme.colors.onSurface }]}>{budget.category} 予算</Text>
                        <Text style={[styles.remainingText, { color: remaining < 0 ? theme.colors.error : 'green' }]}>
                            残 {remaining.toLocaleString()} 円
                        </Text>
                    </View>
                    <ProgressBar 
                        progress={progress} 
                        color={progressColor} 
                        style={styles.progressBar} 
                    />
                    <View style={styles.progressDetail}>
                        <Text style={[styles.progressText, { color: theme.colors.onSurfaceVariant }]}>使用: {spent.toLocaleString()} 円</Text>
                        <Text style={[styles.progressText, { color: theme.colors.onSurfaceVariant }]}>予算: {budget.amount.toLocaleString()} 円</Text>
                    </View>
                </Card.Content>
            </Card>
        );
    };

    return (
        // 背景色をテーマに合わせる
        <ScrollView contentContainerStyle={[styles.scrollContent, { backgroundColor: theme.colors.background }]}>
            <View style={styles.container}>
                {/* タイトル文字色をテーマに合わせる */}
                <Title style={[styles.pageTitle, { color: theme.colors.onBackground }]}>💸 {currentYearMonth} の支出分析</Title>
                
                <Card style={styles.inputCard}>
                    <Card.Title 
                        title="カテゴリ別 予算設定" 
                        subtitle="目標を設定して使いすぎを防止"
                        titleStyle={{ color: theme.colors.onSurface }}
                        subtitleStyle={{ color: theme.colors.onSurfaceVariant }}
                    />
                    <Card.Content>
                        <TextInput
                            label="カテゴリ名"
                            value={budgetCategory}
                            onChangeText={setBudgetCategory}
                            mode="outlined"
                            style={[styles.textInput, { backgroundColor: theme.colors.surface }]} // 入力欄背景
                        />
                        <TextInput
                            label="月間予算額 (円)"
                            value={budgetAmountInput}
                            onChangeText={setBudgetAmountInput}
                            keyboardType="numeric"
                            mode="outlined"
                            style={[styles.textInput, { backgroundColor: theme.colors.surface }]}
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

                <Title style={[styles.sectionTitle, { color: theme.colors.onBackground }]}>🎯 予算進捗ナビゲーター</Title>
                {budgets.length > 0 ? (
                    budgets.map(renderBudgetProgress)
                ) : (
                    <Card style={styles.infoCard}>
                        <Card.Content>
                            <Text style={[styles.noBudgetText, { color: theme.colors.onSurfaceVariant }]}>先に予算を設定してください。</Text>
                        </Card.Content>
                    </Card>
                )}

                <Title style={[styles.sectionTitle, { color: theme.colors.onBackground }]}>📊 {currentYearMonth} のカテゴリ分析</Title>
                <Card style={styles.chartCard}>
                    <Card.Content>
                        <Title style={[styles.chartCardTitle, { color: theme.colors.onSurface }]}>合計支出: {monthlyTotal.toLocaleString()}円</Title>
                        
                        {monthlyTotal > 0 ? (
                            <PieChart
                                data={chartData}
                                width={screenWidth - 80}
                                height={220}
                                chartConfig={{
                                    color: (opacity = 1) => `rgba(255, 255, 255, ${opacity})`, // チャート設定も調整
                                }}
                                accessor={"population"}
                                backgroundColor={"transparent"}
                                paddingLeft={"0"}
                                center={[0, 0]}
                            />
                        ) : (
                            <Paragraph style={[styles.noDataText, { color: theme.colors.onSurfaceVariant }]}>今月の支出データがありません。</Paragraph>
                        )}
                    </Card.Content>
                </Card>

            </View>
        </ScrollView>
    );
};

const styles = StyleSheet.create({
    scrollContent: {
        paddingBottom: 50,
        paddingHorizontal: 10,
        minHeight: '100%', // 画面いっぱいに背景色を広げる
    },
    container: {
        flex: 1,
    },
    pageTitle: {
        fontSize: 26,
        fontWeight: 'bold',
        textAlign: 'center',
        marginVertical: 20,
    },
    sectionTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        marginTop: 20,
        marginBottom: 10,
        paddingHorizontal: 10,
    },
    inputCard: {
        marginHorizontal: 10,
        marginBottom: 20,
        elevation: 2,
    },
    textInput: {
        marginBottom: 10,
    },
    budgetButton: {
        marginTop: 10,
        paddingVertical: 4,
    },
    chartCard: {
        marginHorizontal: 10,
        marginBottom: 20,
        alignItems: 'center',
        elevation: 2,
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
    },
    infoCard: {
        marginHorizontal: 10,
    },
    noBudgetText: {
        textAlign: 'center',
    }
});

export default AnalysisScreen;