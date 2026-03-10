import { EcArgParser } from '@/lib/args.1.ts';
import { Logger } from '@/lib/logger.0.ts';
import { inspect } from 'node:util';

enum WeakBehaviour {
  None,
  Allow,
  Replace,
}

enum Strength {
  None,
  Weak,
  Strong,
}

class Interface {
  colour: string;
  shape: string;

  constructor(value: string) {
    [this.colour, this.shape] = value.split(' ', 2);
  }

  strength(other: Interface): Strength {
    if (this.colour === other.colour && this.shape === other.shape) return Strength.Strong;
    if (this.colour === other.colour || this.shape === other.shape) return Strength.Weak;
    return Strength.None;
  }

  [inspect.custom]() {
    return [this.colour, this.shape];
  }
}

class Node {
  readonly plug: Interface;
  readonly leftSocket: Interface;
  readonly rightSocket: Interface;

  leftNode: Node | null = null;
  rightNode: Node | null = null;

  constructor(
    public readonly id: number,
    plug: string,
    leftSocket: string,
    rightSocket: string,
    public readonly isRoot: boolean,
  ) {
    this.plug = new Interface(plug);
    this.leftSocket = new Interface(leftSocket);
    this.rightSocket = new Interface(rightSocket);
  }

  // wrappedNode so i can replace `node` inside the recursion and have it backpropagate
  place(wrappedNode: { node: Node }, behaviour: WeakBehaviour, logger: Logger): boolean {
    switch (behaviour) {
      case WeakBehaviour.None:
      case WeakBehaviour.Allow: {
        const minStrength = behaviour === WeakBehaviour.None ? Strength.Strong : Strength.Weak;

        if (!this.leftNode && this.leftSocket.strength(wrappedNode.node.plug) >= minStrength) {
          this.leftNode = wrappedNode.node;
          return true;
        }

        if (this.leftNode?.place(wrappedNode, behaviour, logger)) return true;

        if (!this.rightNode && this.rightSocket.strength(wrappedNode.node.plug) >= minStrength) {
          this.rightNode = wrappedNode.node;
          return true;
        }

        if (this.rightNode?.place(wrappedNode, behaviour, logger)) return true;

        return false;
      }

      case WeakBehaviour.Replace: {
        // inhibit recursion branches for replaced nodes
        let inhibitLeft = false;
        let inhibitRight = false;

        logger.debugMed('enter place id', wrappedNode.node.id, 'branch', this);

        switch (this.leftSocket.strength(wrappedNode.node.plug)) {
          case Strength.Weak: {
            if (!this.leftNode) {
              this.leftNode = wrappedNode.node;
              return true;
            }
            break;
          }
          case Strength.Strong: {
            if (!this.leftNode || this.leftSocket.strength(this.leftNode.plug) === Strength.Weak) {
              const existing = this.leftNode;
              this.leftNode = wrappedNode.node;
              if (existing) {
                logger.debugLow('replaced', existing, 'with', wrappedNode.node);
                wrappedNode.node = existing;
                inhibitLeft = true;
              } else { return true; }
            }
          }
        }

        if (!inhibitLeft && this.leftNode?.place(wrappedNode, behaviour, logger)) return true;

        switch (this.rightSocket.strength(wrappedNode.node.plug)) {
          case Strength.Weak: {
            if (!this.rightNode) {
              this.rightNode = wrappedNode.node;
              return true;
            }
            break;
          }
          case Strength.Strong: {
            if (!this.rightNode || this.rightSocket.strength(this.rightNode.plug) === Strength.Weak) {
              const existing = this.rightNode;
              this.rightNode = wrappedNode.node;
              if (existing) {
                logger.debugMed('replaced', existing, 'with', wrappedNode.node);
                wrappedNode.node = existing;
                inhibitRight = true;
              } else { return true; }
            }
          }
        }

        if (!inhibitRight && this.rightNode?.place(wrappedNode, behaviour, logger)) return true;

        // if this is the root node and wrappedNode was replaced, need to re-run `place` from the top
        // the puzzle guarantees that all nodes can be placed in a single tree so this cannot cause infinite recursion
        if (this.isRoot) return this.place(wrappedNode, behaviour, logger);

        return false;
      }
    }
  }

  read(): number[] {
    return [
      ...this.leftNode?.read() ?? [],
      this.id,
      ...this.rightNode?.read() ?? [],
    ];
  }

  checksum(): number {
    return this.read().reduce((acc, item, i) => acc + ((i + 1) * item), 0);
  }

  [inspect.custom]() {
    return {
      id: this.id,
      isRoot: this.isRoot,
      left: this.leftNode,
      right: this.rightNode,
    };
  }
}

function part1(root: Node, nodes: Node[], logger: Logger) {
  for (const node of nodes) {
    if (!root.place({ node }, WeakBehaviour.None, logger))
      throw new Error(`could not place node ${JSON.stringify(node)}`);
  }
  // 5904
  logger.success(root.checksum());
}

function part2(root: Node, nodes: Node[], logger: Logger) {
  for (const node of nodes) {
    if (!root.place({ node }, WeakBehaviour.Allow, logger))
      throw new Error(`could not place node ${JSON.stringify(node)}`);
  }
  // 320419
  logger.success(root.checksum());
}

function part3(root: Node, nodes: Node[], logger: Logger) {
  for (const node of nodes) {
    if (!root.place({ node }, WeakBehaviour.Replace, logger))
      throw new Error(`could not place node ${JSON.stringify(node)}`);
  }
  // 406577
  logger.success(root.checksum());
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
