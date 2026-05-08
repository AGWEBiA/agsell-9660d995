import React, { useState, useRef, useEffect, memo } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { 
  ArrowLeft, ChevronRight, Clock, BookOpen, ExternalLink, Eye, Maximize2, X, 
  PlayCircle, Lightbulb, AlertTriangle, Info, Download, Loader2, Heart,
  FileDown
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Link } from 'react-router-dom';
import type { HelpCategory, HelpArticle } from '@/data/helpCenterData';
import { TutorialPresentation } from '@/components/help-center/TutorialPresentation';
import { tutorialPresentations } from '@/data/tutorialPresentations';
import { toast } from 'sonner';

interface Props {
  article: HelpArticle;
  category?: HelpCategory;
  onBack: () => void;
  allArticles: HelpArticle[];
  onNavigate: (articleId?: string, categoryId?: string) => void;
}

function ScreenshotPreview({ label, route }: { label: string; route: string }) {
  const [expanded, setExpanded] = useState(false);

  return (
    <>
      <div className="my-6 rounded-xl border overflow-hidden bg-card shadow-sm group hover:shadow-md transition-shadow duration-200">
        <div className="flex items-center justify-between px-4 py-2 bg-muted/30 border-b">
          <div className="flex items-center gap-2">
            <div className="flex gap-1.5">
              <div className="w-2.5 h-2.5 rounded-full bg-destructive/50" />
              <div className="w-2.5 h-2.5 rounded-full bg-yellow-500/50" />
              <div className="w-2.5 h-2.5 rounded-full bg-green-500/50" />
            </div>
            <span className="text-[10px] text-muted-foreground ml-2 font-mono">{route}</span>
          </div>
          <div className="flex items-center gap-1">
            <Button variant="ghost" size="sm" className="h-6 px-2 text-[10px]" onClick={() => setExpanded(true)}>
              <Maximize2 className="h-3 w-3 mr-1" /> Ampliar
            </Button>
            <Link to={route}>
              <Button variant="ghost" size="sm" className="h-6 px-2 text-[10px]">
                <ExternalLink className="h-3 w-3 mr-1" /> Abrir
              </Button>
            </Link>
          </div>
        </div>
        <Link to={route} className="flex items-center justify-center gap-3 py-10 bg-muted/5 hover:bg-muted/15 transition-colors cursor-pointer group/link">
          <Eye className="h-8 w-8 text-muted-foreground/40 group-hover/link:text-primary transition-colors" />
          <div>
            <p className="text-sm font-medium text-muted-foreground group-hover/link:text-foreground transition-colors">Clique para abrir esta tela</p>
            <p className="text-xs text-muted-foreground/60">{route}</p>
          </div>
        </Link>
        <div className="px-4 py-2 bg-muted/10 border-t">
          <p className="text-[10px] text-muted-foreground flex items-center gap-1.5">
            <Eye className="h-3 w-3" /> {label}
          </p>
        </div>
      </div>

      {expanded && (
        <div className="fixed inset-0 z-[100] bg-background/90 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="w-full max-w-6xl h-[85vh] rounded-2xl border overflow-hidden bg-background shadow-2xl flex flex-col">
            <div className="flex items-center justify-between px-4 py-2 bg-muted/30 border-b shrink-0">
              <div className="flex items-center gap-2">
                <div className="flex gap-1.5">
                  <div className="w-2.5 h-2.5 rounded-full bg-destructive/50" />
                  <div className="w-2.5 h-2.5 rounded-full bg-yellow-500/50" />
                  <div className="w-2.5 h-2.5 rounded-full bg-green-500/50" />
                </div>
                <span className="text-sm text-muted-foreground ml-2">{label}</span>
              </div>
              <div className="flex items-center gap-2">
                <Link to={route}>
                  <Button variant="ghost" size="sm" className="h-7 text-xs">
                    <ExternalLink className="h-3 w-3 mr-1" /> Ir para a página
                  </Button>
                </Link>
                <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setExpanded(false)}>
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </div>
            <Link to={route} className="flex-1 flex items-center justify-center gap-3 hover:bg-muted/10 transition-colors">
              <Eye className="h-10 w-10 text-muted-foreground/30" />
              <p className="text-lg text-muted-foreground">Clique para navegar até {label}</p>
            </Link>
          </div>
        </div>
      )}
    </>
  );
}

