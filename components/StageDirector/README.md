# Hướng dẫn tái cấu trúc thành phần StageDirector

## 📋 Tổng quan tái cấu trúc

Tái cấu trúc thành phần StageDirector từ **1418 dòng** từ kiến trúc đơn khối thành kiến trúc mô-đun hóa, chia thành **11 mô-đun độc lập**, thành phần chính được đơn giản hóa xuống khoảng **450 dòng** (giảm 68%).

## 🎯 Mục tiêu tái cấu trúc

- ✅ **Cải thiện khả năng bảo trì**: Chia nhỏ thành phần siêu lớn thành các mô-đun có trách nhiệm rõ ràng
- ✅ **Loại bỏ mã trùng lặp**: Thống nhất ba cửa sổ chỉnh sửa trùng lặp (ModalOverlay)
- ✅ **Tăng cường khả năng tái sử dụng**: Tạo các thành phần chung như EditModal, ShotCard
- ✅ **Tối ưu hóa tổ chức mã**: Tách biệt cấu hình, hàm công cụ và thành phần UI
- ✅ **Duy trì tương thích ngược**: Không thay đổi bất kỳ chức năng hiện có nào và giao diện bên ngoài

## 📁 Cấu trúc thư mục mới

```
components/
└── StageDirector/
    ├── index.tsx                    # Thành phần chính (~450 dòng)
    ├── cameraMovementGuides.ts      # Cấu hình chuyển động máy ảnh (157 dòng)
    ├── constants.ts                 # Hằng số và cấu hình kiểu (95 dòng)
    ├── utils.ts                     # Tập hợp hàm công cụ (130 dòng)
    ├── EditModal.tsx                # Cửa sổ chỉnh sửa chung (70 dòng)
    ├── ShotCard.tsx                 # Thẻ hình thu nhỏ shot (68 dòng)
    ├── SceneContext.tsx             # Thông tin ngữ cảnh cảnh (133 dòng)
    ├── KeyframeEditor.tsx           # Trình chỉnh sửa keyframe (142 dòng)
    ├── VideoGenerator.tsx           # Trình tạo video (99 dòng)
    ├── ImagePreviewModal.tsx        # Cửa sổ xem trước hình ảnh (44 dòng)
    ├── ShotWorkbench.tsx            # Bảng công việc tích hợp (165 dòng)
    └── README.md                    # Giải thích tài liệu
```

## 🔄 Giải thích mô-đun

### 1. **cameraMovementGuides.ts** - Cấu hình chuyển động máy ảnh

**Chức năng**: 27 loại chuyển động máy ảnh điện ảnh và hướng dẫn bố cục của chúng

**Lý do trích xuất**:
- Đối tượng cấu hình 150 dòng ban đầu được nhúng trong thành phần
- Dữ liệu cấu hình trộn lẫn với logic kinh doanh

**Ưu điểm**:
- Duy trì độc lập thư viện chuyển động máy ảnh
- Hỗ trợ gợi ý loại TypeScript
- Dễ dàng mở rộng các loại chuyển động mới

**Ví dụ sử dụng**:
```typescript
import { cameraMovementGuides } from './cameraMovementGuides';

const guide = cameraMovementGuides.find(g => g.value === 'tracking-shot');
console.log(guide?.compositionGuide); // Xuất hướng dẫn bố cục
```

---

### 2. **constants.ts** - Hằng số và cấu hình kiểu

**Nội dung bao gồm**:
- Hằng số kiểu (STYLES) - Kiểu thẻ, nút, huy hiệu
- Prompt kiểu trực quan (VISUAL_STYLE_PROMPTS)
- Giá trị mặc định mô hình video (VIDEO_TEMPLATES)
- Cấu hình mặc định (DEFAULTS)

**Lý do trích xuất**:
- Chuỗi kiểu phân tán khắp thành phần
- Giá trị cấu hình được mã hóa cứng trong logic

