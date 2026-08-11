import { BodyMeasurements, WeeklySundayReport } from '../types';
import { formatDateRu } from './dqsEngine';

export interface ReportCardOptions {
  includeWeightChart?: boolean;
  includeMeasurements?: boolean;
}

export interface DayWeightData {
  dayName: string;
  dateStr: string;
  weight?: number;
  dqs?: number;
}

export function generateReportCardImage(
  report: WeeklySundayReport,
  userName: string,
  options: ReportCardOptions = { includeWeightChart: true, includeMeasurements: true },
  weekLogsData: DayWeightData[] = []
): string {
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  if (!ctx) return '';

  const width = 1080;

  // Calculate dynamic canvas height
  let estimatedHeight = 1150;
  if (options.includeWeightChart) estimatedHeight += 240;
  if (options.includeMeasurements) estimatedHeight += 210;

  // Measure text section box heights
  const dummyCtx = document.createElement('canvas').getContext('2d');
  if (dummyCtx) {
    dummyCtx.font = '18px "Plus Jakarta Sans", sans-serif';
    const text1 = report.whatWentWell || '— Без записей —';
    const text2 = report.whatWasDifficult || '— Без записей —';
    const text3 = report.insights || '— Без записей —';
    const text4 = report.nextWeekFocus || '— Без записей —';

    const h1 = Math.max(110, 48 + 30 + wrapText(dummyCtx, text1, 900).length * 26);
    const h2 = Math.max(110, 48 + 30 + wrapText(dummyCtx, text2, 900).length * 26);
    const h3 = Math.max(110, 48 + 30 + wrapText(dummyCtx, text3, 900).length * 26);
    const h4 = Math.max(110, 48 + 30 + wrapText(dummyCtx, text4, 900).length * 26);

    estimatedHeight = 420 + (options.includeWeightChart ? 240 : 0) + (options.includeMeasurements ? 210 : 0) + h1 + h2 + h3 + h4 + 160;
  }

  const height = Math.max(1350, Math.round(estimatedHeight));
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
  ctx.arc(150, height - 200, 320, 0, Math.PI * 2);
  ctx.fill();

  // Outer Border Box
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.08)';
  ctx.lineWidth = 2;
  ctx.strokeRect(30, 30, width - 60, height - 60);

  // HEADER
  // Tag / Badge
  ctx.fillStyle = '#10b981';
  ctx.beginPath();
  ctx.roundRect(60, 65, 240, 42, 21);
  ctx.fill();

  ctx.fillStyle = '#000000';
  ctx.font = 'bold 18px "Plus Jakarta Sans", sans-serif';
  ctx.fillText('★ DQS ОТЧЕТ', 90, 92);

  // Dates Title
  ctx.fillStyle = '#f8fafc';
  ctx.font = 'bold 36px "Plus Jakarta Sans", sans-serif';
  ctx.fillText(`Неделя: ${formatDateRu(report.weekStartDate)} — ${formatDateRu(report.weekEndDate)}`, 60, 150);

  // User Name
  ctx.fillStyle = '#94a3b8';
  ctx.font = '22px "Plus Jakarta Sans", sans-serif';
  ctx.fillText(`Участник: ${userName || 'Участник'}`, 60, 185);

  // TOP STATS CARDS GRID (Y: 215 to 385)
  // Card 1: DQS Score
  drawCard(ctx, 60, 215, 460, 160, 'rgba(17, 17, 17, 0.85)', 'rgba(16, 185, 129, 0.3)');
  ctx.fillStyle = '#10b981';
  ctx.font = '600 17px "Plus Jakarta Sans", sans-serif';
  ctx.fillText('СРЕДНИЙ DQS ЗА НЕДЕЛЮ', 85, 250);

  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 58px "Plus Jakarta Sans", sans-serif';
  ctx.fillText(`${report.avgDqs.toFixed(1)}`, 85, 320);

  ctx.fillStyle = '#10b981';
  ctx.font = '600 19px "Plus Jakarta Sans", sans-serif';
  ctx.fillText(`★ ${report.greenDaysCount}/7 зеленых дней`, 230, 315);

  // Card 2: Weight Progress
  drawCard(ctx, 560, 215, 460, 160, 'rgba(17, 17, 17, 0.85)', 'rgba(16, 185, 129, 0.3)');
  ctx.fillStyle = '#34d399';
  ctx.font = '600 17px "Plus Jakarta Sans", sans-serif';
  ctx.fillText('ПРОГРЕСС ВЕСА (СРЕДНИЙ)', 585, 250);

  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 40px "Plus Jakarta Sans", sans-serif';
  ctx.fillText(`${report.weightCurrentWeekAvg.toFixed(1)} кг`, 585, 305);

  ctx.fillStyle = '#cbd5e1';
  ctx.font = '17px "Plus Jakarta Sans", sans-serif';
  ctx.fillText(`За неделю: ${report.weightChangeWeekPct >= 0 ? '+' : ''}${report.weightChangeWeekPct}%`, 585, 345);
  ctx.fillText(`От старта: ${report.weightChangeTotalPct >= 0 ? '+' : ''}${report.weightChangeTotalPct}%`, 770, 345);

  let currentY = 395;

  // BLOCK: WEEKLY WEIGHT CHART
  if (options.includeWeightChart && weekLogsData && weekLogsData.length > 0) {
    currentY = drawWeightChartBox(ctx, 60, currentY, 960, 220, weekLogsData);
    currentY += 20;
  }

  // BLOCK: WEEKLY MEASUREMENTS CHANGES
  if (options.includeMeasurements) {
    currentY = drawMeasurementsBox(
      ctx,
      60,
      currentY,
      960,
      190,
      report.measurementsStart || {},
      report.measurementsCurrent || {}
    );
    currentY += 20;
  }

  // SECTION CONTENT BOXES
  // Box 1: Что получилось
  currentY = drawSectionBox(
    ctx,
    60,
    currentY,
    960,
    '✔ Что получилось отлично',
    report.whatWentWell || '— Без записей —',
    '#22c55e'
  ) + 20;

  // Box 2: Что не получилось / сложности
  currentY = drawSectionBox(
    ctx,
    60,
    currentY,
    960,
    '▲ Что не получилось / сложности',
    report.whatWasDifficult || '— Без записей —',
    '#f59e0b'
  ) + 20;

  // Box 3: Главный инсайт
  currentY = drawSectionBox(
    ctx,
    60,
    currentY,
    960,
    '💡 Инсайт недели',
    report.insights || '— Без записей —',
    '#a855f7'
  ) + 20;

  // Box 4: Фокус на следующую неделю
  currentY = drawSectionBox(
    ctx,
    60,
    currentY,
    960,
    '🎯 Фокус на следующую неделю',
    report.nextWeekFocus || '— Без записей —',
    '#0ea5e9'
  ) + 20;

  // FOOTER
  const footerY = Math.max(currentY + 20, height - 80);
  ctx.fillStyle = 'rgba(255, 255, 255, 0.08)';
  ctx.fillRect(60, footerY - 20, 960, 1);

  ctx.fillStyle = '#94a3b8';
  ctx.font = '17px "Plus Jakarta Sans", sans-serif';
  ctx.fillText('Diet Quality Score (DQS) Diary • Без подсчета калорий • Качество & Разнообразие', 60, footerY + 15);

  ctx.fillStyle = '#38bdf8';
  ctx.font = 'bold 17px "Plus Jakarta Sans", sans-serif';
  ctx.fillText('DQS APP', 930, footerY + 15);

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

