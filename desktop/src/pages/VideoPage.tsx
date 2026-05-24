import { useState } from 'react'
import { useFlowCredits } from '@/api/hooks'
import { flow } from '@/api/endpoints'
import type { PaygateTier } from '@/types/api'
import {
  Video,
  Loader2,
  Download,
  Upload,
  X,
  Play,
  Zap,
} from 'lucide-react'

type VideoMode = 'text-to-video' | 'image-to-video' | 'frame-to-frame'
type VideoAspect = 'VIDEO_ASPECT_RATIO_PORTRAIT' | 'VIDEO_ASPECT_RATIO_LANDSCAPE'

function asPaygateTier(value: unknown): PaygateTier {
  return value === 'PAYGATE_TIER_TWO' ? 'PAYGATE_TIER_TWO' : 'PAYGATE_TIER_ONE'
}

interface GeneratedVideo {
  id: string
  url?: string
  media_id?: string
  prompt: string
  mode: VideoMode
  status: 'generating' | 'completed' | 'failed'
  error?: string
  timestamp: number
}

export default function VideoPage() {
  const { data: credits } = useFlowCredits()

  const [mode, setMode] = useState<VideoMode>('image-to-video')
  const [prompt, setPrompt] = useState('')
  const [aspectRatio, setAspectRatio] = useState<VideoAspect>('VIDEO_ASPECT_RATIO_PORTRAIT')
  const [startFrame, setStartFrame] = useState<{ mediaId: string; preview: string } | null>(null)
  const [endFrame, setEndFrame] = useState<{ mediaId: string; preview: string } | null>(null)
  const [generating, setGenerating] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [results, setResults] = useState<GeneratedVideo[]>([])
  const [previewVideo, setPreviewVideo] = useState<GeneratedVideo | null>(null)

  const handleUploadFrame = async (
    e: React.ChangeEvent<HTMLInputElement>,
    target: 'start' | 'end',
  ) => {
    const file = e.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = async () => {
      const base64 = (reader.result as string).split(',')[1]
      const preview = reader.result as string

      try {
        const res = await flow.uploadImageBinary({
          image_base64: base64,
          mime_type: file.type || 'image/png',
          file_name: file.name,
        })
        if (res.media_id) {
          const frame = { mediaId: res.media_id, preview }
          if (target === 'start') setStartFrame(frame)
          else setEndFrame(frame)
        }
      } catch {
        setError(`Failed to upload ${target} frame`)
      }
    }
    reader.readAsDataURL(file)
  }

  const handleGenerate = async () => {
    if (!prompt.trim()) return
    setGenerating(true)
    setError(null)

    const tier = asPaygateTier(credits?.userPaygateTier)
    const videoEntry: GeneratedVideo = {
      id: crypto.randomUUID(),
      prompt: prompt.trim(),
      mode,
      status: 'generating',
      timestamp: Date.now(),
    }
    setResults((prev) => [videoEntry, ...prev])

    try {
      let result: unknown

      if (mode === 'text-to-video') {
        if (!startFrame) {
          setError('Text-to-video requires at least a reference image. Upload a start frame.')
          setGenerating(false)
          return
        }
        result = await flow.generateVideoRefs({
          reference_media_ids: [startFrame.mediaId],
          prompt: prompt.trim(),
          project_id: '',
          scene_id: '',
          aspect_ratio: aspectRatio,
          user_paygate_tier: tier,
        })
      } else if (mode === 'image-to-video') {
        if (!startFrame) {
          setError('Image-to-video requires a start frame.')
          setGenerating(false)
          return
        }
        result = await flow.generateVideo({
          start_image_media_id: startFrame.mediaId,
          prompt: prompt.trim(),
          project_id: '',
          scene_id: '',
          aspect_ratio: aspectRatio,
          end_image_media_id: endFrame?.mediaId ?? undefined,
          user_paygate_tier: tier,
        })
      } else {
        // frame-to-frame
        if (!startFrame || !endFrame) {
          setError('Frame-to-frame requires both start and end frames.')
          setGenerating(false)
          return
        }
        result = await flow.generateVideo({
          start_image_media_id: startFrame.mediaId,
          prompt: prompt.trim(),
          project_id: '',
          scene_id: '',
          aspect_ratio: aspectRatio,
          end_image_media_id: endFrame.mediaId,
          user_paygate_tier: tier,
        })
      }

      const data = result as Record<string, unknown>
      const url = (data?.video_url ?? data?.url ?? '') as string
      const mediaId = (data?.media_id ?? '') as string

      setResults((prev) =>
        prev.map((v) =>
          v.id === videoEntry.id
            ? { ...v, status: 'completed', url, media_id: mediaId }
            : v,
        ),
      )
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Generation failed'
      setError(msg)
      setResults((prev) =>
        prev.map((v) =>
          v.id === videoEntry.id ? { ...v, status: 'failed', error: msg } : v,
        ),
      )
    } finally {
      setGenerating(false)
    }
  }

  return (
    <div className="p-6 h-full flex flex-col">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-semibold">Video Generator</h1>
          <p className="text-text-secondary text-sm mt-1">
            Standalone video generation — no project required
          </p>
        </div>
      </div>

      <div className="flex-1 flex gap-6 min-h-0">
        {/* Left: Form */}
        <div className="w-[400px] shrink-0 space-y-4 overflow-y-auto">
          {/* Mode selector */}
          <div>
            <label className="block text-sm font-medium mb-1.5">Mode</label>
            <div className="flex gap-2">
              {([
                ['text-to-video', 'Text → Video'],
                ['image-to-video', 'Image → Video'],
                ['frame-to-frame', 'Frame → Frame'],
              ] as [VideoMode, string][]).map(([value, label]) => (
                <button
                  key={value}
                  onClick={() => setMode(value)}
                  className={`px-3 py-1.5 rounded-md text-xs border transition-colors ${
                    mode === value
                      ? 'bg-accent-purple/20 border-accent-purple text-accent-purple'
                      : 'bg-bg-tertiary border-border text-text-secondary hover:text-text-primary'
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          {/* Frames */}
          <div className="grid grid-cols-2 gap-3">
            <FrameUpload
              label="Start Frame"
              frame={startFrame}
              onUpload={(e) => handleUploadFrame(e, 'start')}
              onClear={() => setStartFrame(null)}
              required={mode !== 'text-to-video' || mode === 'text-to-video'}
            />
            <FrameUpload
              label="End Frame"
              frame={endFrame}
              onUpload={(e) => handleUploadFrame(e, 'end')}
              onClear={() => setEndFrame(null)}
              required={mode === 'frame-to-frame'}
              disabled={mode === 'text-to-video'}
            />
          </div>

          {/* Prompt */}
          <div>
            <label className="block text-sm font-medium mb-1.5">
              Motion Prompt
            </label>
            <textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="Describe the camera movement and action..."
              rows={4}
              className="w-full bg-bg-tertiary border border-border rounded-md px-3 py-2 text-sm resize-none focus:border-accent-purple outline-none transition-colors"
            />
          </div>

          {/* Aspect Ratio */}
          <div>
            <label className="block text-sm font-medium mb-1.5">Aspect Ratio</label>
            <div className="flex gap-2">
              {([
                ['VIDEO_ASPECT_RATIO_PORTRAIT', '9:16'],
                ['VIDEO_ASPECT_RATIO_LANDSCAPE', '16:9'],
              ] as [VideoAspect, string][]).map(([value, label]) => (
                <button
                  key={value}
                  onClick={() => setAspectRatio(value)}
                  className={`px-3 py-1.5 rounded-md text-sm border transition-colors ${
                    aspectRatio === value
                      ? 'bg-accent-purple/20 border-accent-purple text-accent-purple'
                      : 'bg-bg-tertiary border-border text-text-secondary hover:text-text-primary'
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          {/* Generate */}
          <button
            onClick={handleGenerate}
            disabled={generating || !prompt.trim()}
            className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-accent-purple hover:bg-accent-purple/80 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-lg text-sm font-medium transition-colors"
          >
            {generating ? (
              <>
                <Loader2 size={16} className="animate-spin" />
                Generating...
              </>
            ) : (
              <>
                <Video size={16} />
                Generate Video
              </>
            )}
          </button>

          {error && (
            <div className="text-accent-red text-sm bg-accent-red/10 border border-accent-red/20 rounded-md px-3 py-2">
              {error}
            </div>
          )}
        </div>

        {/* Right: Results */}
        <div className="flex-1 min-w-0 overflow-y-auto">
          {results.length === 0 ? (
            <div className="h-full flex items-center justify-center text-text-secondary text-sm">
              Generated videos will appear here
            </div>
          ) : (
            <div className="space-y-3">
              {results.map((vid) => (
                <VideoResultCard
                  key={vid.id}
                  video={vid}
                  onPreview={() => setPreviewVideo(vid)}
                />
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Video preview modal */}
      {previewVideo?.url && (
        <div
          className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-8"
          onClick={() => setPreviewVideo(null)}
        >
          <div
            className="max-w-3xl w-full bg-bg-secondary rounded-lg overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <video
              src={previewVideo.url}
              controls
              autoPlay
              className="w-full max-h-[70vh]"
            />
            <div className="p-4 flex items-center justify-between">
              <p className="text-sm text-text-secondary truncate flex-1">
                {previewVideo.prompt}
              </p>
              <a
                href={previewVideo.url}
                download
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1 px-3 py-1.5 bg-bg-tertiary border border-border rounded-md text-sm hover:border-accent-purple/50 transition-colors"
              >
                <Download size={14} />
                Download
              </a>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function FrameUpload({
  label,
  frame,
  onUpload,
  onClear,
  required,
  disabled,
}: {
  label: string
  frame: { mediaId: string; preview: string } | null
  onUpload: (e: React.ChangeEvent<HTMLInputElement>) => void
  onClear: () => void
  required?: boolean
  disabled?: boolean
}) {
  return (
    <div className={disabled ? 'opacity-40 pointer-events-none' : ''}>
      <label className="block text-xs font-medium mb-1">
        {label} {required && <span className="text-accent-red">*</span>}
      </label>
      {frame ? (
        <div className="relative aspect-video bg-bg-tertiary rounded-md overflow-hidden">
          <img src={frame.preview} alt={label} className="w-full h-full object-cover" />
          <button
            onClick={onClear}
            className="absolute top-1 right-1 w-5 h-5 bg-black/60 rounded-full flex items-center justify-center hover:bg-accent-red transition-colors"
          >
            <X size={10} />
          </button>
        </div>
      ) : (
        <label className="flex flex-col items-center justify-center aspect-video bg-bg-tertiary border border-dashed border-border rounded-md cursor-pointer hover:border-accent-purple/50 transition-colors text-text-secondary">
          <Upload size={14} />
          <span className="text-[10px] mt-1">Upload</span>
          <input type="file" accept="image/*" onChange={onUpload} className="hidden" />
        </label>
      )}
    </div>
  )
}

function VideoResultCard({
  video,
  onPreview,
}: {
  video: GeneratedVideo
  onPreview: () => void
}) {
  return (
    <div className="bg-bg-secondary border border-border rounded-lg p-3 flex items-center gap-3">
      {/* Status indicator */}
      <div className="w-10 h-10 rounded-md bg-bg-tertiary flex items-center justify-center shrink-0">
        {video.status === 'generating' && (
          <Loader2 size={16} className="animate-spin text-accent-orange" />
        )}
        {video.status === 'completed' && (
          <Play size={16} className="text-accent-green" />
        )}
        {video.status === 'failed' && (
          <X size={16} className="text-accent-red" />
        )}
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <p className="text-sm truncate">{video.prompt}</p>
        <div className="flex items-center gap-2 mt-0.5">
          <span className="text-[10px] px-1.5 py-0.5 bg-bg-tertiary rounded text-text-secondary">
            {video.mode}
          </span>
          {video.status === 'failed' && (
            <span className="text-[10px] text-accent-red">{video.error}</span>
          )}
        </div>
      </div>

      {/* Actions */}
      <div className="flex gap-2 shrink-0">
        {video.status === 'completed' && video.url && (
          <>
            <button
              onClick={onPreview}
              className="w-8 h-8 flex items-center justify-center rounded-md bg-bg-tertiary border border-border hover:border-accent-purple/50 transition-colors"
              title="Preview"
            >
              <Play size={14} />
            </button>
            <a
              href={video.url}
              download
              target="_blank"
              rel="noopener noreferrer"
              className="w-8 h-8 flex items-center justify-center rounded-md bg-bg-tertiary border border-border hover:border-accent-purple/50 transition-colors"
              title="Download"
            >
              <Download size={14} />
            </a>
            <button
              className="w-8 h-8 flex items-center justify-center rounded-md bg-bg-tertiary border border-border hover:border-accent-purple/50 transition-colors"
              title="Upscale 4K"
            >
              <Zap size={14} />
            </button>
          </>
        )}
      </div>
    </div>
  )
}
