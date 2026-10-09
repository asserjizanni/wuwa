import { Wind, Sun, Flame, Zap, Snowflake, Moon } from 'lucide-react'

const ELEMENT_CONFIG: Record<string, { label: string; icon: React.ComponentType<any>; className: string }> = {
  AERO:    { label: 'Aero',    icon: Wind,      className: 'element-aero' },
  SPECTRO: { label: 'Spectro', icon: Sun,       className: 'element-spectro' },
  FUSION:  { label: 'Fusion',  icon: Flame,     className: 'element-fusion' },
  ELECTRO: { label: 'Electro', icon: Zap,       className: 'element-electro' },
  GLACIO:  { label: 'Glacio',  icon: Snowflake, className: 'element-glacio' },
  HAVOC:   { label: 'Havoc',   icon: Moon,      className: 'element-havoc' },
}

export interface ElementBadgeProps {
  element: string
  compact?: boolean
  size?: 'sm' | 'md' | 'lg'
  showLabel?: boolean
}

export default function ElementBadge({
  element,
  compact = false,
  size,
  showLabel = true,
}: ElementBadgeProps) {
  const isCompact = compact || size === 'sm'
  const config = ELEMENT_CONFIG[element?.toUpperCase()] || ELEMENT_CONFIG.AERO
  const Icon = config.icon

  if (isCompact) {
    return (
      <span className={`element-badge ${config.className} text-xs py-0.5 px-2`}>
        <Icon size={11} />
        {showLabel && config.label}
      </span>
    )
  }

  return (
    <span className={`element-badge ${config.className} text-sm py-1 px-3`}>
      <Icon size={14} />
      {showLabel && config.label}
    </span>
  )
}
