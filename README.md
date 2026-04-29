# Sea-Director (Xưởng làm phim AI)

> **Nền tảng AI tạo phim ngắn / truyện tranh tất cả trong một**

---

## 🚀 Giới thiệu

**Sea-Director** là một **nền tảng AI tạo phim ngắn / truyện tranh all-in-one**, giúp creator biến ý tưởng thành sản phẩm hoàn chỉnh nhanh chóng.

Khác với cách tạo nội dung kiểu ngẫu nhiên, Sea-Director sử dụng workflow:

👉 **Script → Asset → Keyframe**

Cho phép:

* Tạo video từ một câu mô tả
* Kiểm soát nhân vật không bị biến dạng
* Giữ continuity giữa các cảnh
* Điều khiển camera chính xác

---

## 🎯 Triết lý: Keyframe-driven

Sea-Director áp dụng khái niệm **Keyframe**:

1. Tạo frame đầu (Start) và cuối (End)
2. AI nội suy chuyển động giữa 2 frame
3. Dùng asset để giữ consistency

👉 Kết quả: video ổn định, không lỗi nhân vật

---

## ⚙️ Tính năng chính

### Phase 01: Kịch bản

* AI tự tạo storyboard
* Text → prompt hình ảnh
* Điều chỉnh thời lượng
* Có thể chỉnh tay chi tiết

### Phase 02: Nhân vật

* Reference image
* Nhiều outfit
* Scene consistency

### Phase 03: Director

* Quản lý shot dạng grid
* Start / End frame
* Preview 9 khung
* Context-aware AI

### Phase 04: Export

* Timeline preview
* Export MP4
* Export frame

---

## 🧠 Kiến trúc

* Frontend: React 19 + Tailwind
---

## 🚀 Vì sao dùng?

### 💰 Chi phí thấp

* <20% giá official
* Pay-as-you-go
* SLA 99.9%

---

## ⚠️ Lưu ý

* Project open source
* Model có thể thay
* API không bắt buộc
* Không đảm bảo free mãi

---

### Local

```bash
git clone https://github.com/HuyHao2512/Sea-Director.git
cd Sea-Director
npm install
npm run dev
```

### Docker

```bash
docker-compose up -d --build
```

### Docker CLI

```bash
docker build -t aidirector .
docker run -d -p 3005:80 aidirector
```

---

## ⚡ Quick start

1. Nhập API key
2. Nhập ý tưởng
3. Generate asset
4. Tạo frame
5. Generate video

---

## 🙏 Nguồn

https://github.com/Will-Water/CineGen-AI

---

## 📜 License

CC BY-NC-SA 4.0

* ✅ Dùng cá nhân
* ✅ Modify
* ❌ Không commercial
---

**Built for Creators 🚀**
