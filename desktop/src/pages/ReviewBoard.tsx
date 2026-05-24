import { useState } from 'react'
import { useParams, NavLink } from 'react-router-dom'
import {
  useProject,
  useVideos,
  useScenes,
  useUpdateScene,
} from '@/api/hooks'
import { flow } from '@/api/endpoints'
import {
  ArrowLeft,
  Check,
  X,
  RotateCcw,
  RefreshCw,
  Play,
  Pause,
  Loader2,
} from 'lucide-react'
import type { Scene, Orientation } from '@/types/api'

type Verdict = 'accept' | 'reject' | null

export default function ReviewBoard() {
  const { id: pid } = useParams<{ id: string }>()
  const [orientation, setOrientation] = useState<Orientation>('VERTICAL')
  const [verdicts, setVerdicts] = useState<Record<string, Verdict>>({})
  const [refreshing, setRefreshing] = useState(false)

  const { data: project } = useProject(pid)
  const { data: videos } = useVideos(pid)
  const videoId = videos?.[0]?.id
  const { data: scenes } = useScenes(videoId)

  const handleRefreshUrls = async () => {
    if (!pid) return
    setRefreshing(true)
    try {
      await flow.refreshUrls(pid)
    } finally {
      setRefreshing(false)
    }
  }

  if (!pid) return <div className="p-6 text-text-secondary">No project.</div>

  const total = scenes?.length ?? 0
  const accepted = Object.values(verdicts).filter((v) => v === 'accept').length
  const rejected = Object.values(verdicts).filter((v) => v === 'reject').length

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
            Review · {project?.name ?? '...'}
          </div>
          <div className="text-xs text-text-secondary">
            {accepted} accepted · {rejected} rejected · {total - accepted - rejected} pending
          </div>
        </div>
        <div className="flex gap-2">
          <button
            onClick={handleRefreshUrls}
            disabled={refreshing}
            className="flex items-center gap-1 px-3 py-1.5 bg-bg-tertiary border border-border rounded-md text-sm hover:border-accent-purple/50 disabled:opacity-50 transition-colors"
            title="Refresh expired GCS signed URLs"
          >
            {refreshing ? (
              <Loader2 size={14} className="animate-spin" />
            ) : (
              <RefreshCw size={14} />
            )}
            Refresh URLs
          </button>
          <OrientationToggle value={orientation} onChange={setOrientation} />
        </div>
      </header>

      <div className="flex-1 overflow-auto p-6">
        {!scenes?.length ? (
          <div className="text-text-secondary text-sm">No scenes yet.</div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {scenes.map((s) => (
              <ReviewCard
                key={s.id}
                scene={s}
                orientation={orientation}
                verdict={verdicts[s.id] ?? null}
                onVerdict={(v) =>
                  setVerdicts((prev) => ({ ...prev, [s.id]: v }))
                }
              />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

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

function ReviewCard({
  scene,
  orientation,
  verdict,
  onVerdict,
}: {
  scene: Scene
  orientation: Orientation
  verdict: Verdict
  onVerdict: (v: Verdict) => void
}) {
  const [playing, setPlaying] = useState(false)
  const updateScene = useUpdateScene(scene.id)

  const videoUrl =
    orientation === 'VERTICAL' ? scene.vertical_video_url : scene.horizontal_video_url
  const imgUrl =
    orientation === 'VERTICAL' ? scene.vertical_image_url : scene.horizontal_image_url
  const upscaleUrl =
    orientation === 'VERTICAL' ? scene.vertical_upscale_url : scene.horizontal_upscale_url

  const ringColor =
    verdict === 'accept'
      ? 'ring-2 ring-accent-green'
      : verdict === 'reject'
        ? 'ring-2 ring-accent-red'
        : ''

  const handleRegenerate = () => {
    onVerdict('reject')
    // TODO: trigger regenerate request via createBatch hook (parent should pass)
  }

  return (
    <div
      className={`bg-bg-secondary border border-border rounded-lg overflow-hidden ${ringColor}`}
    >
      <div className="relative aspect-video bg-black">
        {videoUrl ? (
          playing ? (
            <video
              src={upscaleUrl ?? videoUrl}
              autoPlay
              loop
              muted
              controls
              className="w-full h-full object-contain"
              onPause={() => setPlaying(false)}
            />
          ) : (
            <button
              onClick={() => setPlaying(true)}
              className="absolute inset-0 flex items-center justify-center group"
            >
              {imgUrl ? (
                <img
                  src={imgUrl}
                  alt="poster"
                  className="w-full h-full object-cover"
                />
              ) : null}
              <div className="absolute inset-0 bg-black/30 group-hover:bg-black/50 transition-colors flex items-center justify-center">
                <Play size={32} className="text-white" />
              </div>
            </button>
          )
        ) : imgUrl ? (
          <img src={imgUrl} alt="" className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-text-secondary text-xs">
            No video
          </div>
        )}
        <span className="absolute top-2 left-2 px-1.5 py-0.5 bg-black/70 rounded text-[10px] font-medium">
          #{scene.display_order + 1}
        </span>
        {upscaleUrl && (
          <span className="absolute top-2 right-2 px-1.5 py-0.5 bg-accent-purple rounded text-[10px] font-medium">
            4K
          </span>
        )}
      </div>

      <div className="p-3 space-y-2">
        <p className="text-xs line-clamp-2 text-text-primary">
          {scene.prompt}
        </p>

        {scene.duration && (
          <div className="text-[10px] text-text-secondary">
            Duration: {scene.duration.toFixed(1)}s
            {scene.trim_start != null && scene.trim_end != null && (
              <>
                {' '}
                · Trim: {scene.trim_start.toFixed(1)}s →{' '}
                {scene.trim_end.toFixed(1)}s
              </>
            )}
          </div>
        )}

        <div className="grid grid-cols-3 gap-1.5">
          <button
            onClick={() => onVerdict(verdict === 'accept' ? null : 'accept')}
            className={`flex items-center justify-center gap-1 px-2 py-1 rounded text-[11px] border transition-colors ${
              verdict === 'accept'
                ? 'bg-accent-green text-white border-accent-green'
                : 'bg-bg-tertiary border-border hover:border-accent-green/50'
            }`}
          >
            <Check size={10} />
            Accept
          </button>
          <button
            onClick={() => onVerdict(verdict === 'reject' ? null : 'reject')}
            className={`flex items-center justify-center gap-1 px-2 py-1 rounded text-[11px] border transition-colors ${
              verdict === 'reject'
                ? 'bg-accent-red text-white border-accent-red'
                : 'bg-bg-tertiary border-border hover:border-accent-red/50'
            }`}
          >
            <X size={10} />
            Reject
          </button>
          <button
            onClick={handleRegenerate}
            disabled={updateScene.isPending}
            className="flex items-center justify-center gap-1 px-2 py-1 bg-bg-tertiary border border-border hover:border-accent-purple/50 disabled:opacity-50 rounded text-[11px] transition-colors"
          >
            <RotateCcw size={10} />
            Redo
          </button>
        </div>
      </div>
      {/* unused state suppressor */}
      <div className="hidden">{playing ? <Pause /> : null}</div>
    </div>
  )
}
