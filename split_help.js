const fs = require('fs');
const path = require('path');

const filePath = 'src/data/helpCenterData.ts';
const content = fs.readFileSync(filePath, 'utf-8');

const lines = content.split('\n');

const categories = [
  { id: 'getting-started', fileName: 'getting-started.ts' },
  { id: 'crm', fileName: 'crm.ts' },
  { id: 'communication', fileName: 'communication.ts' },
  { id: 'marketing', fileName: 'marketing.ts' },
  { id: 'intelligence', fileName: 'intelligence.ts' },
  { id: 'settings', fileName: 'settings.ts' },
  { id: 'documentation', fileName: 'documentation.ts' },
];

const imports = `import {
  Users, BarChart3, Settings, FileText, Rocket, Zap, MessageSquare, Workflow,
  LayoutDashboard, Building2, Kanban, Tags, CheckSquare, Inbox, Mail, Target,
  Link as LinkIcon, Bot, Brain, Trophy, Shield, Key, Webhook, SlidersHorizontal,
  Instagram, ListChecks, BookOpen, Globe, Briefcase, Star, PlayCircle, HelpCircle,
  Vote, SplitSquareVertical, Megaphone, Search, Bell, Palette, Download, Save,
  RefreshCw, FileCode, Heart, Code2, FileDown
} from 'lucide-react';
import { HelpArticle } from '@/types/help';

`;

const categoryArticles = {};
categories.forEach(cat => categoryArticles[cat.id] = []);

let currentArticleLines = [];
let currentCategory = '';
let inArticle = false;

for (let i = 0; i < lines.length; i++) {
  const line = lines[i];
  
  // Simple heuristic for article start
  if (line.trim() === '{') {
    inArticle = true;
    currentArticleLines = [line];
    currentCategory = '';
  } else if (inArticle) {
    currentArticleLines.push(line);
    const catMatch = line.match(/categoryId: '([^']+)'/);
    if (catMatch) {
      currentCategory = catMatch[1];
    }
    
    // Heuristic for article end
    if (line.trim() === '},') {
      if (currentCategory && categoryArticles[currentCategory]) {
        categoryArticles[currentCategory].push(currentArticleLines.join('\n'));
      }
      inArticle = false;
      currentArticleLines = [];
    }
  }
}

if (!fs.existsSync('src/data/help')) {
  fs.mkdirSync('src/data/help', { recursive: true });
}

categories.forEach(cat => {
  const articles = categoryArticles[cat.id];
  if (articles && articles.length > 0) {
    const fileContent = `${imports}export const ${cat.id.replace(/-/g, '_')}_articles: HelpArticle[] = [\n${articles.join('\n')}\n];\n`;
    fs.writeFileSync(path.join('src/data/help', cat.fileName), fileContent);
  }
});
