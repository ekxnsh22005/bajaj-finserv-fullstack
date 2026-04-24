import { NextResponse } from 'next/server';

const USER_ID = 'ekanshjindal_22092005';
const EMAIL_ID = 'ej3961@srmist.edu.in';
const COLLEGE_ROLL = 'RA2311026010860';

const VALID_EDGE_RE = /^[A-Z]->[A-Z]$/;

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};

function processData(rawData) {
  const seenEdges = new Set();
  const duplicateEdgesSet = new Set();
  const invalidEntries = [];
  const validEdges = [];

  for (const entry of rawData) {
    const s = String(entry).trim();
    if (!VALID_EDGE_RE.test(s) || s[0] === s[3]) {
      invalidEntries.push(s);
      continue;
    }
    if (seenEdges.has(s)) {
      duplicateEdgesSet.add(s);
    } else {
      seenEdges.add(s);
      validEdges.push(s);
    }
  }

  const childrenMap = {};
  const parentOf = {};
  const nodeOrder = {};
  let idx = 0;

  for (const edge of validEdges) {
    const [p, c] = edge.split('->');
    if (nodeOrder[p] === undefined) nodeOrder[p] = idx++;
    if (nodeOrder[c] === undefined) nodeOrder[c] = idx++;
    if (!childrenMap[p]) childrenMap[p] = [];
    if (parentOf[c] !== undefined) continue; 
    parentOf[c] = p;
    childrenMap[p].push(c);
  }

  const allNodes = Object.keys(nodeOrder);
  const roots = allNodes.filter(n => parentOf[n] === undefined);

  const reachable = new Set();
  const dfsReach = (node) => {
    if (reachable.has(node)) return;
    reachable.add(node);
    for (const child of (childrenMap[node] || [])) dfsReach(child);
  };
  for (const r of roots) dfsReach(r);

  const cycleNodes = allNodes.filter(n => !reachable.has(n));
  const cycleSet = new Set(cycleNodes);

  const undirAdj = {};
  for (const n of cycleNodes) undirAdj[n] = [];
  for (const edge of validEdges) {
    const [p, c] = edge.split('->');
    if (cycleSet.has(p) && cycleSet.has(c)) {
      undirAdj[p].push(c);
      undirAdj[c].push(p);
    }
  }

  const visitedC = new Set();
  const cycleGroupsData = [];
  for (const node of cycleNodes) {
    if (!visitedC.has(node)) {
      const group = [];
      const queue = [node];
      visitedC.add(node);
      while (queue.length) {
        const curr = queue.shift();
        group.push(curr);
        for (const nb of undirAdj[curr]) {
          if (!visitedC.has(nb)) { visitedC.add(nb); queue.push(nb); }
        }
      }
      const cycleRoot = [...group].sort()[0];
      const sortKey = Math.min(...group.map(n => nodeOrder[n]));

      // Trace a path through the cycle for display purposes
      const groupSet = new Set(group);
      const path = [cycleRoot];
      let pathCurr = cycleRoot;
      const pathSeen = new Set([cycleRoot]);
      while (true) {
        const next = (childrenMap[pathCurr] || []).find(n => groupSet.has(n) && !pathSeen.has(n));
        if (!next) break;
        path.push(next);
        pathSeen.add(next);
        pathCurr = next;
      }

      cycleGroupsData.push({ root: cycleRoot, sortKey, cycle_path: path });
    }
  }

  const buildTree = (node, visited = new Set()) => {
    visited.add(node);
    const obj = {};
    for (const child of (childrenMap[node] || [])) {
      if (!visited.has(child)) {
        obj[child] = buildTree(child, new Set(visited));
      }
    }
    return obj;
  };

  const calcDepth = (node, visited = new Set()) => {
    visited.add(node);
    let max = 0;
    for (const child of (childrenMap[node] || [])) {
      if (!visited.has(child)) {
        max = Math.max(max, calcDepth(child, new Set(visited)));
      }
    }
    return 1 + max;
  };

  const allHierarchies = [];

  for (const root of roots) {
    allHierarchies.push({
      sortKey: nodeOrder[root],
      entry: { root, tree: { [root]: buildTree(root) }, depth: calcDepth(root) },
    });
  }

  for (const { root, sortKey, cycle_path } of cycleGroupsData) {
    allHierarchies.push({
      sortKey,
      entry: { root, tree: {}, has_cycle: true, cycle_path },
    });
  }

  allHierarchies.sort((a, b) => a.sortKey - b.sortKey);
  const hierarchies = allHierarchies.map(h => h.entry);

  const treesOnly = hierarchies.filter(h => !h.has_cycle);
  let largestTreeRoot = null;
  let maxDepth = -1;
  for (const h of treesOnly) {
    if (h.depth > maxDepth || (h.depth === maxDepth && h.root < largestTreeRoot)) {
      maxDepth = h.depth;
      largestTreeRoot = h.root;
    }
  }

  return {
    user_id: USER_ID,
    email_id: EMAIL_ID,
    college_roll_number: COLLEGE_ROLL,
    hierarchies,
    invalid_entries: invalidEntries,
    duplicate_edges: [...duplicateEdgesSet],
    summary: {
      total_trees: treesOnly.length,
      total_cycles: cycleGroupsData.length,
      largest_tree_root: largestTreeRoot,
    },
  };
}

export async function POST(request) {
  try {
    const body = await request.json();
    if (!body?.data || !Array.isArray(body.data)) {
      return NextResponse.json(
        { error: 'Invalid request: "data" must be an array' },
        { status: 400, headers: CORS }
      );
    }
    return NextResponse.json(processData(body.data), { headers: CORS });
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400, headers: CORS });
  }
}

export async function OPTIONS() {
  return new Response(null, { status: 204, headers: CORS });
}
