import { useState } from 'react'
import { useParams, useSearchParams, NavLink } from 'react-router-dom'
import {
  useProject,
  useVideos,
  useScenes,
  useBatchStatus,
  useCreateBatchRequests,
  useRequests,
} from '@/api/hooks'
import {
  ArrowLeft,
  Image as ImageIcon,
  Video as VideoIcon,
  Loader2,
  Play,
  RotateCcw,
  CheckCircle2,
  XCircle,
  Clock,
  Zap,
} from 'lucide-react'
import type { Orientation, RequestType, Scene, BatchRequestCreate } from '@/types/api'

export default function Pipeline() {
  const { id: pid } = useParams<{ id: string }>()
  const [search] = useSearchParams()
  const videoIdFromQuery = search.get('video') ?? undefined

  const { data: project } = useProject(pid)
  const { data: videos } = useVideos(pid)
  const videoId = videoIdFromQuery ?? videos?.[0]?.id
  const { data: scenes } = useScenes(videoId)

  const [orientation, setOrientation] = useState<Orientation>('VERTICAL')
  const createBatch = useCreateBatchRequests()
  const [submitting, setSubmitting] = useState<string | null>(null)

  const triggerBatch = async (type: RequestType, scenesArg: Scene[] | undefined) => {
    if (!pid || !videoId || !scenesArg?.length) return
    setSubmitting(type)
    try {
      const body: BatchRequestCreate = {
        requests: scenesArg.map((s) => ({
          type,
          scene_id: s.id,
          project_id: pid,
          video_id: videoId,
          orientation,
        })),
      }
      await createBatch.mutateAsync(body)
    } finally {
      setSubmitting(null)
    }
  }

  if (!pid) return <div className="p-6 text-text-secondary">No project.</div>

  return (
    <div className="flex flex-col h-full">
      <header className="border-b border-border bg-bg-secondary px-6 py-3 flex items-center gap-4">
        <NavLink
          to={`/project/${pid}`}
          className="flex items-center gap-1 text-text-secondary hover:text-text-primary text-sm"
        >
          <ArrowLeft size={14} />
          Back
        </NavLink>
        <div className="flex-1 min-w-0">
          <div className="text-sm font-medium truncate">
            Pipeline · {project?.name ?? '...'}
          </div>
          <div className="text-xs text-text-secondary">
            {scenes?.length ?? 0} scenes
          </div>
        </div>
        <OrientationToggle value={orientation} onChange={setOrientation} />
      </header>

      <div className="flex-1 overflow-auto p-6 space-y-6">
        {/* Batch progress */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <BatchProgressCard
            videoId={videoId}
            type="GENERATE_IMAGE"
            orientation={orientation}
            label="Scene Images"
            icon={<ImageIcon size={16} />}
            onTrigger={() => triggerBatch('GENERATE_IMAGE', scenes)}
            triggering={submitting === 'GENERATE_IMAGE'}
          />
          <BatchProgressCard
            videoId={videoId}
            type="GENERATE_VIDEO"
            orientation={orientation}
            label="Scene Videos"
            icon={<VideoIcon size={16} />}
            onTrigger={() => triggerBatch('GENERATE_VIDEO', scenes)}
            triggering={submitting === 'GENERATE_VIDEO'}
          />
          <BatchProgressCard
            videoId={videoId}
            type="UPSCALE_VIDEO"
            orientation={orientation}
            label="Upscale 4K"
            icon={<Zap size={16} />}
            onTrigger={() => triggerBatch('UPSCALE_VIDEO', scenes)}
            triggering={submitting === 'UPSCALE_VIDEO'}
          />
        </div>

        {/* Queue activity */}
        <ActiveQueue videoId={videoId} />

        {/* Scene-level details */}
        <SceneTable scenes={scenes ?? []} orientation={orientation} />
      </div>
    </div>
  )
}

// ============ Orientation toggle ============

function OrientationToggle({
  value,
  onChange,
}: {
  value: Orientation
  onChange: (v: Orientation) => void
}) {
  return (
    <div className="flex gap-1 bg-bg-tertiary border border-border rounded-md p-0.5">
      {(['VERTICAL', 'HORIZONTAL'] as Orientation[]).map((o) => (
        <button
          key={o}
          onClick={() => onChange(o)}
          className={`px-2.5 py-1 rounded text-xs font-medium transition-colors ${
            value === o
              ? 'bg-accent-purple text-white'
              : 'text-text-secondary hover:text-text-primary'
          }`}
        >
          {o === 'VERTICAL' ? '9:16' : '16:9'}
        </button>
      ))}
    </div>
  )
}

// ============ Batch progress card ============

function BatchProgressCard({
  videoId,
  type,
  orientation,
  label,
  icon,
  onTrigger,
  triggering,
}: {
  videoId?: string
  type: RequestType
  orientation: Orientation
  label: string
  icon: React.ReactNode
  onTrigger: () => void
  triggering: boolean
}) {
  const { data: status } = useBatchStatus({
    video_id: videoId,
    type,
    orientation,
  })

  const total = status?.total ?? 0
  const completed = status?.completed ?? 0
  const failed = status?.failed ?? 0
  const inflight = (status?.pending ?? 0) + (status?.processing ?? 0)
  const pct = total > 0 ? Math.round((completed / total) * 100) : 0

  return (
    <div className="bg-bg-secondary border border-border rounded-lg p-4 space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-sm font-medium">
          {icon}
          {label}
        </div>
        {status?.done ? (
          <CheckCircle2 size={16} className="text-accent-green" />
        ) : inflight > 0 ? (
          <Loader2 size={16} className="animate-spin text-accent-orange" />
        ) : null}
      </div>

      {/* Progress bar */}
      <div className="space-y-1">
        <div className="flex justify-between text-xs text-text-secondary">
          <span>
            {completed}/{total}
          </span>
          <span>{pct}%</span>
        </div>
        <div className="w-full h-1.5 bg-bg-tertiary rounded-full overflow-hidden">
          <div
            className="h-full bg-accent-purple transition-all"
            style={{ width: `${pct}%` }}
          />
        </div>
      </div>

      {/* Counts */}
      <div className="flex gap-2 text-xs">
        <Pill icon={<Clock size={10} />} value={status?.pending ?? 0} cls="text-text-secondary" />
        <Pill icon={<Loader2 size={10} />} value={status?.processing ?? 0} cls="text-accent-orange" />
        <Pill icon={<CheckCircle2 size={10} />} value={completed} cls="text-accent-green" />
        <Pill icon={<XCircle size={10} />} value={failed} cls="text-accent-red" />
      </div>

      <button
        onClick={onTrigger}
        disabled={triggering || !videoId}
        className="w-full flex items-center justify-center gap-2 px-3 py-1.5 bg-accent-purple hover:bg-accent-purple/80 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-md text-xs font-medium transition-colors"
      >
        {triggering ? (
          <>
            <Loader2 size={12} className="animate-spin" />
            Submitting...
          </>
        ) : (
          <>
            <Play size={12} />
            Generate {label}
          </>
        )}
      </button>
    </div>
  )
}

function Pill({
  icon,
  value,
  cls,
}: {
  icon: React.ReactNode
  value: number
  cls: string
}) {
  return (
    <span className={`flex items-center gap-1 ${cls}`}>
      {icon}
      {value}
    </span>
  )
}

// ============ Active queue ============

function ActiveQueue({ videoId }: { videoId?: string }) {
  const { data: requests } = useRequests(
    { video_id: videoId },
    videoId ? 2500 : 0,
  )

  const active = (requests ?? []).filter(
    (r) => r.status === 'PENDING' || r.status === 'PROCESSING',
  )
  const recentFailed = (requests ?? [])
    .filter((r) => r.status === 'FAILED')
    .slice(0, 5)

  if (!videoId) return null

  return (
    <div className="space-y-3">
      <h3 className="text-sm font-medium">Active queue ({active.length})</h3>
      {active.length === 0 && recentFailed.length === 0 ? (
        <div className="text-text-secondary text-sm">Queue is idle.</div>
      ) : (
        <div className="space-y-1.5">
          {active.map((r) => (
            <RequestRow key={r.id} request={r} />
          ))}
          {recentFailed.length > 0 && (
            <>
              <div className="text-xs text-accent-red mt-3 mb-1">
                Recent failures
              </div>
              {recentFailed.map((r) => (
                <RequestRow key={r.id} request={r} />
              ))}
            </>
          )}
        </div>
      )}
    </div>
  )
}

function RequestRow({
  request: r,
}: {
  request: {
    id: string
    type: string
    status: string
    error_message?: string | null
    scene_id?: string | null
  }
}) {
  const statusIcon =
    r.status === 'PROCESSING' ? (
      <Loader2 size={12} className="animate-spin text-accent-orange" />
    ) : r.status === 'FAILED' ? (
      <XCircle size={12} className="text-accent-red" />
    ) : r.status === 'COMPLETED' ? (
      <CheckCircle2 size={12} className="text-accent-green" />
    ) : (
      <Clock size={12} className="text-text-secondary" />
    )

  return (
    <div className="flex items-center gap-3 px-3 py-1.5 bg-bg-secondary border border-border rounded-md text-xs">
      {statusIcon}
      <span className="text-text-secondary font-mono shrink-0">
        {r.id.slice(0, 8)}
      </span>
      <span className="font-medium">{r.type}</span>
      <span className="text-text-secondary">{r.status}</span>
      {r.error_message && (
        <span className="text-accent-red truncate flex-1">{r.error_message}</span>
      )}
      {r.scene_id && (
        <span className="text-text-secondary font-mono ml-auto">
          scene {r.scene_id.slice(0, 8)}
        </span>
      )}
    </div>
  )
}

// ============ Per-scene table ============

function SceneTable({
  scenes,
  orientation,
}: {
  scenes: Scene[]
  orientation: Orientation
}) {
  if (!scenes.length) return null

  return (
    <div className="space-y-3">
      <h3 className="text-sm font-medium">Per-scene status</h3>
      <div className="overflow-x-auto bg-bg-secondary border border-border rounded-lg">
        <table className="w-full text-xs">
          <thead className="bg-bg-tertiary text-text-secondary">
            <tr>
              <th className="text-left px-3 py-2 font-medium">#</th>
              <th className="text-left px-3 py-2 font-medium">Prompt</th>
              <th className="text-left px-3 py-2 font-medium">Image</th>
              <th className="text-left px-3 py-2 font-medium">Video</th>
              <th className="text-left px-3 py-2 font-medium">Upscale</th>
              <th className="text-left px-3 py-2 font-medium">Actions</th>
            </tr>
          </thead>
          <tbody>
            {scenes.map((s) => {
              const imgStatus =
                orientation === 'VERTICAL'
                  ? s.vertical_image_status
                  : s.horizontal_image_status
              const vidStatus =
                orientation === 'VERTICAL'
                  ? s.vertical_video_status
                  : s.horizontal_video_status
              const upStatus =
                orientation === 'VERTICAL'
                  ? s.vertical_upscale_status
                  : s.horizontal_upscale_status
              return (
                <tr
                  key={s.id}
                  className="border-t border-border hover:bg-bg-tertiary/50"
                >
                  <td className="px-3 py-2 text-text-secondary">
                    {s.display_order + 1}
                  </td>
                  <td className="px-3 py-2 max-w-[400px] truncate">
                    {s.prompt}
                  </td>
                  <td className="px-3 py-2">
                    <StatusCell status={imgStatus} />
                  </td>
                  <td className="px-3 py-2">
                    <StatusCell status={vidStatus} />
                  </td>
                  <td className="px-3 py-2">
                    <StatusCell status={upStatus} />
                  </td>
                  <td className="px-3 py-2">
                    <button
                      className="flex items-center gap-1 px-2 py-1 bg-bg-tertiary border border-border rounded hover:border-accent-purple/50 transition-colors text-[11px]"
                      title="Retry failed"
                    >
                      <RotateCcw size={10} />
                      Retry
                    </button>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}

function StatusCell({ status }: { status: string }) {
  const cls =
    status === 'COMPLETED'
      ? 'text-accent-green'
      : status === 'PROCESSING'
        ? 'text-accent-orange'
        : status === 'FAILED'
          ? 'text-accent-red'
          : 'text-text-secondary'
  return <span className={`uppercase ${cls}`}>{status}</span>
}
