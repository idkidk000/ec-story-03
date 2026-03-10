import { EcArgParser } from '@/lib/args.1.ts';
import { Logger } from '@/lib/logger.0.ts';
import { inspect } from 'node:util';

enum WeakBehaviour {
  None,
  Allow,
  Replace,
}

class Node {
  left: Node | null = null;
  right: Node | null = null;

  constructor(
    public readonly id: number,
    public readonly plug: string,
    public readonly leftSocket: string,
    public readonly rightSocket: string,
    public readonly isRoot: boolean,
  ) {}

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

  // wrappedNode so i can replace `node` inside the recursion and have it backpropagate
  place(wrappedNode: { node: Node }, behaviour: WeakBehaviour, logger: Logger): boolean {
    switch (behaviour) {
      case WeakBehaviour.None: {
        if (!this.left && wrappedNode.node.plug === this.leftSocket) {
          this.left = wrappedNode.node;
          return true;
        }

        if (this.left?.place(wrappedNode, behaviour, logger)) return true;

        if (!this.right && wrappedNode.node.plug === this.rightSocket) {
          this.right = wrappedNode.node;
          return true;
        }

        if (this.right?.place(wrappedNode, behaviour, logger)) return true;

        return false;
      }

      case WeakBehaviour.Allow: {
        if (!this.left && wrappedNode.node.plugParts.some((part) => this.leftParts.includes(part))) {
          this.left = wrappedNode.node;
          return true;
        }

        if (this.left?.place(wrappedNode, behaviour, logger)) return true;

        if (!this.right && wrappedNode.node.plugParts.some((part) => this.rightParts.includes(part))) {
          this.right = wrappedNode.node;
          return true;
        }

        if (this.right?.place(wrappedNode, behaviour, logger)) return true;

        return false;
      }

      case WeakBehaviour.Replace: {
        // inhibit recursion branches for replaced nodes
        let inhibitLeft = false;
        let inhibitRight = false;

        logger.info('enter place id', wrappedNode.node.id, 'branch', this);

        if (!this.left && wrappedNode.node.plugParts.some((part) => this.leftParts.includes(part))) {
          this.left = wrappedNode.node;
          return true;
        }

        if (!this.leftStrong && wrappedNode.node.plug === this.leftSocket) {
          const existing = this.left;
          this.left = wrappedNode.node;
          if (existing) {
            logger.warn('replaced', existing, 'with', wrappedNode.node);
            wrappedNode.node = existing;
            inhibitLeft = true;
          } else { return true; }
        }

        if (!inhibitLeft && this.left?.place(wrappedNode, behaviour, logger)) return true;

        if (!this.right && wrappedNode.node.plugParts.some((part) => this.rightParts.includes(part))) {
          this.right = wrappedNode.node;
          return true;
        }

        if (!this.rightStrong && wrappedNode.node.plug === this.rightSocket) {
          const existing = this.right;
          this.right = wrappedNode.node;
          if (existing) {
            logger.warn('replaced', existing, 'with', wrappedNode.node);
            wrappedNode.node = existing;
            inhibitRight = true;
          } else { return true; }
        }

        if (!inhibitRight && this.right?.place(wrappedNode, behaviour, logger)) return true;

        // BUG: if this is the root node and wrappedNode was replaced, need to re-run `place` from the top
        // FIXME: this is quite stupid
        if (this.isRoot) return this.place(wrappedNode, behaviour, logger);

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
      isRoot: this.isRoot,
      left: this.left,
      right: this.right,
    };
  }
}

function part1(root: Node, nodes: Node[], logger: Logger) {
  for (const node of nodes) {
    if (!root.place({ node }, WeakBehaviour.None, logger))
      throw new Error(`could not place node ${JSON.stringify(node)}`);
  }
  logger.debugLow(root, root.read());
  const checksum = root.read().reduce((acc, item, i) => acc + ((i + 1) * item), 0);

  // 5904
  logger.success(checksum);
}

function part2(root: Node, nodes: Node[], logger: Logger) {
  for (const node of nodes) {
    if (!root.place({ node }, WeakBehaviour.Allow, logger))
      throw new Error(`could not place node ${JSON.stringify(node)}`);
  }
  logger.debugLow(root, root.read());
  const checksum = root.read().reduce((acc, item, i) => acc + ((i + 1) * item), 0);

  // 320419
  logger.success(checksum);
}

function part3(root: Node, nodes: Node[], logger: Logger) {
  for (const node of nodes) {
    if (!root.place({ node }, WeakBehaviour.Replace, logger))
      throw new Error(`could not place node ${JSON.stringify(node)}`);
  }
  logger.debugLow(root, root.read());
  const checksum = root.read().reduce((acc, item, i) => acc + ((i + 1) * item), 0);

  // 406577
  logger.success(checksum);
}

function main() {
  const { data, logger, part } = new EcArgParser(import.meta.url);

  const [root, ...nodes] = data.matchAll(
    /^id=(?<id>\d+), plug=(?<plug>[A-Z ]+), leftSocket=(?<leftSocket>[A-Z ]+), rightSocket=(?<rightSocket>[A-Z ]+),/gm,
  ).filter((match): match is typeof match & { groups: Record<'id' | 'plug' | 'leftSocket' | 'rightSocket', string> } =>
    typeof match.groups !== 'undefined'
  )
    .map((match, i) =>
      new Node(parseInt(match.groups.id), match.groups.plug, match.groups.leftSocket, match.groups.rightSocket, i === 0)
    ).toArray();

  if (part === 1) part1(root, nodes, logger.makeChild('part1'));
  if (part === 2) part2(root, nodes, logger.makeChild('part2'));
  if (part === 3) part3(root, nodes, logger.makeChild('part3'));
}

main();
