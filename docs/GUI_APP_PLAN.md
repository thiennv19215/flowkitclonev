# FlowKit Desktop GUI — Kế hoạch phát triển

> App desktop Windows để thao tác với FlowKit backend (`localhost:8100`)
> Layout tham khảo: **PivoClip** (top nav + pipeline stepper + entity grid + dark theme)
> Tính năng: **phát triển riêng** theo FlowKit API

---

## 1. Mục tiêu

Xây dựng app desktop có giao diện đồ họa cho FlowKit, giúp người dùng:

- Quản lý projects/entities/scenes mà không cần dùng CLI
- Theo dõi pipeline real-time (queue, progress, credits)
- Preview ảnh/video ngay trong app
- Trigger các skill (`/fk-gen-images`, `/fk-gen-videos`, ...) qua nút bấm
- Phân phối exe cho người không biết code

---

## 2. Tech Stack

| Layer | Công nghệ | Lý do |
|-------|-----------|-------|
| Khung app | **Tauri 2.x** | Exe nhẹ (~5-10MB), bảo mật, dùng WebView2 sẵn của Windows |
| UI Framework | **React 18 + Vite + TypeScript** | Dev nhanh, ecosystem lớn |
| Styling | **TailwindCSS + shadcn/ui** | Component đẹp sẵn, dark theme dễ |
| State | **Zustand** | Nhẹ, đơn giản hơn Redux |
| API Client | **TanStack Query** | Cache, retry, refetch tự động |
| WebSocket | **Native WebSocket API** | Kết nối port 9222 cho real-time |
| Forms | **React Hook Form + Zod** | Validate schema mạnh |
| Icons | **Lucide React** | Bộ icon đẹp, nhẹ |
| Routing | **React Router** | Multi-page navigation |

**Tại sao Tauri thay vì Electron?**
- KomfyStudio dùng Electron → exe ~150MB
- PivoClip cũng vậy
- Tauri cho exe ~5-10MB, RAM ít hơn nhiều, vẫn dùng web stack y hệt

---

## 3. Kiến trúc

```
flowkit-desktop/
├── src-tauri/              # Rust shell (gần như không đụng)
│   ├── tauri.conf.json
│   └── src/main.rs
├── src/
│   ├── api/                # API client cho FlowKit
│   │   ├── client.ts       # axios/fetch wrapper
│   │   ├── projects.ts
│   │   ├── characters.ts
│   │   ├── videos.ts
│   │   ├── scenes.ts
│   │   ├── requests.ts
│   │   ├── flow.ts
│   │   └── ws.ts           # WebSocket client (port 9222)
│   ├── components/
│   │   ├── ui/             # shadcn components
│   │   ├── layout/         # Sidebar, Header, etc.
│   │   ├── EntityCard.tsx
│   │   ├── SceneCard.tsx
│   │   ├── PipelineStepper.tsx
│   │   └── QueueMonitor.tsx
│   ├── pages/
│   │   ├── Dashboard.tsx
│   │   ├── ProjectList.tsx
│   │   ├── ProjectDetail.tsx
│   │   ├── Storyboard.tsx
│   │   ├── SceneEditor.tsx
│   │   ├── Pipeline.tsx
│   │   └── Settings.tsx
│   ├── store/              # Zustand stores
│   │   ├── activeProject.ts
│   │   └── settings.ts
│   ├── hooks/
│   │   ├── useProjects.ts
│   │   ├── useScenes.ts
│   │   └── useWebSocket.ts
│   ├── types/              # TypeScript types từ FlowKit API
│   └── App.tsx
├── package.json
└── vite.config.ts
```

---

## 4. Tính năng theo phase

### Phase 1 — MVP (1-2 tuần)
**Mục tiêu:** App chạy được, kết nối backend, CRUD project cơ bản

- [ ] Setup Tauri + React + Tailwind + shadcn
- [ ] Settings page: cấu hình API base URL (mặc định `http://127.0.0.1:8100`)
- [ ] Health check + extension status indicator
- [ ] Dashboard: list projects, credits, queue summary
- [ ] Project CRUD: tạo/xem/sửa/xóa
- [ ] Active project switcher

