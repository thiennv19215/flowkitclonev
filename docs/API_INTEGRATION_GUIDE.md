# FlowKit API Integration Guide

Tài liệu này tóm tắt cách tích hợp FlowKit API vào app/hệ thống khác.

## 1. Tổng quan

FlowKit gồm 2 phần chính:

1. **Chrome Extension**
   - Lấy Google Flow bearer token từ phiên Google Flow/Labs.
   - Xử lý reCAPTCHA.
   - Gọi Google Flow API thật.
   - Kết nối với backend local qua WebSocket `ws://127.0.0.1:9222`.

2. **Python Backend / Local Agent**
   - FastAPI chạy ở `http://127.0.0.1:8100`.
   - Quản lý project, video, scene, entity, request bằng SQLite.
   - App ngoài chỉ nên gọi HTTP API backend này.
   - Không gọi trực tiếp WebSocket `9222` từ frontend/app ngoài.

Tài liệu gốc nên đọc thêm:

- `docs/API_REFERENCE.md`
- `ARCHITECTURE.md`
- `skills/README.md`
- `docs/CLOUDFLARE_TUNNEL.md`

## 2. Base URL

Local:

```txt
http://127.0.0.1:8100
```

Nếu expose qua Cloudflare Tunnel:

```txt
https://YOUR_FLOWKIT_API_DOMAIN
```

Pre-flight check:

```http
GET /health
```

Kết quả mong muốn:

```json
{
  "extension_connected": true
}
```

Nếu `extension_connected: false`, backend đang chạy nhưng Chrome extension chưa kết nối hoặc chưa lấy token Google Flow.

## 3. Nguyên tắc tích hợp

### Chỉ gọi HTTP API backend

App ngoài/frontend chỉ gọi:

```txt
GET /api/...
POST /api/...
PATCH /api/...
DELETE /api/...
```

Không gọi trực tiếp:

```txt
ws://127.0.0.1:9222
```

WebSocket này là bridge nội bộ giữa backend và Chrome extension.

### Dùng batch request, không tự loop API

Khi generate nhiều entity/scene, dùng:

```http
POST /api/requests/batch
```

Sau đó poll:

```http
GET /api/requests/batch-status
```

Không tự viết script spam từng request liên tục.

### media_id luôn là UUID

`media_id` đúng dạng:

```txt
xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx
```

Không dùng string kiểu `CAMS...`.

### Mặc định nên dùng vertical 9:16

FlowKit mặc định Shorts-first.

Nên gửi rõ:

```json
{
  "aspect_ratio": "IMAGE_ASPECT_RATIO_PORTRAIT",
  "orientation": "VERTICAL"
}
```

## 4. API chính

### Health

```http
GET /health
```

Dùng để kiểm tra backend và Chrome extension.

---

### Projects

```http
POST   /api/projects
GET    /api/projects
GET    /api/projects/{pid}
PATCH  /api/projects/{pid}
DELETE /api/projects/{pid}
GET    /api/projects/{pid}/characters
GET    /api/projects/{pid}/output-dir
```

Ví dụ tạo project:

```json
{
  "name": "Luna the Space Cat",
  "description": "Short video about Luna exploring a candy planet.",
  "story": "Luna lands on a candy planet, discovers a chocolate river, and plants a flag on a gummy bear mountain.",
  "material": "3d_pixar",
  "characters": [
    {
      "name": "Luna",
      "entity_type": "character",
      "description": "Small white cat with big blue eyes, wearing a tiny orange space suit with round glass helmet. Pixar-style 3D.",
      "voice_description": "Soft curious childlike voice full of wonder"
    },
    {
      "name": "Candy Planet Surface",
      "entity_type": "location",
      "description": "Alien planet surface made of colorful hard candies, lollipop trees, cotton candy clouds, pastel pink and purple sky. Pixar-style 3D."
    }
  ]
}
```

Backend tạo project trên Google Flow trước, sau đó dùng Flow `projectId` làm local project id.

---

### Characters / Entities

```http
POST   /api/characters
GET    /api/characters
GET    /api/characters/{cid}
PATCH  /api/characters/{cid}
DELETE /api/characters/{cid}
GET    /api/projects/{pid}/characters
```

`entity_type` hỗ trợ:

```txt
character
location
creature
visual_asset
generic_troop
faction
```

