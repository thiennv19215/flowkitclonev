import { useState } from 'react'
import { useParams, NavLink } from 'react-router-dom'
import {
  useProject,
  useProjectCharacters,
  useVideos,
  useScenes,
  useCreateCharacter,
  useDeleteCharacter,
  useCreateRequest,
  useFlowCredits,
  useMaterials,
} from '@/api/hooks'
import { flow, characters as charactersApi, projects as projectsApi } from '@/api/endpoints'
import EntityCard from '@/components/EntityCard'
import PipelineStepper from '@/components/PipelineStepper'
import type { EntityType, PaygateTier } from '@/types/api'
import {
  ArrowLeft,
  Plus,
  Loader2,
  Sparkles,
  ArrowRight,
  Image as ImageIcon,
  Film,
} from 'lucide-react'

type StepId = 'project' | 'entities' | 'scenes' | 'generate' | 'export'

const STEPS = [
  { id: 'project', label: 'Project' },
  { id: 'entities', label: 'Entities' },
  { id: 'scenes', label: 'Scenes' },
  { id: 'generate', label: 'Generate' },
  { id: 'export', label: 'Export' },
] satisfies { id: StepId; label: string }[]

function asPaygateTier(value: unknown): PaygateTier {
  return value === 'PAYGATE_TIER_TWO' ? 'PAYGATE_TIER_TWO' : 'PAYGATE_TIER_ONE'
}

export default function Storyboard() {
  const { id: pid } = useParams<{ id: string }>()
  const [step, setStep] = useState<StepId>('entities')

  const { data: project, isLoading: loadingProject } = useProject(pid)
  const { data: entities } = useProjectCharacters(pid)
  const { data: videos } = useVideos(pid)
  const firstVideoId = videos?.[0]?.id
  const { data: scenes } = useScenes(firstVideoId)

  if (!pid) {
    return (
      <div className="p-6 text-text-secondary">No project selected.</div>
    )
  }

  if (pid === 'new') {
    return <NewProjectView />
  }

  if (loadingProject) {
    return (
      <div className="p-6 flex items-center gap-2 text-text-secondary">
        <Loader2 size={16} className="animate-spin" />
        Loading project...
      </div>
    )
  }

  if (!project) {
    return <div className="p-6 text-text-secondary">Project not found.</div>
  }

  const entityCount = entities?.length ?? 0
  const sceneCount = scenes?.length ?? 0

  const stepStatus = STEPS.map((s) => ({
    ...s,
    done:
      (s.id === 'project') ||
      (s.id === 'entities' && entityCount > 0) ||
      (s.id === 'scenes' && sceneCount > 0),
  }))

  return (
    <div className="flex flex-col h-full">
      {/* Sub-header */}
      <header className="border-b border-border bg-bg-secondary px-6 py-3 flex items-center gap-4">
        <NavLink
          to="/"
          className="flex items-center gap-1 text-text-secondary hover:text-text-primary text-sm"
        >
          <ArrowLeft size={14} />
          Back
        </NavLink>
        <div className="flex-1 min-w-0">
          <div className="text-sm font-medium truncate">{project.name}</div>
          <div className="text-xs text-text-secondary">
            {entityCount} entities · {sceneCount} scenes ·{' '}
            {project.material ?? 'realistic'}
          </div>
        </div>
        <PipelineStepper
          steps={stepStatus}
          current={step}
          onSelect={(id) => setStep(id as StepId)}
        />
      </header>

      {/* Step content */}
      <div className="flex-1 overflow-auto">
        {step === 'project' && <ProjectStep project={project} />}
        {step === 'entities' && <EntitiesStep projectId={pid} />}
        {step === 'scenes' && (
          <ScenesStep projectId={pid} videoId={firstVideoId} />
        )}
        {step === 'generate' && (
          <GenerateStep projectId={pid} videoId={firstVideoId} />
        )}
        {step === 'export' && <ExportStep projectId={pid} />}
      </div>
    </div>
  )
}

// ============ STEP: Project ============

