import { useState } from 'react'
import { useParams, NavLink } from 'react-router-dom'
import { useProject, useVideos, useScenes, useUpdateScene } from '@/api/hooks'
import {
  ArrowLeft,
  Mic,
  Music,
  Type as TypeIcon,
  Loader2,
  Volume2,
} from 'lucide-react'
import type { Scene } from '@/types/api'

type Tab = 'voice' | 'narrator' | 'music' | 'overlays'

export default function Audio() {
  const { id: pid } = useParams<{ id: string }>()
  const [tab, setTab] = useState<Tab>('narrator')

  const { data: project } = useProject(pid)
  const { data: videos } = useVideos(pid)
  const videoId = videos?.[0]?.id
  const { data: scenes } = useScenes(videoId)

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
            Audio · {project?.name ?? '...'}
          </div>
          <div className="text-xs text-text-secondary">
            {scenes?.length ?? 0} scenes ·{' '}
            {project?.allow_voice ? 'voice on' : 'voice off'}
          </div>
        </div>
        <div className="flex gap-1 bg-bg-tertiary border border-border rounded-md p-0.5">
          {(
            [
              ['narrator', 'Narrator', Mic],
              ['voice', 'Voices', Volume2],
              ['music', 'Music', Music],
              ['overlays', 'Overlays', TypeIcon],
            ] as [Tab, string, typeof Mic][]
          ).map(([id, label, Icon]) => (
            <button
              key={id}
              onClick={() => setTab(id)}
              className={`flex items-center gap-1.5 px-3 py-1 rounded text-xs font-medium transition-colors ${
                tab === id
                  ? 'bg-accent-purple text-white'
                  : 'text-text-secondary hover:text-text-primary'
              }`}
            >
              <Icon size={12} />
              {label}
            </button>
          ))}
        </div>
      </header>

      <div className="flex-1 overflow-auto p-6">
        {tab === 'narrator' && <NarratorTab scenes={scenes ?? []} />}
        {tab === 'voice' && <VoiceTab />}
        {tab === 'music' && <MusicTab />}
        {tab === 'overlays' && <OverlaysTab />}
      </div>
    </div>
  )
}

// ============ Narrator tab ============

function NarratorTab({ scenes }: { scenes: Scene[] }) {
  const [generating, setGenerating] = useState<Record<string, boolean>>({})

  const handleGenerate = (sceneId: string) => {
    setGenerating((s) => ({ ...s, [sceneId]: true }))
    // Stub: backend TTS endpoint when available
    setTimeout(() => {
      setGenerating((s) => ({ ...s, [sceneId]: false }))
    }, 1500)
  }

  return (
    <div className="space-y-4 max-w-3xl">
      <div>
        <h2 className="text-lg font-medium">Narrator Text + TTS</h2>
        <p className="text-text-secondary text-sm">
          Generate narrator text per scene and convert to TTS audio.
        </p>
      </div>

      <div className="flex gap-2">
        <button className="flex items-center gap-2 px-3 py-2 bg-accent-purple hover:bg-accent-purple/80 text-white rounded-md text-sm font-medium transition-colors">
          <Mic size={14} />
          Generate all narrator text (AI)
        </button>
        <button className="flex items-center gap-2 px-3 py-2 bg-bg-tertiary border border-border rounded-md text-sm hover:border-accent-purple/50 transition-colors">
          <Volume2 size={14} />
          Generate all TTS
        </button>
      </div>

      <div className="space-y-2">
        {scenes.map((s) => (
          <SceneNarratorRow
            key={s.id}
            scene={s}
            generating={generating[s.id] ?? false}
            onGenerate={() => handleGenerate(s.id)}
          />
        ))}
      </div>
    </div>
  )
}

