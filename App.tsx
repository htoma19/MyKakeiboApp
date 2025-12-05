import 'react-native-gesture-handler';
import React, { useState, useCallback, useEffect } from 'react'; // ★ useEffect を追加
import { SafeAreaView, StatusBar, StyleSheet, View, Text } from 'react-native';

// ★ AsyncStorage をインポート
import AsyncStorage from '@react-native-async-storage/async-storage'; 

// UI関連のインポート (ActivityIndicator を追加)
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Provider as PaperProvider, DefaultTheme, ActivityIndicator } from 'react-native-paper'; 
import Icon from 'react-native-vector-icons/MaterialCommunityIcons'; // MaterialCommunityIcons を使用
//import Icon from 'react-native-vector-icons/MaterialIcons';

import InputScreen from './src/InputScreen';
import HistoryScreen from './src/HistoryScreen';
import AnalysisScreen from './src/AnalysisScreen';

// データ型を定義
interface Expense {
  id: string;
  amount: number;
  category: string;
  memo: string;
  date: string; // YYYY-MM-DD 形式で保存
}

interface Budget {
  category: string;
  amount: number;
}

// データ保存キー
const EXPENSES_KEY = '@MyKakeiboApp:expenses';
const BUDGETS_KEY = '@MyKakeiboApp:budgets';

// テーマを定義 (react-native-paper)
const theme = {
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors,
    primary: '#3498db', // メインカラー (青)
    accent: '#e74c3c',  // アクセントカラー (赤)
  },
};

const Tab = createBottomTabNavigator();

const App = () => {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [isLoading, setIsLoading] = useState(true); // ★ 読み込み状態

  // ====================================
  // ★ 1. データの永続化ロジック
  // ====================================

  // 初期データの読み込み
  useEffect(() => {
    const loadData = async () => {
      try {
        const storedExpenses = await AsyncStorage.getItem(EXPENSES_KEY);
        const storedBudgets = await AsyncStorage.getItem(BUDGETS_KEY);

        if (storedExpenses) {
          // Date型ではなく文字列のまま保存されているので、そのままパース
          setExpenses(JSON.parse(storedExpenses));
        }
        if (storedBudgets) {
          setBudgets(JSON.parse(storedBudgets));
        }
      } catch (e) {
        console.error('Failed to load data from storage', e);
      } finally {
        setIsLoading(false); // 読み込み完了
      }
    };
    loadData();
  }, []);

  // expenses の変更を検知して保存
  useEffect(() => {
    const saveExpenses = async () => {
      if (expenses.length > 0 || !isLoading) { // 初回ロード完了後、またはデータがある場合に保存
        try {
          await AsyncStorage.setItem(EXPENSES_KEY, JSON.stringify(expenses));
        } catch (e) {
          console.error('Failed to save expenses', e);
        }
      }
    };
    saveExpenses();
  }, [expenses, isLoading]);

  // budgets の変更を検知して保存
  useEffect(() => {
    const saveBudgets = async () => {
      if (budgets.length > 0 || !isLoading) { // 初回ロード完了後、またはデータがある場合に保存
        try {
          await AsyncStorage.setItem(BUDGETS_KEY, JSON.stringify(budgets));
        } catch (e) {
          console.error('Failed to save budgets', e);
        }
      }
    };
    saveBudgets();
  }, [budgets, isLoading]);


  // ====================================
  // 2. コールバック関数
  // ====================================

  const handleAddExpense = useCallback((expense: { amount: number; category: string; memo: string, date: Date }) => {
    const newExpense: Expense = {
      id: Date.now().toString(),
      amount: expense.amount,
      category: expense.category,
      memo: expense.memo,
      date: expense.date.toISOString().split('T')[0], // YYYY-MM-DD 形式
    };
    setExpenses(prev => [newExpense, ...prev].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()));
  }, []);

  const handleDeleteExpense = useCallback((id: string) => {
    setExpenses(prev => prev.filter(e => e.id !== id));
  }, []);

  const handleSetBudget = useCallback((budget: Budget) => {
    setBudgets(prev => {
      const existingIndex = prev.findIndex(b => b.category === budget.category);
      if (existingIndex > -1) {
        // 更新
        const newBudgets = [...prev];
        newBudgets[existingIndex] = budget;
        return newBudgets;
      } else {
        // 新規追加
        return [...prev, budget];
      }
    });
  }, []);

  // ====================================
  // 3. 画面描画 (ローディング画面)
  // ====================================
  if (isLoading) {
    return (
        <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={theme.colors.primary} />
            <Text style={{ marginTop: 10 }}>データを読み込み中...</Text>
        </View>
    );
  }

  return (
    <PaperProvider theme={theme}>
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle="light-content" backgroundColor="#3498db" />
        <NavigationContainer>
          <Tab.Navigator
            screenOptions={({ route }) => ({
              tabBarIcon: ({ color, size }) => {
                let iconName: string;
                if (route.name === '登録') {
                  iconName = 'cash-register';
                } else if (route.name === '分析') {
                  iconName = 'chart-pie';
                } else {
                  iconName = 'history';
                }
                return <Icon name={iconName} size={size} color={color} />;
              },
              tabBarActiveTintColor: theme.colors.primary,
              tabBarInactiveTintColor: 'gray',
              headerShown: false,
            })}
          >
            <Tab.Screen name="登録">
              {props => <InputScreen {...props} onAddExpense={handleAddExpense} />}
            </Tab.Screen>
            <Tab.Screen name="分析">
              {props => <AnalysisScreen {...props} expenses={expenses} budgets={budgets} onSetBudget={handleSetBudget} />}
            </Tab.Screen>
            <Tab.Screen name="履歴">
              {props => <HistoryScreen {...props} expenses={expenses} onDeleteExpense={handleDeleteExpense} />}
            </Tab.Screen>
          </Tab.Navigator>
        </NavigationContainer>
      </SafeAreaView>
    </PaperProvider>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
  }
});

export default App;