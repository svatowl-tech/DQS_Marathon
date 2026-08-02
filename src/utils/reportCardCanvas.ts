import { WeeklySundayReport } from '../types';
import { formatDateRu } from './dqsEngine';

export function generateReportCardImage(report: WeeklySundayReport, userName: string): string {
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  if (!ctx) return '';

  const width = 1080;
  const height = 1350;
  canvas.width = width;
  canvas.height = height;

  // Background Gradient
  const bgGrad = ctx.createLinearGradient(0, 0, 0, height);
  bgGrad.addColorStop(0, '#050505'); 
  bgGrad.addColorStop(1, '#111111'); 
  ctx.fillStyle = bgGrad;
  ctx.fillRect(0, 0, width, height);

  // Decorative Accent Shapes
  ctx.fillStyle = 'rgba(16, 185, 129, 0.08)'; // emerald glow
  ctx.beginPath();
  ctx.arc(900, 150, 280, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = 'rgba(16, 185, 129, 0.05)';
  ctx.beginPath();
  ctx.arc(150, 1100, 320, 0, Math.PI * 2);
  ctx.fill();

  // Outer Border Box
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.08)';
  ctx.lineWidth = 2;
  ctx.strokeRect(30, 30, width - 60, height - 60);

  // HEADER
  // Tag / Badge
  ctx.fillStyle = '#10b981';
  ctx.beginPath();
  ctx.roundRect(60, 70, 240, 42, 21);
  ctx.fill();

  ctx.fillStyle = '#000000';
  ctx.font = 'bold 18px "Plus Jakarta Sans", sans-serif';
  ctx.fillText('★ DQS ОТЧЕТ', 90, 97);

  // Dates Title
  ctx.fillStyle = '#f8fafc';
  ctx.font = 'bold 38px "Plus Jakarta Sans", sans-serif';
  ctx.fillText(`Неделя: ${formatDateRu(report.weekStartDate)} — ${formatDateRu(report.weekEndDate)}`, 60, 155);

  // User Name
  ctx.fillStyle = '#94a3b8';
  ctx.font = '22px "Plus Jakarta Sans", sans-serif';
  ctx.fillText(`Участник: ${userName || 'Участник'}`, 60, 190);

  // TOP STATS CARDS GRID (Y: 220 to 420)
  // Card 1: DQS Score
  drawCard(ctx, 60, 220, 460, 170, 'rgba(17, 17, 17, 0.85)', 'rgba(16, 185, 129, 0.3)');
  ctx.fillStyle = '#10b981';
  ctx.font = '600 18px "Plus Jakarta Sans", sans-serif';
  ctx.fillText('СРЕДНИЙ DQS ЗА НЕДЕЛЮ', 85, 260);

  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 62px "Plus Jakarta Sans", sans-serif';
  ctx.fillText(`${report.avgDqs.toFixed(1)}`, 85, 335);

  ctx.fillStyle = '#10b981';
  ctx.font = '600 20px "Plus Jakarta Sans", sans-serif';
  ctx.fillText(`★ ${report.greenDaysCount}/7 зеленых дней`, 230, 330);

  // Card 2: Weight Progress
  drawCard(ctx, 560, 220, 460, 170, 'rgba(17, 17, 17, 0.85)', 'rgba(16, 185, 129, 0.3)');
  ctx.fillStyle = '#34d399';
  ctx.font = '600 18px "Plus Jakarta Sans", sans-serif';
  ctx.fillText('ПРОГРЕСС ВЕСА (СРЕДНИЙ)', 585, 260);

  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 42px "Plus Jakarta Sans", sans-serif';
  ctx.fillText(`${report.weightCurrentWeekAvg.toFixed(1)} кг`, 585, 315);

  ctx.fillStyle = '#cbd5e1';
  ctx.font = '18px "Plus Jakarta Sans", sans-serif';
  ctx.fillText(`За неделю: ${report.weightChangeWeekPct >= 0 ? '+' : ''}${report.weightChangeWeekPct}%`, 585, 355);
  ctx.fillText(`От старта: ${report.weightChangeTotalPct >= 0 ? '+' : ''}${report.weightChangeTotalPct}%`, 780, 355);

  // SECTION CONTENT BOXES
  let currentY = 420;

  // Box 1: Что получилось
  currentY = drawSectionBox(
    ctx,
    60,
    currentY,
    960,
    '✔ Что получилось отлично',
    report.whatWentWell || '— Без записей —',
    '#22c55e'
  );

  // Box 2: Что не получилось / сложности
  currentY = drawSectionBox(
    ctx,
    60,
    currentY + 20,
    960,
    '▲ Что не получилось / сложности',
    report.whatWasDifficult || '— Без записей —',
    '#f59e0b'
  );

  // Box 3: Главный инсайт
  currentY = drawSectionBox(
    ctx,
    60,
    currentY + 20,
    960,
    '💡 Инсайт недели',
    report.insights || '— Без записей —',
    '#a855f7'
  );

  // Box 4: Фокус на следующую неделю
  currentY = drawSectionBox(
    ctx,
    60,
    currentY + 20,
    960,
    '🎯 Фокус на следующую неделю',
    report.nextWeekFocus || '— Без записей —',
    '#0ea5e9'
  );

  // FOOTER
  ctx.fillStyle = 'rgba(255, 255, 255, 0.08)';
  ctx.fillRect(60, height - 100, 960, 1);

  ctx.fillStyle = '#94a3b8';
  ctx.font = '18px "Plus Jakarta Sans", sans-serif';
  ctx.fillText('Diet Quality Score (DQS) Diary • Без подсчета калорий • Качество & Разнообразие', 60, height - 55);

  ctx.fillStyle = '#38bdf8';
  ctx.font = 'bold 18px "Plus Jakarta Sans", sans-serif';
  ctx.fillText('DQS APP', 930, height - 55);

  return canvas.toDataURL('image/png');
}