function drawWeightChartBox(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  weekLogsData: DayWeightData[]
): number {
  ctx.save();
  // Card Container
  ctx.fillStyle = 'rgba(17, 17, 17, 0.85)';
  ctx.strokeStyle = 'rgba(56, 189, 248, 0.3)'; // sky blue accent
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.roundRect(x, y, w, h, 16);
  ctx.fill();
  ctx.stroke();

  // Title
  ctx.fillStyle = '#38bdf8';
  ctx.font = 'bold 18px "Plus Jakarta Sans", sans-serif';
  ctx.fillText('📈 ДИНАМИКА ВЕСА ЗА НЕДЕЛЮ (7 ДНЕЙ)', x + 24, y + 36);

  // Filter valid weights
  const validWeights = weekLogsData.map((d) => d.weight).filter((w): w is number => typeof w === 'number' && w > 0);

  if (validWeights.length === 0) {
    ctx.fillStyle = '#94a3b8';
    ctx.font = '16px "Plus Jakarta Sans", sans-serif';
    ctx.fillText('Записи веса за текущую неделю отсутствуют', x + 24, y + 110);
    ctx.restore();
    return y + h;
  }

  const minW = Math.min(...validWeights);
  const maxW = Math.max(...validWeights);
  const range = maxW - minW > 0 ? maxW - minW : 1;

  const chartLeft = x + 70;
  const chartRight = x + w - 70;
  const chartTop = y + 70;
  const chartBottom = y + h - 55;
  const chartHeight = chartBottom - chartTop;

  // Grid lines
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.06)';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(chartLeft, chartTop);
  ctx.lineTo(chartRight, chartTop);
  ctx.moveTo(chartLeft, chartBottom);
  ctx.lineTo(chartRight, chartBottom);
  ctx.stroke();

  // X Step
  const stepX = (chartRight - chartLeft) / Math.max(1, weekLogsData.length - 1);

  // Points array
  const points: Array<{ x: number; y: number; weight?: number; dayName: string; dateStr: string }> = [];

  weekLogsData.forEach((d, i) => {
    const px = chartLeft + i * stepX;
    if (typeof d.weight === 'number' && d.weight > 0) {
      const py = chartBottom - ((d.weight - minW) / range) * (chartHeight - 20) - 10;
      points.push({ x: px, y: py, weight: d.weight, dayName: d.dayName, dateStr: d.dateStr });
    } else {
      points.push({ x: px, y: chartBottom, dayName: d.dayName, dateStr: d.dateStr });
    }
  });

  // Draw connecting lines for valid points
  const validPoints = points.filter((p) => p.weight !== undefined);

  if (validPoints.length > 1) {
    ctx.strokeStyle = '#38bdf8';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(validPoints[0].x, validPoints[0].y);
    for (let i = 1; i < validPoints.length; i++) {
      ctx.lineTo(validPoints[i].x, validPoints[i].y);
    }
    ctx.stroke();
  }

  // Draw point circles and labels
  points.forEach((p) => {
    // X Label (Day + Date)
    ctx.fillStyle = '#cbd5e1';
    ctx.font = 'bold 15px "Plus Jakarta Sans", sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(p.dayName, p.x, chartBottom + 22);

    ctx.fillStyle = '#64748b';
    ctx.font = '13px "Plus Jakarta Sans", sans-serif';
    ctx.fillText(p.dateStr, p.x, chartBottom + 38);

    if (p.weight !== undefined) {
      // Circle node
      ctx.fillStyle = '#38bdf8';
      ctx.beginPath();
      ctx.arc(p.x, p.y, 6, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(p.x, p.y, 3, 0, Math.PI * 2);
      ctx.fill();

      // Value text above node
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 15px "Plus Jakarta Sans", sans-serif';
      ctx.fillText(`${p.weight.toFixed(1)}`, p.x, p.y - 12);
    } else {
      // Empty dot indicator
      ctx.fillStyle = '#334155';
      ctx.beginPath();
      ctx.arc(p.x, chartBottom - 10, 4, 0, Math.PI * 2);
      ctx.fill();
    }
  });

  ctx.textAlign = 'left';
  ctx.restore();
  return y + h;
}

