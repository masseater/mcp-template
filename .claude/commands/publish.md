# Publish to npm

npm への公開を GitHub Actions 経由で実行する。

## 手順

1. `package.json` の現在のバージョンを確認
2. 前回の publish 以降の変更を `git log` で確認し、適切なバージョンアップを提案:
   - **major**: 破壊的変更（API変更、削除）
   - **minor**: 新機能追加（後方互換性あり）
   - **patch**: バグ修正、ドキュメント更新
3. ユーザーに公開するバージョンを確認
4. `package.json` のバージョンを更新
5. 変更をコミット & プッシュ
6. `gh workflow run publish.yml -f version=<version>` を実行
7. `gh run watch` でワークフローの完了を待機