function SceneNarratorRow({
  scene,
  generating,
  onGenerate,
}: {
  scene: Scene
  generating: boolean
  onGenerate: () => void
}) {
  const [text, setText] = useState(scene.narrator_text ?? '')
  const updateScene = useUpdateScene(scene.id)

  const handleSave = () => {
    updateScene.mutate({ narrator_text: text })
  }

  return (
    <div className="bg-bg-secondary border border-border rounded-lg p-3 space-y-2">
      <div className="flex items-center gap-2 text-xs">
        <span className="px-1.5 py-0.5 bg-bg-tertiary rounded font-medium">
          #{scene.display_order + 1}
        </span>
        <span className="text-text-secondary truncate flex-1">
          {scene.prompt}
        </span>
      </div>
      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder="Narrator text..."
        rows={2}
        className="w-full bg-bg-tertiary border border-border rounded-md px-2 py-1.5 text-xs focus:border-accent-purple outline-none resize-none"
      />
      <div className="flex gap-2">
        <button
          onClick={handleSave}
          disabled={updateScene.isPending || text === scene.narrator_text}
          className="px-2.5 py-1 bg-bg-tertiary border border-border rounded text-[11px] hover:border-accent-purple/50 disabled:opacity-50 transition-colors"
        >
          Save
        </button>
        <button
          onClick={onGenerate}
          disabled={generating}
          className="flex items-center gap-1 px-2.5 py-1 bg-accent-purple hover:bg-accent-purple/80 disabled:opacity-50 text-white rounded text-[11px] transition-colors"
        >
          {generating ? (
            <Loader2 size={10} className="animate-spin" />
          ) : (
            <Volume2 size={10} />
          )}
          TTS
        </button>
      </div>
    </div>
  )
}

// ============ Voice tab ============

function VoiceTab() {
  return (
    <div className="space-y-4 max-w-3xl">
      <div>
        <h2 className="text-lg font-medium">Voice Templates</h2>
        <p className="text-text-secondary text-sm">
          Manage voice templates for narration. Use{' '}
          <code>/fk-import-voice</code> or <code>/fk-gen-tts-template</code> in CLI.
        </p>
      </div>
      <div className="bg-bg-secondary border border-border rounded-lg p-4 text-text-secondary text-sm">
        Voice template manager coming soon.
      </div>
    </div>
  )
}

// ============ Music tab ============

function MusicTab() {
  const [prompt, setPrompt] = useState('')
  const [duration, setDuration] = useState(60)

  return (
    <div className="space-y-4 max-w-3xl">
      <div>
        <h2 className="text-lg font-medium">Background Music (Suno)</h2>
        <p className="text-text-secondary text-sm">
          Generate background music via Suno API.
        </p>
      </div>

      <div className="bg-bg-secondary border border-border rounded-lg p-4 space-y-3">
        <div>
          <label className="block text-xs font-medium mb-1">
            Music prompt / style
          </label>
          <textarea
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder="Cinematic orchestral, slow build, emotional..."
            rows={3}
            className="w-full bg-bg-tertiary border border-border rounded-md px-3 py-2 text-sm focus:border-accent-purple outline-none resize-none"
          />
        </div>

        <div>
          <label className="block text-xs font-medium mb-1">
            Duration: {duration}s
          </label>
          <input
            type="range"
            min={30}
            max={180}
            value={duration}
            onChange={(e) => setDuration(Number(e.target.value))}
            className="w-full accent-accent-purple"
          />
        </div>

        <button
          disabled={!prompt.trim()}
          className="flex items-center gap-2 px-3 py-2 bg-accent-purple hover:bg-accent-purple/80 disabled:opacity-50 text-white rounded-md text-sm font-medium transition-colors"
        >
          <Music size={14} />
          Generate Music
        </button>
      </div>
    </div>
  )
}

// ============ Overlays tab ============

function OverlaysTab() {
  return (
    <div className="space-y-4 max-w-3xl">
      <div>
        <h2 className="text-lg font-medium">Text Overlays</h2>
        <p className="text-text-secondary text-sm">
          Generate text overlays from narrator text per scene.
        </p>
      </div>

      <button className="flex items-center gap-2 px-3 py-2 bg-accent-purple hover:bg-accent-purple/80 text-white rounded-md text-sm font-medium transition-colors">
        <TypeIcon size={14} />
        Generate overlays from narrator text
      </button>

      <div className="bg-bg-secondary border border-border rounded-lg p-4 text-text-secondary text-sm">
        Use <code>/fk-gen-text-overlays</code> CLI skill for now.
      </div>
    </div>
  )
}
