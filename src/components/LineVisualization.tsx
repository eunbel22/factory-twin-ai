import { STATUS_COLOR, STATUS_ICON, type StatusLevel } from '../lib/status'

type Node = {
  key: string
  label: string
  sublabel: string
  level: StatusLevel
}

function StationNode({ node }: { node: Node }) {
  const color = STATUS_COLOR[node.level]
  return (
    <div className="flex flex-col items-center gap-1">
      <div
        className="flex h-12 w-12 items-center justify-center rounded-full text-lg font-bold text-white shadow-sm"
        style={{ backgroundColor: color }}
      >
        {STATUS_ICON[node.level]}
      </div>
      <div className="text-xs font-semibold text-neutral-800">{node.label}</div>
      <div className="text-[11px] text-neutral-500">{node.sublabel}</div>
    </div>
  )
}

function Connector() {
  return (
    <div className="mb-6 flex flex-1 items-center px-1">
      <div className="h-0.5 w-full bg-neutral-200" />
    </div>
  )
}

export function LineVisualization({ nodes }: { nodes: Node[] }) {
  return (
    <div className="flex items-start justify-between rounded-lg border border-neutral-200 bg-white px-6 py-5">
      {nodes.map((node, i) => (
        <div key={node.key} className="flex flex-1 items-start">
          <StationNode node={node} />
          {i < nodes.length - 1 && <Connector />}
        </div>
      ))}
    </div>
  )
}

export type { Node as LineVisualizationNode }
