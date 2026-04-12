# Deploy `Generate_Img` lên Vercel

## Runtime chuẩn hóa

- Node.js: `22.x`
- Package manager: `pnpm` qua Corepack
- Install command: `corepack enable && pnpm install --frozen-lockfile`
- Build command: `pnpm build`

Repo đã khai báo các giá trị này ở:

- `package.json`
- `.nvmrc`
- `vercel.json`
- `.github/workflows/ci.yml`

## Biến môi trường cần cấu hình

### Bắt buộc

- `CLOUDFLARE_API_TOKEN`

### Chọn 1 trong 2 cách cấu hình endpoint

1. Cách khuyến nghị:
   - `CLOUDFLARE_API_URL`
2. Cách fallback:
   - `CLOUDFLARE_ACCOUNT_ID`
   - `CLOUDFLARE_IMAGE_MODEL_ID`

### Legacy alias

- `CLOUDFLARE_AUTH_TOKEN`

Chỉ giữ alias này nếu bạn đang chuyển tiếp từ môi trường cũ. Với môi trường mới, dùng `CLOUDFLARE_API_TOKEN`.

## Gợi ý cấu hình môi trường trên Vercel

### Development

- `CLOUDFLARE_API_TOKEN`
- `CLOUDFLARE_API_URL`

### Preview

- `CLOUDFLARE_API_TOKEN`
- `CLOUDFLARE_API_URL`

### Production

- `CLOUDFLARE_API_TOKEN`
- `CLOUDFLARE_API_URL`

Nếu không muốn lưu URL đầy đủ, thay `CLOUDFLARE_API_URL` bằng:

- `CLOUDFLARE_ACCOUNT_ID`
- `CLOUDFLARE_IMAGE_MODEL_ID`

## Cách link project cục bộ

```bash
corepack enable
pnpm install
npx vercel link
```

Lưu ý:

- Không commit thư mục `.vercel`
- Không đưa token Cloudflare vào `NEXT_PUBLIC_*`

## Checklist deploy

1. Tạo project mới trên Vercel với framework `Next.js`
2. Chọn root directory là thư mục repo hiện tại
3. Chọn Node.js `22.x`
4. Thêm env cho `Development`, `Preview`, `Production`
5. Chạy preview deploy trước
6. Kiểm tra route `/`
7. Kiểm tra generate ảnh qua `/api/generate-image`

## Kiểm tra trước khi deploy

```bash
corepack enable
pnpm install --frozen-lockfile
pnpm lint
pnpm typecheck
pnpm build
```