function drawMeasurementsBox(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  startMeas: BodyMeasurements,
  currentMeas: BodyMeasurements
): number {
  ctx.save();

  // Container
  ctx.fillStyle = 'rgba(17, 17, 17, 0.85)';
  ctx.strokeStyle = 'rgba(168, 85, 247, 0.3)'; // purple accent
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.roundRect(x, y, w, h, 16);
  ctx.fill();
  ctx.stroke();

  // Title
  ctx.fillStyle = '#c084fc';
  ctx.font = 'bold 18px "Plus Jakarta Sans", sans-serif';
  ctx.fillText('📏 НЕДЕЛЬНЫЕ ИЗМЕНЕНИЯ ЗАМЕРОВ', x + 24, y + 36);

  const items: Array<{ label: string; start?: number; current?: number }> = [
    { label: 'Талия', start: startMeas.waist, current: currentMeas.waist },
    { label: 'Бёдра', start: startMeas.hips, current: currentMeas.hips },
    { label: 'Грудь', start: startMeas.chest, current: currentMeas.chest },
    { label: 'Бедро', start: startMeas.thigh, current: currentMeas.thigh },
    { label: 'Рука', start: startMeas.arm, current: currentMeas.arm },
  ];

  const colWidth = (w - 48 - 16 * 4) / 5;
  const startX = x + 24;
  const cardY = y + 55;
  const cardH = 115;

  items.forEach((item, i) => {
    const itemX = startX + i * (colWidth + 16);

    // Sub-card
    ctx.fillStyle = 'rgba(255, 255, 255, 0.03)';
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.08)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.roundRect(itemX, cardY, colWidth, cardH, 12);
    ctx.fill();
    ctx.stroke();

    // Label
    ctx.fillStyle = '#94a3b8';
    ctx.font = '600 14px "Plus Jakarta Sans", sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(item.label, itemX + colWidth / 2, cardY + 25);

    // Current value
    const curVal = item.current;
    const startVal = item.start;

    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 22px "Plus Jakarta Sans", sans-serif';
    ctx.fillText(curVal ? `${curVal} см` : '—', itemX + colWidth / 2, cardY + 58);

    // Delta calculation
    if (curVal && startVal) {
      const diff = curVal - startVal;
      const diffStr = diff > 0 ? `+${diff.toFixed(1)} см` : `${diff.toFixed(1)} см`;

      // Badge bg
      const badgeY = cardY + 72;
      ctx.fillStyle = diff <= 0 ? 'rgba(16, 185, 129, 0.2)' : 'rgba(245, 158, 11, 0.2)';
      ctx.beginPath();
      ctx.roundRect(itemX + 12, badgeY, colWidth - 24, 26, 8);
      ctx.fill();

      ctx.fillStyle = diff <= 0 ? '#34d399' : '#fbbf24';
      ctx.font = 'bold 13px "Plus Jakarta Sans", sans-serif';
      ctx.fillText(diffStr, itemX + colWidth / 2, badgeY + 18);
    } else {
      ctx.fillStyle = '#64748b';
      ctx.font = '12px "Plus Jakarta Sans", sans-serif';
      ctx.fillText(startVal ? `Старт: ${startVal}` : 'Нет данных', itemX + colWidth / 2, cardY + 88);
    }
  });

  ctx.textAlign = 'left';
  ctx.restore();
  return y + h;
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
