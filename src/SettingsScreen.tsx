import React, { useState } from 'react';
import { View, StyleSheet, ScrollView, Alert } from 'react-native';
import { Card, Title, TextInput, Button, List, IconButton, Divider } from 'react-native-paper';

interface SettingsScreenProps {
  categories: string[];
  onAddCategory: (category: string) => void;
  onDeleteCategory: (category: string) => void;
}

const SettingsScreen: React.FC<SettingsScreenProps> = ({ categories, onAddCategory, onDeleteCategory }) => {
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
      // 誤操作防止の確認アラート
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
    <ScrollView style={styles.container}>
      <Title style={styles.pageTitle}>⚙️ 設定</Title>

      {/* カテゴリ追加エリア */}
      <Card style={styles.card}>
        <Card.Title title="カテゴリの追加" />
        <Card.Content>
          <View style={styles.inputContainer}>
            <TextInput
              mode="outlined"
              label="新しいカテゴリ"
              value={newCategory}
              onChangeText={setNewCategory}
              style={styles.input}
            />
            <Button mode="contained" onPress={handleAdd} style={styles.addButton} icon="plus">
              追加
            </Button>
          </View>
        </Card.Content>
      </Card>

      {/* カテゴリ一覧エリア */}
      <Card style={styles.card}>
        <Card.Title title="カテゴリ一覧" subtitle="削除ボタンで削除できます" />
        <Card.Content>
            {categories.map((cat, index) => (
                <View key={cat}>
                    <List.Item
                        title={cat}
                        right={props => (
                            <IconButton 
                                {...props} 
                                icon="delete" 
                                iconColor="red" 
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
    backgroundColor: '#f5f5f5',
  },
  pageTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    textAlign: 'center',
    marginVertical: 15,
    color: '#333',
  },
  card: {
    marginBottom: 20,
    elevation: 3,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  input: {
    flex: 1,
    marginRight: 10,
    backgroundColor: 'white',
  },
  addButton: {
    height: 50,
    justifyContent: 'center',
  },
});

export default SettingsScreen;