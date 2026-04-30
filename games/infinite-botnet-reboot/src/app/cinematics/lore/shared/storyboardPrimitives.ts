type Facing = 'left' | 'right';

interface Point {
  x: number;
  y: number;
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

function traceRoundedRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
  radius: number,
): void {
  const r = Math.max(0, Math.min(radius, width * 0.5, height * 0.5));

  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + width - r, y);
  ctx.quadraticCurveTo(x + width, y, x + width, y + r);
  ctx.lineTo(x + width, y + height - r);
  ctx.quadraticCurveTo(x + width, y + height, x + width - r, y + height);
  ctx.lineTo(x + r, y + height);
  ctx.quadraticCurveTo(x, y + height, x, y + height - r);
  ctx.lineTo(x, y + r);
  ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.closePath();
}

function projectFromVertical(
  originX: number,
  originY: number,
  length: number,
  angleFromDown: number,
  facingSign: number,
): Point {
  const angle = angleFromDown * facingSign;
  return {
    x: originX + Math.sin(angle) * length,
    y: originY + Math.cos(angle) * length,
  };
}

export function drawStoryboardPanel(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
  borderColor: string,
  fillColor: string,
): void {
  const radius = Math.max(4, Math.min(width, height) * 0.06);
  const borderWidth = Math.max(1.4, Math.min(width, height) * 0.012);

  ctx.save();
  traceRoundedRect(ctx, x, y, width, height, radius);
  ctx.fillStyle = fillColor;
  ctx.fill();

  ctx.lineWidth = borderWidth;
  ctx.strokeStyle = borderColor;
  ctx.stroke();

  const inset = borderWidth * 1.4;
  if (width > inset * 2 && height > inset * 2) {
    traceRoundedRect(ctx, x + inset, y + inset, width - inset * 2, height - inset * 2, radius * 0.72);
    ctx.lineWidth = Math.max(1, borderWidth * 0.56);
    ctx.strokeStyle = 'rgba(230, 246, 250, 0.14)';
    ctx.stroke();
  }
  ctx.restore();
}

export interface StickFigureOptions {
  x: number;
  y: number;
  scale?: number;
  facing?: Facing;
  strokeColor?: string;
  lineWidth?: number;
  headFillColor?: string;
  torsoLean?: number;
  leftArmAngle?: number;
  rightArmAngle?: number;
  leftLegAngle?: number;
  rightLegAngle?: number;
  headRadius?: number;
}

export function drawStickFigure(ctx: CanvasRenderingContext2D, options: Readonly<StickFigureOptions>): void {
  const scale = options.scale ?? 1;
  const facingSign = options.facing === 'left' ? -1 : 1;

  const headRadius = options.headRadius ?? 5.6 * scale;
  const torsoLength = 17 * scale;
  const armLength = 12.5 * scale;
  const legLength = 14.5 * scale;

  const hipX = options.x;
  const hipY = options.y - legLength;

  const lean = (options.torsoLean ?? 0) * facingSign;
  const shoulderX = hipX + Math.sin(lean) * torsoLength;
  const shoulderY = hipY - Math.cos(lean) * torsoLength;

  const headX = shoulderX;
  const headY = shoulderY - headRadius - 2 * scale;

  const leftHand = projectFromVertical(
    shoulderX,
    shoulderY,
    armLength,
    options.leftArmAngle ?? -0.72,
    facingSign,
  );
  const rightHand = projectFromVertical(
    shoulderX,
    shoulderY,
    armLength,
    options.rightArmAngle ?? 0.72,
    facingSign,
  );

  const leftFoot = projectFromVertical(
    hipX,
    hipY,
    legLength,
    options.leftLegAngle ?? -0.42,
    facingSign,
  );
  const rightFoot = projectFromVertical(
    hipX,
    hipY,
    legLength,
    options.rightLegAngle ?? 0.42,
    facingSign,
  );

  ctx.save();
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  ctx.strokeStyle = options.strokeColor ?? 'rgba(225, 244, 248, 0.9)';
  ctx.lineWidth = options.lineWidth ?? Math.max(1.4, 2 * scale);

  ctx.beginPath();
  ctx.moveTo(shoulderX, shoulderY);
  ctx.lineTo(hipX, hipY);
  ctx.stroke();

  ctx.beginPath();
  ctx.moveTo(shoulderX, shoulderY);
  ctx.lineTo(leftHand.x, leftHand.y);
  ctx.moveTo(shoulderX, shoulderY);
  ctx.lineTo(rightHand.x, rightHand.y);
  ctx.stroke();

  ctx.beginPath();
  ctx.moveTo(hipX, hipY);
  ctx.lineTo(leftFoot.x, leftFoot.y);
  ctx.moveTo(hipX, hipY);
  ctx.lineTo(rightFoot.x, rightFoot.y);
  ctx.stroke();

  ctx.beginPath();
  ctx.arc(headX, headY, headRadius, 0, Math.PI * 2);
  if (options.headFillColor) {
    ctx.fillStyle = options.headFillColor;
    ctx.fill();
  }
  ctx.stroke();

  ctx.restore();
}