### Phase 1.5 — Image & Video Generator standalone (1-2 tuần)
**Mục tiêu:** Tạo ảnh + video không cần project, giống tab Image/Video của PivoClip

- [ ] Trang **Image Generator**
  - [ ] Form prompt + negative prompt
  - [ ] Aspect ratio + material picker
  - [ ] Upload reference image (drag & drop)
  - [ ] Số ảnh + seed
  - [ ] Model selector (Imagen)
  - [ ] Grid kết quả + lịch sử
  - [ ] Download ảnh + "Lưu vào project"
- [ ] Trang **Video Generator**
  - [ ] 3 mode: Text-to-Video / Image-to-Video / Frame-to-Frame
  - [ ] Upload start + end frame
  - [ ] Prompt mô tả chuyển động
  - [ ] Camera move preset (link `/fk-camera-guide`)
  - [ ] Creative Mix button (link `/fk-creative-mix`)
  - [ ] Model selector (Veo 3 / Veo 3 Fast)
  - [ ] Queue panel với progress bar real-time
  - [ ] Preview player + Download + Upscale 4K
  - [ ] "Lưu vào project"
- [ ] Floating Action Button (FAB) — quick generate ở mọi trang

### Phase 2 — Storyboard kiểu PivoClip (2 tuần)
**Mục tiêu:** Clone giao diện PivoClip cho Key Objects + Scenes

- [ ] Top nav (Image, Video, Storyboard, Workflow, Settings)
- [ ] Pipeline stepper component (Ý tưởng → Story → Key Objects → Phân cảnh)
- [ ] Trang **Ý tưởng** — textarea concept + AI suggest
- [ ] Trang **Story** — editor markdown chia scene
- [ ] Trang **Key Objects** — entity grid 6 cột (giống screenshot PivoClip)
  - [ ] EntityCard với badge color theo type
  - [ ] Drag & drop upload ảnh local
  - [ ] Nút "Tạo lại" + "Lưu Global"
  - [ ] Nút X xóa entity
- [ ] Trang **Phân cảnh** — scene grid với ảnh + prompt + video preview
- [ ] Backend switcher (Flow/PlenX/CF) — UI có nhưng chỉ Flow active
- [ ] Batch actions footer: "Tạo tất cả" + "Tạo Phân cảnh →"
- [ ] Material picker modal (`/fk-add-material`)

### Phase 3 — Generation Pipeline (2 tuần)
**Mục tiêu:** Trigger và monitor các bước generate

- [ ] Pipeline stepper UI (Ý tưởng → Story → Entities → Scenes → Video)
- [ ] Queue monitor real-time qua WebSocket
- [ ] Generate scene images (batch + per-scene)
- [ ] Generate scene videos (batch + per-scene)
- [ ] Progress bar per request
- [ ] Retry failed request một click
- [ ] Error toast với link đến `/fk-doctor`

### Phase 4 — Review & Output (1-2 tuần)
**Mục tiêu:** Preview, review, xuất video cuối

- [ ] Video preview player (HLS/MP4)
- [ ] Review board kiểu `/fk-review-board`
- [ ] Concat video (`/fk-concat`, `/fk-concat-fit-narrator`)
- [ ] Refresh URLs hết hạn
- [ ] Export final video xuống local

### Phase 5 — Audio & YouTube (1-2 tuần)
**Mục tiêu:** TTS, music, upload YouTube

- [ ] Voice template manager
- [ ] TTS narrator generation
- [ ] Music generation (Suno)
- [ ] Text overlays editor
- [ ] Thumbnail generator (4 variants)
- [ ] YouTube SEO metadata form
- [ ] YouTube upload với OAuth

### Phase 6 — Polish (1 tuần)
- [ ] Dark/light theme
- [ ] Keyboard shortcuts
- [ ] Notification system
- [ ] Auto-update (Tauri updater)
- [ ] Logging + crash report
- [ ] Build pipeline (GitHub Actions → release exe)

