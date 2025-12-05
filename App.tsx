// ----- ここからコピー -----
import React from 'react';
import {SafeAreaView, StyleSheet, Text, View} from 'react-native';

function App(): React.JSX.Element {
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.center}>
        <Text style={styles.title}>
          家計簿アプリ
        </Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1, // 画面全体を使う
  },
  center: {
    flex: 1, // 画面全体を使う
    justifyContent: 'center', // 縦（垂直）方向の中央揃え
    alignItems: 'center', // 横（水平）方向の中央揃え
  },
  title: {
    fontSize: 24, // 文字サイズ
    fontWeight: 'bold', // 太字
  },
});

export default App;
// ----- ここまでコピー -----