function renderSingleBlock(block: string, idx: number): React.ReactNode {
  if (!block.trim()) return null;

  // Headings - but handle cases where heading has content after it on next lines
  if (block.startsWith('### ') || block.startsWith('## ')) {
    const lines = block.split('\n');
    const headingLine = lines[0];
    const isH2 = headingLine.startsWith('## ');
    const headingText = headingLine.replace(/^#{2,3}\s/, '');
    const rest = lines.slice(1).join('\n').trim();

    if (rest) {
      return (
        <React.Fragment key={idx}>
          {isH2
            ? <h2 className="text-xl font-bold mt-10 mb-4 text-foreground">{headingText}</h2>
            : <h3 className="text-lg font-semibold mt-8 mb-3 text-foreground">{headingText}</h3>
          }
          {renderSingleBlock(rest, idx + 10000)}
        </React.Fragment>
      );
    }
    return isH2
      ? <h2 key={idx} className="text-xl font-bold mt-10 mb-4 text-foreground">{headingText}</h2>
      : <h3 key={idx} className="text-lg font-semibold mt-8 mb-3 text-foreground">{headingText}</h3>;
  }

  // Blockquote
  if (block.startsWith('> ')) {
    return (
      <div key={idx} className="border-l-4 border-primary/40 bg-primary/5 rounded-r-xl p-4 my-5">
        <p className="text-sm leading-relaxed" dangerouslySetInnerHTML={{ __html: block.replace('> ', '').replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>') }} />
      </div>
    );
  }

  // Unordered list
  if (block.startsWith('- ') || block.startsWith('* ')) {
    const items = block.split('\n').filter(l => l.trim());
    return (
      <ul key={idx} className="space-y-2.5 my-5">
        {items.map((item, i) => (
          <li key={i} className="flex items-start gap-2.5">
            <ChevronRight className="h-4 w-4 mt-0.5 shrink-0 text-primary" />
            <span className="text-sm leading-relaxed" dangerouslySetInnerHTML={{ __html: item.replace(/^[-*]\s/, '').replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>') }} />
          </li>
        ))}
      </ul>
    );
  }

  // Ordered list  
  if (/^\d+\.\s/.test(block)) {
    const items = block.split('\n').filter(l => l.trim());
    return (
      <ol key={idx} className="space-y-3 my-5">
        {items.map((item, i) => {
          const text = item.replace(/^\d+\.\s*/, '');
          const hasSubItems = text.startsWith('   ');
          return (
            <li key={i} className={cn("flex items-start gap-3", hasSubItems && "ml-8")}>
              {!hasSubItems && (
                <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary text-xs font-bold">
                  {i + 1}
                </span>
              )}
              {hasSubItems && (
                <ChevronRight className="h-4 w-4 mt-0.5 shrink-0 text-primary/60" />
              )}
              <span className="text-sm pt-1 leading-relaxed" dangerouslySetInnerHTML={{ __html: text.trim().replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>') }} />
            </li>
          );
        })}
      </ol>
    );
  }

  // Video embed
  if (block.startsWith('[video:')) {
    const match = block.match(/\[video:(.*?)(?:\|(.*?))?\]/);
    const label = match?.[1] || 'Tutorial em vídeo';
    const videoSrc = match?.[2];
    if (videoSrc) {
      return (
        <div key={idx} className="my-6 rounded-xl border overflow-hidden bg-card shadow-sm">
          <div className="flex items-center gap-2.5 px-4 py-2.5 bg-gradient-to-r from-primary/5 to-transparent border-b">
            <PlayCircle className="h-4 w-4 text-primary" />
            <span className="text-sm font-semibold">{label}</span>
          </div>
          <div className="relative aspect-video bg-black">
            <video src={videoSrc} controls preload="metadata" className="w-full h-full">
              Seu navegador não suporta vídeos.
            </video>
          </div>
        </div>
      );
    }
  }

  // Presentation embed
  if (block.startsWith('[presentation:')) {
    const match = block.match(/\[presentation:(.*?)\]/);
    const presId = match?.[1];
    if (presId && tutorialPresentations[presId]) {
      return <TutorialPresentation key={idx} presentation={tutorialPresentations[presId]} />;
    }
  }

  // Screenshot
  if (block.startsWith('[screenshot:')) {
    const match = block.match(/\[screenshot:(.*?)(?:\|(.*?))?\]/);
    const label = match?.[1] || 'Tela do sistema';
    const route = match?.[2];
    if (route) return <ScreenshotPreview key={idx} label={label} route={route} />;
    return (
      <div key={idx} className="my-6 rounded-xl border bg-muted/20 p-6 text-center">
        <div className="flex items-center justify-center gap-2 text-muted-foreground mb-2">
          <BookOpen className="h-5 w-5" />
          <span className="text-sm font-medium">Captura de tela</span>
        </div>
        <p className="text-sm text-muted-foreground">{label}</p>
      </div>
    );
  }

  // Callouts
  if (block.startsWith('💡')) {
    return (
      <div key={idx} className="rounded-xl p-4 my-5 border bg-blue-500/5 border-blue-500/15 flex items-start gap-2.5">
        <Lightbulb className="h-4 w-4 text-blue-500 shrink-0 mt-0.5" />
        <p className="text-sm leading-relaxed" dangerouslySetInnerHTML={{ __html: block.replace(/^💡\s*/, '').replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>') }} />
      </div>
    );
  }
  if (block.startsWith('⚠️')) {
    return (
      <div key={idx} className="rounded-xl p-4 my-5 border bg-amber-500/5 border-amber-500/15 flex items-start gap-2.5">
        <AlertTriangle className="h-4 w-4 text-amber-500 shrink-0 mt-0.5" />
        <p className="text-sm leading-relaxed" dangerouslySetInnerHTML={{ __html: block.replace(/^⚠️\s*/, '').replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>') }} />
      </div>
    );
  }
  if (block.startsWith('ℹ️')) {
    return (
      <div key={idx} className="rounded-xl p-4 my-5 border bg-primary/5 border-primary/15 flex items-start gap-2.5">
        <Info className="h-4 w-4 text-primary shrink-0 mt-0.5" />
        <p className="text-sm leading-relaxed" dangerouslySetInnerHTML={{ __html: block.replace(/^ℹ️\s*/, '').replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>') }} />
      </div>
    );
  }

  // Links and Buttons in Markdown
  if (block.includes('<a') || block.includes('class=')) {
    return <div key={idx} className="my-4" dangerouslySetInnerHTML={{ __html: block }} />;
  }

  // Regular paragraph
  return <p key={idx} className="text-sm leading-relaxed my-3.5 text-foreground/80" dangerouslySetInnerHTML={{ __html: block.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>') }} />;
}

function renderContentBlocks(content: string): React.ReactNode[] {
  return content.split('\n\n').map((block, idx) => renderSingleBlock(block, idx)).filter(Boolean);
}

export const HelpCenterArticle = memo(function HelpCenterArticle({ article, category, onBack, allArticles, onNavigate }: Props) {
  const [downloading, setDownloading] = useState(false);
  const [favorites, setFavorites] = useState<string[]>(() => {
    const saved = localStorage.getItem('help-center-favorites');
    return saved ? JSON.parse(saved) : [];
  });
  const articleRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    localStorage.setItem('help-center-favorites', JSON.stringify(favorites));
  }, [favorites]);

  const isFavorite = favorites.includes(article.id);

  const toggleFavorite = () => {
    if (isFavorite) {
      setFavorites(prev => prev.filter(id => id !== article.id));
      toast.info('Removido dos favoritos');
    } else {
      setFavorites(prev => [...prev, article.id]);
      toast.success('Adicionado aos favoritos');
    }
  };

  const relatedArticles = allArticles
    .filter((a) => a.categoryId === article.categoryId && a.id !== article.id)
    .slice(0, 4);

  const Icon = article.icon;

  const handleDownloadPDF = async () => {
    if (!articleRef.current) return;
    
    setDownloading(true);
    const toastId = toast.loading('Gerando PDF A4 profissional...');

    try {
      const element = articleRef.current;
      const isCompleteGuide = article.id === 'automation-pdf-download';

      // Dynamic imports for heavy libraries to optimize bundle size
      const [html2canvas, { default: jsPDF }] = await Promise.all([
        import('html2canvas'),
        import('jspdf')
      ]);
      
      // Temporary style adjustments for PDF capture
      const originalStyle = element.style.cssText;
      element.style.color = '#000000';
      element.style.backgroundColor = '#ffffff';
      element.style.padding = '60px 50px';
      element.style.width = '1000px'; // Wider for better resolution before scaling
      element.style.borderRadius = '0';
      element.style.boxShadow = 'none';
      
      const textElements = element.querySelectorAll('.text-foreground, .text-muted-foreground, p, h1, h2, h3, h4, span, li, strong');
      const originalColors: string[] = [];
      Array.from(textElements).forEach((el, i) => {
        const htmlEl = el as HTMLElement;
        originalColors[i] = htmlEl.style.color;
        htmlEl.style.setProperty('color', '#1e293b', 'important');
        htmlEl.style.setProperty('font-family', 'sans-serif', 'important');
      });

      // Find all headings for a global index
      const headings = Array.from(element.querySelectorAll('h2, h3'))
        .filter(h => h.offsetParent !== null)
        .map(h => ({
          text: (h as HTMLElement).innerText,
          level: h.tagName.toLowerCase()
        }));

      // Add Professional Branding Header
      const brandingHeader = document.createElement('div');
      brandingHeader.className = 'pdf-branding-container';
      brandingHeader.style.cssText = `
        border-bottom: 3px solid #3b82f6;
        margin-bottom: 50px;
        padding-bottom: 30px;
        display: block;
        width: 100%;
      `;
      
      brandingHeader.innerHTML = `
        <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 20px;">
          <div style="display: flex; align-items: center; gap: 15px;">
            <div style="background-color: #3b82f6; padding: 12px; border-radius: 12px;">
              <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="m12 19 7-7 3 3-7 7-3-3z"/><path d="m18 13-1.5-7.5L2 2l3.5 14.5L13 18l5-5z"/><path d="m2 2 20 20"/></svg>
            </div>
            <div style="display: flex; flex-direction: column;">
              <span style="font-size: 28px; font-weight: 800; color: #0f172a; letter-spacing: -1px; line-height: 1;">AG SELL</span>
              <span style="font-size: 11px; color: #3b82f6; font-weight: 700; text-transform: uppercase; letter-spacing: 2px; margin-top: 4px;">Marketing Intelligence</span>
            </div>
          </div>
          <div style="text-align: right;">
            <div style="font-size: 11px; color: #64748b; font-weight: 700; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 4px;">Guia Operacional Detalhado</div>
            <div style="font-size: 16px; color: #1e293b; font-weight: 800;">${article.title}</div>
            <div style="font-size: 10px; color: #94a3b8; margin-top: 5px;">Versão 2.4 • Emitido em ${new Date().toLocaleDateString('pt-BR')}</div>
          </div>
        </div>
        
        ${headings.length > 0 ? `
          <div style="margin-top: 40px; padding: 30px; background: #f8fafc; border-radius: 20px; border: 1px solid #e2e8f0;">
            <div style="font-size: 16px; font-weight: 800; color: #0f172a; margin-bottom: 20px; border-bottom: 2px solid #3b82f6; padding-bottom: 10px; display: inline-block;">SUMÁRIO EXECUTIVO</div>
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px 40px;">
              ${headings.map(h => `
                <div style="font-size: 12px; padding-left: ${h.level === 'h3' ? '20px' : '0'}; color: ${h.level === 'h3' ? '#64748b' : '#0f172a'}; font-weight: ${h.level === 'h2' ? '700' : '400'}; border-bottom: 1px dotted #e2e8f0; padding-bottom: 4px; display: flex; justify-content: space-between;">
                  <span>${h.level === 'h2' ? '■' : '•'} ${h.text}</span>
                </div>
              `).join('')}
            </div>
          </div>
        ` : ''}
      `;
      element.prepend(brandingHeader);

      const canvas = await html2canvas.default(element, {
        scale: 2,
        useCORS: true,
        logging: false,
        backgroundColor: '#ffffff',
        windowWidth: 1000,
        y: 0,
        scrollX: 0,
        scrollY: 0
      });

      // Restore original state immediately to not flicker
      element.removeChild(brandingHeader);
      element.style.cssText = originalStyle;
      Array.from(textElements).forEach((el, i) => {
        (el as HTMLElement).style.color = originalColors[i];
      });

      const imgData = canvas.toDataURL('image/jpeg', 0.95);
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4'
      });

      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = pdf.internal.pageSize.getHeight();
      
      // Margins
      const margin = 10;
      const contentWidth = pdfWidth - (2 * margin);
      
      const imgProps = (pdf as any).getImageProperties(imgData);
      const scaledHeight = (imgProps.height * contentWidth) / imgProps.width;
      
      let heightLeft = scaledHeight;
      let position = margin; // Start with top margin

      // First page
      pdf.addImage(imgData, 'JPEG', margin, position, contentWidth, scaledHeight);
      heightLeft -= (pdfHeight - (2 * margin));

      // Subsequent pages
      while (heightLeft > 0) {
        position = heightLeft - scaledHeight + margin;
        pdf.addPage();
        // Add a white rectangle at the top to cover the "bleed" from previous page
        pdf.setFillColor(255, 255, 255);
        pdf.rect(0, 0, pdfWidth, margin, 'F');
        
        pdf.addImage(imgData, 'JPEG', margin, position, contentWidth, scaledHeight);
        
        // Add white rectangle at the bottom to cover the "bleed" to next page
        pdf.setFillColor(255, 255, 255);
        pdf.rect(0, pdfHeight - margin, pdfWidth, margin, 'F');
        
        heightLeft -= (pdfHeight - (2 * margin));
      }
      
      // Add dynamic footer and page numbers
      const pageCount = (pdf as any).internal.getNumberOfPages();
      for (let i = 1; i <= pageCount; i++) {
        pdf.setPage(i);
        pdf.setFontSize(8);
        pdf.setTextColor(148, 163, 184); // slate-400
        
        // Horizontal line
        pdf.setDrawColor(226, 232, 240);
        pdf.line(margin, pdfHeight - margin - 5, pdfWidth - margin, pdfHeight - margin - 5);
        
        // Footer texts
        pdf.text('AG Sell Marketing Intelligence - Guia de Automações 2024', margin, pdfHeight - margin);
        pdf.text(`Página ${i} de ${pageCount}`, pdfWidth - margin, pdfHeight - margin, { align: 'right' });
      }

      pdf.save(`AG-Sell-Manual-${article.title.replace(/\s+/g, '-')}.pdf`);
      toast.success('PDF A4 gerado com sucesso!', { id: toastId });
    } catch (error) {
      console.error('PDF generation error:', error);
      toast.error('Erro ao gerar PDF.', { id: toastId });
    } finally {
      setDownloading(false);
    }
  };

  const isAutomationGuide = article.categoryId === 'automation-guide';

  return (
    <div className="relative">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-5 gap-3">
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" onClick={onBack} className="-ml-2 text-muted-foreground hover:text-foreground gap-1">
            <ArrowLeft className="h-4 w-4" /> {category?.title || 'Voltar'}
          </Button>
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={toggleFavorite}
            className={cn("gap-2 text-xs", isFavorite ? "text-red-500 bg-red-500/5 hover:bg-red-500/10" : "text-muted-foreground")}
          >
            <Heart className={cn("h-4 w-4", isFavorite && "fill-current")} />
            {isFavorite ? 'Favorito' : 'Favoritar'}
          </Button>
        </div>

        {isAutomationGuide && (
          <div className="flex items-center gap-2">
            <Button 
              variant="outline" 
              size="sm" 
              onClick={handleDownloadPDF} 
              disabled={downloading}
              className="gap-2 text-xs font-medium border-primary/20 hover:border-primary/50 hover:bg-primary/5"
            >
              {downloading ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <FileDown className="h-3.5 w-3.5" />
              )}
              Exportar A4
            </Button>
          </div>
        )}
      </div>

      <div ref={articleRef} className={cn("bg-background", downloading && "p-8 max-w-[800px] mx-auto")}>
        {/* Article header */}
        <div className="flex items-start gap-4 mb-6">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-primary/10 shadow-sm">
            <Icon className="h-6 w-6 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-foreground">{article.title}</h1>
            <p className="text-muted-foreground mt-1 text-sm leading-relaxed">{article.description}</p>
            <div className="flex items-center gap-3 mt-2.5">
              {category && (
                <Badge variant="secondary" className="text-xs">{category.title}</Badge>
              )}
              {article.readTime && (
                <span className="flex items-center gap-1 text-xs text-muted-foreground">
                  <Clock className="h-3 w-3" /> {article.readTime}
                </span>
              )}
            </div>
          </div>
        </div>

        <Separator className="mb-8" />

        {/* Article content */}
        <article className="prose prose-sm dark:prose-invert max-w-none">
          {renderContentBlocks(article.content)}
        </article>
      </div>

      {/* Related articles */}
      {relatedArticles.length > 0 && (
        <div className="mt-12">
          <Separator className="mb-6" />
          <h3 className="font-semibold mb-4 text-foreground">Artigos relacionados</h3>
          <div className="grid sm:grid-cols-2 gap-2.5">
            {relatedArticles.map((ra) => (
              <button
                key={ra.id}
                onClick={() => onNavigate(ra.id, ra.categoryId)}
                className="group text-left p-3.5 rounded-xl border hover:border-primary/30 hover:bg-accent/30 transition-all duration-200"
              >
                <p className="text-sm font-medium group-hover:text-primary transition-colors">{ra.title}</p>
                <p className="text-xs text-muted-foreground mt-1 line-clamp-1">{ra.description}</p>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
});