---

## 5. UI/UX — Layout tham khảo PivoClip

> **Lưu ý:** Chỉ tham khảo **layout/visual design** từ PivoClip. Tính năng và logic **phát triển riêng** theo FlowKit API.

### 5.1 Layout tổng thể (lấy cảm hứng từ PivoClip)

```
┌─────────────────────────────────────────────────────────────────┐
│ ● ● ●  Logo   Image │ Video │ Storyboard │ Workflow │ Settings  │  ← Top nav
├─────────────────────────────────────────────────────────────────┤
│ ← Quay lại │ Tên project                    │ Pipeline stepper  │  ← Sub header
│             │ "8 phân cảnh · Hoàn thành"     │ ✓Ý tưởng → ✓Story → ●Key Objects → Phân cảnh │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  Bước 3 — Key Objects                          [Flow] [PlenX]  │  ← Section title + backend switcher
│  13 đối tượng — kéo ảnh vào card hoặc bấm Tạo ảnh             │
│                                                                 │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐       │
│  │CHARACTER │  │ LOCATION │  │ LOCATION │  │   PROP   │       │  ← Entity cards grid
│  │  [ảnh]   │  │  [ảnh]   │  │  [ảnh]   │  │  [ảnh]   │       │
│  │ Tên      │  │ Tên      │  │ Tên      │  │ Tên      │       │
│  │[Tạo lại] │  │[Tạo lại] │  │[Tạo lại] │  │[Tạo lại] │       │
│  │[Lưu Glb] │  │[Lưu Glb] │  │[Lưu Glb] │  │[Lưu Glb] │       │
│  └──────────┘  └──────────┘  └──────────┘  └──────────┘       │
│                                                                 │
│                    [Tạo tất cả (X chưa có ảnh)]  [Tạo Phân cảnh →] │  ← Batch actions
└─────────────────────────────────────────────────────────────────┘
```

### 5.2 Các component chính (layout tham khảo PivoClip, logic riêng)

| Component | Layout tham khảo PivoClip | Tính năng riêng FlowKit |
|-----------|---------------------------|--------------------------|
| **TopNav** | Logo + menu tabs + credits badge | Tabs theo workflow FlowKit, credits từ `/api/flow/credits` |
| **PipelineStepper** | Breadcrumb các bước | Bước riêng FlowKit (Project → Entities → Scenes → Generate → Export) |
| **EntityCard** | Card với badge + ảnh + tên + nút | Action riêng theo FlowKit (refs, materials, scene linking) |
| **EntityGrid** | Grid responsive nhiều cột | Filter/sort/group theo logic FlowKit |
| **BatchActions** | Footer sticky nút batch | Trigger `/api/requests/batch` của FlowKit |
| **DragDropZone** | Kéo ảnh vào card | Upload qua FlowKit API + auto link entity |
| **ProjectHeader** | Tên project + meta info | Status pipeline FlowKit + queue indicator |

### 5.3 Các trang (cấu trúc riêng FlowKit, layout dạng PivoClip)

| Trang | Mô tả | Layout tham khảo |
|-------|--------|---------------------|
| **Dashboard** | List projects dạng grid card + quick stats | Card grid (PivoClip style) |
| **Image** | Tạo ảnh đơn lẻ (standalone) — không cần project | Form 2 cột + grid kết quả |
| **Video** | Tạo video đơn lẻ (standalone) từ ảnh hoặc text prompt | Form + queue panel |
| **Storyboard** | Trang tổng hợp pipeline tạo video — chia tab nội bộ | Tab theo bước FlowKit |
| **Workflow** | Pipeline tự động chạy hàng loạt | Stepper + monitor |
| **Review Board** | Preview tất cả scene videos, đánh giá chất lượng | Grid video player |
| **Export** | Concat + download + YouTube upload | Form export + preview |
| **Settings** | Cấu hình API, model, voice, account | Form sections |

