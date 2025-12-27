import 'react-native-gesture-handler';
import React, { useState, useCallback, useEffect } from 'react'; 
import { SafeAreaView, StatusBar, StyleSheet, View, Text, Platform } from 'react-native';

// AsyncStorage をインポート
import AsyncStorage from '@react-native-async-storage/async-storage'; 

// UI関連のインポート
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Provider as PaperProvider, DefaultTheme, ActivityIndicator } from 'react-native-paper'; 
import Icon from 'react-native-vector-icons/MaterialCommunityIcons'; 

import InputScreen from './src/InputScreen';
import HistoryScreen from './src/HistoryScreen';
import AnalysisScreen from './src/AnalysisScreen';
import SettingsScreen from './src/SettingsScreen';

// データ型を定義
interface Expense {
  id: string;
  amount: number;
  category: string;
  memo: string;
  date: string;
}

interface Budget {
  category: string;
  amount: number;
}

// データ保存キー
const EXPENSES_KEY = '@MyKakeiboApp:expenses';
const BUDGETS_KEY = '@MyKakeiboApp:budgets';
const CATEGORIES_KEY = '@MyKakeiboApp:categories';

// デフォルトのカテゴリリスト
const DEFAULT_CATEGORIES = [
    '食費', '交通費', '日用品', '娯楽', '交際費', '自己投資', '住居費', '未分類'
];

const theme = {
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors,
    primary: '#3498db',
    accent: '#e74c3c',
  },
};

const Tab = createBottomTabNavigator();

const App = () => {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [categories, setCategories] = useState<string[]>(DEFAULT_CATEGORIES);
  const [isLoading, setIsLoading] = useState(true); 

  // ====================================
  // 1. データの永続化ロジック
  // ====================================

  useEffect(() => {
    const loadData = async () => {
      try {
        const storedExpenses = await AsyncStorage.getItem(EXPENSES_KEY);
        const storedBudgets = await AsyncStorage.getItem(BUDGETS_KEY);
        const storedCategories = await AsyncStorage.getItem(CATEGORIES_KEY);

        if (storedExpenses) setExpenses(JSON.parse(storedExpenses));
        if (storedBudgets) setBudgets(JSON.parse(storedBudgets));
        if (storedCategories) setCategories(JSON.parse(storedCategories));
      } catch (e) {
        console.error('Failed to load data', e);
      } finally {
        setIsLoading(false);
      }
    };
    loadData();
  }, []);

  useEffect(() => {
    if (!isLoading) {
        AsyncStorage.setItem(EXPENSES_KEY, JSON.stringify(expenses)).catch(e => console.error(e));
        AsyncStorage.setItem(BUDGETS_KEY, JSON.stringify(budgets)).catch(e => console.error(e));
        AsyncStorage.setItem(CATEGORIES_KEY, JSON.stringify(categories)).catch(e => console.error(e));
    }
  }, [expenses, budgets, categories, isLoading]);


  // ====================================
  // 2. コールバック関数
  // ====================================

  const handleAddExpense = useCallback((expense: { amount: number; category: string; memo: string, date: Date }) => {
    const newExpense: Expense = {
      id: Date.now().toString(),
      amount: expense.amount,
      category: expense.category,
      memo: expense.memo,
      date: expense.date.toISOString().split('T')[0],
    };
    setExpenses(prev => [newExpense, ...prev].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()));
  }, []);

  // ★ 追加：データの更新機能
  const handleUpdateExpense = useCallback((updatedExpense: Expense) => {
    setExpenses(prev => prev.map(e => e.id === updatedExpense.id ? updatedExpense : e));
  }, []);

  const handleDeleteExpense = useCallback((id: string) => {
    setExpenses(prev => prev.filter(e => e.id !== id));
  }, []);

  const handleSetBudget = useCallback((budget: Budget) => {
    setBudgets(prev => {
      const existingIndex = prev.findIndex(b => b.category === budget.category);
      if (existingIndex > -1) {
        const newBudgets = [...prev];
        newBudgets[existingIndex] = budget;
        return newBudgets;
      } else {
        return [...prev, budget];
      }
    });
  }, []);

  const handleAddCategory = useCallback((category: string) => {
      setCategories(prev => [...prev, category]);
  }, []);

  const handleDeleteCategory = useCallback((category: string) => {
      setCategories(prev => prev.filter(c => c !== category));
  }, []);


  // ====================================
  // 3. 画面描画
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
                let iconName: string = 'circle';
                if (route.name === '登録') iconName = 'cash-register';
                else if (route.name === '分析') iconName = 'chart-pie';
                else if (route.name === '履歴') iconName = 'history';
                else if (route.name === '設定') iconName = 'cog';
                return <Icon name={iconName} size={size} color={color} />;
              },
              tabBarActiveTintColor: theme.colors.primary,
              tabBarInactiveTintColor: 'gray',
              headerShown: false,
            })}
          >
            <Tab.Screen name="登録">
              {props => <InputScreen {...props} onAddExpense={handleAddExpense} categories={categories} />}
            </Tab.Screen>
            <Tab.Screen name="分析">
              {props => <AnalysisScreen {...props} expenses={expenses} budgets={budgets} onSetBudget={handleSetBudget} />}
            </Tab.Screen>
            <Tab.Screen name="履歴">
              {/* ★ onUpdateExpense を渡すように変更 */}
              {props => <HistoryScreen {...props} expenses={expenses} onDeleteExpense={handleDeleteExpense} onUpdateExpense={handleUpdateExpense} />}
            </Tab.Screen>
            <Tab.Screen name="設定">
              {props => <SettingsScreen {...props} categories={categories} onAddCategory={handleAddCategory} onDeleteCategory={handleDeleteCategory} />}
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
    // ✅ 以下の行を追加（Androidの場合のみ、ステータスバーの高さ分だけ下にずらす）
    paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
  }
});

export default App;