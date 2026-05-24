import {
  useQuery,
  useMutation,
  useQueryClient,
  type UseQueryOptions,
} from '@tanstack/react-query'
import {
  projects,
  characters,
  videos,
  scenes,
  requests,
  materials,
  flow,
  health,
  models,
  type RequestListFilter,
} from './endpoints'
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
  FlowStatus,
  FlowCredits,
  ProjectStatus,
  HealthResponse,
} from '@/types/api'

// ============ KEYS ============

export const qk = {
  health: ['health'] as const,
  flowStatus: ['flow', 'status'] as const,
  flowCredits: ['flow', 'credits'] as const,
  models: ['models'] as const,
  projects: (status?: ProjectStatus) => ['projects', status ?? 'all'] as const,
  project: (id: string) => ['project', id] as const,
  projectCharacters: (id: string) => ['project', id, 'characters'] as const,
  characters: ['characters'] as const,
  character: (id: string) => ['character', id] as const,
  videos: (projectId: string) => ['videos', projectId] as const,
  video: (id: string) => ['video', id] as const,
  scenes: (videoId: string) => ['scenes', videoId] as const,
  scene: (id: string) => ['scene', id] as const,
  requests: (filter: RequestListFilter) => ['requests', filter] as const,
  requestsPending: ['requests', 'pending'] as const,
  batchStatus: (filter: Record<string, unknown>) => ['requests', 'batch-status', filter] as const,
  request: (id: string) => ['request', id] as const,
  materials: ['materials'] as const,
  material: (id: string) => ['material', id] as const,
}

// ============ HEALTH + FLOW ============

export function useHealth(options?: { refetchIntervalMs?: number }) {
  return useQuery<HealthResponse>({
    queryKey: qk.health,
    queryFn: health.check,
    refetchInterval: options?.refetchIntervalMs ?? 5000,
    retry: false,
  })
}

export function useFlowStatus(options?: { refetchIntervalMs?: number }) {
  return useQuery<FlowStatus>({
    queryKey: qk.flowStatus,
    queryFn: flow.status,
    refetchInterval: options?.refetchIntervalMs ?? 10_000,
  })
}

export function useFlowCredits() {
  return useQuery<FlowCredits>({
    queryKey: qk.flowCredits,
    queryFn: flow.credits,
    refetchInterval: 30_000,
    retry: false,
  })
}

// ============ PROJECTS ============

export function useProjects(status?: ProjectStatus) {
  return useQuery<Project[]>({
    queryKey: qk.projects(status),
    queryFn: () => projects.list(status),
  })
}

export function useProject(id: string | undefined, options?: Partial<UseQueryOptions<Project>>) {
  return useQuery<Project>({
    queryKey: qk.project(id ?? ''),
    queryFn: () => projects.get(id as string),
    enabled: !!id,
    ...options,
  })
}

export function useProjectCharacters(id: string | undefined) {
  return useQuery<Character[]>({
    queryKey: qk.projectCharacters(id ?? ''),
    queryFn: () => projects.characters(id as string),
    enabled: !!id,
  })
}

export function useCreateProject() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (body: ProjectCreate) => projects.create(body),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['projects'] })
    },
  })
}

export function useUpdateProject(id: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (body: ProjectUpdate) => projects.update(id, body),
    onSuccess: (data) => {
      qc.setQueryData(qk.project(id), data)
      qc.invalidateQueries({ queryKey: ['projects'] })
    },
  })
}

export function useDeleteProject() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => projects.delete(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['projects'] })
    },
  })
}

// ============ CHARACTERS ============

export function useCharacters() {
  return useQuery<Character[]>({
    queryKey: qk.characters,
    queryFn: characters.list,
  })
}

export function useCreateCharacter() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (body: CharacterCreate) => characters.create(body),
    onSuccess: () => qc.invalidateQueries({ queryKey: qk.characters }),
  })
}

export function useUpdateCharacter(id: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (body: CharacterUpdate) => characters.update(id, body),
    onSuccess: (data) => {
      qc.setQueryData(qk.character(id), data)
      qc.invalidateQueries({ queryKey: qk.characters })
    },
  })
}