> **Lưu ý:** Các bước trong Storyboard sẽ phát triển riêng theo workflow FlowKit (Entities → Scenes → Generate Images → Generate Videos → Concat), **không** clone tab "Ý tưởng / Story / Key Objects / Phân cảnh" của PivoClip.

---

### 5.7 Trang **Image** — Tạo ảnh standalone (giống tab Image của PivoClip)

```
┌─────────────────────────────────────────────────────────────────┐
│  Image Generator                              [Flow ▾] [Model ▾]│
├─────────────────────────────────────────────────────────────────┤
│  ┌──────────────────────────┐  ┌──────────────────────────────┐ │
│  │ Prompt                   │  │ Settings                     │ │
│  │ ┌──────────────────────┐ │  │ • Aspect ratio: 16:9 / 1:1  │ │
│  │ │                      │ │  │ • Material: Realistic       │ │
│  │ │ Type a prompt...     │ │  │ • Reference image (optional)│ │
│  │ │                      │ │  │ • Số ảnh: 1 / 4             │ │
│  │ └──────────────────────┘ │  │ • Seed (optional)           │ │
│  │                          │  │                              │ │
│  │ Negative prompt          │  │ [Tạo ảnh] [Lưu vào project] │ │
│  │ ┌──────────────────────┐ │  │                              │ │
│  │ └──────────────────────┘ │  └──────────────────────────────┘ │
│  └──────────────────────────┘                                   │
├─────────────────────────────────────────────────────────────────┤
│  Kết quả                                          [Lịch sử ▾]   │
│  ┌─────┐ ┌─────┐ ┌─────┐ ┌─────┐                              │
│  │ ảnh │ │ ảnh │ │ ảnh │ │ ảnh │  ← Click để xem full + tải   │
│  └─────┘ └─────┘ └─────┘ └─────┘                              │
└─────────────────────────────────────────────────────────────────┘
```

**Tính năng:**
- [ ] Form prompt + negative prompt
- [ ] Aspect ratio picker (16:9, 9:16, 1:1, 4:3, 3:4)
- [ ] Material picker (Realistic, Pixar 3D, Anime, ...)
- [ ] Upload reference image (drag & drop hoặc click)
- [ ] Số ảnh sinh ra (1, 2, 4)
- [ ] Seed input (optional, để tái tạo kết quả)
- [ ] Model selector (Imagen 3, Imagen 4, ...) — gọi `/fk-change-model`
- [ ] Backend switcher (Flow active, PlenX/CF disabled)
- [ ] Lịch sử ảnh đã tạo (sidebar hoặc dropdown)
- [ ] Preview ảnh full size (modal)
- [ ] Download ảnh xuống local
- [ ] **"Lưu vào project"** — chuyển ảnh thành entity (Character/Location/Prop) hoặc gán vào scene

**FlowKit API:**
- `POST /api/requests` với type `GENERATE_IMAGE` (không gắn project_id)
- `GET /api/materials` — list materials
- `POST /api/upload` — upload reference image

---

### 5.8 Trang **Video** — Tạo video standalone (giống tab Video của PivoClip)

