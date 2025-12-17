import { DataPoint, Node, VoteResult, Forest } from '../types';

// RNG: Park-Miller
function makeRng(seed0: number) {
  let s = seed0 % 2147483647;
  if (s <= 0) s += 2147483646;
  return function () {
    s = (s * 16807) % 2147483647;
    return (s - 1) / 2147483646;
  };
}

function giniIndex(left: DataPoint[], right: DataPoint[]): number {
  function gini(arr: DataPoint[]) {
    const counts: Record<number, number> = {};
    arr.forEach(s => counts[s.c!] = (counts[s.c!] || 0) + 1);
    const n = arr.length;
    let g = 1;
    Object.values(counts).forEach(v => { const p = v / n; g -= p * p; });
    return g;
  }
  const n = left.length + right.length;
  return (left.length / n) * gini(left) + (right.length / n) * gini(right);
}

function makeNode(sample: DataPoint[], r: () => number, depth: number, maxDepth: number): Node {
  const classes = sample.map(s => s.c!);
  const uniq = [...new Set(classes)];
  
  // Leaf condition
  if (uniq.length === 1 || depth === maxDepth) {
    const counts: Record<number, number> = {};
    classes.forEach(c => counts[c] = (counts[c] || 0) + 1);
    let maj = Object.keys(counts)[0];
    Object.keys(counts).forEach(k => { if (counts[parseInt(k)] > counts[parseInt(maj)]) maj = k; });
    return { leaf: true, cls: parseInt(maj, 10) };
  }

  let best: { feat: string, thr: number, left: DataPoint[], right: DataPoint[], g: number } | null = null;
  const features = ['inc', 'score'];

  // Try random splits
  for (let k = 0; k < 14; k++) {
    const feat = features[Math.floor(r() * features.length)];
    const idx1 = Math.floor(r() * sample.length);
    const idx2 = Math.floor(r() * sample.length);
    const v1 = sample[idx1][feat as keyof DataPoint] as number;
    const v2 = sample[idx2][feat as keyof DataPoint] as number;
    
    const thr = (v1 + v2) / 2;
    const left = sample.filter(s => (s[feat as keyof DataPoint] as number) <= thr);
    const right = sample.filter(s => (s[feat as keyof DataPoint] as number) > thr);
    
    if (left.length === 0 || right.length === 0) continue;
    
    const g = giniIndex(left, right);
    if (!best || g < best.g) best = { feat, thr, left, right, g };
  }

  // Fallback if no split found
  if (!best) {
    const counts: Record<number, number> = {};
    classes.forEach(c => counts[c] = (counts[c] || 0) + 1);
    let maj = Object.keys(counts)[0];
    Object.keys(counts).forEach(k => { if (counts[parseInt(k)] > counts[parseInt(maj)]) maj = k; });
    return { leaf: true, cls: parseInt(maj, 10) };
  }

  return {
    leaf: false,
    feat: best.feat,
    thr: best.thr,
    left: makeNode(best.left, r, depth + 1, maxDepth),
    right: makeNode(best.right, r, depth + 1, maxDepth)
  };
}

export function buildForest(data: DataPoint[], n: number, seed: number, perTreeDepth = 2): Forest {
  const r = makeRng(seed);
  const trees: Node[] = [];
  for (let t = 0; t < n; t++) {
    const sample: DataPoint[] = [];
    for (let i = 0; i < data.length; i++) {
      const idx = Math.floor(r() * data.length);
      sample.push(data[idx]);
    }
    const node = makeNode(sample, r, 0, perTreeDepth);
    trees.push(node);
  }
  return { trees };
}

function predictTree(node: Node, pt: DataPoint): number {
  if (node.leaf) return node.cls!;
  const val = pt[node.feat as keyof DataPoint] as number;
  if (val <= node.thr!) return predictTree(node.left!, pt);
  return predictTree(node.right!, pt);
}