**Ưu điểm**:
- Quản lý tập trung kiểu và cấu hình
- Dễ dàng tùy chỉnh chủ đề
- Giảm số ma thuật

---

### 3. **utils.ts** - Tập hợp hàm công cụ

**Hàm bao gồm**:
- `getRefImagesForShot()` - Thu thập hình ảnh tham chiếu
- `buildKeyframePrompt()` - Xây dựng prompt keyframe
- `buildVideoPrompt()` - Xây dựng prompt video
- `extractBasePrompt()` - Trích xuất prompt cơ sở
- `generateId()` - Tạo ID duy nhất
- `delay()` - Hàm trì hoãn
- `convertImageToBase64()` - Chuyển đổi hình ảnh sang base64
- `createKeyframe()` - Tạo đối tượng keyframe
- `updateKeyframeInShot()` - Cập nhật keyframe trong shot

**Lý do trích xuất**:
- Logic nối chuỗi phức tạp phân tán trong thành phần
- Mã chuyển đổi dữ liệu lặp lại

**Ưu điểm**:
- Hàm thuần túy dễ kiểm tra
- Tăng khả năng tái sử dụng mã
- Giảm độ phức tạp của thành phần chính

---

### 4. **EditModal.tsx** - Cửa sổ chỉnh sửa chung

**Chức năng**: Thành phần cửa sổ chỉnh sửa thống nhất

**Nội dung thay thế**: Ba triển khai `ModalOverlay` trùng lặp trong thành phần gốc (~300 dòng)

**Props**:
```typescript
interface EditModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: () => void;
  title: string;
  icon: React.ReactNode;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  textareaClassName?: string;
}
```

**Ví dụ sử dụng**:
```typescript
<EditModal
  isOpen={isEditing}
  onClose={() => setIsEditing(false)}
  onSave={handleSave}
  title="Chỉnh sửa hành động tường thuật"
  icon={<Film />}
  value={currentValue}
  onChange={setValue}
/>
```

**Ưu điểm**:
- Loại bỏ 83% mã trùng lặp
- Trải nghiệm chỉnh sửa thống nhất
- Dễ dàng mở rộng các loại chỉnh sửa mới

---

### 5. **ShotCard.tsx** - Thẻ hình thu nhỏ shot

**Chức năng**: Thẻ shot trong chế độ xem lưới

**Nội dung hiển thị**:
- Số thứ tự shot
- Hình thu nhỏ khung bắt đầu
- Mô tả shot
- Trạng thái tạo video
- Số lượng nhân vật

**Props**:
```typescript
interface ShotCardProps {
  shot: Shot;
  index: number;
  isActive: boolean;
  onClick: () => void;
}
```

**Ưu điểm**:
- Logic hiển thị độc lập
- Hỗ trợ các chế độ bố cục khác nhau
- Dễ dàng thêm chức năng tương tác

---

### 6. **SceneContext.tsx** - Thông tin ngữ cảnh cảnh

**Chức năng**: Hiển thị và quản lý thông tin cảnh của shot hiện tại

**Nội dung bao gồm**:
- Điều hướng shot (trước/sau)
- Chỉnh sửa hành động tường thuật
- Quản lý nhân vật (thêm/xóa)
- Lựa chọn biến thể nhân vật

**Props**:
```typescript
interface SceneContextProps {
  shot: Shot;
  shotIndex: number;
  totalShots: number;
  scriptData?: ScriptData;
  onClose: () => void;
  onPrevious: () => void;
  onNext: () => void;
  onEditActionSummary: () => void;
  onAddCharacter: (charId: string) => void;
  onRemoveCharacter: (charId: string) => void;
  onVariationChange: (charId: string, varId: string) => void;
}
```

**Ưu điểm**:
- Quản lý thông tin cảnh tập trung
- Hiển thị rõ ràng mối quan hệ nhân vật
- Logic tương tác độc lập

---

