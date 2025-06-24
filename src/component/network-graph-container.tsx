"use client";

import { useEffect, useState } from "react";
import type { SchemaGraphData } from "~/server/parser/type";
import FileInput from "./file-input";
import { NetworkGraph } from "./network-graph";

const GRAPH_DATA_KEY = "graphData";

export function NetworkGraphContainer() {
  const [graphData, setGraphData] = useState<SchemaGraphData | null>(() => {
    if (typeof window === "undefined") return null;
    const stored = localStorage.getItem(GRAPH_DATA_KEY);
    if (!stored) return null;
    try {
      return JSON.parse(stored) as SchemaGraphData;
    } catch {
      return null;
    }
  });

  useEffect(() => {
    if (graphData) {
      localStorage.setItem(GRAPH_DATA_KEY, JSON.stringify(graphData));
    } else {
      localStorage.removeItem(GRAPH_DATA_KEY);
    }
  }, [graphData]);

  return (
    <>
      <FileInput onGraphData={setGraphData} />
      {graphData && <NetworkGraph graphData={graphData} />}
    </>
  );
}