```
┌─────────────────────────────────────────────────────────────────┐
│  Video Generator                            [Veo 3 ▾] [Flow ▾] │
├─────────────────────────────────────────────────────────────────┤
│  Mode: ( ) Text-to-Video  (●) Image-to-Video  ( ) Frame-to-Frame│
├─────────────────────────────────────────────────────────────────┤
│  ┌────────────────┐  ┌────────────────┐  ┌──────────────────┐  │
│  │ Start frame    │  │ End frame      │  │ Settings         │  │
│  │ ┌────────────┐ │  │ ┌────────────┐ │  │ • Duration: 8s   │  │
│  │ │  [+ ảnh]   │ │  │ │  [+ ảnh]   │ │  │ • Aspect: 16:9   │  │
│  │ │            │ │  │ │            │ │  │ • Camera move    │  │
│  │ └────────────┘ │  │ └────────────┘ │  │ • Quality: HD/4K │  │
│  └────────────────┘  └────────────────┘  └──────────────────┘  │
│                                                                 │
│  Prompt mô tả chuyển động:                                      │
│  ┌────────────────────────────────────────────────────────────┐│
│  │ Camera dolly in slowly, character turns head toward...     ││
│  └────────────────────────────────────────────────────────────┘│
│                                                                 │
│  [Camera Guide] [Creative Mix]            [Tạo video] [Hủy]   │
├─────────────────────────────────────────────────────────────────┤
│  Queue                                                          │
│  ▶ Video #1 — 75% ━━━━━━━━━━━━━━░░░░  [Hủy]                   │
│  ✓ Video #2 — Hoàn thành        [Preview] [Tải] [Upscale 4K] │
└─────────────────────────────────────────────────────────────────┘
```

**Tính năng:**
- [ ] **3 chế độ tạo video:**
  - Text-to-Video — chỉ prompt
  - Image-to-Video — 1 ảnh start frame + prompt
  - Frame-to-Frame — start frame + end frame + prompt (transition)
- [ ] Upload start/end frame (drag & drop)
- [ ] Prompt mô tả chuyển động
- [ ] Duration: 8s (Veo default), tùy chọn dài hơn nếu model hỗ trợ
- [ ] Aspect ratio: 16:9, 9:16, 1:1
- [ ] Camera movement preset (dolly, pan, zoom, static, ...) — link tới `/fk-camera-guide`
- [ ] Quality: HD / 4K (4K trigger upscale sau)
- [ ] Model selector (Veo 3, Veo 3 Fast, ...) — gọi `/fk-change-model`
- [ ] **Creative Mix** button — link tới `/fk-creative-mix` cho hiệu ứng đặc biệt
- [ ] Queue panel với progress bar real-time qua WebSocket
- [ ] Preview video player inline (HLS/MP4)
- [ ] Download video
- [ ] Upscale 4K một click
- [ ] **"Lưu vào project"** — gán video vào scene cụ thể

**FlowKit API:**
- `POST /api/requests` với type:
  - `GENERATE_VIDEO` (image-to-video, frame-to-frame)
  - `GENERATE_VIDEO_REFS` (text-to-video với reference)
  - `UPSCALE_VIDEO` (4K)
- WebSocket `:9222` — progress updates
- `GET /api/flow/status` — model availability

---

### 5.9 Quick Generate widget (floating)

Trong **mọi trang Storyboard**, có nút floating action button (FAB) ở góc phải:

```
                                                    ┌─────┐
                                                    │  +  │  ← FAB
                                                    └─────┘
```

Click → mở quick menu:
- 🖼️ **Tạo ảnh nhanh** — mini form prompt + generate
- 🎬 **Tạo video nhanh** — mini form prompt + generate
- 📁 **Upload ảnh local**

Kết quả pop lên toast notification + auto-add vào project hiện tại.

---

### 5.10 Dark theme (clone PivoClip colors)

```css
:root {
  --bg-primary: #0a0a0f;        /* Nền chính - gần đen */
  --bg-secondary: #12121a;      /* Card background */
  --bg-tertiary: #1a1a25;       /* Hover state */
  --border: #2a2a35;            /* Viền card */
  --text-primary: #f0f0f0;      /* Text chính */
  --text-secondary: #888;       /* Text phụ */
  --accent-purple: #7c3aed;     /* Accent chính */
  --accent-red: #ef4444;        /* Nút xóa, badge CHARACTER */
  --accent-blue: #3b82f6;       /* Badge LOCATION */
  --accent-green: #22c55e;      /* Badge PROP, tick hoàn thành */
  --accent-orange: #f97316;     /* Warning, pending */
}
```

### 5.5 Entity badge colors (giống PivoClip)