Quy tắc:

- `description` chỉ mô tả ngoại hình/hình dạng.
- Không ghi hành động theo scene vào character description.
- Scene prompt sẽ mô tả hành động.

---

### Videos

```http
POST   /api/videos
GET    /api/videos?project_id=<PID>
GET    /api/videos/{vid}
PATCH  /api/videos/{vid}
DELETE /api/videos/{vid}
```

Ví dụ:

```json
{
  "project_id": "<PID>",
  "title": "Episode 1",
  "display_order": 0,
  "orientation": "VERTICAL"
}
```

---

### Scenes

```http
POST   /api/scenes
GET    /api/scenes?video_id=<VID>
GET    /api/scenes/{sid}
PATCH  /api/scenes/{sid}
DELETE /api/scenes/{sid}
```

Ví dụ scene đầu tiên:

```json
{
  "video_id": "<VID>",
  "display_order": 0,
  "prompt": "Luna steps out of a small rocket onto Candy Planet Surface. First footprint in candy dust. Wide shot, dramatic landing moment. Pixar 3D.",
  "video_prompt": "Wide shot of Luna emerging from a rocket onto a vast candy landscape, cotton candy clouds towering above. The camera cranes down smoothly. Luna gasps: \"Wow!\" (no subtitles). Warm golden hour light, soft pastel tones.\n\nAudio: gentle warm breeze.\nSFX: soft footsteps on crystallized sugar ground.\nNegative: subtitles, watermark, text overlay.",
  "character_names": ["Luna", "Candy Planet Surface"],
  "chain_type": "ROOT"
}
```

Ví dụ scene nối tiếp:

```json
{
  "video_id": "<VID>",
  "display_order": 1,
  "prompt": "Luna kneels at the edge of Chocolate River on Candy Planet Surface, dipping a paw in. Surprised expression. Warm lighting. Pixar 3D.",
  "video_prompt": "Over-the-shoulder shot, Luna kneels at Chocolate River edge on Candy Planet Surface, steam rising. Luna asks: \"What is this?\" (no subtitles). Then cut to close-up as her paw dips into chocolate. Warm reflected light.\n\nAudio: gentle river bubbling.\nSFX: soft chocolate splash.\nNegative: subtitles, watermark, text overlay.",
  "character_names": ["Luna", "Candy Planet Surface", "Chocolate River"],
  "chain_type": "CONTINUATION",
  "parent_scene_id": "<SCENE_1_ID>"
}
```

Quy tắc chain:

- `ROOT`: scene độc lập hoặc mở đầu chain.
- `CONTINUATION`: cùng nhân vật/góc nhìn/location tiếp diễn.
- Không chain hai nhân vật chính khác nhau vì dễ làm drift/morph mặt.
- Prompt nên viết bằng tiếng Anh.

---

### Requests / Generation Queue

```http
POST  /api/requests
POST  /api/requests/batch
GET   /api/requests
GET   /api/requests/pending
GET   /api/requests/batch-status
GET   /api/requests/{rid}
PATCH /api/requests/{rid}
```

Request status:

```txt
PENDING -> PROCESSING -> COMPLETED | FAILED
```

Request types chính:

```txt
GENERATE_CHARACTER_IMAGE
REGENERATE_CHARACTER_IMAGE
EDIT_CHARACTER_IMAGE

GENERATE_IMAGE
REGENERATE_IMAGE
EDIT_IMAGE

GENERATE_VIDEO
REGENERATE_VIDEO
GENERATE_VIDEO_REFS

UPSCALE_VIDEO
```

## 5. Luồng tích hợp chuẩn

### Step 0: Check health

```http
GET /health
```

Nếu `extension_connected` không true, báo user mở Chrome extension và Google Flow trước.

---

### Step 1: Create project

```http
POST /api/projects
```

Lưu lại `project_id` từ response.

---

### Step 2: Create video

```http
POST /api/videos
```

Body:

```json
{
  "project_id": "<PID>",
  "title": "Video title",
  "display_order": 0,
  "orientation": "VERTICAL"
}
```

Lưu lại `video_id`.

---

### Step 3: Create scenes

```http
POST /api/scenes
```

Tạo toàn bộ scenes trước khi generate.

Sau khi tạo xong có thể review và PATCH lại prompt:

