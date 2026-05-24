# FlowKit Backend API Reference

> Base URL: `http://127.0.0.1:8100`
> All routers mounted under `/api` prefix (so `/projects` → `/api/projects`)
> WebSocket: `ws://127.0.0.1:9222` (extension bridge)

## Defaults

| Setting | Default | Notes |
|---------|---------|-------|
| Image aspect ratio | `IMAGE_ASPECT_RATIO_PORTRAIT` | UI label: **9:16** |
| Video orientation | `VERTICAL` | Maps to `VIDEO_ASPECT_RATIO_PORTRAIT` (**9:16**) |
| Fallback if tool omits ratio | Use **9:16** | Do not assume landscape; FlowKit is Shorts-first by default. |

When integrating a custom tool, always send these explicitly unless the user chooses otherwise:

```json
{
  "aspect_ratio": "IMAGE_ASPECT_RATIO_PORTRAIT",
  "orientation": "VERTICAL"
}
```

## Health

| Method | Path | Description |
|--------|------|-------------|
| GET | `/health` | Returns `{extension_connected: bool}` |

## Projects

| Method | Path | Body | Returns |
|--------|------|------|---------|
| POST | `/api/projects` | `ProjectCreate` | `Project` |
| GET | `/api/projects?status=ACTIVE` | — | `Project[]` |
| GET | `/api/projects/{pid}` | — | `Project` |
| PATCH | `/api/projects/{pid}` | `ProjectUpdate` | `Project` |
| DELETE | `/api/projects/{pid}` | — | `{ok: true}` |
| POST | `/api/projects/{pid}/characters/{cid}` | — | Link existing character |
| DELETE | `/api/projects/{pid}/characters/{cid}` | — | Unlink character |
| GET | `/api/projects/{pid}/characters` | — | `Character[]` |
| GET | `/api/projects/{pid}/output-dir` | — | `{slug, path, meta}` |
| POST | `/api/projects/{pid}/generate-thumbnail` | `ThumbnailRequest` | `ThumbnailResponse` |

**Project creation flow:** Backend creates project on Google Flow first → uses returned `projectId` as local id → then creates linked character entities with auto-generated profiles.

**Note:** Requires extension connected (HTTP 503 otherwise).

## Characters (Entities)

`entity_type` covers: character, location, creature, visual_asset, generic_troop, faction.

| Method | Path | Body | Returns |
|--------|------|------|---------|
| POST | `/api/characters` | `CharacterCreate` | `Character` |
| GET | `/api/characters` | — | `Character[]` (all, ordered by created_at DESC) |
| GET | `/api/characters/{cid}` | — | `Character` |
| PATCH | `/api/characters/{cid}` | `CharacterUpdate` | `Character` (re-slugs if name changes) |
| DELETE | `/api/characters/{cid}` | — | `{ok: true}` |

## Videos

| Method | Path | Body | Returns |
|--------|------|------|---------|
| POST | `/api/videos` | `VideoCreate` | `Video` |
| GET | `/api/videos?project_id=X` | — | `Video[]` |
| GET | `/api/videos/{vid}` | — | `Video` |
| PATCH | `/api/videos/{vid}` | `VideoUpdate` | `Video` |
| DELETE | `/api/videos/{vid}` | — | `{ok: true}` |

## Scenes

| Method | Path | Body | Returns |
|--------|------|------|---------|
| POST | `/api/scenes` | `SceneCreate` | `Scene` (auto-prefixes material; auto-shifts on INSERT) |
| GET | `/api/scenes?video_id=X` | — | `Scene[]` |
| GET | `/api/scenes/{sid}` | — | `Scene` |
| PATCH | `/api/scenes/{sid}` | `SceneUpdate` | `Scene` (use `null` to clear fields) |
| DELETE | `/api/scenes/{sid}` | — | `{ok: true}` |
| DELETE | `/api/scenes?video_id=X&source=system` | — | Bulk delete + re-compact `display_order` |

## Requests (Generation Queue)

The queue worker throttles: max 5 concurrent, 10s cooldown, retry with exponential backoff.

| Method | Path | Body | Returns |
|--------|------|------|---------|
| POST | `/api/requests` | `RequestCreate` | `Request` (409 if active dup exists) |
| POST | `/api/requests/batch` | `{requests: RequestCreate[]}` | `Request[]` (idempotent — skips dups) |
| GET | `/api/requests?scene_id=X&status=Y&video_id=Z&project_id=W` | — | `Request[]` |
| GET | `/api/requests/pending` | — | `Request[]` |
| GET | `/api/requests/batch-status?video_id=X&type=Y&orientation=Z` | — | `BatchStatus` (use to poll bulk progress) |
| GET | `/api/requests/{rid}` | — | `Request` |
| PATCH | `/api/requests/{rid}` | `RequestUpdate` | `Request` |

