import { EcArgParser } from '@/lib/args.1.ts';
import { Logger } from '@/lib/logger.0.ts';
import { inspect } from 'node:util';

enum WeakBehaviour {
  None,
  Allow,
  Replace,
}

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
  parent: Node | null = null;
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

  get leftStrong(): boolean | null {
    if (!this.left) return null;
    if (this.left.plug === this.leftSocket) return true;
    return false;
  }

  get rightStrong(): boolean | null {
    if (!this.right) return null;
    if (this.right.plug === this.rightSocket) return true;
    return false;
  }

  place(
    node: Node,
    behaviour: WeakBehaviour = WeakBehaviour.None,
    // obj so it's passed by ref and therefore updatable back to the root
    insert: {
      after: Node;
      inhibit: boolean;
    } | null = null,
  ): boolean | { replaced: Node; by: Node } {
    switch (behaviour) {
      case WeakBehaviour.None: {
        if (!this.left && node.plug === this.leftSocket) {
          this.left = node;
          return true;
        }

        if (this.left?.place(node, behaviour, insert)) return true;

        if (!this.right && node.plug === this.rightSocket) {
          this.right = node;
          return true;
        }

        if (this.right?.place(node, behaviour, insert)) return true;

        return false;
      }

      case WeakBehaviour.Allow: {
        if (!this.left && node.plugParts.some((part) => this.leftParts.includes(part))) {
          this.left = node;
          return true;
        }

        if (this.left?.place(node, behaviour, insert)) return true;

        if (!this.right && node.plugParts.some((part) => this.rightParts.includes(part))) {
          this.right = node;
          return true;
        }

        if (this.right?.place(node, behaviour, insert)) return true;

        return false;
      }

      case WeakBehaviour.Replace: {
        console.log({ id: node.id, insert }, this);
        if (!insert?.inhibit) {
          if (!this.left && node.plugParts.some((part) => this.leftParts.includes(part))) {
            this.left = node;
            node.parent = this;
            return true;
          }
          if (!this.leftStrong && node.plug === this.leftSocket) {
            const existing = this.left;
            this.left = node;
            node.parent = this;
            if (existing) return { replaced: existing, by: node };
            return true;
          }
        }
        const placedLeft = this.left?.place(node, behaviour, insert);
        if (placedLeft) return placedLeft;

        if (!insert?.inhibit) {
          if (!this.right && node.plugParts.some((part) => this.rightParts.includes(part))) {
            this.right = node;
            node.parent = this;
            return true;
          }
          if (!this.rightStrong && node.plug === this.rightSocket) {
            const existing = this.right;
            this.right = node;
            node.parent = this;
            if (existing) return { replaced: existing, by: node };
            return true;
          }
        }
        const placedRight = this.right?.place(node, behaviour, insert);
        if (placedRight) return placedRight;

        // `insert.inhibit` should now backpropagate
        if (insert?.after === this) {
          console.log('uninhibiting');
          insert.inhibit = false;
        }
        return false;
      }

      default:
        throw new Error('clown emoji');
    }
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
  for (const node of data.slice(1)) root.place(new Node(node), WeakBehaviour.None);
  logger.debugLow(root, root.read());
  const checksum = root.read().reduce((acc, item, i) => acc + ((i + 1) * item), 0);

  // 5904
  logger.success(checksum);
}

function part2(data: Parsed[], logger: Logger) {
  const root = new Node(data[0]);
  for (const node of data.slice(1)) root.place(new Node(node), WeakBehaviour.Allow);
  logger.debugLow(root, root.read());
  const checksum = root.read().reduce((acc, item, i) => acc + ((i + 1) * item), 0);

  // 320419
  logger.success(checksum);
}

function part3(data: Parsed[], logger: Logger) {
  const root = new Node(data[0]);
  for (const node of data.slice(1)) {
    // result is the replaced node or boolean
    const result = root.place(new Node(node), WeakBehaviour.Replace);
    if (typeof result === 'object')
      root.place(result.replaced, WeakBehaviour.Replace, { after: result.by, inhibit: true });
  }
  logger.debugLow(root, root.read());
  const checksum = root.read().reduce((acc, item, i) => acc + ((i + 1) * item), 0);

  logger.success(checksum);
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
