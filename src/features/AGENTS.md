# features/

ビジネスロジックを格納するディレクトリ。MCP に依存しない純粋な関数として実装する。

## 責務

- **純粋なビジネスロジック**: MCP SDK への依存なし
- **neverthrow による明示的エラー処理**: `Result<T, E>` を返す
- **テスト容易性**: 副作用なしの純粋関数

## ディレクトリ構造

**必ず機能単位でディレクトリを作成すること。**

```
features/
├── text-stats/
│   ├── text-stats.ts       # 実装
│   └── text-stats.test.ts  # テスト
├── another-feature/
│   ├── another-feature.ts
│   └── another-feature.test.ts
```

## NG: ファイルを直接配置

```
features/
├── text-stats.ts      # NG: ディレクトリなし
├── text-stats.test.ts
```
