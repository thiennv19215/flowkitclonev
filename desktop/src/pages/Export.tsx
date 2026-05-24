import { useState } from 'react'
import { useParams, NavLink } from 'react-router-dom'
import { useProject, useVideos, useScenes, useUpdateVideo } from '@/api/hooks'
import { projects } from '@/api/endpoints'
import {
  ArrowLeft,
  Download,
  Loader2,
  Image as ImageIcon,
  Sparkles,
  Youtube,
  FileVideo,
  Layers,
} from 'lucide-react'

export default function Export() {
  const { id: pid } = useParams<{ id: string }>()
  const { data: project } = useProject(pid)
  const { data: videos } = useVideos(pid)
  const video = videos?.[0]
  const { data: scenes } = useScenes(video?.id)
  const updateVideo = useUpdateVideo(video?.id ?? '')

  const [thumbnailPrompt, setThumbnailPrompt] = useState('')
  const [thumbnailUrl, setThumbnailUrl] = useState<string | null>(null)
  const [generatingThumb, setGeneratingThumb] = useState(false)
  const [aspectRatio, setAspectRatio] = useState<'LANDSCAPE' | 'PORTRAIT'>(
    'LANDSCAPE',
  )

  if (!pid) return <div className="p-6 text-text-secondary">No project.</div>

  const completedScenes =
    scenes?.filter(
      (s) =>
        s.vertical_video_status === 'COMPLETED' ||
        s.horizontal_video_status === 'COMPLETED',
    ).length ?? 0
  const totalScenes = scenes?.length ?? 0
  const allReady = completedScenes === totalScenes && totalScenes > 0

  const handleGenerateThumbnail = async () => {
    if (!pid || !thumbnailPrompt.trim()) return
    setGeneratingThumb(true)
    try {
      const res = await projects.generateThumbnail(pid, {
        prompt: thumbnailPrompt.trim(),
        aspect_ratio: aspectRatio,
        output_filename: 'thumbnail.png',
      })
      if (res.image_url) {
        setThumbnailUrl(res.image_url)
        await updateVideo.mutateAsync({ thumbnail_url: res.image_url })
      }
    } finally {
      setGeneratingThumb(false)
    }
  }

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
            Export · {project?.name ?? '...'}
          </div>
          <div className="text-xs text-text-secondary">
            {completedScenes}/{totalScenes} scenes ready
          </div>
        </div>
      </header>

      <div className="flex-1 overflow-auto p-6 grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Concat */}
        <Section title="Concat & Download" icon={<Layers size={16} />}>
          <p className="text-text-secondary text-sm">
            Combine all scene videos into one final video.
          </p>
          <div className="text-xs text-text-secondary">
            Status:{' '}
            {allReady ? (
              <span className="text-accent-green">All scenes ready</span>
            ) : (
              <span className="text-accent-orange">
                Waiting for {totalScenes - completedScenes} scenes
              </span>
            )}
          </div>
          <div className="grid grid-cols-2 gap-2">
            <button
              disabled={!allReady}
              className="flex items-center justify-center gap-2 px-3 py-2 bg-accent-purple hover:bg-accent-purple/80 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-md text-sm font-medium transition-colors"
            >
              <FileVideo size={14} />
              Concat (basic)
            </button>
            <button
              disabled={!allReady}
              className="flex items-center justify-center gap-2 px-3 py-2 bg-bg-tertiary border border-border hover:border-accent-purple/50 disabled:opacity-50 disabled:cursor-not-allowed rounded-md text-sm transition-colors"
            >
              <FileVideo size={14} />
              Concat (fit narrator)
            </button>
          </div>
          {video?.vertical_url || video?.horizontal_url ? (
            <a
              href={video.vertical_url ?? video.horizontal_url ?? ''}
              download
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-2 px-3 py-2 bg-bg-tertiary border border-border rounded-md text-sm hover:border-accent-purple/50 transition-colors"
            >
              <Download size={14} />
              Download final video
            </a>
          ) : null}
        </Section>

        {/* Thumbnail */}
        <Section title="YouTube Thumbnail" icon={<ImageIcon size={16} />}>
          <p className="text-text-secondary text-sm">
            Generate a 1280×720 thumbnail using project entities as references.
          </p>

          <div>
            <label className="block text-xs font-medium mb-1">
              Aspect Ratio
            </label>
            <div className="flex gap-2">
              {(['LANDSCAPE', 'PORTRAIT'] as const).map((v) => (
                <button
                  key={v}
                  onClick={() => setAspectRatio(v)}
                  className={`px-2.5 py-1 rounded text-xs border transition-colors ${
                    aspectRatio === v
                      ? 'bg-accent-purple/20 border-accent-purple text-accent-purple'
                      : 'bg-bg-tertiary border-border text-text-secondary hover:text-text-primary'
                  }`}
                >
                  {v === 'LANDSCAPE' ? '16:9' : '9:16'}
                </button>
              ))}
            </div>
          </div>

          <textarea
            value={thumbnailPrompt}
            onChange={(e) => setThumbnailPrompt(e.target.value)}
            placeholder="Describe the thumbnail scene..."
            rows={3}
            className="w-full bg-bg-tertiary border border-border rounded-md px-3 py-2 text-sm focus:border-accent-purple outline-none resize-none"
          />

          <button
            onClick={handleGenerateThumbnail}
            disabled={generatingThumb || !thumbnailPrompt.trim()}
            className="flex items-center justify-center gap-2 px-3 py-2 bg-accent-purple hover:bg-accent-purple/80 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-md text-sm font-medium transition-colors w-full"
          >
            {generatingThumb ? (
              <>
                <Loader2 size={14} className="animate-spin" />
                Generating...
              </>
            ) : (
              <>
                <Sparkles size={14} />
                Generate Thumbnail
              </>
            )}
          </button>

          {(thumbnailUrl ?? video?.thumbnail_url) && (
            <div className="aspect-video bg-bg-tertiary rounded-md overflow-hidden">
              <img
                src={(thumbnailUrl ?? video?.thumbnail_url) ?? ''}
                alt="Thumbnail"
                className="w-full h-full object-cover"
              />
            </div>
          )}
        </Section>

        {/* YouTube upload (stub) */}
        <Section
          title="YouTube Upload"
          icon={<Youtube size={16} />}
          className="lg:col-span-2"
        >
          <p className="text-text-secondary text-sm">
            Configure YouTube SEO + privacy and upload the final video.
          </p>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium mb-1">Title</label>
              <input
                type="text"
                placeholder="Video title"
                className="w-full bg-bg-tertiary border border-border rounded-md px-3 py-2 text-sm focus:border-accent-purple outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-medium mb-1">Privacy</label>
              <select className="w-full bg-bg-tertiary border border-border rounded-md px-3 py-2 text-sm focus:border-accent-purple outline-none">
                <option value="unlisted">Unlisted</option>
                <option value="public">Public</option>
                <option value="private">Private</option>
              </select>
            </div>
          </div>
          <div>
            <label className="block text-xs font-medium mb-1">
              Description / Tags
            </label>
            <textarea
              rows={3}
              placeholder="Description and tags..."
              className="w-full bg-bg-tertiary border border-border rounded-md px-3 py-2 text-sm focus:border-accent-purple outline-none resize-none"
            />
          </div>
          <div className="flex gap-2">
            <button
              disabled
              className="flex items-center justify-center gap-2 px-3 py-2 bg-accent-red hover:bg-accent-red/80 disabled:opacity-50 text-white rounded-md text-sm font-medium transition-colors"
            >
              <Youtube size={14} />
              Upload to YouTube
            </button>
            <button
              disabled
              className="flex items-center justify-center gap-2 px-3 py-2 bg-bg-tertiary border border-border rounded-md text-sm text-text-secondary"
            >
              Generate SEO metadata
            </button>
          </div>
          <p className="text-[11px] text-text-secondary">
            YouTube upload requires OAuth setup. Use the <code>/fk-youtube-upload</code> CLI skill in the meantime.
          </p>
        </Section>
      </div>
    </div>
  )
}

function Section({
  title,
  icon,
  className,
  children,
}: {
  title: string
  icon: React.ReactNode
  className?: string
  children: React.ReactNode
}) {
  return (
    <section
      className={`bg-bg-secondary border border-border rounded-lg p-4 space-y-3 ${
        className ?? ''
      }`}
    >
      <div className="flex items-center gap-2 text-sm font-medium">
        {icon}
        {title}
      </div>
      {children}
    </section>
  )
}
