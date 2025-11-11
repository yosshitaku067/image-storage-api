# Image Storage API

Honoを使用したファイルシステムベースの画像ストレージAPI

## 概要

このAPIは、ローカルファイルシステムを使用して画像を保存・管理するシンプルなWebAPIです。データベースを使用せず、ファイルシステムのみで動作します。

## セットアップ

```bash
pnpm install
```

## OpenAPI仕様の生成

```bash
pnpm run generate:openapi
```

このコマンドで`openapi.yaml`と`openapi.json`が生成されます。

## 開発サーバー起動

```bash
pnpm run dev
```

サーバーが起動したら以下のURLにアクセス:
- API: http://localhost:3000
- Swagger UI: http://localhost:3000/docs

## 環境設定

`.env`ファイルで以下の環境変数を設定:

```env
IMAGE_STORAGE_PATH="./uploads"
PORT=3000
```

## API エンドポイント

### 画像アップロード
```bash
curl -X POST http://localhost:3000/api/images \
  -F "path=user/123/avatar.jpg" \
  -F "file=@image.jpg"
```

レスポンス例:
```json
{
  "path": "user/123/avatar.jpg",
  "filename": "avatar.jpg",
  "size": 12345,
  "uploadedAt": "2025-11-11T00:00:00.000Z",
  "updatedAt": "2025-11-11T00:00:00.000Z"
}
```

### 画像一覧取得（ページネーション）
```bash
curl "http://localhost:3000/api/images?page=1&limit=20"
```

パラメータ:
- `page`: ページ番号（デフォルト: 1）
- `limit`: 1ページあたりの件数（デフォルト: 20、最大: 100）

### 画像ファイル取得
```bash
curl "http://localhost:3000/api/images/user%2F123%2Favatar.jpg" --output image.jpg
```

注意: パスはURLエンコードが必要です

### 画像削除
```bash
curl -X DELETE "http://localhost:3000/api/images/user%2F123%2Favatar.jpg"
```

注意: パスはURLエンコードが必要です

## テスト

```bash
# テストを実行
pnpm run test

# テストをwatch modeで実行
pnpm run test:watch

# UIでテストを実行
pnpm run test:ui

# カバレッジ付きでテスト実行
pnpm run test:coverage
```

## 技術スタック

- Hono - Webフレームワーク
- Zod - バリデーション
- OpenAPI / Swagger UI - APIドキュメント
- Vitest - テストフレームワーク
- Node.js File System - ファイルストレージ

## 特徴

- **シンプル**: データベース不要、ファイルシステムのみで動作
- **パスベース**: ファイルパスでリソースを管理
- **セキュリティ**: ディレクトリトラバーサル攻撃を防止
- **OpenAPI準拠**: Swagger UIで簡単にAPIをテスト可能