### 7. **KeyframeEditor.tsx** - Trình chỉnh sửa keyframe

**Chức năng**: Quản lý khung bắt đầu và kết thúc

**Hoạt động bao gồm**:
- Tạo keyframe (AI)
- Tải lên hình ảnh tùy chỉnh
- Chỉnh sửa prompt
- Sao chép khung kết thúc shot trước đó

**Props**:
```typescript
interface KeyframeEditorProps {
  shot: Shot;
  showCopyPrevious: boolean;
  onGenerate: (type: 'start' | 'end') => void;
  onUpload: (type: 'start' | 'end') => void;
  onEditPrompt: (type: 'start' | 'end', prompt: string) => void;
  onCopyPrevious: () => void;
  onImageClick: (url: string, title: string) => void;
}
```

**Ưu điểm**:
- Logic khung bắt đầu và kết thúc thống nhất
- Hiển thị trạng thái rõ ràng (tạo/thất bại/hoàn thành)
- Hỗ trợ nhiều phương thức nhập

---

### 8. **VideoGenerator.tsx** - Trình tạo video

**Chức năng**: Tạo và xem trước video

**Nội dung bao gồm**:
- Lựa chọn mô hình video
- Chỉnh sửa prompt video
- Nút tạo
- Trình phát video xem trước

**Props**:
```typescript
interface VideoGeneratorProps {
  shot: Shot;
  onGenerate: () => void;
  onModelChange: (model: string) => void;
  onEditPrompt: () => void;
}
```

**Ưu điểm**:
- Luồng tạo video độc lập
- Hỗ trợ chuyển đổi mô hình khác nhau
- Phản hồi trạng thái trực quan

---

### 9. **ImagePreviewModal.tsx** - Cửa sổ xem trước hình ảnh

**Chức năng**: Xem trước hình ảnh toàn màn hình

**Props**:
```typescript
interface ImagePreviewModalProps {
  imageUrl: string | null;
  title?: string;
  onClose: () => void;
}
```

**Ưu điểm**:
- Thành phần độc lập nhẹ
- Hỗ trợ đóng bằng cách nhấp
- Hiển thị có tiêu đề

---

### 10. **ShotWorkbench.tsx** - Bảng công việc tích hợp

**Chức năng**: Giao diện bảng công việc tích hợp bên phải

**Thành phần tích hợp**:
- SceneContext - Thanh bên thông tin cảnh
- KeyframeEditor - Chỉnh sửa keyframe
- VideoGenerator - Tạo video

**Props**: Tích hợp Props của tất cả thành phần con

**Ưu điểm**:
- Giao diện quy trình công việc thống nhất
- Cấu trúc bố cục mô-đun hóa
- Dễ dàng điều chỉnh kiểu toàn bộ

---

### 11. **index.tsx** - Thành phần chính

**Trách nhiệm**:
- Quản lý trạng thái (lựa chọn shot, tiến độ hàng loạt, trạng thái chỉnh sửa)
- Phối hợp logic kinh doanh (tạo, tải lên, lưu)
- Sắp xếp thành phần con

**Nội dung được đơn giản hóa**:
- Loại bỏ 300 dòng mã cửa sổ trùng lặp
- Trích xuất 150 dòng dữ liệu cấu hình
- Tách biệt 200 dòng hàm công cụ
- Tách biệt 500+ dòng thành phần UI

**Chức năng được giữ lại**:
- Tạo khung đầu hàng loạt
- Chuyển đổi shot
- Logic quản lý trạng thái chỉnh sửa
- Xử lý lỗi

---

## 🎨 So sánh trước và sau tái cấu trúc

