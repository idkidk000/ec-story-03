import { EcArgParser } from '@/lib/args.1.ts';
import { CoordSystem, Grid } from '@/lib/grid.0.ts';
import { Logger } from '@/lib/logger.0.ts';
import { PackedSet } from '@/lib/packed-set.0.ts';
import { Offset2D, Point2D, Point2DLike } from '@/lib/point2d.0.ts';
import { Utils } from '@/lib/utils.0.ts';
import { PackedMap } from '@/lib/packed-map.0.ts';
import { Deque } from '@/lib/deque.0.ts';

function part1(data: string, logger: Logger) {
  const grid = new Grid(data.split('\n').map((line) => line.split('')), CoordSystem.Xy);

  function find(char: string): Point2DLike {
    const result = grid.find((value) => value === char);
    if (!result) throw new Error(`could not find ${char}`);
    return Utils.pick(result, ['x', 'y']);
  }

  const start = find('@');
  const end = find('#');
  const offsets = Point2D.offsets(1, Offset2D.Cardinal).map(({ x, y }) => ({ x, y: y * -1 }));
  let current = { ...start };
  let moves = 0;
  const occupied = new PackedSet(Point2D.pack32, Point2D.unpack32, [start]);

  function dump(current: Point2DLike): void {
    const [minX, maxX, minY, maxY] = [...occupied.keys(), end].reduce((acc, item) => [
      Math.min(acc[0], item.x),
      Math.max(acc[1], item.x),
      Math.min(acc[2], item.y),
      Math.max(acc[3], item.y),
    ], [Infinity, -Infinity, Infinity, -Infinity]);
    const offset: Point2DLike = { x: -minX, y: -minY };
    const debugGrid = new Grid({ rows: maxY - minY + 1, cols: maxX - minX + 1, fill: '.' }, CoordSystem.Xy);
    for (const key of occupied.keys()) debugGrid.cellSet(Point2D.add(key, offset), '+');
    debugGrid.cellSet(Point2D.add(start, offset), 'S');
    debugGrid.cellSet(Point2D.add(end, offset), 'E');
    debugGrid.cellSet(Point2D.add(current, offset), '@');
    logger.debugLow(debugGrid);
  }

  for (let step = 0; !Point2D.isEqual(current, end); ++step) {
    const offset = offsets[step % offsets.length];
    const next = Point2D.add(current, offset);
    logger.debugLow({ step, moves, current, offset, next });
    if (occupied.has(next)) continue;
    occupied.add(next);
    current = next;
    ++moves;
  }

  // 247
  dump(current);
  logger.success(moves);
}

function part2(data: string, logger: Logger) {
  const grid = new Grid(data.split('\n').map((line) => line.split('')), CoordSystem.Xy);

  function find(char: string): Point2DLike {
    const result = grid.find((value) => value === char);
    if (!result) throw new Error(`could not find ${char}`);
    return Utils.pick(result, ['x', 'y']);
  }

  const start = find('@');
  const end = find('#');
  const offsets = Point2D.offsets(1, Offset2D.Cardinal).map(({ x, y }) => ({ x, y: y * -1 }));
  let current = { ...start };
  let moves = 0;
  let blocked = 0;
  const occupied = new PackedMap(Point2D.pack32, Point2D.unpack32, [[start, 'S'], [end, 'E']]);
  const bounds = {
    minX: Math.min(start.x, end.x),
    maxX: Math.max(start.x, end.x),
    minY: Math.min(start.y, end.y),
    maxY: Math.max(start.y, end.y),
  };

  function dump(current: Point2DLike): void {
    // remap into +ve coordinate space
    const offset = { x: -bounds.minX, y: -bounds.minY };
    const debugGrid = new Grid(
      { rows: bounds.maxY - bounds.minY + 1, cols: bounds.maxX - bounds.minX + 1, fill: '.' },
      CoordSystem.Xy,
    );
    for (const [point, value] of occupied.entries()) debugGrid.cellSet(Point2D.add(point, offset), value);
    debugGrid.cellSet(Point2D.add(start, offset), 'S');
    debugGrid.cellSet(Point2D.add(end, offset), 'E');
    debugGrid.cellSet(Point2D.add(current, offset), '@');
    logger.debugLow(debugGrid);
  }

  function floodFill(origin: Point2DLike): void {
    if (occupied.has(origin)) return;
    // map contiguous unoccupied region
    // abort if it includes bounds
    // set occupied
    const queue = new Deque<Point2DLike>();
    queue.pushFront(origin);
    const region = new PackedSet(Point2D.pack32, Point2D.unpack32);
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
    for (const point of region) occupied.set(point, 'F');
    logger.debugLow('flood fill', ...region.keys().toArray());
  }

  function isEndEnclosed(): boolean {
    return occupied.has({ x: end.x - 1, y: end.y }) &&
      occupied.has({ x: end.x + 1, y: end.y }) &&
      occupied.has({ x: end.x, y: end.y - 1 }) &&
      occupied.has({ x: end.x, y: end.y + 1 });
  }

  for (let step = 0; !isEndEnclosed(); ++step) {
    if (blocked > 4) {
      dump(current);
      throw new Error('blocked');
    }
    const offset = offsets[step % offsets.length];
    const next = Point2D.add(current, offset);
    logger.debugLow({ step, moves, current, offset, next });
    if (occupied.has(next)) {
      ++blocked;
      continue;
    }
    occupied.set(next, '+');
    current = next;
    ++moves;
    blocked = 0;
    bounds.minX = Math.min(bounds.minX, current.x);
    bounds.maxX = Math.max(bounds.maxX, current.x);
    bounds.minY = Math.min(bounds.minY, current.y);
    bounds.maxY = Math.max(bounds.maxY, current.y);
    for (const neighbour of offsets.map((offset) => Point2D.add(offset, current))) floodFill(neighbour);
    dump(current);
  }

  dump(current);

  // 3307
  logger.success(moves);
}

