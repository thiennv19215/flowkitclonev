import { api } from './client'
import type {
  Project,
  ProjectCreate,
  ProjectUpdate,
  Character,
  CharacterCreate,
  CharacterUpdate,
  Video,
  VideoCreate,
  VideoUpdate,
  Scene,
  SceneCreate,
  SceneUpdate,
  Request,
  RequestCreate,
  RequestUpdate,
  BatchRequestCreate,
  BatchStatus,
  Material,
  MaterialCreateRequest,
  FlowStatus,
  FlowCredits,
  GenerateImageRequest,
  GenerateVideoRequest,
  GenerateVideoRefsRequest,
  UpscaleVideoRequest,
  UploadImageBinaryRequest,
  UploadImageResponse,
  ThumbnailRequest,
  ThumbnailResponse,
  HealthResponse,
  ModelsConfig,
  ProjectStatus,
} from '@/types/api'

// ============ HEALTH ============

export const health = {
  check: () => api.get<HealthResponse>('/health'),
}

// ============ PROJECTS ============

export const projects = {
  list: (status?: ProjectStatus) =>
    api.get<Project[]>(status ? `/api/projects?status=${status}` : '/api/projects'),
  get: (id: string) => api.get<Project>(`/api/projects/${id}`),
  create: (body: ProjectCreate) => api.post<Project>('/api/projects', body),
  update: (id: string, body: ProjectUpdate) =>
    api.patch<Project>(`/api/projects/${id}`, body),
  delete: (id: string) => api.delete<{ ok: true }>(`/api/projects/${id}`),
  characters: (id: string) => api.get<Character[]>(`/api/projects/${id}/characters`),
  linkCharacter: (pid: string, cid: string) =>
    api.post<{ ok: true }>(`/api/projects/${pid}/characters/${cid}`),
  unlinkCharacter: (pid: string, cid: string) =>
    api.delete<{ ok: true }>(`/api/projects/${pid}/characters/${cid}`),
  outputDir: (id: string) =>
    api.get<{ slug: string; path: string; meta: Record<string, unknown> }>(
      `/api/projects/${id}/output-dir`,
    ),
  generateThumbnail: (id: string, body: ThumbnailRequest) =>
    api.post<ThumbnailResponse>(`/api/projects/${id}/generate-thumbnail`, body),
}

// ============ CHARACTERS ============

export const characters = {
  list: () => api.get<Character[]>('/api/characters'),
  get: (id: string) => api.get<Character>(`/api/characters/${id}`),
  create: (body: CharacterCreate) => api.post<Character>('/api/characters', body),
  update: (id: string, body: CharacterUpdate) =>
    api.patch<Character>(`/api/characters/${id}`, body),
  delete: (id: string) => api.delete<{ ok: true }>(`/api/characters/${id}`),
}

// ============ VIDEOS ============

export const videos = {
  listByProject: (projectId: string) =>
    api.get<Video[]>(`/api/videos?project_id=${projectId}`),
  get: (id: string) => api.get<Video>(`/api/videos/${id}`),
  create: (body: VideoCreate) => api.post<Video>('/api/videos', body),
  update: (id: string, body: VideoUpdate) =>
    api.patch<Video>(`/api/videos/${id}`, body),
  delete: (id: string) => api.delete<{ ok: true }>(`/api/videos/${id}`),
}

// ============ SCENES ============

export const scenes = {
  listByVideo: (videoId: string) => api.get<Scene[]>(`/api/scenes?video_id=${videoId}`),
  get: (id: string) => api.get<Scene>(`/api/scenes/${id}`),
  create: (body: SceneCreate) => api.post<Scene>('/api/scenes', body),
  update: (id: string, body: SceneUpdate) =>
    api.patch<Scene>(`/api/scenes/${id}`, body),
  delete: (id: string) => api.delete<{ ok: true }>(`/api/scenes/${id}`),
  cleanup: (videoId: string, source: 'system' | 'user' = 'system') =>
    api.delete<{ deleted: number; remaining: number }>(
      `/api/scenes?video_id=${videoId}&source=${source}`,
    ),
}

// ============ REQUESTS (queue) ============

export interface RequestListFilter {
  scene_id?: string
  status?: string
  video_id?: string
  project_id?: string
}

export const requests = {
  list: (filter: RequestListFilter = {}) => {
    const qs = new URLSearchParams()
    Object.entries(filter).forEach(([k, v]) => {
      if (v) qs.set(k, v)
    })
    const suffix = qs.toString() ? `?${qs.toString()}` : ''
    return api.get<Request[]>(`/api/requests${suffix}`)
  },
  pending: () => api.get<Request[]>('/api/requests/pending'),
  batchStatus: (
    filter: { video_id?: string; project_id?: string; type?: string; orientation?: string } = {},
  ) => {
    const qs = new URLSearchParams()
    Object.entries(filter).forEach(([k, v]) => {
      if (v) qs.set(k, v)
    })
    const suffix = qs.toString() ? `?${qs.toString()}` : ''
    return api.get<BatchStatus>(`/api/requests/batch-status${suffix}`)
  },
  get: (id: string) => api.get<Request>(`/api/requests/${id}`),
  create: (body: RequestCreate) => api.post<Request>('/api/requests', body),
  createBatch: (body: BatchRequestCreate) =>
    api.post<Request[]>('/api/requests/batch', body),
  update: (id: string, body: RequestUpdate) =>
    api.patch<Request>(`/api/requests/${id}`, body),
}

// ============ MATERIALS ============

export const materials = {
  list: () => api.get<Material[]>('/api/materials'),
  get: (id: string) => api.get<Material>(`/api/materials/${id}`),
  create: (body: MaterialCreateRequest) => api.post<Material>('/api/materials', body),
  delete: (id: string) => api.delete<{ ok: true }>(`/api/materials/${id}`),
}

// ============ FLOW (direct API + extension status) ============

export const flow = {
  status: () => api.get<FlowStatus>('/api/flow/status'),
  credits: () => api.get<FlowCredits>('/api/flow/credits'),
  generateImage: (body: GenerateImageRequest) =>
    api.post<unknown>('/api/flow/generate-image', body),
  generateVideo: (body: GenerateVideoRequest) =>
    api.post<unknown>('/api/flow/generate-video', body),
  generateVideoRefs: (body: GenerateVideoRefsRequest) =>
    api.post<unknown>('/api/flow/generate-video-refs', body),
  upscaleVideo: (body: UpscaleVideoRequest) =>
    api.post<unknown>('/api/flow/upscale-video', body),
  checkStatus: (operations: unknown[]) =>
    api.post<unknown>('/api/flow/check-status', { operations }),
  refreshUrls: (projectId: string) =>
    api.post<unknown>(`/api/flow/refresh-urls/${projectId}`),
  getMedia: (mediaId: string) => api.get<unknown>(`/api/flow/media/${mediaId}`),
  uploadImageBinary: (body: UploadImageBinaryRequest) =>
    api.post<UploadImageResponse>('/api/flow/upload-image-binary', body),
}

// ============ MODELS CONFIG ============

export const models = {
  get: () => api.get<ModelsConfig>('/api/models'),
  patch: (body: Partial<ModelsConfig>) => api.patch<{ status: string; models: ModelsConfig }>(
    '/api/models',
    body,
  ),
}