```http
PATCH /api/scenes/{sid}
```

Các field thường patch:

```txt
prompt
video_prompt
transition_prompt
image_prompt
character_names
narrator_text
display_order
chain_type
parent_scene_id
```

---

### Step 4: Generate reference images

Lấy entities:

```http
GET /api/projects/{pid}/characters
```

Submit batch:

```http
POST /api/requests/batch
```

Body:

```json
{
  "requests": [
    {
      "type": "GENERATE_CHARACTER_IMAGE",
      "character_id": "<CID1>",
      "project_id": "<PID>"
    },
    {
      "type": "GENERATE_CHARACTER_IMAGE",
      "character_id": "<CID2>",
      "project_id": "<PID>"
    }
  ]
}
```

Poll:

```http
GET /api/requests/batch-status?project_id=<PID>&type=GENERATE_CHARACTER_IMAGE
```

Sau khi done, gọi lại:

```http
GET /api/projects/{pid}/characters
```

Đảm bảo tất cả entity có `media_id` UUID.

---

### Step 5: Generate scene images

Submit batch:

```http
POST /api/requests/batch
```

Body:

```json
{
  "requests": [
    {
      "type": "GENERATE_IMAGE",
      "scene_id": "<SID1>",
      "project_id": "<PID>",
      "video_id": "<VID>",
      "orientation": "VERTICAL"
    },
    {
      "type": "GENERATE_IMAGE",
      "scene_id": "<SID2>",
      "project_id": "<PID>",
      "video_id": "<VID>",
      "orientation": "VERTICAL"
    }
  ]
}
```

Poll:

```http
GET /api/requests/batch-status?video_id=<VID>&type=GENERATE_IMAGE&orientation=VERTICAL
```

Verify scenes:

```http
GET /api/scenes?video_id=<VID>
```

Check:

```txt
vertical_image_status == COMPLETED
vertical_image_media_id exists
```

---

### Step 6: Generate scene videos

Submit batch:

```http
POST /api/requests/batch
```

Body:

```json
{
  "requests": [
    {
      "type": "GENERATE_VIDEO",
      "scene_id": "<SID1>",
      "project_id": "<PID>",
      "video_id": "<VID>",
      "orientation": "VERTICAL"
    },
    {
      "type": "GENERATE_VIDEO",
      "scene_id": "<SID2>",
      "project_id": "<PID>",
      "video_id": "<VID>",
      "orientation": "VERTICAL"
    }
  ]
}
```

Poll:

```http
GET /api/requests/batch-status?video_id=<VID>&type=GENERATE_VIDEO&orientation=VERTICAL
```

Verify scenes:

```http
GET /api/scenes?video_id=<VID>
```

Check:

```txt
vertical_video_status == COMPLETED
vertical_video_url exists
vertical_video_media_id exists
```

---

### Step 7: Optional upscale

Submit batch:

```http
POST /api/requests/batch
```

Body:

```json
{
  "requests": [
    {
      "type": "UPSCALE_VIDEO",
      "scene_id": "<SID1>",
      "project_id": "<PID>",
      "video_id": "<VID>",
      "orientation": "VERTICAL"
    }
  ]
}
```

Chỉ dùng nếu Google Flow account/tier hỗ trợ upscale.

---

### Step 8: Output/download

Lấy output dir:

```http
GET /api/projects/{pid}/output-dir
```

Lấy scene URLs:

```http
GET /api/scenes?video_id=<VID>
```

Các field URL thường dùng:

```txt
vertical_video_url
vertical_upscale_url
horizontal_video_url
horizontal_upscale_url
```

Nếu muốn concat bằng FlowKit, dùng logic tương ứng skill `fk-concat`.

## 6. Direct Flow API

Có nhóm API direct bypass queue:

```http
GET  /api/flow/status
GET  /api/flow/credits
POST /api/flow/generate-image
POST /api/flow/generate-video
POST /api/flow/generate-video-refs
POST /api/flow/upscale-video
POST /api/flow/check-status
POST /api/flow/refresh-urls/{project_id}
GET  /api/flow/media/{media_id}
POST /api/flow/edit-image
POST /api/flow/upload-image
POST /api/flow/upload-image-binary
```

