import React, { useState, useMemo } from 'react';
import { GraphData, GraphNode } from '../types';
import { Eye, ZoomIn, ZoomOut, RotateCcw, AlertTriangle, Shield, CheckCircle, Info } from 'lucide-react';

interface RelationshipGraphProps {
  graphData: GraphData;
  accountName: string;
}

export const RelationshipGraph: React.FC<RelationshipGraphProps> = ({ graphData, accountName }) => {
  const [selectedNode, setSelectedNode] = useState<GraphNode | null>(null);
  const [highlightRipple, setHighlightRipple] = useState<boolean>(true);
  const [zoom, setZoom] = useState<number>(1);

  // Layout calculation: Compute coordinates in a 800x500 canvas
  const { nodeMap, positionedNodes } = useMemo(() => {
    const width = 800;
    const height = 500;
    const centerX = width / 2;
    const centerY = height / 2;

    const map = new Map<string, GraphNode & { x: number; y: number }>();
    const positioned: Array<GraphNode & { x: number; y: number }> = [];

    // Separate by node type
    const rootNode = graphData.nodes.find((n) => n.type === 'ACCOUNT');
    const contacts = graphData.nodes.filter((n) => n.type === 'CONTACT');
    const deals = graphData.nodes.filter((n) => n.type === 'DEAL');
    const activities = graphData.nodes.filter((n) => n.type === 'ACTIVITY');
    const decisions = graphData.nodes.filter((n) => n.type === 'DECISION');

    // Place Root at center
    if (rootNode) {
      const pos = { ...rootNode, x: centerX, y: centerY };
      map.set(rootNode.id, pos);
      positioned.push(pos);
    }

    // Place Contacts on Left Arc
    contacts.forEach((c, idx) => {
      const angle = Math.PI - 0.7 + (idx / Math.max(1, contacts.length - 1)) * 1.4;
      const radius = 220;
      const pos = {
        ...c,
        x: centerX + Math.cos(angle) * radius,
        y: centerY + Math.sin(angle) * (radius * 0.8),
      };
      map.set(c.id, pos);
      positioned.push(pos);
    });

    // Place Deals on Right Arc
    deals.forEach((d, idx) => {
      const angle = -0.6 + (idx / Math.max(1, deals.length - 1)) * 1.2;
      const radius = 230;
      const pos = {
        ...d,
        x: centerX + Math.cos(angle) * radius,
        y: centerY + Math.sin(angle) * (radius * 0.8),
      };
      map.set(d.id, pos);
      positioned.push(pos);
    });

    // Place Activities on Top Arc
    activities.forEach((a, idx) => {
      const offset = (idx - (activities.length - 1) / 2) * 110;
      const pos = {
        ...a,
        x: centerX + offset,
        y: centerY - 170,
      };
      map.set(a.id, pos);
      positioned.push(pos);
    });

    // Place Decisions on Bottom Arc
    decisions.forEach((dec, idx) => {
      const offset = (idx - (decisions.length - 1) / 2) * 130;
      const pos = {
        ...dec,
        x: centerX + offset,
        y: centerY + 170,
      };
      map.set(dec.id, pos);
      positioned.push(pos);
    });

    return { nodeMap: map, positionedNodes: positioned };
  }, [graphData]);

  const getNodeColor = (node: GraphNode) => {
    if (node.type === 'ACCOUNT') {
      return node.risk_level === 'CRITICAL' ? '#EF4444' : (node.risk_level === 'WARNING' ? '#F59E0B' : '#10B981');
    }
    if (node.risk_level === 'CRITICAL') return '#EF4444';
    if (node.risk_level === 'WARNING') return '#F59E0B';
    if (node.type === 'CONTACT') return '#38BDF8';
    if (node.type === 'DEAL') return '#818CF8';
    if (node.type === 'ACTIVITY') return '#A855F7';
    return '#10B981';
  };

  const isCriticalPathNode = (nodeId: string) => {
    return highlightRipple && graphData.critical_path?.includes(nodeId);
  };

  return (
    <div className="relative w-full bg-slate-950/80 rounded-xl border border-slate-800 overflow-hidden shadow-2xl">
      {/* Top Header bar with controls */}
      <div className="p-3 sm:p-4 border-b border-slate-800/80 flex flex-wrap items-center justify-between gap-3 bg-slate-900/60">
        <div>
          <div className="flex items-center gap-2">
            <span className="font-semibold text-sm text-slate-100">
              Pipeline Relationship Graph
            </span>
            <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-400 border border-slate-700">
              {positionedNodes.length} Nodes • {graphData.edges.length} Edges
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-0.5">
            Interactive multi-entity ripple analysis across accounts, contacts, and opportunities.
          </p>
        </div>

        {/* Toolbar controls */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setHighlightRipple(!highlightRipple)}
            className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium border transition-colors ${
              highlightRipple
                ? 'bg-amber-500/20 text-amber-300 border-amber-500/40 shadow-sm'
                : 'bg-slate-800 text-slate-400 border-slate-700 hover:text-slate-200'
            }`}
          >
            <AlertTriangle className="w-3.5 h-3.5" />
            <span>{highlightRipple ? 'Ripple Path Active' : 'Highlight Ripple Path'}</span>
          </button>

          <div className="flex items-center bg-slate-800 rounded-lg p-0.5 border border-slate-700">
            <button
              type="button"
              onClick={() => setZoom((z) => Math.min(1.4, z + 0.1))}
              className="p-1 text-slate-400 hover:text-slate-200"
              title="Zoom in"
            >
              <ZoomIn className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={() => setZoom((z) => Math.max(0.7, z - 0.1))}
              className="p-1 text-slate-400 hover:text-slate-200"
              title="Zoom out"
            >
              <ZoomOut className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={() => setZoom(1)}
              className="p-1 text-slate-400 hover:text-slate-200"
              title="Reset Zoom"
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* Ripple Summary Banner */}
      {highlightRipple && graphData.ripple_summary && (
        <div className="px-4 py-2.5 bg-amber-950/30 border-b border-amber-900/40 flex items-center gap-2 text-xs text-amber-200">
          <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
          <div className="flex-1 font-mono text-[11px] overflow-x-auto whitespace-nowrap">
            <span className="text-amber-400 font-semibold uppercase mr-2">Ripple Chain:</span>
            {graphData.ripple_summary}
          </div>
        </div>
      )}

      {/* Main SVG Graph Canvas */}
      <div className="relative w-full h-[460px] overflow-hidden flex items-center justify-center p-2">
        <svg
          viewBox="0 0 800 500"
          className="w-full h-full transition-transform duration-200 ease-out select-none"
          style={{ transform: `scale(${zoom})` }}
        >
          <defs>
            <linearGradient id="rippleGradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#EF4444" />
              <stop offset="100%" stopColor="#F59E0B" />
            </linearGradient>
            <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="4" result="blur" />
              <feComposite in="SourceGraphic" in2="blur" operator="over" />
            </filter>
          </defs>

          {/* Render Edges */}
          {graphData.edges.map((edge, idx) => {
            const source = nodeMap.get(edge.source);
            const target = nodeMap.get(edge.target);
            if (!source || !target) return null;

            const isHighlighted = highlightRipple && edge.is_risk_path;

            return (
              <g key={`edge-${idx}`}>
                <line
                  x1={source.x}
                  y1={source.y}
                  x2={target.x}
                  y2={target.y}
                  stroke={isHighlighted ? '#F59E0B' : '#334155'}
                  strokeWidth={isHighlighted ? 2.5 : 1.2}
                  strokeDasharray={isHighlighted ? '5,5' : undefined}
                  className={isHighlighted ? 'animate-pulse' : ''}
                  opacity={isHighlighted ? 0.9 : 0.4}
                />
                {/* Edge relationship label */}
                <text
                  x={(source.x + target.x) / 2}
                  y={(source.y + target.y) / 2 - 4}
                  fill={isHighlighted ? '#FBBF24' : '#64748B'}
                  fontSize="8"
                  fontFamily="monospace"
                  textAnchor="middle"
                  className="select-none pointer-events-none"
                >
                  {edge.relationship}
                </text>
              </g>
            );
          })}

          {/* Render Nodes */}
          {positionedNodes.map((node) => {
            const isSelected = selectedNode?.id === node.id;
            const isRipple = isCriticalPathNode(node.id);
            const color = getNodeColor(node);
            const isRoot = node.type === 'ACCOUNT';

            return (
              <g
                key={node.id}
                transform={`translate(${node.x}, ${node.y})`}
                onClick={() => setSelectedNode(node)}
                className="cursor-pointer group"
              >
                {/* Highlight ring if on critical ripple path */}
                {isRipple && (
                  <circle
                    r={isRoot ? 38 : 26}
                    fill="none"
                    stroke="#EF4444"
                    strokeWidth="2.5"
                    strokeDasharray="4,4"
                    className="animate-spin-slow origin-center opacity-80"
                    filter="url(#glow)"
                  />
                )}

                {/* Node Outer Circle */}
                <circle
                  r={isRoot ? 30 : 20}
                  fill={isRoot ? '#0F172A' : '#1E293B'}
                  stroke={color}
                  strokeWidth={isSelected ? 3 : 2}
                  className="transition-all duration-150 group-hover:scale-110"
                />

                {/* Node Icon / Letter */}
                <text
                  textAnchor="middle"
                  dy=".3em"
                  fill="#F8FAFC"
                  fontSize={isRoot ? '12' : '10'}
                  fontWeight="bold"
                  className="select-none pointer-events-none"
                >
                  {node.type === 'ACCOUNT' ? 'HQ' : node.type[0]}
                </text>

                {/* Node Label Text */}
                <text
                  y={isRoot ? 45 : 32}
                  textAnchor="middle"
                  fill="#E2E8F0"
                  fontSize="10"
                  fontWeight="500"
                  className="select-none pointer-events-none drop-shadow"
                >
                  {node.label.length > 22 ? `${node.label.substring(0, 20)}...` : node.label}
                </text>

                {/* Node Type Badge */}
                <text
                  y={isRoot ? 57 : 44}
                  textAnchor="middle"
                  fill={color}
                  fontSize="8"
                  fontFamily="monospace"
                  className="select-none pointer-events-none"
                >
                  {node.type} {node.risk_level === 'CRITICAL' ? '⚠️' : ''}
                </text>
              </g>
            );
          })}
        </svg>

        {/* Selected Node Details Side-sheet */}
        {selectedNode && (
          <div className="absolute right-3 top-3 bottom-3 w-72 bg-slate-900/95 backdrop-blur-md border border-slate-700/80 rounded-lg p-4 shadow-2xl flex flex-col justify-between text-xs z-10 animate-in fade-in slide-in-from-right-4">
            <div>
              <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                <span className="font-mono text-[10px] text-emerald-400 uppercase font-semibold">
                  {selectedNode.type} Node Details
                </span>
                <button
                  type="button"
                  onClick={() => setSelectedNode(null)}
                  className="text-slate-400 hover:text-white"
                >
                  ✕
                </button>
              </div>

              <div className="mt-3 space-y-2">
                <div>
                  <div className="text-[10px] text-slate-500 uppercase font-mono">Entity Label</div>
                  <div className="font-semibold text-slate-100 text-sm">{selectedNode.label}</div>
                </div>

                {selectedNode.risk_level && (
                  <div>
                    <div className="text-[10px] text-slate-500 uppercase font-mono">Risk Status</div>
                    <span
                      className={`inline-block px-2 py-0.5 rounded text-[10px] font-mono mt-0.5 border ${
                        selectedNode.risk_level === 'CRITICAL'
                          ? 'bg-rose-500/20 text-rose-300 border-rose-500/40'
                          : selectedNode.risk_level === 'WARNING'
                          ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                          : 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                      }`}
                    >
                      {selectedNode.risk_level}
                    </span>
                  </div>
                )}

                {selectedNode.details && (
                  <div className="pt-2 border-t border-slate-800 space-y-1.5">
                    {Object.entries(selectedNode.details).map(([k, v]) => (
                      <div key={k} className="flex justify-between items-center text-[11px]">
                        <span className="text-slate-400 capitalize">{k.replace('_', ' ')}:</span>
                        <span className="font-mono text-slate-200">
                          {typeof v === 'number' && k.includes('revenue') ? `$${v.toLocaleString()}` : String(v)}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div className="mt-4 pt-2 border-t border-slate-800 text-[10px] text-slate-500">
              Click graph background or ✕ to close details.
            </div>
          </div>
        )}
      </div>

      {/* Graph Legend Footer */}
      <div className="p-2.5 bg-slate-900/60 border-t border-slate-800/80 flex flex-wrap items-center justify-between text-[11px] text-slate-400 px-4">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-rose-500" />
            <span>Critical Risk</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
            <span>Warning Signal</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-sky-400" />
            <span>Contact</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-indigo-400" />
            <span>Deal Opportunity</span>
          </div>
        </div>

        <div className="text-[10px] font-mono text-slate-500 hidden sm:block">
          Deterministic Node Graph • Click node to inspect
        </div>
      </div>
    </div>
  );
};
