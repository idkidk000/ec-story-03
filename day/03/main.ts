import { EcArgParser } from '@/lib/args.1.ts';
import { Logger } from '@/lib/logger.0.ts';
import { inspect } from 'node:util';

interface Parsed {
  id: number;
  plug: string;
  leftSocket: string;
  rightSocket: string;
  data: unknown;
}

class Node {
  left: Node | null = null;
  right: Node | null = null;
  readonly id: number;
  readonly plug: string;
  readonly leftSocket: string;
  readonly rightSocket: string;
  readonly data: unknown;

  constructor({ id, plug, leftSocket, rightSocket, data }: Parsed) {
    this.id = id;
    this.plug = plug;
    this.leftSocket = leftSocket;
    this.rightSocket = rightSocket;
    this.data = data;
  }

  get plugParts(): string[] {
    return this.plug.split(' ');
  }

  get leftParts(): string[] {
    return this.leftSocket.split(' ');
  }

  get rightParts(): string[] {
    return this.rightSocket.split(' ');
  }

  place(node: Node, allowWeak = false): boolean {
    if (
      !this.left && (
        this.leftSocket === node.plug ||
        (
          allowWeak && this.leftParts.some((part) => node.plugParts.includes(part))
        )
      )
    ) {
      this.left = node;
      return true;
    }
    if (this.left && this.left.place(node, allowWeak)) return true;
    if (
      !this.right && (
        this.rightSocket === node.plug ||
        (
          allowWeak && this.rightParts.some((part) => node.plugParts.includes(part))
        )
      )
    ) {
      this.right = node;
      return true;
    }
    if (this.right && this.right.place(node, allowWeak)) return true;
    return false;
  }

  read(): number[] {
    const result: number[] = [];
    if (this.left) result.push(...this.left.read());
    result.push(this.id);
    if (this.right) result.push(...this.right.read());
    return result;
  }

  [inspect.custom]() {
    return {
      id: this.id,
      left: this.left,
      right: this.right,
    };
  }
}

function part1(data: Parsed[], logger: Logger) {
  const root = new Node(data[0]);
  for (const node of data.slice(1)) root.place(new Node(node));
  logger.debugLow(root, root.read());
  const checksum = root.read().reduce((acc, item, i) => acc + ((i + 1) * item), 0);

  // 5904
  logger.success(checksum);
}

function part2(data: Parsed[], logger: Logger) {
  const root = new Node(data[0]);
  for (const node of data.slice(1)) root.place(new Node(node), true);
  logger.debugLow(root, root.read());
  const checksum = root.read().reduce((acc, item, i) => acc + ((i + 1) * item), 0);

  logger.success(checksum);
}

function part3(nodes: Parsed[], logger: Logger) {
}

function main() {
  const { data, logger, part } = new EcArgParser(import.meta.url);

  const parsed: Parsed[] = data.split('\n').map((line) => {
    const keyVals = line.split(', ').map((token) => token.split('=')) as [keyof Parsed, string][];
    const node: Partial<Parsed> = {};
    // @ts-ignore FIXME
    for (const [key, val] of keyVals) node[key] = key === 'id' ? parseInt(val) : val;
    return node as Parsed;
  });

  if (part === 1) part1(parsed, logger.makeChild('part1'));
  if (part === 2) part2(parsed, logger.makeChild('part2'));
  if (part === 3) part3(parsed, logger.makeChild('part3'));
}

main();
