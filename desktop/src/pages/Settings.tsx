import { useState } from 'react'
import { useSettings, DEFAULT_API_BASE_URL } from '@/store/settings'
import { useHealth, useFlowStatus, useFlowCredits } from '@/api/hooks'
import { CheckCircle2, XCircle, Save, RotateCcw } from 'lucide-react'

export default function Settings() {
  const { apiBaseUrl, theme, setApiBaseUrl, setTheme, reset } = useSettings()
  const [draftUrl, setDraftUrl] = useState(apiBaseUrl)
  const { data: health } = useHealth()
  const { data: flowStatus } = useFlowStatus()
  const { data: credits } = useFlowCredits()

  const dirty = draftUrl.trim() !== apiBaseUrl

  const handleSave = () => {
    setApiBaseUrl(draftUrl)
  }

  const handleReset = () => {
    setDraftUrl(DEFAULT_API_BASE_URL)
    reset()
  }

  return (
    <div className="p-6 space-y-6 max-w-3xl">
      <div>
        <h1 className="text-2xl font-semibold">Settings</h1>
        <p className="text-text-secondary text-sm mt-1">
          Configure FlowKit Studio
        </p>
      </div>

      {/* Backend section */}
      <Section title="Backend Connection">
        <Field label="API Base URL">
          <div className="flex gap-2">
            <input
              value={draftUrl}
              onChange={(e) => setDraftUrl(e.target.value)}
              placeholder={DEFAULT_API_BASE_URL}
              className="flex-1 bg-bg-tertiary border border-border rounded-md px-3 py-2 text-sm focus:border-accent-purple outline-none transition-colors font-mono"
            />
            <button
              onClick={handleSave}
              disabled={!dirty}
              className="flex items-center gap-2 px-3 py-2 bg-accent-purple disabled:opacity-50 disabled:cursor-not-allowed hover:bg-accent-purple/80 text-white rounded-md text-sm font-medium transition-colors"
            >
              <Save size={14} />
              Save
            </button>
          </div>
          <p className="text-xs text-text-secondary mt-1">
            Default: <code className="bg-bg-tertiary px-1 rounded">{DEFAULT_API_BASE_URL}</code>
          </p>
        </Field>

        <StatusRow
          label="Backend health"
          ok={!!health?.extension_connected || health !== undefined}
          detail={
            health
              ? health.extension_connected
                ? 'Connected, extension active'
                : 'Backend up but extension disconnected'
              : 'Cannot reach backend'
          }
        />
        <StatusRow
          label="Extension"
          ok={flowStatus?.connected ?? false}
          detail={
            flowStatus?.connected
              ? `Flow key: ${flowStatus.flow_key_present ? 'present' : 'missing'}`
              : 'Not connected'
          }
        />
        <StatusRow
          label="Credits"
          ok={!!credits}
          detail={
            credits
              ? `${credits.credits ?? 'n/a'} (${credits.userPaygateTier ?? 'unknown tier'})`
              : 'Unavailable'
          }
        />
      </Section>

      {/* Appearance */}
      <Section title="Appearance">
        <Field label="Theme">
          <div className="flex gap-2">
            <ThemeButton
              value="dark"
              current={theme}
              onClick={() => setTheme('dark')}
            />
            <ThemeButton
              value="light"
              current={theme}
              onClick={() => setTheme('light')}
            />
          </div>
          <p className="text-xs text-text-secondary mt-1">
            Light theme is reserved for a future release.
          </p>
        </Field>
      </Section>

      {/* Reset */}
      <div className="border-t border-border pt-4">
        <button
          onClick={handleReset}
          className="flex items-center gap-2 px-3 py-2 bg-bg-tertiary border border-border hover:border-accent-red/50 hover:text-accent-red rounded-md text-sm transition-colors"
        >
          <RotateCcw size={14} />
          Reset to defaults
        </button>
      </div>
    </div>
  )
}

function Section({
  title,
  children,
}: {
  title: string
  children: React.ReactNode
}) {
  return (
    <section className="bg-bg-secondary border border-border rounded-lg p-4 space-y-4">
      <h2 className="text-sm font-medium uppercase tracking-wide text-text-secondary">
        {title}
      </h2>
      {children}
    </section>
  )
}

function Field({
  label,
  children,
}: {
  label: string
  children: React.ReactNode
}) {
  return (
    <div>
      <label className="block text-sm font-medium mb-1.5">{label}</label>
      {children}
    </div>
  )
}

function StatusRow({
  label,
  ok,
  detail,
}: {
  label: string
  ok: boolean
  detail: string
}) {
  return (
    <div className="flex items-start gap-3 py-2 border-t border-border first:border-t-0">
      {ok ? (
        <CheckCircle2 size={16} className="text-accent-green mt-0.5 shrink-0" />
      ) : (
        <XCircle size={16} className="text-accent-red mt-0.5 shrink-0" />
      )}
      <div className="flex-1 min-w-0">
        <div className="text-sm font-medium">{label}</div>
        <div className="text-xs text-text-secondary truncate">{detail}</div>
      </div>
    </div>
  )
}

function ThemeButton({
  value,
  current,
  onClick,
}: {
  value: 'dark' | 'light'
  current: 'dark' | 'light'
  onClick: () => void
}) {
  const active = value === current
  return (
    <button
      onClick={onClick}
      disabled={value === 'light'}
      className={`px-3 py-1.5 rounded-md text-sm border transition-colors capitalize ${
        active
          ? 'bg-accent-purple/20 border-accent-purple text-accent-purple'
          : 'bg-bg-tertiary border-border text-text-secondary hover:text-text-primary disabled:opacity-50 disabled:cursor-not-allowed'
      }`}
    >
      {value}
    </button>
  )
}
