import type { Collection } from "@/lib/api/types";

export type CollectionNode = {
  collection: Collection;
  children: CollectionNode[];
};

/** Links every collection to its parent's node, regardless of tree depth. */
export function buildCollectionNodeMap(collections: Collection[]): Map<number, CollectionNode> {
  const nodeMap = new Map<number, CollectionNode>();
  for (const collection of collections) {
    nodeMap.set(collection.id, { collection, children: [] });
  }
  for (const collection of collections) {
    if (collection.parent === null) continue;
    const parentNode = nodeMap.get(collection.parent);
    const node = nodeMap.get(collection.id);
    if (parentNode && node) parentNode.children.push(node);
  }
  return nodeMap;
}

export function buildCollectionTree(collections: Collection[]): CollectionNode[] {
  const nodeMap = buildCollectionNodeMap(collections);
  return collections
    .filter((collection) => collection.parent === null)
    .map((collection) => nodeMap.get(collection.id)!);
}

export type FlatCollectionRow = { collection: Collection; depth: number };

export function flattenCollectionTree(nodes: CollectionNode[], depth = 0): FlatCollectionRow[] {
  const rows: FlatCollectionRow[] = [];
  for (const node of nodes) {
    rows.push({ collection: node.collection, depth });
    rows.push(...flattenCollectionTree(node.children, depth + 1));
  }
  return rows;
}