| Type | Màu badge | Ví dụ |
|------|-----------|-------|
| CHARACTER | Đỏ `#ef4444` | Nhân vật chính |
| LOCATION | Xanh dương `#3b82f6` | Bối cảnh |
| PROP | Xanh lá `#22c55e` | Đạo cụ |

### 5.6 Interactions (giống PivoClip)

- **Hover card** → border sáng lên, shadow nhẹ
- **Click "Tạo lại"** → gọi API regenerate, show loading spinner trên ảnh
- **Drag ảnh vào card** → highlight drop zone, upload + gán ảnh
- **Click "X"** → confirm dialog → xóa entity
- **Click "Lưu Global"** → save entity làm global reference (dùng lại ở project khác)
- **Pipeline stepper click** → navigate giữa các bước
- **"Tạo tất cả"** → batch generate tất cả entity chưa có ảnh
- **"Tạo Phân cảnh →"** → chuyển sang bước tiếp theo

---

## 6. API endpoints sẽ dùng

Từ FlowKit backend (`localhost:8100`):

| Endpoint | Mục đích |
|----------|----------|
| `GET /health` | Check backend + extension |
| `GET /api/flow/status`, `GET /api/flow/credits` | Top bar info |
| `GET/POST/PATCH/DELETE /api/projects` | CRUD projects |
| `GET/POST/PATCH/DELETE /api/characters` | CRUD entities |
| `GET/POST/PATCH/DELETE /api/videos` | CRUD videos |
| `GET/POST/PATCH/DELETE /api/scenes` | CRUD scenes |
| `POST /api/requests/batch` | Trigger generate batch |
| `GET /api/requests/pending` | Queue monitor |
| `GET /api/materials` | Material picker |
| WebSocket `:9222` | Real-time updates |

---

## 7. Phân phối

- **Build target:** Windows x64 (`.exe` installer + portable)
- **Code signing:** Optional (cần cert ~$200/năm) — nếu không sẽ có warning SmartScreen
- **Auto-update:** Tauri updater + GitHub Releases
- **Tên app:** Tạm gọi `FlowKit Studio` (có thể đổi)
- **Icon:** Logo riêng cho app

---

## 8. Timeline tổng

| Phase | Thời gian | Tổng dồn |
|-------|-----------|----------|
| Phase 1 — MVP | 1-2 tuần | 2 tuần |
| Phase 1.5 — Image & Video Generator | 1-2 tuần | 4 tuần |
| Phase 2 — Storyboard PivoClip | 2 tuần | 6 tuần |
| Phase 3 — Pipeline | 2 tuần | 8 tuần |
| Phase 4 — Review & Output | 1-2 tuần | 10 tuần |
| Phase 5 — Audio & YouTube | 1-2 tuần | 12 tuần |
| Phase 6 — Polish | 1 tuần | 13 tuần |

**Tổng: ~12-13 tuần** cho bản hoàn chỉnh.

MVP chạy được sau 2 tuần. Sau Phase 1.5 đã có thể tạo ảnh + video standalone (giống tab Image/Video PivoClip).

---

## 9. Quyết định cần xác nhận

Trước khi bắt đầu code, cần chốt:

1. **Tên app chính thức?** (FlowKit Studio? FlowKit Desktop? Tên riêng?)
2. **Logo/branding?** — có sẵn hay tự generate?
3. **Thư mục code đặt ở đâu?**
   - Option A: `flowkit/desktop/` (cùng repo backend)
   - Option B: Repo riêng `flowkit-desktop`
4. **Phạm vi MVP?** — bắt đầu từ phase 1 hay focus tính năng cụ thể?
5. **Single-user hay multi-user?** — hiện tại assume single-user trên 1 máy

---

## 10. Bước tiếp theo

Sau khi chốt các câu hỏi ở mục 9:

1. Init Tauri project: `npm create tauri-app@latest`
2. Setup Tailwind + shadcn/ui
3. Build skeleton: layout + routing + API client
4. Cài Phase 1 features
5. Test với backend đang chạy

---

*Plan này có thể điều chỉnh theo phản hồi và ưu tiên thực tế.*
