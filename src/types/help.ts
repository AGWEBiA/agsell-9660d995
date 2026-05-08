import { type LucideIcon } from 'lucide-react';

export interface HelpCategory {
  id: string;
  title: string;
  icon: LucideIcon;
  description: string;
}

export interface HelpArticle {
  id: string;
  categoryId: string;
  title: string;
  icon: LucideIcon;
  description: string;
  readTime?: string;
  popular?: boolean;
  content: string;
}