function drawCard(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  bgColor: string,
  borderColor: string
) {
  ctx.save();
  ctx.fillStyle = bgColor;
  ctx.strokeStyle = borderColor;
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.roundRect(x, y, w, h, 16);
  ctx.fill();
  ctx.stroke();
  ctx.restore();
}

function drawSectionBox(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  title: string,
  text: string,
  accentColor: string
): number {
  const padding = 24;
  ctx.font = '18px "Plus Jakarta Sans", sans-serif';
  
  // Wrap text lines
  const lines = wrapText(ctx, text, w - padding * 2 - 20);
  const titleHeight = 30;
  const lineHeight = 26;
  const boxHeight = Math.max(110, padding * 2 + titleHeight + lines.length * lineHeight);

  // Draw background
  ctx.save();
  ctx.fillStyle = 'rgba(17, 17, 17, 0.85)';
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.08)';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.roundRect(x, y, w, boxHeight, 16);
  ctx.fill();
  ctx.stroke();

  // Left accent bar
  ctx.fillStyle = accentColor;
  ctx.beginPath();
  ctx.roundRect(x + 4, y + 16, 6, boxHeight - 32, 3);
  ctx.fill();

  // Title
  ctx.fillStyle = accentColor;
  ctx.font = 'bold 20px "Plus Jakarta Sans", sans-serif';
  ctx.fillText(title, x + padding + 6, y + padding + 10);

  // Text lines
  ctx.fillStyle = '#e2e8f0';
  ctx.font = '18px "Plus Jakarta Sans", sans-serif';
  lines.forEach((line, i) => {
    ctx.fillText(line, x + padding + 6, y + padding + titleHeight + 12 + i * lineHeight);
  });

  ctx.restore();
  return y + boxHeight;
}

function wrapText(ctx: CanvasRenderingContext2D, text: string, maxWidth: number): string[] {
  const words = text.split(' ');
  const lines: string[] = [];
  let currentLine = '';

  for (let i = 0; i < words.length; i++) {
    const word = words[i];
    const testLine = currentLine ? `${currentLine} ${word}` : word;
    const metrics = ctx.measureText(testLine);
    if (metrics.width > maxWidth && currentLine) {
      lines.push(currentLine);
      currentLine = word;
    } else {
      currentLine = testLine;
    }
  }
  if (currentLine) {
    lines.push(currentLine);
  }
  return lines.length > 0 ? lines : [''];
}