export function useDeleteCharacter() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => characters.delete(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: qk.characters }),
  })
}

// ============ VIDEOS ============

export function useVideos(projectId: string | undefined) {
  return useQuery<Video[]>({
    queryKey: qk.videos(projectId ?? ''),
    queryFn: () => videos.listByProject(projectId as string),
    enabled: !!projectId,
  })
}

export function useVideo(id: string | undefined) {
  return useQuery<Video>({
    queryKey: qk.video(id ?? ''),
    queryFn: () => videos.get(id as string),
    enabled: !!id,
  })
}

export function useCreateVideo() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (body: VideoCreate) => videos.create(body),
    onSuccess: (data) => qc.invalidateQueries({ queryKey: qk.videos(data.project_id) }),
  })
}

export function useUpdateVideo(id: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (body: VideoUpdate) => videos.update(id, body),
    onSuccess: (data) => {
      qc.setQueryData(qk.video(id), data)
      qc.invalidateQueries({ queryKey: qk.videos(data.project_id) })
    },
  })
}

// ============ SCENES ============

export function useScenes(videoId: string | undefined) {
  return useQuery<Scene[]>({
    queryKey: qk.scenes(videoId ?? ''),
    queryFn: () => scenes.listByVideo(videoId as string),
    enabled: !!videoId,
  })
}

export function useCreateScene() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (body: SceneCreate) => scenes.create(body),
    onSuccess: (data) => qc.invalidateQueries({ queryKey: qk.scenes(data.video_id) }),
  })
}

export function useUpdateScene(id: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (body: SceneUpdate) => scenes.update(id, body),
    onSuccess: (data) => {
      qc.setQueryData(qk.scene(id), data)
      qc.invalidateQueries({ queryKey: qk.scenes(data.video_id) })
    },
  })
}

export function useDeleteScene(videoId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => scenes.delete(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: qk.scenes(videoId) }),
  })
}

// ============ REQUESTS (queue) ============

export function useRequests(filter: RequestListFilter = {}, refetchIntervalMs = 0) {
  return useQuery<Request[]>({
    queryKey: qk.requests(filter),
    queryFn: () => requests.list(filter),
    refetchInterval: refetchIntervalMs > 0 ? refetchIntervalMs : false,
  })
}

export function usePendingRequests(refetchIntervalMs = 3000) {
  return useQuery<Request[]>({
    queryKey: qk.requestsPending,
    queryFn: requests.pending,
    refetchInterval: refetchIntervalMs,
  })
}

export function useBatchStatus(
  filter: { video_id?: string; project_id?: string; type?: string; orientation?: string },
  refetchIntervalMs = 2500,
) {
  return useQuery<BatchStatus>({
    queryKey: qk.batchStatus(filter),
    queryFn: () => requests.batchStatus(filter),
    refetchInterval: refetchIntervalMs,
    enabled: !!(filter.video_id || filter.project_id),
  })
}

export function useRequest(id: string | undefined, refetchIntervalMs = 0) {
  return useQuery<Request>({
    queryKey: qk.request(id ?? ''),
    queryFn: () => requests.get(id as string),
    enabled: !!id,
    refetchInterval: refetchIntervalMs > 0 ? refetchIntervalMs : false,
  })
}

export function useCreateRequest() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (body: RequestCreate) => requests.create(body),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['requests'] }),
  })
}

export function useCreateBatchRequests() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (body: BatchRequestCreate) => requests.createBatch(body),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['requests'] }),
  })
}

export function useUpdateRequest(id: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (body: RequestUpdate) => requests.update(id, body),
    onSuccess: (data) => {
      qc.setQueryData(qk.request(id), data)
      qc.invalidateQueries({ queryKey: ['requests'] })
    },
  })
}

// ============ MATERIALS ============

export function useMaterials() {
  return useQuery<Material[]>({
    queryKey: qk.materials,
    queryFn: materials.list,
    staleTime: 5 * 60 * 1000,
  })
}

// ============ MODELS ============

export function useModels() {
  return useQuery({
    queryKey: qk.models,
    queryFn: models.get,
    staleTime: 60_000,
  })
}
