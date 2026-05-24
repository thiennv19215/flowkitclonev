import { useState } from 'react'
import { useMaterials, useFlowCredits } from '@/api/hooks'
import { flow } from '@/api/endpoints'
import type { PaygateTier } from '@/types/api'
import {
  Image as ImageIcon,
  Loader2,
  Download,
  RotateCcw,
  Upload,
  X,
  ChevronDown,
} from 'lucide-react'

type AspectRatio = 'IMAGE_ASPECT_RATIO_PORTRAIT' | 'IMAGE_ASPECT_RATIO_LANDSCAPE' | 'IMAGE_ASPECT_RATIO_SQUARE'

function asPaygateTier(value: unknown): PaygateTier {
  return value === 'PAYGATE_TIER_TWO' ? 'PAYGATE_TIER_TWO' : 'PAYGATE_TIER_ONE'
}

interface GeneratedImage {
  id: string
  url: string
  media_id?: string
  prompt: string
  timestamp: number
}

export default function ImagePage() {
  const { data: materialsList } = useMaterials()
  const { data: credits } = useFlowCredits()

  const [prompt, setPrompt] = useState('')
  const [aspectRatio, setAspectRatio] = useState<AspectRatio>('IMAGE_ASPECT_RATIO_PORTRAIT')
  const [material, setMaterial] = useState('realistic')
  const [referenceImage, setReferenceImage] = useState<string | null>(null)
  const [referencePreview, setReferencePreview] = useState<string | null>(null)
  const [materialOpen, setMaterialOpen] = useState(false)
  const [generating, setGenerating] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [results, setResults] = useState<GeneratedImage[]>([])
  const [selectedImage, setSelectedImage] = useState<GeneratedImage | null>(null)

  const projectId = '' // standalone mode, no project
  const materialOptions = materialsList?.length
    ? materialsList
    : [{ id: 'realistic', name: 'Realistic' }]
  const selectedMaterial = materialOptions.find((m) => m.id === material) ?? materialOptions[0]

  const handleGenerate = async () => {
    if (!prompt.trim()) return
    setGenerating(true)
    setError(null)

    try {
      const result = await flow.generateImage({
        prompt: prompt.trim(),
        project_id: projectId,
        aspect_ratio: aspectRatio,
        user_paygate_tier: asPaygateTier(credits?.userPaygateTier),
        character_media_ids: referenceImage ? [referenceImage] : undefined,
      })

      const data = result as Record<string, unknown>
      const mediaId = (data?.media_id ?? data?._mediaId ?? '') as string
      const url = (data?.image_url ?? data?.url ?? data?.fifeUrl ?? '') as string

      if (url || mediaId) {
        const newImage: GeneratedImage = {
          id: crypto.randomUUID(),
          url,
          media_id: mediaId,
          prompt: prompt.trim(),
          timestamp: Date.now(),
        }
        setResults((prev) => [newImage, ...prev])
      } else {
        setError('Generation completed but no image URL returned.')
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Generation failed')
    } finally {
      setGenerating(false)
    }
  }

  const handleReferenceUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = async () => {
      const base64 = (reader.result as string).split(',')[1]
      setReferencePreview(reader.result as string)

      try {
        const res = await flow.uploadImageBinary({
          image_base64: base64,
          mime_type: file.type || 'image/png',
          file_name: file.name,
        })
        if (res.media_id) {
          setReferenceImage(res.media_id)
        }
      } catch {
        setError('Failed to upload reference image')
      }
    }
    reader.readAsDataURL(file)
  }

  const clearReference = () => {
    setReferenceImage(null)
    setReferencePreview(null)
  }

  return (
    <div className="p-6 h-full flex flex-col">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-semibold">Image Generator</h1>
          <p className="text-text-secondary text-sm mt-1">
            Standalone image generation — no project required
          </p>
        </div>
      </div>

      <div className="flex-1 flex gap-6 min-h-0">
        {/* Left: Form */}
        <div className="w-[380px] shrink-0 space-y-4 overflow-y-auto">
          {/* Prompt */}
          <div>
            <label className="block text-sm font-medium mb-1.5">Prompt</label>
            <textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="Describe the image you want to generate..."
              rows={4}
              className="w-full bg-bg-tertiary border border-border rounded-md px-3 py-2 text-sm resize-none focus:border-accent-purple outline-none transition-colors"
            />
          </div>

          {/* Aspect Ratio */}
          <div>
            <label className="block text-sm font-medium mb-1.5">Aspect Ratio</label>
            <div className="flex gap-2">
              {([
                ['IMAGE_ASPECT_RATIO_PORTRAIT', '9:16'],
                ['IMAGE_ASPECT_RATIO_LANDSCAPE', '16:9'],
                ['IMAGE_ASPECT_RATIO_SQUARE', '1:1'],
              ] as [AspectRatio, string][]).map(([value, label]) => (
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

          {/* Material */}
          <div className="relative">
            <label className="block text-sm font-medium mb-1.5">Material (Style)</label>
            <button
              type="button"
              onClick={() => setMaterialOpen((open) => !open)}
              className="w-full bg-bg-tertiary border border-border rounded-md px-3 py-2 text-sm focus:border-accent-purple outline-none transition-colors flex items-center justify-between gap-2 text-left"
            >
              <span className="truncate">{selectedMaterial.name}</span>
              <ChevronDown
                size={16}
                className={`shrink-0 transition-transform ${materialOpen ? 'rotate-180' : ''}`}
              />
            </button>

            {materialOpen && (
              <div className="absolute left-0 right-0 top-full mt-1 z-50 max-h-60 overflow-y-auto rounded-md border border-border bg-bg-secondary shadow-xl">
                {materialOptions.map((m) => (
                  <button
                    key={m.id}
                    type="button"
                    onClick={() => {
                      setMaterial(m.id)
                      setMaterialOpen(false)
                    }}
                    className={`w-full px-3 py-2 text-left text-sm transition-colors hover:bg-bg-tertiary ${
                      material === m.id ? 'text-accent-purple' : 'text-text-secondary'
                    }`}
                  >
                    <span className="block truncate">{m.name}</span>
                    <span className="block text-[10px] opacity-60 truncate">{m.id}</span>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Reference Image */}
          <div>
            <label className="block text-sm font-medium mb-1.5">
              Reference Image (optional)
            </label>
            {referencePreview ? (
              <div className="relative w-full aspect-video bg-bg-tertiary rounded-md overflow-hidden">
                <img
                  src={referencePreview}
                  alt="Reference"
                  className="w-full h-full object-cover"
                />
                <button
                  onClick={clearReference}
                  className="absolute top-2 right-2 w-6 h-6 bg-black/60 rounded-full flex items-center justify-center hover:bg-accent-red transition-colors"
                >
                  <X size={12} />
                </button>
              </div>
            ) : (
              <label className="flex items-center justify-center gap-2 w-full h-24 bg-bg-tertiary border border-dashed border-border rounded-md cursor-pointer hover:border-accent-purple/50 transition-colors text-text-secondary text-sm">
                <Upload size={16} />
                Drop or click to upload
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleReferenceUpload}
                  className="hidden"
                />
              </label>
            )}
          </div>

          {/* Generate button */}
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
                <ImageIcon size={16} />
                Generate Image
              </>
            )}
          </button>

          {error && (
            <div className="text-accent-red text-sm bg-accent-red/10 border border-accent-red/20 rounded-md px-3 py-2">
              {error}
            </div>
          )}
        </div>

        {/* Right: Results grid */}
        <div className="flex-1 min-w-0 overflow-y-auto">
          {results.length === 0 ? (
            <div className="h-full flex items-center justify-center text-text-secondary text-sm">
              Generated images will appear here
            </div>
          ) : (
            <div className="grid grid-cols-2 xl:grid-cols-3 gap-3">
              {results.map((img) => (
                <div
                  key={img.id}
                  onClick={() => setSelectedImage(img)}
                  className="bg-bg-secondary border border-border rounded-lg overflow-hidden cursor-pointer hover:border-accent-purple/50 transition-colors group"
                >
                  {img.url ? (
                    <img
                      src={img.url}
                      alt={img.prompt}
                      className="w-full aspect-square object-cover"
                    />
                  ) : (
                    <div className="w-full aspect-square bg-bg-tertiary flex items-center justify-center text-text-secondary text-xs">
                      No preview
                    </div>
                  )}
                  <div className="p-2">
                    <p className="text-xs text-text-secondary truncate">{img.prompt}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Full-size preview modal */}
      {selectedImage && (
        <div
          className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-8"
          onClick={() => setSelectedImage(null)}
        >
          <div
            className="max-w-4xl max-h-full flex flex-col bg-bg-secondary rounded-lg overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {selectedImage.url && (
              <img
                src={selectedImage.url}
                alt={selectedImage.prompt}
                className="max-h-[70vh] object-contain"
              />
            )}
            <div className="p-4 flex items-center justify-between gap-4">
              <p className="text-sm text-text-secondary truncate flex-1">
                {selectedImage.prompt}
              </p>
              <div className="flex gap-2 shrink-0">
                {selectedImage.url && (
                  <a
                    href={selectedImage.url}
                    download
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1 px-3 py-1.5 bg-bg-tertiary border border-border rounded-md text-sm hover:border-accent-purple/50 transition-colors"
                  >
                    <Download size={14} />
                    Download
                  </a>
                )}
                <button
                  onClick={() => {
                    setPrompt(selectedImage.prompt)
                    setSelectedImage(null)
                  }}
                  className="flex items-center gap-1 px-3 py-1.5 bg-bg-tertiary border border-border rounded-md text-sm hover:border-accent-purple/50 transition-colors"
                >
                  <RotateCcw size={14} />
                  Reuse prompt
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
