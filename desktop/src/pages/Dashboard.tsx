import { useFlowCredits, useProjects, usePendingRequests } from '@/api/hooks'
import { Link } from 'react-router-dom'
import { Plus, Loader2, AlertCircle, CheckCircle2, Clock } from 'lucide-react'

export default function Dashboard() {
  const { data: projects, isLoading: loadingProjects } = useProjects()
  const { data: credits } = useFlowCredits()
  const { data: pending } = usePendingRequests()

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Dashboard</h1>
          <p className="text-text-secondary text-sm mt-1">FlowKit Studio</p>
        </div>
        <Link
          to="/project/new"
          className="flex items-center gap-2 px-4 py-2 bg-accent-purple hover:bg-accent-purple/80 text-white rounded-lg transition-colors text-sm font-medium"
        >
          <Plus size={16} />
          New Project
        </Link>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard
          label="Credits"
          value={credits?.credits?.toString() ?? '—'}
          sublabel={credits?.userPaygateTier ?? ''}
        />
        <StatCard
          label="Queue"
          value={pending?.length?.toString() ?? '0'}
          sublabel="pending requests"
          icon={<Clock size={16} className="text-accent-orange" />}
        />
        <StatCard
          label="Projects"
          value={projects?.length?.toString() ?? '0'}
          sublabel="total"
        />
      </div>

      <div>
        <h2 className="text-lg font-medium mb-3">Projects</h2>
        {loadingProjects ? (
          <div className="flex items-center gap-2 text-text-secondary">
            <Loader2 size={16} className="animate-spin" />
            Loading...
          </div>
        ) : !projects?.length ? (
          <div className="text-text-secondary text-sm">
            No projects yet. Create one to get started.
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {projects.map((project) => (
              <ProjectCard key={project.id} project={project} />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

function StatCard({
  label,
  value,
  sublabel,
  icon,
}: {
  label: string
  value: string
  sublabel: string
  icon?: React.ReactNode
}) {
  return (
    <div className="bg-bg-secondary border border-border rounded-lg p-4">
      <div className="flex items-center gap-2 text-text-secondary text-xs uppercase tracking-wide mb-1">
        {icon}
        {label}
      </div>
      <div className="text-2xl font-semibold">{value}</div>
      <div className="text-text-secondary text-xs mt-1">{sublabel}</div>
    </div>
  )
}

function ProjectCard({
  project,
}: {
  project: {
    id: string
    name: string
    status: string
    material?: string | null
    created_at?: string | null
  }
}) {
  const statusIcon =
    project.status === 'ACTIVE' ? (
      <CheckCircle2 size={14} className="text-accent-green" />
    ) : (
      <AlertCircle size={14} className="text-accent-orange" />
    )

  return (
    <Link
      to={`/project/${project.id}`}
      className="bg-bg-secondary border border-border rounded-lg p-4 hover:border-accent-purple/50 transition-colors group"
    >
      <div className="w-full aspect-video bg-bg-tertiary rounded-md mb-3 flex items-center justify-center text-text-secondary text-xs">
        No thumbnail
      </div>
      <div className="flex items-center gap-2">
        {statusIcon}
        <span className="font-medium text-sm truncate group-hover:text-accent-purple transition-colors">
          {project.name}
        </span>
      </div>
      <div className="flex items-center gap-2 mt-1 text-xs text-text-secondary">
        {project.material && (
          <span className="px-1.5 py-0.5 bg-bg-tertiary rounded text-[10px]">
            {project.material}
          </span>
        )}
        {project.created_at && (
          <span>{new Date(project.created_at).toLocaleDateString()}</span>
        )}
      </div>
    </Link>
  )
}
