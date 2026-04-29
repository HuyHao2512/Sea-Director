# AI Director (Xưởng làm phim AI)

> **Nền tảng AI tạo phim ngắn / truyện tranh tất cả trong một**
> *Nền tảng sản xuất Motion Comic & Video bằng AI cấp công nghiệp*

[![Tiếng Việt](https://img.shields.io/badge/Language-Tiếng%20Việt-blue.svg)](./README.md)
[![English](https://img.shields.io/badge/Language-English-gray.svg)](./README_EN.md)
[![日本語](https://img.shields.io/badge/Language-日本語-gray.svg)](./README_JA.md)
[![License: CC BY-NC-SA 4.0](https://img.shields.io/badge/License-CC%20BY--NC--SA%204.0-lightgrey.svg)](https://creativecommons.org/licenses/by-nc-sa/4.0/)

---

## 🚀 Giới thiệu

**AI Director** là một **nền tảng AI tạo phim ngắn / truyện tranh all-in-one**, giúp creator biến ý tưởng thành sản phẩm hoàn chỉnh nhanh chóng.

Khác với cách tạo nội dung kiểu ngẫu nhiên, AI Director sử dụng workflow:

👉 **Script → Asset → Keyframe**

Cho phép:

* Tạo video từ một câu mô tả
* Kiểm soát nhân vật không bị biến dạng
* Giữ continuity giữa các cảnh
* Điều khiển camera chính xác

---

## 🖥 Giao diện

### Quản lý dự án

![Quản lý dự án](./images/project-management.png)

### Phase 01: Kịch bản & phân cảnh

![Tạo kịch bản](./images/script-creation.png)
![Kịch bản và câu chuyện](./images/script-and-story.png)

### Phase 02: Nhân vật & tài sản

![Nhân vật và cảnh](./images/characters-and-scenes.png)
![Cảnh](./images/scenes.png)

### Phase 03: Bàn làm việc đạo diễn

![Bàn làm việc đạo diễn](./images/director-workbench.png)
![Lưới 9 ô shot](./images/shot-nine-grid.png)
![Shot và khung](./images/shot-and-frames.png)

### Phase 04: Xuất video

![Xuất video hoàn chỉnh](./images/video-export.png)

### Quản lý prompt

![Quản lý prompt](./images/prompt-management.png)

---

## 🎯 Triết lý: Keyframe-driven

AI Director áp dụng khái niệm **Keyframe**:

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
* AI:

  * GPT-5.1
  * Gemini 3 Pro
  * Veo / Sora
* Storage: IndexedDB

---

## 🚀 Vì sao dùng?

### 🎯 Full AI stack

* GPT / Claude
* Gemini
* Sora / Veo

👉 1 API duy nhất

---

### 💰 Chi phí thấp

* <20% giá official
* Pay-as-you-go
* SLA 99.9%

---

### 👨‍💻 Dev friendly

* OpenAI compatible
* Docs đầy đủ
* Tracking realtime

👉 https://api.example.com/

---

## ⚠️ Lưu ý

* Project open source
* Model có thể thay
* API không bắt buộc
* Không đảm bảo free mãi

---

## 💬 Cộng đồng

![QR](./images/qrcode.jpg)

---

## 🎨 Tool nhanh

👉 https://aidirector.tree456.com/

* AI Image
* AI Video
* AI PPT
* AI Content

---

## 💻 Download

👉 https://tree456.oss-cn-beijing.aliyuncs.com/AI%20Director%20Setup%201.0.0.exe

---

## 🛠 Chạy project

### Local

```bash
git clone https://github.com/shuyu-labs/AI-Director.git
cd AI-Director
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

👉 [support@aidirector.com](mailto:support@aidirector.com)

---

**Built for Creators 🚀**
