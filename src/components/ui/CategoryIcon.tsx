import React from 'react';
import {
  Briefcase,
  Compass,
  Cpu,
  GraduationCap,
  HeartHandshake,
  Landmark,
  Music,
  Palette,
  Shapes,
  Trophy
} from 'lucide-react';
import { CategoryDefinition } from '../../types';
import { CATEGORY_DEFINITIONS } from '../../data/categories';

const ICONS: Record<CategoryDefinition['iconName'], React.FC<{ className?: string }>> = {
  Compass,
  Trophy,
  Music,
  Briefcase,
  Cpu,
  GraduationCap,
  Palette,
  HeartHandshake,
  Landmark,
  Shapes
};

/** Icon for a category id ("all" or an EventCategory); unknown ids fall back to the compass. */
export const CategoryIcon: React.FC<{ category: string; className?: string }> = ({ category, className }) => {
  const def = CATEGORY_DEFINITIONS.find((c) => c.id === category);
  const Icon = (def && ICONS[def.iconName]) || Compass;
  return <Icon className={className} />;
};
