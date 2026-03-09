import { EcArgParser } from '@/lib/args.1.ts';
import { Logger } from '@/lib/logger.0.ts';

function parseComponent(data: string, logger: Logger): number {
  const values = data.split('').map((t, i) => t.charCodeAt(0) < 97 ? (2 << (4 - i)) || 1 : 0);
  const result = values.reduce((acc, item) => acc + item, 0);
  logger.debugMed({ data, values, result });
  return result;
}

function part1(data: string, logger: Logger) {
  const parsed = data.split('\n').map((line) => {
    const tokens = line.split(/[: ]/);
    return {
      id: parseInt(tokens[0]),
      red: parseComponent(tokens[1], logger),
      green: parseComponent(tokens[2], logger),
      blue: parseComponent(tokens[3], logger),
    };
  });
  const result = parsed.filter((item) => item.green > item.blue && item.green > item.red).reduce(
    (acc, item) => acc + item.id,
    0,
  );

  // 71210
  logger.success(result);
}

function part2(data: string, logger: Logger) {
  const parsed = data.split('\n').map((line) => {
    const tokens = line.split(/[: ]/);
    return {
      id: parseInt(tokens[0]),
      red: parseComponent(tokens[1], logger),
      green: parseComponent(tokens[2], logger),
      blue: parseComponent(tokens[3], logger),
      shine: parseComponent(tokens[4], logger),
    };
  });
  logger.debugLow(parsed);
  const maxShine = parsed.toSorted((a, b) => b.shine - a.shine)[0].shine;
  logger.debugLow({ maxShine });
  const result = parsed.filter((item) => item.shine === maxShine).map((item) => ({
    ...item,
    value: item.blue + item.green + item.red,
  })).toSorted((a, b) => a.value - b.value)[0].id;

  // 75681
  logger.success(result);
}

function part3(data: string, logger: Logger) {
  const parsed = data.split('\n').map((line) => {
    const tokens = line.split(/[: ]/);
    return {
      id: parseInt(tokens[0]),
      red: parseComponent(tokens[1], logger),
      green: parseComponent(tokens[2], logger),
      blue: parseComponent(tokens[3], logger),
      shine: parseComponent(tokens[4], logger),
    };
  }).map((item) => ({ ...item, value: item.blue + item.green + item.red }));
  logger.debugLow(parsed);

  const groups = Array.from({ length: 6 }, () => new Array<number>());

  for (const item of parsed) {
    const dominant = item.blue > item.green && item.blue > item.red
      ? 0
      : item.green > item.blue && item.green > item.red
      ? 1
      : item.red > item.blue && item.red > item.green
      ? 2
      : null;
    const shine = item.shine <= 30 ? 0 : item.shine >= 33 ? 1 : null;
    if (dominant === null || shine === null) continue;
    groups[(dominant * 2) + shine].push(item.id);
  }
  logger.debugLow(groups);

  const largest = groups.toSorted((a, b) => b.length - a.length)[0];
  const result = largest.reduce((acc, item) => acc + item, 0);

  // 10492858
  logger.success(result);
}

function main() {
  const { data, logger, part } = new EcArgParser(import.meta.url);
  if (part === 1) part1(data, logger.makeChild('part1'));
  if (part === 2) part2(data, logger.makeChild('part2'));
  if (part === 3) part3(data, logger.makeChild('part3'));
}

main();
