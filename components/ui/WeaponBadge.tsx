import { Sword, Shield, Crosshair, Anchor, Radio } from 'lucide-react'

const WEAPON_CONFIG: Record<string, { label: string; icon: React.ComponentType<any> }> = {
  BROADBLADE: { label: 'Broadblade', icon: Shield },
  SWORD:      { label: 'Sword',      icon: Sword },
  PISTOLS:    { label: 'Pistols',    icon: Crosshair },
  GAUNTLETS:  { label: 'Gauntlets',  icon: Anchor },
  RECTIFIER:  { label: 'Rectifier',  icon: Radio },
}

export interface WeaponBadgeProps {
  weaponType?: string
  weapon?: string
  compact?: boolean
  size?: 'sm' | 'md' | 'lg'
}

export default function WeaponBadge({
  weaponType,
  weapon,
  compact = false,
  size,
}: WeaponBadgeProps) {
  const typeKey = (weapon || weaponType || 'SWORD').toUpperCase()
  const config = WEAPON_CONFIG[typeKey] || WEAPON_CONFIG.SWORD
  const Icon = config.icon
  const isCompact = compact || size === 'sm'

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full font-medium text-gray-300 border border-white/10 ${
        isCompact ? 'px-2 py-0.5 text-xs' : 'px-3 py-1 text-sm'
      }`}
      style={{ background: 'rgba(30, 48, 80, 0.5)' }}
    >
      <Icon size={isCompact ? 11 : 13} />
      {config.label}
    </span>
  )
}