### Required Fields by RequestType

| Type | Required |
|------|----------|
| GENERATE_CHARACTER_IMAGE / REGENERATE_CHARACTER_IMAGE / EDIT_CHARACTER_IMAGE | `character_id`, `project_id` |
| GENERATE_IMAGE / REGENERATE_IMAGE / EDIT_IMAGE | `scene_id`, `project_id`, `video_id` |
| GENERATE_VIDEO / REGENERATE_VIDEO / GENERATE_VIDEO_REFS / UPSCALE_VIDEO | `scene_id`, `project_id`, `video_id` |

**Always pass `orientation` (`VERTICAL` | `HORIZONTAL`)** for image/video gen — server auto-syncs to video table.

## Flow (Direct API — bypass queue)

| Method | Path | Body | Description |
|--------|------|------|-------------|
| GET | `/api/flow/status` | — | `{connected, flow_key_present}` |
| GET | `/api/flow/credits` | — | Raw credits payload (includes `userPaygateTier`) |
| POST | `/api/flow/generate-image` | `GenerateImageRequest` | Synchronous image gen |
| POST | `/api/flow/generate-video` | `GenerateVideoRequest` | Submit video gen, returns operations |
| POST | `/api/flow/generate-video-refs` | `GenerateVideoRefsRequest` | Submit r2v video gen |
| POST | `/api/flow/upscale-video` | `UpscaleVideoRequest` | Submit upscale |
| POST | `/api/flow/check-status` | `{operations: [...]}` | Poll video gen status |
| POST | `/api/flow/refresh-urls/{project_id}` | — | Bulk refresh signed URLs |
| GET | `/api/flow/media/{media_id}` | — | Fetch fresh signed URL for one media |
| POST | `/api/flow/edit-image` | `EditImageRequest` | Edit existing image |
| POST | `/api/flow/upload-image` | `UploadImageRequest` (file_path) | Upload local file → media_id |
| POST | `/api/flow/upload-image-binary` | `UploadImageBinaryRequest` (base64) | Upload base64 → media_id |

## Materials (visual styles)

| Method | Path | Body | Returns |
|--------|------|------|---------|
| GET | `/api/materials` | — | `Material[]` |
| GET | `/api/materials/{id}` | — | `Material` |
| POST | `/api/materials` | `MaterialCreateRequest` | `Material` (max 50 custom, 400 if id clashes builtin) |
| DELETE | `/api/materials/{id}` | — | `{ok: true}` (builtin not deletable) |

Built-in IDs: `realistic`, `3d_pixar`, `anime`, etc. (custom IDs must match `^[a-z][a-z0-9_]{1,63}$`).

## Models Config

| Method | Path | Body | Description |
|--------|------|------|-------------|
| GET | `/api/models` | — | Current model keys (video/image/upscale) |
| PATCH | `/api/models` | Partial nested dict | Deep merge + hot-reload |

## WebSocket (port 9222)

The Python agent connects to the Chrome extension over `ws://127.0.0.1:9222`. Frontend should NOT connect directly. Instead, use HTTP polling or `GET /api/requests/batch-status` for queue progress.

**Frontend strategy for live updates:**
- Poll `/api/requests/batch-status?video_id=X` every 2-3s during active generation
- Or watch individual request via `GET /api/requests/{rid}` until `status === "COMPLETED"`

## Status Enum (StatusType)

`PENDING` → `PROCESSING` → `COMPLETED` | `FAILED`

## Error Format

FastAPI default — `{detail: "string" | [{msg, type, ...}]}` with appropriate HTTP code (400/404/409/502/503).

Common codes:
- 400 — bad input
- 404 — resource not found
- 409 — duplicate active request
- 502 — Flow API error
- 503 — extension not connected

## UUID Notes

- All `media_id` and resource IDs are UUID v4 — never accept `CAMS...` legacy strings.
- Project ID = the Flow-assigned `projectId` (string, UUID format).

## Material auto-prefix

When creating a Scene, the backend auto-prepends the project's `material.scene_prefix` to `prompt` if not already present. Frontend doesn't need to do this manually.