export function majorityVote(forest: Forest, pt: DataPoint): VoteResult {
  const votes: Record<number, number> = {};
  for (const tr of forest.trees) {
    const p = predictTree(tr, pt);
    votes[p] = (votes[p] || 0) + 1;
  }
  let best: string | null = null;
  Object.keys(votes).forEach(k => { 
    if (best === null || votes[parseInt(k)] > votes[parseInt(best)]) best = k; 
  });
  return { class: parseInt(best!, 10), votes };
}

// Surrogate Tree Logic

interface SurrogateDataPoint extends DataPoint {
  label: number;
}

function giniIndexSurrogate(left: SurrogateDataPoint[], right: SurrogateDataPoint[]) {
  function giniArr(arr: SurrogateDataPoint[]) {
    const counts: Record<number, number> = {};
    arr.forEach(s => counts[s.label] = (counts[s.label] || 0) + 1);
    const n = arr.length;
    let g = 1;
    Object.values(counts).forEach(v => { const p = v / n; g -= p * p; });
    return g;
  }
  const n = left.length + right.length;
  return (left.length / n) * giniArr(left) + (right.length / n) * giniArr(right);
}

function buildNodeS(sample: SurrogateDataPoint[], depth: number, depthLimit: number): Node {
  const labels = sample.map(s => s.label);
  const uniq = [...new Set(labels)];
  
  if (uniq.length === 1 || depth === depthLimit) {
    const counts: Record<number, number> = {};
    labels.forEach(l => counts[l] = (counts[l] || 0) + 1);
    let maj = Object.keys(counts)[0];
    Object.keys(counts).forEach(k => { if (counts[parseInt(k)] > counts[parseInt(maj)]) maj = k; });
    return { leaf: true, cls: parseInt(maj, 10) };
  }

  let best: { feat: string, thr: number, left: SurrogateDataPoint[], right: SurrogateDataPoint[], g: number } | null = null;
  const features = ['inc', 'score'];

  for (const feat of features) {
    const vals = [...new Set(sample.map(s => s[feat as keyof DataPoint] as number))].sort((a, b) => a - b);
    for (let i = 0; i < vals.length - 1; i++) {
      const thr = (vals[i] + vals[i + 1]) / 2;
      const left = sample.filter(s => (s[feat as keyof DataPoint] as number) <= thr);
      const right = sample.filter(s => (s[feat as keyof DataPoint] as number) > thr);
      
      if (left.length === 0 || right.length === 0) continue;
      
      const g = giniIndexSurrogate(left, right);
      if (!best || g < best.g) best = { feat, thr, left, right, g };
    }
  }

  if (!best) {
    const counts: Record<number, number> = {};
    labels.forEach(l => counts[l] = (counts[l] || 0) + 1);
    let maj = Object.keys(counts)[0];
    Object.keys(counts).forEach(k => { if (counts[parseInt(k)] > counts[parseInt(maj)]) maj = k; });
    return { leaf: true, cls: parseInt(maj, 10) };
  }

  return {
    leaf: false,
    feat: best.feat,
    thr: best.thr,
    left: buildNodeS(best.left, depth + 1, depthLimit),
    right: buildNodeS(best.right, depth + 1, depthLimit)
  };
}

export function buildSurrogate(data: DataPoint[], forest: Forest, depthLimit: number): Node {
  const labelled: SurrogateDataPoint[] = data.map(d => ({ ...d, label: majorityVote(forest, d).class }));
  return buildNodeS(labelled, 0, depthLimit);
}

export function getSurrogateRules(node: Node, prefix = "IF "): string[] {
  if (node.leaf) return [prefix + " THEN class = " + node.cls];
  
  // Format feature names for better readability
  const featureName = node.feat === 'inc' ? 'Income' : 'Score';
  
  const leftCond = prefix + featureName + " ≤ " + node.thr!.toFixed(0);
  const rightCond = prefix + featureName + " > " + node.thr!.toFixed(0);
  
  const leftRules = node.left ? getSurrogateRules(node.left, leftCond + " AND ") : [];
  const rightRules = node.right ? getSurrogateRules(node.right, rightCond + " AND ") : [];
  
  return [...leftRules, ...rightRules];
}