type DoorHinge = 'left' | 'right';

export interface DoorOptions {
  x: number;
  y: number;
  width: number;
  height: number;
  strokeColor?: string;
  fillColor?: string;
  knobColor?: string;
  openRatio?: number;
  hinge?: DoorHinge;
}

export function drawDoor(ctx: CanvasRenderingContext2D, options: Readonly<DoorOptions>): void {
  const {
    x,
    y,
    width,
    height,
    strokeColor,
    fillColor,
    knobColor,
    openRatio: openRatioOption,
    hinge: hingeOption,
  } = options;

  const frameWidth = Math.max(1.2, Math.min(width, height) * 0.05);
  const leafInset = frameWidth * 0.7;
  const leafX = x + leafInset;
  const leafY = y + leafInset;
  const leafWidth = Math.max(1, width - leafInset * 2);
  const leafHeight = Math.max(1, height - leafInset * 2);
  const leafRadius = Math.max(2, Math.min(leafWidth, leafHeight) * 0.08);

  const hinge = hingeOption ?? 'left';
  const openRatio = clamp(openRatioOption ?? 0, 0, 1);

  ctx.save();
  ctx.strokeStyle = strokeColor ?? 'rgba(230, 242, 246, 0.8)';
  ctx.fillStyle = fillColor ?? 'rgba(31, 47, 53, 0.38)';
  ctx.lineWidth = frameWidth;

  ctx.strokeRect(x, y, width, height);
  ctx.fillRect(leafX, leafY, leafWidth, leafHeight);

  if (openRatio <= 0.02) {
    traceRoundedRect(ctx, leafX, leafY, leafWidth, leafHeight, leafRadius);
    ctx.fillStyle = 'rgba(18, 34, 40, 0.44)';
    ctx.fill();
    ctx.stroke();

    const closedKnobX = hinge === 'left' ? leafX + leafWidth * 0.82 : leafX + leafWidth * 0.18;
    const knobY = leafY + leafHeight * 0.52;
    ctx.beginPath();
    ctx.fillStyle = knobColor ?? strokeColor ?? 'rgba(246, 220, 182, 0.9)';
    ctx.arc(closedKnobX, knobY, Math.max(1.3, frameWidth * 0.4), 0, Math.PI * 2);
    ctx.fill();
  } else {
    const skew = leafWidth * openRatio * 0.35;
    const hingeX = hinge === 'left' ? leafX : leafX + leafWidth;
    const sweptX =
      hinge === 'left'
        ? leafX + leafWidth * (1 - openRatio * 0.75)
        : leafX + leafWidth * (openRatio * 0.75);

    ctx.beginPath();
    ctx.moveTo(hingeX, leafY);
    ctx.lineTo(sweptX, leafY + skew);
    ctx.lineTo(sweptX, leafY + leafHeight - skew);
    ctx.lineTo(hingeX, leafY + leafHeight);
    ctx.closePath();

    ctx.fillStyle = 'rgba(22, 39, 45, 0.56)';
    ctx.fill();
    ctx.stroke();

    const knobY = leafY + leafHeight * 0.52;
    const openKnobX = hinge === 'left' ? sweptX - leafWidth * 0.08 : sweptX + leafWidth * 0.08;
    ctx.beginPath();
    ctx.fillStyle = knobColor ?? strokeColor ?? 'rgba(246, 220, 182, 0.9)';
    ctx.arc(openKnobX, knobY, Math.max(1.2, frameWidth * 0.36), 0, Math.PI * 2);
    ctx.fill();
  }

  ctx.restore();
}