function ProjectStep({
  project,
}: {
  project: { name: string; description?: string | null; story?: string | null; material?: string | null }
}) {
  return (
    <div className="p-6 space-y-4 max-w-3xl">
      <h2 className="text-lg font-medium">Project Info</h2>

      <Field label="Name" value={project.name} />
      <Field label="Material" value={project.material ?? 'realistic'} />
      <Field label="Description" value={project.description ?? ''} multiline />
      <Field label="Story" value={project.story ?? ''} multiline />
    </div>
  )
}

function Field({
  label,
  value,
  multiline,
}: {
  label: string
  value: string
  multiline?: boolean
}) {
  return (
    <div>
      <div className="text-xs text-text-secondary uppercase tracking-wide mb-1">
        {label}
      </div>
      <div
        className={`bg-bg-secondary border border-border rounded-md px-3 py-2 text-sm ${
          multiline ? 'whitespace-pre-wrap' : ''
        }`}
      >
        {value || <span className="text-text-secondary">—</span>}
      </div>
    </div>
  )
}

// ============ STEP: Entities ============

function EntitiesStep({ projectId }: { projectId: string }) {
  const { data: entities, isLoading } = useProjectCharacters(projectId)
  const { data: project } = useProject(projectId)
  const { data: credits } = useFlowCredits()
  const { data: materials } = useMaterials()
  const createChar = useCreateCharacter()
  const deleteChar = useDeleteCharacter()
  const createReq = useCreateRequest()

  const [genQueue, setGenQueue] = useState<Set<string>>(new Set())
  const [showAdd, setShowAdd] = useState(false)
  const [newName, setNewName] = useState('')
  const [newType, setNewType] = useState<EntityType>('character')
  const [newDesc, setNewDesc] = useState('')

  const tier = asPaygateTier(credits?.userPaygateTier ?? project?.user_paygate_tier)
  const missingImageCount = entities?.filter((e) => !e.reference_image_url).length ?? 0

  const handleRegenerate = async (cid: string) => {
    setGenQueue((s) => new Set(s).add(cid))
    try {
      await createReq.mutateAsync({
        type: 'GENERATE_CHARACTER_IMAGE',
        character_id: cid,
        project_id: projectId,
      })
    } finally {
      setGenQueue((s) => {
        const n = new Set(s)
        n.delete(cid)
        return n
      })
    }
  }

  const handleGenerateAll = async () => {
    if (!entities) return
    const missing = entities.filter((e) => !e.reference_image_url)
    for (const e of missing) {
      handleRegenerate(e.id)
    }
  }

  const handleUpload = async (cid: string, file: File) => {
    const reader = new FileReader()
    return new Promise<void>((resolve, reject) => {
      reader.onload = async () => {
        try {
          const base64 = (reader.result as string).split(',')[1]
          const res = await flow.uploadImageBinary({
            image_base64: base64,
            mime_type: file.type || 'image/png',
            project_id: projectId,
            file_name: file.name,
          })
          if (res.media_id) {
            await charactersApi.update(cid, {
              media_id: res.media_id,
            })
          }
          resolve()
        } catch (err) {
          reject(err)
        }
      }
      reader.onerror = () => reject(new Error('Failed to read file'))
      reader.readAsDataURL(file)
    })
  }

  const handleAdd = async () => {
    if (!newName.trim()) return
    const material = materials?.find((m) => m.id === project?.material)
    const lighting = material?.lighting ?? 'Studio lighting, highly detailed'
    const prefix =
      newType === 'character'
        ? 'Single reference image of'
        : 'Reference image of'

    await createChar.mutateAsync({
      name: newName.trim(),
      entity_type: newType,
      description: newDesc.trim() || undefined,
      image_prompt: `${prefix} ${newDesc.trim() || newName.trim()}. ${
        material?.style_instruction ?? ''
      } ${lighting}`,
    })

    const allChars = await charactersApi.list()
    const newChar = allChars.find((c) => c.name === newName.trim())
    if (newChar) {
      await projectsApi.linkCharacter(projectId, newChar.id)
    }

    setNewName('')
    setNewDesc('')
    setShowAdd(false)
    void tier
  }

  return (
    <div className="p-6 space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-medium">Key Objects</h2>
          <p className="text-text-secondary text-sm">
            {entities?.length ?? 0} entities — drag images onto cards or
            regenerate via AI
          </p>
        </div>
        <button
          onClick={() => setShowAdd(true)}
          className="flex items-center gap-2 px-3 py-1.5 bg-accent-purple hover:bg-accent-purple/80 text-white rounded-md text-sm font-medium transition-colors"
        >
          <Plus size={14} />
          Add Entity
        </button>
      </div>

      {showAdd && (
        <div className="bg-bg-secondary border border-border rounded-lg p-4 space-y-3">
          <h3 className="text-sm font-medium">New Entity</h3>
          <div className="grid grid-cols-2 gap-3">
            <input
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              placeholder="Name"
              className="bg-bg-tertiary border border-border rounded-md px-3 py-2 text-sm focus:border-accent-purple outline-none"
            />
            <select
              value={newType}
              onChange={(e) => setNewType(e.target.value as EntityType)}
              className="bg-bg-tertiary border border-border rounded-md px-3 py-2 text-sm focus:border-accent-purple outline-none"
            >
              <option value="character">Character</option>
              <option value="location">Location</option>
              <option value="creature">Creature</option>
              <option value="visual_asset">Visual Asset</option>
              <option value="generic_troop">Generic Troop</option>
              <option value="faction">Faction</option>
            </select>
          </div>
          <textarea
            value={newDesc}
            onChange={(e) => setNewDesc(e.target.value)}
            placeholder="Description (optional)"
            rows={2}
            className="w-full bg-bg-tertiary border border-border rounded-md px-3 py-2 text-sm focus:border-accent-purple outline-none resize-none"
          />
          <div className="flex gap-2">
            <button
              onClick={handleAdd}
              disabled={!newName.trim() || createChar.isPending}
              className="px-3 py-1.5 bg-accent-purple hover:bg-accent-purple/80 disabled:opacity-50 text-white rounded-md text-sm"
            >
              Create
            </button>
            <button
              onClick={() => setShowAdd(false)}
              className="px-3 py-1.5 bg-bg-tertiary border border-border rounded-md text-sm"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {isLoading ? (
        <Loader2 size={16} className="animate-spin text-text-secondary" />
      ) : !entities?.length ? (
        <div className="text-text-secondary text-sm">
          No entities yet. Add a character, location, or prop to get started.
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-3">
          {entities.map((e) => (
            <EntityCard
              key={e.id}
              entity={e}
              generating={genQueue.has(e.id)}
              onRegenerate={() => handleRegenerate(e.id)}
              onUpload={(file) => handleUpload(e.id, file)}
              onDelete={() => {
                if (confirm(`Delete entity "${e.name}"?`)) {
                  deleteChar.mutate(e.id)
                }
              }}
            />
          ))}
        </div>
      )}

      {/* Sticky footer */}
      {!!entities?.length && (
        <div className="sticky bottom-0 -mx-6 px-6 py-3 bg-bg-primary/90 backdrop-blur border-t border-border flex items-center justify-end gap-2">
          <button
            onClick={handleGenerateAll}
            disabled={missingImageCount === 0}
            className="flex items-center gap-2 px-4 py-2 bg-bg-tertiary border border-border hover:border-accent-purple/50 disabled:opacity-50 disabled:cursor-not-allowed rounded-md text-sm transition-colors"
          >
            <Sparkles size={14} />
            Generate all ({missingImageCount} missing)
          </button>
          <button className="flex items-center gap-2 px-4 py-2 bg-accent-purple hover:bg-accent-purple/80 text-white rounded-md text-sm font-medium transition-colors">
            Next: Scenes
            <ArrowRight size={14} />
          </button>
        </div>
      )}
    </div>
  )
}

// ============ STEP: Scenes ============

function ScenesStep({
  projectId,
  videoId,
}: {
  projectId: string
  videoId?: string
}) {
  const { data: scenes, isLoading } = useScenes(videoId)

  if (!videoId) {
    return (
      <div className="p-6 text-text-secondary text-sm">
        No video found in this project.
      </div>
    )
  }

  void projectId

  return (
    <div className="p-6 space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-medium">Scenes</h2>
          <p className="text-text-secondary text-sm">
            {scenes?.length ?? 0} scenes
          </p>
        </div>
      </div>

      {isLoading ? (
        <Loader2 size={16} className="animate-spin text-text-secondary" />
      ) : !scenes?.length ? (
        <div className="text-text-secondary text-sm">
          No scenes yet. Generate scenes from your story.
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
          {scenes.map((s, i) => (
            <div
              key={s.id}
              className="bg-bg-secondary border border-border rounded-lg overflow-hidden"
            >
              <div className="aspect-video bg-bg-tertiary relative flex items-center justify-center">
                {s.vertical_image_url || s.horizontal_image_url ? (
                  <img
                    src={s.vertical_image_url ?? s.horizontal_image_url ?? ''}
                    alt={`Scene ${i + 1}`}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <ImageIcon size={20} className="text-text-secondary" />
                )}
                <span className="absolute top-1 left-1 px-1.5 py-0.5 bg-black/60 rounded text-[10px] font-medium">
                  #{s.display_order + 1}
                </span>
              </div>
              <div className="p-2">
                <p className="text-xs text-text-primary line-clamp-2">
                  {s.prompt ?? '—'}
                </p>
                <div className="flex items-center gap-1 mt-1.5 text-[10px] text-text-secondary">
                  <StatusBadge status={s.vertical_image_status} icon="img" />
                  <StatusBadge status={s.vertical_video_status} icon="vid" />
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

function StatusBadge({ status, icon }: { status: string; icon: string }) {
  const color =
    status === 'COMPLETED'
      ? 'text-accent-green'
      : status === 'PROCESSING'
        ? 'text-accent-orange'
        : status === 'FAILED'
          ? 'text-accent-red'
          : 'text-text-secondary'
  return (
    <span className={`uppercase ${color}`}>
      {icon}:{status}
    </span>
  )
}

// ============ STEP: Generate ============

function GenerateStep({
  projectId,
  videoId,
}: {
  projectId: string
  videoId?: string
}) {
  return (
    <div className="p-6 space-y-4">
      <div>
        <h2 className="text-lg font-medium">Generate</h2>
        <p className="text-text-secondary text-sm">
          Trigger batch generation for all scenes (Pipeline page).
        </p>
      </div>

      <NavLink
        to={`/pipeline/${projectId}${videoId ? `?video=${videoId}` : ''}`}
        className="inline-flex items-center gap-2 px-4 py-2 bg-accent-purple hover:bg-accent-purple/80 text-white rounded-md text-sm font-medium transition-colors"
      >
        <Film size={14} />
        Open Pipeline
      </NavLink>
    </div>
  )
}

// ============ STEP: Export ============

function ExportStep({ projectId }: { projectId: string }) {
  return (
    <div className="p-6 space-y-4">
      <div>
        <h2 className="text-lg font-medium">Export</h2>
        <p className="text-text-secondary text-sm">
          Concat scenes, generate thumbnail, upload to YouTube.
        </p>
      </div>

      <NavLink
        to={`/export/${projectId}`}
        className="inline-flex items-center gap-2 px-4 py-2 bg-accent-purple hover:bg-accent-purple/80 text-white rounded-md text-sm font-medium transition-colors"
      >
        Open Export
      </NavLink>
    </div>
  )
}

// ============ Sub-page: New Project ============

function NewProjectView() {
  return (
    <div className="p-6 max-w-2xl">
      <h1 className="text-2xl font-semibold mb-4">New Project</h1>
      <p className="text-text-secondary text-sm">
        Project creation form coming in next iteration.
      </p>
    </div>
  )
}