function part3(data: string, logger: Logger) {
  const grid = new Grid(data.split('\n').map((line) => line.split('')), CoordSystem.Xy);

  function find(char: string): Point2DLike {
    const result = grid.find((value) => value === char);
    if (!result) throw new Error(`could not find ${char}`);
    return Utils.pick(result, ['x', 'y']);
  }

  const start = find('@');
  const bones: Point2DLike[] = grid.findAll((value) => value === '#').map((item) => Utils.pick(item, ['x', 'y']))
    .toArray();
  const offsets = Point2D.offsets(1, Offset2D.Cardinal).map(({ x, y }) => ({ x, y: y * -1 }));
  let current = { ...start };
  let moves = 0;
  let blocked = 0;
  const occupied = new PackedMap(Point2D.pack32, Point2D.unpack32, [
    [start, 'S'],
    ...bones.map((bone) => [bone, 'B'] satisfies [Point2DLike, string]),
  ]);
  const bounds = {
    minX: Math.min(start.x, ...bones.map(({ x }) => x)),
    maxX: Math.max(start.x, ...bones.map(({ x }) => x)),
    minY: Math.min(start.y, ...bones.map(({ y }) => y)),
    maxY: Math.max(start.y, ...bones.map(({ y }) => y)),
  };

  function dump(current: Point2DLike): void {
    // remap into +ve coordinate space
    const offset = { x: -bounds.minX, y: -bounds.minY };
    const debugGrid = new Grid(
      { rows: bounds.maxY - bounds.minY + 1, cols: bounds.maxX - bounds.minX + 1, fill: '.' },
      CoordSystem.Xy,
    );
    for (const [point, value] of occupied.entries()) debugGrid.cellSet(Point2D.add(point, offset), value);
    debugGrid.cellSet(Point2D.add(start, offset), 'S');
    for (const bone of bones) debugGrid.cellSet(Point2D.add(bone, offset), 'B');
    debugGrid.cellSet(Point2D.add(current, offset), '@');
    logger.debugLow(debugGrid);
  }

  function floodFill(origin: Point2DLike): void {
    if (occupied.has(origin)) return;
    // map contiguous unoccupied region
    // abort if it includes bounds
    // set occupied
    const queue = new Deque<Point2DLike>();
    queue.pushFront(origin);
    const region = new PackedSet(Point2D.pack32, Point2D.unpack32);
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
    for (const point of region) occupied.set(point, 'F');
    logger.debugLow('flood fill', ...region.keys().toArray());
  }

  function isEndEnclosed(): boolean {
    return bones.every((bone) =>
      occupied.has({ x: bone.x - 1, y: bone.y }) &&
      occupied.has({ x: bone.x + 1, y: bone.y }) &&
      occupied.has({ x: bone.x, y: bone.y - 1 }) &&
      occupied.has({ x: bone.x, y: bone.y + 1 })
    );
  }

  // pre-fill voids between bones or `isEndEnclosed` will never return true
  for (let x = bounds.minX; x <= bounds.maxX; ++x) {
    for (let y = bounds.minY; y <= bounds.maxY; ++y)
      floodFill({ x, y });
  }

  for (let step = 0; !isEndEnclosed(); ++step) {
    if (blocked > 12) {
      dump(current);
      throw new Error('blocked');
    }
    const offset = offsets[Math.floor(step / 3) % offsets.length];
    const next = Point2D.add(current, offset);
    logger.debugLow({ step, moves, current, offset, next });
    if (occupied.has(next)) {
      ++blocked;
      continue;
    }
    occupied.set(next, '+');
    current = next;
    ++moves;
    blocked = 0;
    bounds.minX = Math.min(bounds.minX, current.x);
    bounds.maxX = Math.max(bounds.maxX, current.x);
    bounds.minY = Math.min(bounds.minY, current.y);
    bounds.maxY = Math.max(bounds.maxY, current.y);
    for (const neighbour of offsets.map((offset) => Point2D.add(offset, current))) floodFill(neighbour);
    dump(current);
  }

  dump(current);

  // 2486
  logger.success(moves);
}

function main() {
  const { data, logger, part } = new EcArgParser(import.meta.url);
  if (part === 1) part1(data, logger.makeChild('part1'));
  if (part === 2) part2(data, logger.makeChild('part2'));
  if (part === 3) part3(data, logger.makeChild('part3'));
}

main();
