import { EcArgParser } from '@/lib/args.1.ts';
import { Deque } from '@/lib/deque.0.ts';
import { CoordSystem, Grid } from '@/lib/grid.0.ts';
import { ansiStyles, Logger } from '@/lib/logger.0.ts';
import { PackedSet } from '@/lib/packed-set.0.ts';
import { Bounds2D, Offset2D, Point2D, Point2DLike } from '@/lib/point2d.0.ts';
import { Utils } from '@/lib/utils.0.ts';

const offsets = Point2D.offsets(1, Offset2D.Cardinal).map(({ x, y }) => ({ x, y: y * -1 }));

function dump(occupied: PackedSet<Point2DLike, number>, current: Point2DLike, logger: Logger): void {
  if (logger.level > 2) return;
  const bounds = Point2D.getBounds([...occupied.keys(), current]);
  const offset: Point2DLike = { x: -bounds.minX, y: -bounds.minY };
  const grid = new Grid(
    { rows: bounds.maxY - bounds.minY + 1, cols: bounds.maxX - bounds.minX + 1, fill: '.' },
    CoordSystem.Xy,
    (cell) =>
      cell === '@' || cell === 'S'
        ? `${ansiStyles.fgIntense.red}${cell}${ansiStyles.reset}`
        : cell === 'F'
        ? `${ansiStyles.fgIntense.blue}F${ansiStyles.reset}`
        : cell === '+'
        ? `${ansiStyles.fgIntense.yellow}+${ansiStyles.reset}`
        : cell,
  );
  for (const point of [...occupied, current])
    grid.cellSet(Point2D.add(point, offset), '+');
  logger.debugLow(grid);
}

function floodFill(
  occupied: PackedSet<Point2DLike, number>,
  origin: Point2DLike,
  bounds: Bounds2D,
  logger: Logger,
): void {
  if (occupied.has(origin)) return;
  const queue = new Deque<Point2DLike>();
  const region = new PackedSet(Point2D.pack32, Point2D.unpack32);
  // map contiguous unoccupied region
  // abort if it includes bounds
  // set occupied
  queue.pushFront(origin);
  let abortFlag = false;

  while (!abortFlag) {
    const item = queue.popBack();
    if (!item) break;
    if (occupied.has(item) || region.has(item)) continue;
    if (item.x === bounds.minX || item.x === bounds.maxX || item.y === bounds.minY || item.y === bounds.maxY) {
      abortFlag = true;
      break;
    }
    region.add(item);
    for (const neighbour of offsets.map((offset) => Point2D.add(offset, item))) queue.pushFront(neighbour);
  }

  if (abortFlag || region.size === 0) return;
  for (const point of region) occupied.add(point);
  logger.debugLow('flood fill', ...region.keys().toArray());
}

function part1(
  occupied: PackedSet<Point2DLike, number>,
  start: Point2DLike,
  [end]: Point2DLike[],
  logger: Logger,
) {
  let current = { ...start };
  let moves = 0;

  for (let step = 0; !Point2D.isEqual(current, end); ++step) {
    const offset = offsets[step % offsets.length];
    const next = Point2D.add(current, offset);
    logger.debugLow({ step, moves, current, offset, next });
    if (occupied.has(next) && !Point2D.isEqual(next, end)) continue;
    occupied.add(next);
    current = next;
    ++moves;
    dump(occupied, current, logger);
  }

  // 247
  logger.success(moves);
}

function part2(
  occupied: PackedSet<Point2DLike, number>,
  start: Point2DLike,
  [end]: Point2DLike[],
  logger: Logger,
) {
  let current = { ...start };
  let moves = 0;
  let blocked = 0;
  const bounds = Point2D.getBounds([start, end]);
  const endNeighbours = offsets.map((offset) => Point2D.add(end, offset));

  function isEndEnclosed(): boolean {
    return endNeighbours.every((neighbour) => occupied.has(neighbour));
  }

  for (let step = 0; !isEndEnclosed(); ++step) {
    if (blocked > 4) {
      dump(occupied, current, logger);
      throw new Error('blocked');
    }
    const offset = offsets[step % offsets.length];
    const next = Point2D.add(current, offset);
    logger.debugLow({ step, moves, current, offset, next });
    if (occupied.has(next)) {
      ++blocked;
      continue;
    }
    occupied.add(next);
    current = next;
    ++moves;
    blocked = 0;
    if (offset.x) {
      bounds.minX = Math.min(bounds.minX, current.x);
      bounds.maxX = Math.max(bounds.maxX, current.x);
    } else {
      bounds.minY = Math.min(bounds.minY, current.y);
      bounds.maxY = Math.max(bounds.maxY, current.y);
    }
    for (const offset of offsets) floodFill(occupied, Point2D.add(current, offset), bounds, logger);
    dump(occupied, current, logger);
  }

  // 3307
  logger.success(moves);
}

function part3(
  occupied: PackedSet<Point2DLike, number>,
  start: Point2DLike,
  bones: Point2DLike[],
  logger: Logger,
) {
  let current = { ...start };
  let moves = 0;
  let blocked = 0;
  const bounds = Point2D.getBounds([start, ...bones]);
  const endNeighbours = new PackedSet(
    Point2D.pack32,
    Point2D.unpack32,
    bones.flatMap((bone) => offsets.map((offset) => Point2D.add(bone, offset))),
  );

  function isEndEnclosed(): boolean {
    return endNeighbours.isSubsetOf(occupied);
  }

  // pre-fill voids between bones or `isEndEnclosed` will never return true
  for (let x = bounds.minX; x <= bounds.maxX; ++x) {
    for (let y = bounds.minY; y <= bounds.maxY; ++y)
      floodFill(occupied, { x, y }, bounds, logger);
  }

  for (let step = 0; !isEndEnclosed(); ++step) {
    if (blocked > 12) {
      dump(occupied, current, logger);
      throw new Error('blocked');
    }
    const offset = offsets[Math.floor(step / 3) % offsets.length];
    const next = Point2D.add(current, offset);
    logger.debugLow({ step, moves, current, offset, next });
    if (occupied.has(next)) {
      ++blocked;
      continue;
    }
    occupied.add(next);
    current = next;
    ++moves;
    blocked = 0;
    if (offset.x) {
      bounds.minX = Math.min(bounds.minX, current.x);
      bounds.maxX = Math.max(bounds.maxX, current.x);
    } else {
      bounds.minY = Math.min(bounds.minY, current.y);
      bounds.maxY = Math.max(bounds.maxY, current.y);
    }
    for (const offset of offsets) floodFill(occupied, Point2D.add(current, offset), bounds, logger);
    dump(occupied, current, logger);
  }

  // 2486
  logger.success(moves);
}

function main() {
  const { data, logger, part } = new EcArgParser(import.meta.url);

  const grid = new Grid(data.split('\n').map((line) => line.split('')), CoordSystem.Rc);
  const startFull = grid.find((value) => value === '@');
  if (!startFull) throw new Error('could not find start');
  const start = Utils.pick(startFull, ['x', 'y']);
  const bones: Point2DLike[] = grid.findAll((value) => value === '#').map((item) => Utils.pick(item, ['x', 'y']))
    .toArray();
  if (!bones.length) throw new Error('could not find any bones');
  const occupied = new PackedSet(Point2D.pack32, Point2D.unpack32, [start, ...bones]);

  if (part === 1) part1(occupied, start, bones, logger.makeChild('part1'));
  if (part === 2) part2(occupied, start, bones, logger.makeChild('part2'));
  if (part === 3) part3(occupied, start, bones, logger.makeChild('part3'));
}

main();
