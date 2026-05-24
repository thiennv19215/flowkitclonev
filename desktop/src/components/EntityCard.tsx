import { useState, useRef } from 'react'
import { Upload, X, RefreshCw, Save, Loader2 } from 'lucide-react'
import type { Character, EntityType } from '@/types/api'

const ENTITY_BADGE_COLOR: Record<EntityType, string> = {
  character: 'bg-accent-red text-white',
  location: 'bg-accent-blue text-white',
  creature: 'bg-accent-orange text-white',
  visual_asset: 'bg-accent-green text-white',
  generic_troop: 'bg-accent-purple text-white',
  faction: 'bg-accent-purple text-white',
}

interface Props {
  entity: Character
  onRegenerate?: () => void
  onUpload?: (file: File) => void | Promise<void>
  onDelete?: () => void
  onSaveGlobal?: () => void
  generating?: boolean
}

export default function EntityCard({
  entity,
  onRegenerate,
  onUpload,
  onDelete,
  onSaveGlobal,
  generating,
}: Props) {
  const [dragOver, setDragOver] = useState(false)
  const [uploading, setUploading] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  const badgeClass = ENTITY_BADGE_COLOR[entity.entity_type] ?? 'bg-bg-tertiary text-text-secondary'
  const hasImage = !!entity.reference_image_url

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault()
    setDragOver(false)
    const file = e.dataTransfer.files?.[0]
    if (file && onUpload) {
      setUploading(true)
      try {
        await onUpload(file)
      } finally {
        setUploading(false)
      }
    }
  }

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file && onUpload) {
      setUploading(true)
      try {
        await onUpload(file)
      } finally {
        setUploading(false)
      }
    }
  }

  return (
    <div
      onDragOver={(e) => {
        e.preventDefault()
        setDragOver(true)
      }}
      onDragLeave={() => setDragOver(false)}
      onDrop={handleDrop}
      className={`relative bg-bg-secondary border rounded-lg overflow-hidden transition-colors group ${
        dragOver
          ? 'border-accent-purple ring-2 ring-accent-purple/30'
          : 'border-border hover:border-accent-purple/50'
      }`}
    >
      {/* Delete button */}
      {onDelete && (
        <button
          onClick={onDelete}
          className="absolute top-2 right-2 z-10 w-6 h-6 bg-black/60 rounded-full flex items-center justify-center hover:bg-accent-red transition-colors opacity-0 group-hover:opacity-100"
          title="Delete entity"
        >
          <X size={12} />
        </button>
      )}

      {/* Image area */}
      <div className="relative aspect-square bg-bg-tertiary">
        {hasImage ? (
          <img
            src={entity.reference_image_url ?? ''}
            alt={entity.name}
            className="w-full h-full object-cover"
          />
        ) : (
          <label className="absolute inset-0 flex flex-col items-center justify-center cursor-pointer text-text-secondary">
            <Upload size={20} />
            <span className="text-[10px] mt-1">Drop or click</span>
            <input
              ref={inputRef}
              type="file"
              accept="image/*"
              onChange={handleFileChange}
              className="hidden"
            />
          </label>
        )}

        {/* Uploading / Generating overlay */}
        {(uploading || generating) && (
          <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
            <Loader2 size={24} className="animate-spin text-white" />
          </div>
        )}

        {/* Type badge */}
        <span
          className={`absolute top-2 left-2 px-1.5 py-0.5 rounded text-[10px] font-medium uppercase ${badgeClass}`}
        >
          {entity.entity_type}
        </span>
      </div>

      {/* Info + actions */}
      <div className="p-3 space-y-2">
        <div>
          <div className="text-sm font-medium truncate" title={entity.name}>
            {entity.name}
          </div>
          {entity.slug && (
            <div className="text-[10px] text-text-secondary truncate">
              @{entity.slug}
            </div>
          )}
        </div>

        <div className="grid grid-cols-2 gap-1.5">
          <button
            onClick={onRegenerate}
            disabled={generating}
            className="flex items-center justify-center gap-1 px-2 py-1 bg-bg-tertiary border border-border rounded text-[11px] hover:border-accent-purple/50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <RefreshCw size={10} />
            Regenerate
          </button>
          <button
            onClick={onSaveGlobal}
            className="flex items-center justify-center gap-1 px-2 py-1 bg-bg-tertiary border border-border rounded text-[11px] hover:border-accent-purple/50 transition-colors"
            title="Save as global reference"
          >
            <Save size={10} />
            Global
          </button>
        </div>
      </div>
    </div>
  )
}
