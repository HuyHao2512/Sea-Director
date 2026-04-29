/**
 * Dịch vụ AI - Facade (điểm vào thống nhất)
 * 
 * Tệp này hoạt động như một điểm vào thống nhất, xuất tất cả các chức năng dịch vụ AI từ mô-đun ./ai/.
 * Tất cả các mô-đun nên tham chiếu thông qua import { xxx } from '../services/aiService'.
 * 
 * Triển khai thực tế đã được chia thành các mô-đun sau:
 * - ai/apiCore.ts        Lớp cơ sở hạ tầng (gọi API, thử lại, xử lý lỗi, quản lý API Key)
 * - ai/promptConstants.ts Hằng số prompt (phong cách hình ảnh, prompt phủ định)
 * - ai/scriptService.ts   Xử lý kịch bản (phân tích, phân cảnh, tiếp tục, viết lại)
 * - ai/visualService.ts   Tài sản hình ảnh (hướng dẫn nghệ thuật, tạo prompt, tạo hình ảnh)
 * - ai/videoService.ts    Tạo video (Veo đồng bộ, Sora không đồng bộ)
 * - ai/shotService.ts     Hỗ trợ phân cảnh (tối ưu hóa keyframe, tạo hành động, chia tách cảnh quay, lưới 9 ô)
 */

export * from './ai';