Khuyến nghị cho app tích hợp: ưu tiên dùng queue `/api/requests/batch`, vì backend đã xử lý throttle, cooldown, retry và trạng thái.

## 7. Cloudflare Tunnel cho public frontend

Kiến trúc:

```txt
FE public / browser
  -> HTTPS
https://YOUR_FLOWKIT_API_DOMAIN
  -> Cloudflare Tunnel
cloudflared container
  -> Docker network
http://flowkit:8100
  -> local WS bridge
Chrome extension -> ws://127.0.0.1:9222
```

Chỉ expose API `8100`, không expose WS `9222`.

`.env`:

```env
CLOUDFLARE_TUNNEL_TOKEN=...
FLOWKIT_PUBLIC_API_URL=https://YOUR_FLOWKIT_API_DOMAIN
```

Start:

```bash
docker compose up -d
```

Check local:

```bash
curl http://127.0.0.1:8100/health
```

Check public:

```bash
curl https://YOUR_FLOWKIT_API_DOMAIN/health
```

Nếu API public, nên bật Cloudflare Access vì FlowKit API hiện không có auth built-in.

## 8. Error handling

FastAPI error format:

```json
{
  "detail": "error message"
}
```

Common HTTP codes:

```txt
400 bad input
404 resource not found
409 duplicate active request
502 Flow API error
503 extension not connected
```

Các lỗi cần diagnose kỹ:

```txt
request FAILED
stuck PROCESSING
extension_connected: false
HTTP 4xx/5xx
UNSAFE_GENERATION
not found
CAPTCHA
NO_FLOW_KEY
```

Với các lỗi này, đọc logic trong:

```txt
skills/fk-doctor.md
```

## 9. Gợi ý client wrapper

Một app ngoài nên có wrapper kiểu:

```ts
class FlowKitClient {
  health() {}
  createProject(payload) {}
  createVideo(payload) {}
  createScene(payload) {}
  listScenes(videoId) {}
  listProjectEntities(projectId) {}
  submitBatchRequests(requests) {}
  getBatchStatus(params) {}
  getRequest(requestId) {}
  getOutputDir(projectId) {}
  refreshUrls(projectId) {}
}
```

Luồng UI/backend tích hợp:

```txt
Health check
  -> Create project
  -> Create video
  -> Create scenes
  -> Generate references
  -> Poll batch status
  -> Generate scene images
  -> Poll batch status
  -> Generate scene videos
  -> Poll batch status
  -> Optional review/upscale
  -> Download/concat/export
```

## 10. Prompt rules quan trọng

### Character/entity description

Chỉ mô tả ngoại hình:

```txt
Small white cat with big blue eyes, wearing a tiny orange space suit.
```

Không viết:

```txt
Luna lands on the planet and discovers chocolate river.
```

### Scene prompt

Mô tả action + environment + camera:

```txt
Luna kneels at the edge of Chocolate River, dipping a paw in. Warm light reflects off the chocolate surface. Medium shot, low angle.
```

Không mô tả lại appearance nếu đã có reference image.

### Video prompt

Nên có:

- Camera/shot
- Action
- Setting
- Lighting
- Audio
- SFX
- Negative

Ví dụ:

```txt
Wide shot of Luna emerging from a rocket onto a vast candy landscape, cotton candy clouds towering above. The camera cranes down smoothly. Luna gasps: "Wow!" (no subtitles). Then cut to low angle tracking shot as she takes her first steps on candy ground. Warm golden hour light, soft pastel tones.

Audio: gentle warm breeze, faint magical shimmer.
SFX: soft footsteps on crystallized sugar ground.
Negative: subtitles, watermark, text overlay.
```

## 11. Minimal end-to-end API sequence

```txt
GET  /health
POST /api/projects
POST /api/videos
POST /api/scenes
POST /api/scenes
POST /api/scenes
GET  /api/projects/{pid}/characters
POST /api/requests/batch                     # GENERATE_CHARACTER_IMAGE
GET  /api/requests/batch-status?...          # poll refs
POST /api/requests/batch                     # GENERATE_IMAGE
GET  /api/requests/batch-status?...          # poll images
POST /api/requests/batch                     # GENERATE_VIDEO
GET  /api/requests/batch-status?...          # poll videos
GET  /api/scenes?video_id={vid}              # collect URLs
GET  /api/projects/{pid}/output-dir
```