| Chỉ số | Trước | Sau | Cải thiện |
|------|--------|--------|------|
| **Dòng thành phần chính** | 1418 dòng | ~450 dòng | Giảm 68% |
| **Độ phức tạp hàm tối đa** | 80+ dòng | 30 dòng | Giảm 62% |
| **Mã trùng lặp** | 3 cửa sổ trùng lặp (300 dòng) | 1 thành phần chung (70 dòng) | Giảm 83% |
| **Bảo trì cấu hình** | Trộn lẫn trong thành phần | Tệp độc lập | Quản lý tập trung |
| **Số lượng mô-đun** | 1 tệp | 11 mô-đun | Tách biệt trách nhiệm |
| **Khả năng kiểm tra** | Khó | Dễ | Hàm có thể kiểm tra độc lập |

## 🔧 Tương thích ngược

Tái cấu trúc duy trì 100% tương thích ngược:

```typescript
// Phương thức nhập gốc vẫn có hiệu lực
import StageDirector from './components/StageDirector';

// Triển khai nội bộ được tái cấu trúc hoàn toàn, nhưng giao diện bên ngoài không thay đổi
<StageDirector 
  project={project} 
  updateProject={updateProject}
  onApiKeyError={handleApiKeyError}
/>
```

## 📦 Đề xuất sử dụng

### 1. **Thêm loại chuyển động máy ảnh mới**
Chỉnh sửa `cameraMovementGuides.ts`:
```typescript
export const cameraMovementGuides: CameraMovementGuide[] = [
  // ...loại hiện có
  {
    value: 'new-movement',
    label: 'Chuyển động máy ảnh mới',
    description: 'Mô tả...',
    compositionGuide: 'Gợi ý bố cục...'
  }
];
```

### 2. **Sửa đổi chủ đề kiểu**
Chỉnh sửa đối tượng `STYLES` trong `constants.ts`:
```typescript
export const STYLES = {
  card: {
    base: 'bg-zinc-900 border-zinc-700', // Sửa đổi kiểu cơ sở
    // ...
  }
};
```

### 3. **Mở rộng hàm công cụ**
Thêm hàm mới trong `utils.ts`:
```typescript
export const myCustomFunction = (param: string): string => {
  // Logic tùy chỉnh
  return result;
};
```

### 4. **Tạo loại chỉnh sửa mới**
Tái sử dụng thành phần `EditModal`:
```typescript
<EditModal
  isOpen={isOpen}
  onClose={handleClose}
  onSave={handleSave}
  title="Loại chỉnh sửa mới"
  icon={<MyIcon />}
  value={value}
  onChange={setValue}
  placeholder="Nhập nội dung..."
/>
```

## 🚀 Hướng tối ưu hóa trong tương lai

- [ ] Thêm kiểm tra đơn vị (hàm trong utils.ts)
- [ ] Sử dụng Context API để giảm prop drilling
- [ ] Xem xét giới thiệu thư viện quản lý trạng thái (Zustand/Jotai)
- [ ] Triển khai chức năng kéo và thả shot
- [ ] Tối ưu hóa hiệu suất kết xuất cho nhiều shot (cuộn ảo)

## 📝 Tóm tắt

Thông qua tái cấu trúc mô-đun hóa, thành phần StageDirector chuyển từ kiến trúc đơn khối sang kiến trúc mô-đun hóa rõ ràng:

✅ **Khả năng bảo trì**: Mỗi mô-đun có trách nhiệm duy nhất, dễ hiểu và sửa đổi  
✅ **Khả năng tái sử dụng**: Thành phần chung có thể được sử dụng ở những nơi khác  
✅ **Khả năng mở rộng**: Tính năng mới có thể được thêm độc lập mà không ảnh hưởng đến mã hiện có  
✅ **Khả năng kiểm tra**: Hàm công cụ và thành phần có thể được kiểm tra độc lập  
✅ **Khả năng đọc**: Logic thành phần chính rõ ràng, số lượng mã giảm 68%  

Tái cấu trúc tuân theo nguyên tắc trách nhiệm duy nhất, nguyên tắc mở/đóng, cải thiện đáng kể chất lượng mã và trải nghiệm phát triển.
