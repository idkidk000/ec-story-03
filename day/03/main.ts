import { EcArgParser } from '@/lib/args.1.ts';
import { Logger } from '@/lib/logger.0.ts';

interface Node {
  id: number;
  plug: string;
  leftSocket: string;
  rightSocket: string;
  data: unknown;
}

function part1(nodes: Node[], logger: Logger) {
  logger.debugLow(nodes);

  // binary tree
  // children are at (ix*2)+[1|2]
  // parent is at Math.floor((ix-1)/2)
  // 7 8  9 10  11 12  13 14
  //  3    4      5      6
  //    1            2
  //          0
  const tree: Node[] = [];

  // place
  for (const node of nodes) {
    if (tree.length === 0) {
      tree[0] = node;
      continue;
    }
    let placed = false;
    for (let i = 0; !placed && i < tree.length; ++i) {
      const existing = tree[i];
      if (typeof existing === 'undefined') continue;
      const leftIx = (i * 2) + 1;
      const rightIx = (i * 2) + 2;
      if (existing.leftSocket === node.plug && typeof tree[leftIx] === 'undefined') {
        tree[leftIx] = node;
        placed = true;
      } else if (existing.rightSocket === node.plug && typeof tree[rightIx] === 'undefined') {
        tree[rightIx] = node;
        placed = true;
      }
    }
    if (!placed) {
      logger.error({ node, tree });
      throw new Error('could not place node');
    }
  }
  logger.info(tree.entries().toArray());

  // read
  // perimieter walk
  enum Operation {
    Left,
    Read,
    Right,
  }
  let ix = 0;
  let operation: Operation = 0;
  const ids: number[] = [];

  while (ids.length < nodes.length) {
    const leftIx = ix * 2 + 1;
    const rightIx = ix * 2 + 2;
    const parentIx = Math.floor((ix - 1) / 2);
    let nextOperation: Operation = operation;
    let nextIx: number = ix;

    switch (operation) {
      case Operation.Left: {
        if (tree[leftIx]) nextIx = leftIx;
        else ++nextOperation;
        break;
      }
      case Operation.Read: {
        ids.push(tree[ix].id);
        ++nextOperation;
        break;
      }
      case Operation.Right: {
        // probably need another operation type?
        if (tree[rightIx] && !ids.includes(tree[rightIx].id)) {
          nextIx = rightIx;
          nextOperation = Operation.Left;
        } else {
          nextIx = parentIx;
          // if we're a left child, read the parent
          if (ix % 2) nextOperation = Operation.Read;
        }
        break;
      }
      default:
        throw new Error(`unhandled operation ${operation}`);
    }

    logger.debugLow({
      ix,
      id: tree[ix].id,
      leftIx,
      rightIx,
      parentIx,
      operation: operation === Operation.Left ? 'left' : operation === Operation.Read ? 'read' : 'right',
      ids,
    });

    operation = nextOperation;
    ix = nextIx;
  }

  const checksum = ids.reduce((acc, item, i) => acc + ((i + 1) * item), 0);

  // 6850 length correct, first digit incorrect
  logger.success(checksum);
}

function part2(nodes: Node[], logger: Logger) {
}

function part3(nodes: Node[], logger: Logger) {
}

function main() {
  const { data, logger, part } = new EcArgParser(import.meta.url);

  const parsed: Node[] = data.split('\n').map((line) => {
    const keyVals = line.split(', ').map((token) => token.split('=')) as [keyof Node, string][];
    const node: Partial<Node> = {};
    // @ts-ignore TODO: fix later
    for (const [key, val] of keyVals) node[key] = key === 'id' ? parseInt(val) : val;
    return node as Node;
  });

  if (part === 1) part1(parsed, logger.makeChild('part1'));
  if (part === 2) part2(parsed, logger.makeChild('part2'));
  if (part === 3) part3(parsed, logger.makeChild('part3'));
}

main();