export interface SuitcaseOptions {
  x: number;
  y: number;
  width: number;
  height: number;
  bodyColor?: string;
  strokeColor?: string;
}

export function drawSuitcase(ctx: CanvasRenderingContext2D, options: Readonly<SuitcaseOptions>): void {
  const { x, y, width, height, bodyColor, strokeColor } = options;
  const radius = Math.max(2, Math.min(width, height) * 0.16);

  ctx.save();
  ctx.lineWidth = Math.max(1.1, Math.min(width, height) * 0.08);
  ctx.strokeStyle = strokeColor ?? 'rgba(240, 229, 196, 0.84)';
  ctx.fillStyle = bodyColor ?? 'rgba(72, 92, 102, 0.48)';

  traceRoundedRect(ctx, x, y, width, height, radius);
  ctx.fill();
  ctx.stroke();

  const handleWidth = width * 0.46;
  const handleHeight = height * 0.34;
  const handleX = x + (width - handleWidth) * 0.5;
  const handleY = y - handleHeight * 0.72;
  traceRoundedRect(ctx, handleX, handleY, handleWidth, handleHeight, Math.max(1.4, radius * 0.4));
  ctx.stroke();

  ctx.beginPath();
  ctx.moveTo(x + width * 0.5, y + height * 0.16);
  ctx.lineTo(x + width * 0.5, y + height * 0.84);
  ctx.strokeStyle = 'rgba(220, 242, 247, 0.42)';
  ctx.stroke();
  ctx.restore();
}

export interface AttentionMarkOptions {
  x: number;
  y: number;
  radius: number;
  intensity?: number;
  color?: string;
}

export function drawAttentionMarks(ctx: CanvasRenderingContext2D, options: Readonly<AttentionMarkOptions>): void {
  const intensity = clamp(options.intensity ?? 1, 0, 1.6);
  const rayCount = 3;

  ctx.save();
  ctx.strokeStyle = options.color ?? 'rgba(255, 181, 131, 0.9)';
  ctx.lineWidth = Math.max(1, options.radius * 0.12);
  ctx.lineCap = 'round';

  for (let i = 0; i < rayCount; i += 1) {
    const angle = -Math.PI * 0.98 + i * (Math.PI * 0.2);
    const startRadius = options.radius * 1.02;
    const endRadius = options.radius * (1.36 + intensity * 0.22);
    const startX = options.x + Math.cos(angle) * startRadius;
    const startY = options.y + Math.sin(angle) * startRadius;
    const endX = options.x + Math.cos(angle) * endRadius;
    const endY = options.y + Math.sin(angle) * endRadius;
    ctx.beginPath();
    ctx.moveTo(startX, startY);
    ctx.lineTo(endX, endY);
    ctx.stroke();
  }

  ctx.restore();
}

export interface EnvelopeOptions {
  x: number;
  y: number;
  width: number;
  height: number;
  rotation?: number;
  strokeColor?: string;
  fillColor?: string;
  rejected?: boolean;
}

export function drawEnvelope(ctx: CanvasRenderingContext2D, options: Readonly<EnvelopeOptions>): void {
  const {
    x,
    y,
    width,
    height,
    rotation,
    strokeColor,
    fillColor,
    rejected,
  } = options;

  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(rotation ?? 0);
  ctx.lineWidth = Math.max(1.1, Math.min(width, height) * 0.08);
  ctx.strokeStyle = strokeColor ?? 'rgba(224, 238, 245, 0.82)';
  ctx.fillStyle = fillColor ?? 'rgba(34, 52, 62, 0.54)';

  ctx.fillRect(-width * 0.5, -height * 0.5, width, height);
  ctx.strokeRect(-width * 0.5, -height * 0.5, width, height);

  ctx.beginPath();
  ctx.moveTo(-width * 0.5, -height * 0.5);
  ctx.lineTo(0, height * 0.02);
  ctx.lineTo(width * 0.5, -height * 0.5);
  ctx.stroke();

  if (rejected) {
    ctx.beginPath();
    ctx.strokeStyle = 'rgba(255, 118, 118, 0.92)';
    ctx.moveTo(-width * 0.32, -height * 0.32);
    ctx.lineTo(width * 0.32, height * 0.32);
    ctx.moveTo(width * 0.32, -height * 0.32);
    ctx.lineTo(-width * 0.32, height * 0.32);
    ctx.stroke();
  }

  ctx.restore();
}

