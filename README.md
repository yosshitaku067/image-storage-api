# Image Storage API

Honoを使用したローカル画像ストレージAPI

## セットアップ

```bash
pnpm install
pnpm run prisma:generate
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
DATABASE_URL="file:./db/dev.db"
IMAGE_STORAGE_PATH="./uploads"
PORT=3000
```

## API エンドポイント

### 画像アップロード
```bash
curl -X POST http://localhost:3000/api/images \
  -F "path=user/123/avatar.jpg" \
  -F "file=@image.jpg" \
  -F "description=プロフィール画像" \
  -F "tags=profile,avatar"
```

### 画像一覧取得
```bash
curl http://localhost:3000/api/images?page=1&limit=20
```

### 画像ファイル取得
```bash
curl http://localhost:3000/api/images/{id} --output image.jpg
```

### 画像削除
```bash
curl -X DELETE http://localhost:3000/api/images/{id}
```

## 技術スタック

- Hono - Webフレームワーク
- Prisma - ORM (SQLite)
- Zod - バリデーション
- OpenAPI / Swagger UI - API ドキュメント
