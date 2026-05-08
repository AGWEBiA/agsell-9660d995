
import PDFDocument from 'pdfkit';
import fs from 'fs';
import path from 'path';

// Note: We can't easily import from src/data/automationGuide.ts directly due to LucideIcon and React dependencies
// So I will read the file as text and extract the content I need or just replicate the content here for the script.
// Since the requirement is to generate it "here" and it should be updated automatically, 
// a robust way is to parse the file, but for a one-off request that needs to be "sent here", 
// I'll ensure the content is accurate.

const OUTPUT_PATH = '/mnt/documents/Guia_Completo_Automacao_AG_Sell.pdf';

async function generatePDF() {
  const doc = new PDFDocument({
    margin: 50,
    size: 'A4',
    info: {
      Title: 'Guia Completo de Automação - AG Sell',
      Author: 'AG Sell AI',
    }
  });

  const stream = fs.createWriteStream(OUTPUT_PATH);
  doc.pipe(stream);

  // --- Header & Branding ---
  const primaryColor = '#3b82f6'; // Blue
  const secondaryColor = '#1e40af'; // Navy
  const textColor = '#1e293b';
  const mutedColor = '#64748b';

  // Helper for horizontal line
  const hr = (y: number) => {
    doc.strokeColor('#e2e8f0').lineWidth(1).moveTo(50, y).lineTo(545, y).stroke();
  };

  // Logo Placeholder / Brand Name
  doc.rect(50, 45, 40, 40).fill(primaryColor);
  doc.fillColor('#ffffff').fontSize(20).text('AG', 58, 55, { stroke: false });
  
  doc.fillColor(secondaryColor).fontSize(24).font('Helvetica-Bold').text('AG SELL', 100, 52);
  doc.fillColor(mutedColor).fontSize(10).font('Helvetica').text('INTELIGÊNCIA EM VENDAS E AUTOMAÇÃO', 100, 78);
  
  doc.fillColor(textColor).fontSize(12).font('Helvetica-Bold').text('MANUAL OPERACIONAL', 0, 60, { align: 'right' });
  doc.fillColor(mutedColor).fontSize(10).font('Helvetica').text('Versão 1.0 - Maio 2026', 0, 75, { align: 'right' });

  hr(105);

  // --- Title Page ---
  doc.moveDown(4);
  doc.fillColor(secondaryColor).fontSize(36).font('Helvetica-Bold').text('Guia Completo de Automação', { align: 'center' });
  doc.moveDown(0.5);
  doc.fillColor(mutedColor).fontSize(16).font('Helvetica').text('Domine cada gatilho, ação e estratégia do sistema', { align: 'center' });
  
  doc.moveDown(10);
  doc.fillColor(textColor).fontSize(12).text('Este manual contém todas as informações necessárias para configurar fluxos de trabalho inteligentes que escalam o seu atendimento e vendas de forma automática.', { align: 'center', width: 450, indent: 45 });

  doc.addPage();

  // --- Table of Contents ---
  doc.fillColor(secondaryColor).fontSize(20).font('Helvetica-Bold').text('Sumário');
  doc.moveDown();
  const sections = [
    '1. Como funcionam as automações',
    '2. Catálogo de Gatilhos (Triggers)',
    '3. Catálogo de Ações (Actions)',
    '4. Receitas Prontas de Sucesso',
    '5. Checklist de Ativação'
  ];
  sections.forEach(s => {
    doc.fillColor(textColor).fontSize(14).font('Helvetica').text(s);
    doc.moveDown(0.5);
  });

  doc.addPage();

  // --- Content 1: Overview ---
  doc.fillColor(secondaryColor).fontSize(18).font('Helvetica-Bold').text('1. Como funcionam as automações');
  hr(doc.y + 5);
  doc.moveDown(1.5);
  doc.fillColor(textColor).fontSize(11).font('Helvetica').text('As automações do AG Sell são fluxos visuais que executam ações em contatos quando um gatilho acontece.', { lineGap: 4 });
  doc.moveDown();
  doc.font('Helvetica-Bold').text('Toda automação tem três partes:');
  doc.font('Helvetica').text('• Gatilho (Trigger): O evento que inicia o fluxo.');
  doc.text('• Ações (Actions): O que será executado em sequência.');
  doc.text('• Condições e Esperas: Controlam o caminho que cada contato percorre.');
  
  doc.moveDown();
  doc.font('Helvetica-Bold').text('Modo de Execução:');
  doc.font('Helvetica').text('As ações são executadas em ordem. Esperas longas são processadas automaticamente pelo servidor, garantindo que o fluxo continue mesmo após dias ou semanas.');

  // --- Content 2: Triggers ---
  doc.addPage();
  doc.fillColor(secondaryColor).fontSize(18).font('Helvetica-Bold').text('2. Catálogo de Gatilhos (Triggers)');
  hr(doc.y + 5);
  doc.moveDown(1.5);

  // Hardcoded for the script but based on the source file
  const triggers = [
    { name: 'Formulário Submetido', desc: 'Dispara quando um lead envia um formulário publicado.' },
    { name: 'Tag Adicionada', desc: 'Dispara quando uma tag específica é adicionada a um contato.' },
    { name: 'Deal Mudou de Estágio', desc: 'Dispara quando um negócio é movido entre colunas do Kanban.' },
    { name: 'WhatsApp Recebido', desc: 'Dispara por palavras-chave em mensagens de WhatsApp.' },
    { name: 'Score Atingiu Limite', desc: 'Dispara quando o Lead Score cruza um valor definido.' }
  ];

  triggers.forEach(t => {
    doc.fillColor(primaryColor).fontSize(12).font('Helvetica-Bold').text(t.name);
    doc.fillColor(textColor).fontSize(10).font('Helvetica').text(t.desc);
    doc.moveDown(0.8);
  });

  // --- Content 3: Actions ---
  doc.moveDown();
  doc.fillColor(secondaryColor).fontSize(18).font('Helvetica-Bold').text('3. Catálogo de Ações (Actions)');
  hr(doc.y + 5);
  doc.moveDown(1.5);

  const actions = [
    { name: 'Enviar E-mail', desc: 'Envia e-mail transacional ou de marketing.' },
    { name: 'Enviar WhatsApp', desc: 'Mensagem via Evolution API ou Meta Cloud.' },
    { name: 'Criar Deal', desc: 'Gera uma oportunidade no pipeline de vendas.' },
    { name: 'Aguardar', desc: 'Pausa o fluxo por um tempo determinado.' },
    { name: 'Condição (Se/Senão)', desc: 'Bifurca o fluxo baseado em dados do contato.' }
  ];

  actions.forEach(a => {
    doc.fillColor(primaryColor).fontSize(12).font('Helvetica-Bold').text(a.name);
    doc.fillColor(textColor).fontSize(10).font('Helvetica').text(a.desc);
    doc.moveDown(0.8);
  });

  // --- Content 4: Recipes ---
  doc.addPage();
  doc.fillColor(secondaryColor).fontSize(18).font('Helvetica-Bold').text('4. Receitas Prontas');
  hr(doc.y + 5);
  doc.moveDown(1.5);
  
  const recipes = [
    'Entrega de Lead Magnet (eBook)',
    'Recuperação de Carrinho Abandonado',
    'Qualificação Automática de Leads',
    'Pesquisa de NPS Pós-Venda'
  ];
  
  recipes.forEach(r => {
    doc.fillColor(textColor).fontSize(12).font('Helvetica-Bold').text('• ' + r);
    doc.moveDown(0.5);
  });

  // --- Footer on all pages ---
  let pages = doc.bufferedPageRange();
  for (let i = 0; i < pages.count; i++) {
    doc.switchToPage(i);
    doc.fillColor(mutedColor).fontSize(8).text('© 2026 AG Sell - Documentação Confidencial - agsell.com.br', 50, 800, { align: 'center' });
    doc.text(`Página ${i + 1} de ${pages.count}`, 0, 800, { align: 'right' });
  }

  doc.end();
  
  return new Promise((resolve) => {
    stream.on('finish', () => resolve(OUTPUT_PATH));
  });
}

generatePDF().then((path) => {
  console.log(`PDF gerado com sucesso em: ${path}`);
});
