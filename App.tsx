import 'react-native-gesture-handler';
import React, { useState, useCallback, useEffect } from 'react'; 
import { SafeAreaView, StatusBar, StyleSheet, View, Text, Platform, useColorScheme } from 'react-native';

import AsyncStorage from '@react-native-async-storage/async-storage'; 

// テーマ関連のインポート
import { NavigationContainer, DarkTheme as NavDarkTheme, DefaultTheme as NavDefaultTheme } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { 
    Provider as PaperProvider, 
    MD3DarkTheme, 
    MD3LightTheme, 
    adaptNavigationTheme,
    ActivityIndicator
} from 'react-native-paper'; 
import Icon from 'react-native-vector-icons/MaterialCommunityIcons'; 

import InputScreen from './src/InputScreen';
import HistoryScreen from './src/HistoryScreen';
import AnalysisScreen from './src/AnalysisScreen';
import SettingsScreen from './src/SettingsScreen';

// NavigationのテーマとPaperのテーマを統合
const { LightTheme, DarkTheme } = adaptNavigationTheme({
    reactNavigationLight: NavDefaultTheme,
    reactNavigationDark: NavDarkTheme,
});

// ★ 修正箇所: fonts プロパティを明示的に指定して上書きを防ぐ
const CustomLightTheme = {
    ...MD3LightTheme,
    ...LightTheme,
    colors: {
        ...MD3LightTheme.colors,
        ...LightTheme.colors,
        primary: '#3498db',
        accent: '#e74c3c',
    },
    fonts: MD3LightTheme.fonts, // これでフォントエラーを防ぎます
};

const CustomDarkTheme = {
    ...MD3DarkTheme,
    ...DarkTheme,
    colors: {
        ...MD3DarkTheme.colors,
        ...DarkTheme.colors,
        primary: '#5dade2',
        accent: '#e74c3c',
    },
    fonts: MD3DarkTheme.fonts, // ダークモードも同様に
};

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

const EXPENSES_KEY = '@MyKakeiboApp:expenses';
const BUDGETS_KEY = '@MyKakeiboApp:budgets';
const CATEGORIES_KEY = '@MyKakeiboApp:categories';

const DEFAULT_CATEGORIES = [
    '食費', '交通費', '日用品', '娯楽', '交際費', '自己投資', '住居費', '未分類'
];

const Tab = createBottomTabNavigator();

const App = () => {
  const colorScheme = useColorScheme();
  const isDarkMode = colorScheme === 'dark';
  
  const theme = isDarkMode ? CustomDarkTheme : CustomLightTheme;

  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [categories, setCategories] = useState<string[]>(DEFAULT_CATEGORIES);
  const [isLoading, setIsLoading] = useState(true); 

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

  if (isLoading) {
    return (
        <View style={[styles.loadingContainer, { backgroundColor: theme.colors.background }]}>
            <ActivityIndicator size="large" color={theme.colors.primary} />
            <Text style={{ marginTop: 10, color: theme.colors.onBackground }}>データを読み込み中...</Text>
        </View>
    );
  }

  return (
    <PaperProvider theme={theme}>
      <StatusBar 
        barStyle={isDarkMode ? "light-content" : "dark-content"} 
        backgroundColor={theme.colors.background} 
      />
      <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background, paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0 }]}>
        <NavigationContainer theme={theme}>
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
              tabBarStyle: {
                  backgroundColor: theme.colors.elevation.level2,
                  borderTopColor: theme.colors.outline,
              }
            })}
          >
            <Tab.Screen name="登録">
              {props => <InputScreen {...props} onAddExpense={handleAddExpense} categories={categories} />}
            </Tab.Screen>
            <Tab.Screen name="分析">
              {props => <AnalysisScreen {...props} expenses={expenses} budgets={budgets} onSetBudget={handleSetBudget} />}
            </Tab.Screen>
            <Tab.Screen name="履歴">
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
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  }
});

export default App;