export interface ClockOptions {
  x: number;
  y: number;
  radius: number;
  minuteAngle: number;
  hourAngle: number;
  strokeColor?: string;
}

export function drawClock(ctx: CanvasRenderingContext2D, options: Readonly<ClockOptions>): void {
  const strokeColor = options.strokeColor ?? 'rgba(231, 241, 247, 0.82)';

  ctx.save();
  ctx.strokeStyle = strokeColor;
  ctx.lineWidth = Math.max(1.2, options.radius * 0.12);
  ctx.beginPath();
  ctx.arc(options.x, options.y, options.radius, 0, Math.PI * 2);
  ctx.stroke();

  ctx.beginPath();
  ctx.moveTo(options.x, options.y);
  ctx.lineTo(
    options.x + Math.cos(options.minuteAngle - Math.PI / 2) * options.radius * 0.74,
    options.y + Math.sin(options.minuteAngle - Math.PI / 2) * options.radius * 0.74,
  );
  ctx.moveTo(options.x, options.y);
  ctx.lineTo(
    options.x + Math.cos(options.hourAngle - Math.PI / 2) * options.radius * 0.54,
    options.y + Math.sin(options.hourAngle - Math.PI / 2) * options.radius * 0.54,
  );
  ctx.stroke();
  ctx.restore();
}

export interface FridgeOptions {
  x: number;
  y: number;
  width: number;
  height: number;
  doorOpenRatio?: number;
}

export function drawFridge(ctx: CanvasRenderingContext2D, options: Readonly<FridgeOptions>): void {
  const { x, y, width, height, doorOpenRatio: doorOpenRatioOption } = options;
  const doorOpenRatio = clamp(doorOpenRatioOption ?? 0, 0, 1);
  const radius = Math.max(3, Math.min(width, height) * 0.1);

  ctx.save();
  ctx.lineWidth = Math.max(1.3, Math.min(width, height) * 0.07);
  ctx.strokeStyle = 'rgba(216, 232, 240, 0.82)';
  ctx.fillStyle = 'rgba(20, 33, 41, 0.5)';
  traceRoundedRect(ctx, x, y, width, height, radius);
  ctx.fill();
  ctx.stroke();

  ctx.beginPath();
  ctx.moveTo(x + width * 0.1, y + height * 0.48);
  ctx.lineTo(x + width * 0.9, y + height * 0.48);
  ctx.stroke();

  ctx.beginPath();
  ctx.moveTo(x + width * 0.08, y + height * 0.26);
  ctx.lineTo(x + width * 0.92, y + height * 0.26);
  ctx.moveTo(x + width * 0.08, y + height * 0.72);
  ctx.lineTo(x + width * 0.92, y + height * 0.72);
  ctx.strokeStyle = 'rgba(186, 212, 224, 0.34)';
  ctx.stroke();

  if (doorOpenRatio > 0.02) {
    const doorWidth = width * 0.36;
    const skew = doorWidth * doorOpenRatio * 0.5;
    const hingeX = x + width;
    const sweptX = x + width + doorWidth * (0.2 + doorOpenRatio * 0.55);

    ctx.beginPath();
    ctx.moveTo(hingeX, y);
    ctx.lineTo(sweptX, y + skew);
    ctx.lineTo(sweptX, y + height - skew);
    ctx.lineTo(hingeX, y + height);
    ctx.closePath();
    ctx.fillStyle = 'rgba(24, 40, 48, 0.46)';
    ctx.fill();
    ctx.strokeStyle = 'rgba(199, 224, 234, 0.62)';
    ctx.stroke();
  }

  ctx.restore();
}