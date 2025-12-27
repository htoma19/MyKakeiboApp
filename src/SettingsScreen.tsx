import React, { useState } from 'react';
import { View, StyleSheet, ScrollView, Alert } from 'react-native';
// useTheme を追加
import { Card, Title, TextInput, Button, List, IconButton, Divider, useTheme } from 'react-native-paper';

interface SettingsScreenProps {
  categories: string[];
  onAddCategory: (category: string) => void;
  onDeleteCategory: (category: string) => void;
}

const SettingsScreen: React.FC<SettingsScreenProps> = ({ categories, onAddCategory, onDeleteCategory }) => {
  const theme = useTheme(); // ★ テーマ取得
  const [newCategory, setNewCategory] = useState('');

  const handleAdd = () => {
    if (newCategory.trim() === '') {
      Alert.alert('エラー', 'カテゴリ名を入力してください');
      return;
    }
    if (categories.includes(newCategory.trim())) {
        Alert.alert('エラー', 'そのカテゴリは既に存在します');
        return;
    }
    onAddCategory(newCategory.trim());
    setNewCategory('');
  };

  const handleDelete = (category: string) => {
      Alert.alert(
          '削除の確認',
          `「${category}」を削除しますか？\n(過去の履歴データは残ります)`,
          [
              { text: 'キャンセル', style: 'cancel' },
              { text: '削除', style: 'destructive', onPress: () => onDeleteCategory(category) }
          ]
      );
  };

  return (
    // 背景色設定
    <ScrollView style={[styles.container, { backgroundColor: theme.colors.background }]}>
      {/* タイトル色設定 */}
      <Title style={[styles.pageTitle, { color: theme.colors.onBackground }]}>⚙️ 設定</Title>

      <Card style={styles.card}>
        <Card.Title title="カテゴリの追加" titleStyle={{ color: theme.colors.onSurface }} />
        <Card.Content>
          <View style={styles.inputContainer}>
            <TextInput
              mode="outlined"
              label="新しいカテゴリ"
              value={newCategory}
              onChangeText={setNewCategory}
              // 入力欄の色設定
              style={[styles.input, { backgroundColor: theme.colors.surface }]}
            />
            <Button mode="contained" onPress={handleAdd} style={styles.addButton} icon="plus">
              追加
            </Button>
          </View>
        </Card.Content>
      </Card>

      <Card style={styles.card}>
        <Card.Title 
            title="カテゴリ一覧" 
            subtitle="削除ボタンで削除できます"
            titleStyle={{ color: theme.colors.onSurface }}
            subtitleStyle={{ color: theme.colors.onSurfaceVariant }}
        />
        <Card.Content>
            {categories.map((cat, index) => (
                <View key={cat}>
                    <List.Item
                        title={cat}
                        titleStyle={{ color: theme.colors.onSurface }} // リスト文字色
                        right={props => (
                            <IconButton 
                                {...props} 
                                icon="delete" 
                                iconColor={theme.colors.error} 
                                onPress={() => handleDelete(cat)} 
                            />
                        )}
                    />
                    {index < categories.length - 1 && <Divider />}
                </View>
            ))}
        </Card.Content>
      </Card>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 10,
  },
  pageTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    textAlign: 'center',
    marginVertical: 15,
  },
  card: {
    marginBottom: 20,
    elevation: 2,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  input: {
    flex: 1,
    marginRight: 10,
  },
  addButton: {
    height: 50,
    justifyContent: 'center',
  },
});

export default SettingsScreen;