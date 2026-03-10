import { EcArgParser } from '@/lib/args.1.ts';
import { Logger } from '@/lib/logger.0.ts';

interface Parsed {
  id: number;
  red: number;
  green: number;
  blue: number;
  value: number;
  shine: number;
}

function part1(data: Parsed[], logger: Logger) {
  const result = data.filter((item) => item.green > item.blue && item.green > item.red).reduce(
    (acc, item) => acc + item.id,
    0,
  );

  // 71210
  logger.success(result);
}

function part2(data: Parsed[], logger: Logger) {
  const maxShine = Math.max(...data.map(({ shine }) => shine));
  const result = data.filter((item) => item.shine === maxShine).toSorted((a, b) => a.value - b.value)[0].id;

  // 75681
  logger.success(result);
}

function part3(data: Parsed[], logger: Logger) {
  const groups: number[][] = Array.from({ length: 6 }, () => []);

  for (const item of data) {
    const dominant = item.red > item.blue && item.red > item.green
      ? 0
      : item.green > item.blue && item.green > item.red
      ? 1
      : item.blue > item.green && item.blue > item.red
      ? 2
      : null;
    const shine = item.shine <= 30 ? 0 : item.shine >= 33 ? 1 : null;
    if (dominant === null || shine === null) continue;
    groups[(dominant * 2) + shine].push(item.id);
  }
  logger.debugLow(groups);

  const result = groups.toSorted((a, b) => b.length - a.length)[0].reduce((acc, item) => acc + item, 0);

  // 10492858
  logger.success(result);
}

function main() {
  const { data, logger, part } = new EcArgParser(import.meta.url);

  function parseComponent(component: string): number {
    return component.split('').map((t, i) => t.charCodeAt(0) < 97 ? (2 << (4 - i)) || 1 : 0).reduce(
      (acc, item) => acc + item,
      0,
    );
  }

  const parsed = data.split('\n').map((line) => {
    const tokens = line.split(/[: ]/);
    const [red, green, blue] = tokens.slice(1, 4).map(parseComponent);
    return {
      id: parseInt(tokens[0]),
      red,
      green,
      blue,
      value: red + green + blue,
      shine: tokens.length > 4 ? parseComponent(tokens[4]) : 0,
    };
  });

  if (part === 1) part1(parsed, logger.makeChild('part1'));
  if (part === 2) part2(parsed, logger.makeChild('part2'));
  if (part === 3) part3(parsed, logger.makeChild('part3'));
}

main();
