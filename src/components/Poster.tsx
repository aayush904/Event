import type { CSSProperties } from 'react';
import type { Cover } from '../lib/types';
import { PALETTES } from '../lib/constants';
import { categoryLabel } from '../lib/constants';

/** CSS-only background patterns. Each takes ink + accent colours. */
function patternStyle(pattern: number, ink: string, accent: string): CSSProperties {
  switch (pattern % 8) {
    case 0:
      return { backgroundImage: `repeating-linear-gradient(-45deg, transparent 0 18px, ${ink}22 18px 20px)` };
    case 1:
      return { backgroundImage: `radial-gradient(${ink}33 1.6px, transparent 1.8px)`, backgroundSize: '12px 12px' };
    case 2:
      return { backgroundImage: `radial-gradient(circle at 82% 30%, ${accent} 0 22%, transparent 22.3%)` };
    case 3:
      return {
        backgroundImage: `linear-gradient(${ink}1f 1px, transparent 1px), linear-gradient(90deg, ${ink}1f 1px, transparent 1px)`,
        backgroundSize: '24px 24px',
      };
    case 4:
      return { backgroundImage: `repeating-radial-gradient(circle at 100% 100%, transparent 0 14px, ${ink}26 14px 16px)` };
    case 5:
      return { backgroundImage: `linear-gradient(180deg, transparent 58%, ${accent} 58% 66%, transparent 66% 72%, ${accent} 72% 76%, transparent 76%)` };
    case 6:
      return { backgroundImage: `conic-gradient(from 90deg at 78% 40%, ${accent} 0 25%, transparent 25%)` };
    default:
      return { backgroundImage: `repeating-linear-gradient(90deg, transparent 0 30px, ${ink}18 30px 31px)` };
  }
}

interface Props {
  cover: Cover;
  title: string;
  category: string;
  dateLabel: string;
  size?: 'md' | 'lg';
  className?: string;
}

export default function Poster({ cover, title, category, dateLabel, size = 'md', className = '' }: Props) {
  if (cover.kind === 'image') {
    return (
      <div className={`poster ${size === 'lg' ? 'lg' : ''} ${className}`} style={{ background: '#16130f' }}>
        <img className="cover-img" src={cover.src} alt="" />
      </div>
    );
  }
  const [bg, ink, accent] = PALETTES[cover.palette % PALETTES.length];
  return (
    <div className={`poster ${size === 'lg' ? 'lg' : ''} ${className}`} style={{ background: bg, color: ink }} aria-hidden="true">
      <div className="pat" style={patternStyle(cover.pattern, ink, accent)} />
      <div className="poster-top">
        <span>{categoryLabel(category)}</span>
        <span>{dateLabel}</span>
      </div>
      <div className="poster-title">{title}</div>
    </div>
  );
}
