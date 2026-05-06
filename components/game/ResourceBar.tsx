'use client';
import { Resources } from '@/lib/supabase';

const RESOURCE_ICONS: Record<string, string> = {
  scrap: '🔩', wire: '🔌', chip: '💾', fuel: '⛽', glow: '✨', cred: '💎',
};
const RESOURCE_COLORS: Record<string, string> = {
  scrap: '#ff7043', wire: '#a389f4', chip: '#42a5f5', fuel: '#ff5722', glow: '#26c6da', cred: '#ffd700',
};

export default function ResourceBar({ resources }: { resources: Resources }) {
  const keys = ['scrap','wire','chip','fuel','glow','cred'] as const;
  return (
    <div className="resource-bar">
      {keys.map(key => (
        <div key={key} className="resource-pill" title={key.toUpperCase()}>
          <span className="resource-icon">{RESOURCE_ICONS[key]}</span>
          <span className="resource-val" style={{ color: RESOURCE_COLORS[key] }}>
            {resources[key].toLocaleString()}
          </span>
          <span className="resource-key">{key}</span>
        </div>
      ))}
    </div>
  );
}
