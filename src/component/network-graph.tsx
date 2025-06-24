"use client";

import { useRef } from "react";
import { GraphCanvas, useSelection, type GraphCanvasRef } from "reagraph";
import type { SchemaGraphData } from "~/server/parser/type";

export const NetworkGraph = ({ graphData }: { graphData: SchemaGraphData }) => {
  const graphRef = useRef<GraphCanvasRef | null>(null);

  const {
    actives,
    selections,
    onNodeClick,
    onCanvasClick,
    onLasso,
    onLassoEnd,
  } = useSelection({
    ref: graphRef,
    nodes: graphData.nodes,
    edges: graphData.edges,
    type: "multi",
  });

  return (
    <>
      <div
        style={{
          zIndex: 9,
          userSelect: "none",
          position: "absolute",
          top: 0,
          right: 0,
          background: "rgba(0, 0, 0, .5)",
          color: "white",
        }}
      >
        <h3
          style={{
            margin: 5,
          }}
        >
          Hold Shift and Drag to Lasso
        </h3>
      </div>
      <GraphCanvas
        ref={graphRef}
        nodes={graphData.nodes}
        edges={graphData.edges}
        selections={selections}
        actives={actives}
        onNodeClick={onNodeClick}
        onCanvasClick={onCanvasClick}
        lassoType="all"
        onLasso={onLasso}
        onLassoEnd={onLassoEnd}
      />
    </>
  );
};
