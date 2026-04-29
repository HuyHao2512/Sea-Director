# 🚀 Cách sử dụng

## Cách 1: Sử dụng Docker Compose (khuyến nghị)

```bash
# Build và khởi động container (sẽ build lại image)
docker-compose up -d --build

# Nếu nghi ngờ cache build của Docker khiến chưa được cập nhật (build không dùng cache + tạo lại container)
docker-compose build --no-cache
docker-compose up -d --force-recreate

# Xem log
docker-compose logs -f

# Dừng container
docker-compose down
```

---

## Cách 2: Sử dụng lệnh Docker

```bash
# Build image
docker build -t aidirector .

# Build không dùng cache (bắt buộc chạy lại toàn bộ các layer)
docker build --no-cache -t aidirector .

# Chạy container
docker run -d -p 3005:80 --name aidirector-app aidirector

# Xem log
docker logs -f aidirector-app

# Dừng container
docker stop aidirector-app
```

---

## Bổ sung: Nếu bạn xác nhận container đã được cập nhật nhưng trang vẫn là phiên bản cũ

* Trình duyệt có thể đã cache tài nguyên tĩnh: hãy thử refresh mạnh (Ctrl + F5) hoặc xóa cache trang web.
* Nếu phía trước có CDN / reverse proxy, cũng có thể cache `index.html`, cần làm mới cache ở phía upstream.
