"use client";

import React, { useEffect, useRef, useState } from "react";
import * as d3 from "d3";
import { Search, ZoomIn, ZoomOut, RotateCcw, Filter, Info } from "lucide-react";
import { useRouter } from "next/navigation";

const PLSQLKnowledgeGraph = () => {
  const router = useRouter();
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const svgRef = useRef();
  const containerRef = useRef();
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedDomain, setSelectedDomain] = useState("All");
  const [selectedNode, setSelectedNode] = useState(null);
  const [showInfo, setShowInfo] = useState(false);

  // Data loading with error handling and debugging
  const [data, setData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    // Check authentication status
    const authData = sessionStorage.getItem("swms-auth");
    if (!authData) {
      router.push("/login");
      return;
    }

    try {
      const authInfo = JSON.parse(authData);
      if (!authInfo.authenticated) {
        router.push("/login");
        return;
      }
      setCurrentUser(authInfo.username);
    } catch (error) {
      console.error("Error parsing auth data:", error);
      router.push("/login");
      return;
    }

    setLoading(false);
  }, [router]);

  const handleLogout = async () => {
    try {
      await fetch("/api/auth/logout", {
        method: "POST",
      });
    } catch (error) {
      console.error("Logout error:", error);
    }

    sessionStorage.removeItem("swms-auth");
    router.push("/login");
  };

  // Load your JSON data here - replace this with your actual data loading
  useEffect(() => {
    const loadData = async () => {
      try {
        // Load data from public folder
        const response = await fetch("/swms_knowledge_graph.json");

        if (!response.ok) {
          throw new Error(
            `Failed to load data: ${response.status} ${response.statusText}`
          );
        }

        const yourActualData = await response.json();

        // Validate data structure
        if (!yourActualData || typeof yourActualData !== "object") {
          throw new Error("Invalid JSON data format");
        }

        if (!yourActualData.nodes || !Array.isArray(yourActualData.nodes)) {
          throw new Error('JSON must contain a "nodes" array');
        }

        console.log(
          `Loaded ${yourActualData.nodes.length} nodes from swms_knowledge_graph.json`
        );

        // Generate links from node relationships if not provided
        let processedData = { ...yourActualData };

        if (!processedData.links || processedData.links.length === 0) {
          // Generate links based on common patterns in procedures/functions
          const links = [];

          yourActualData.nodes.forEach((sourceNode, i) => {
            yourActualData.nodes.forEach((targetNode, j) => {
              if (i !== j) {
                // Check if nodes share common procedures or functions
                const sharedProcs =
                  sourceNode.procedures?.filter((proc) =>
                    targetNode.procedures?.includes(proc)
                  ).length || 0;

                const sharedFuncs =
                  sourceNode.functions?.filter((func) =>
                    targetNode.functions?.includes(func)
                  ).length || 0;

                if (sharedProcs > 0 || sharedFuncs > 0) {
                  links.push({
                    source: sourceNode.id,
                    target: targetNode.id,
                    relationship:
                      sharedProcs > 0 ? "shared_procedure" : "shared_function",
                    strength: Math.min((sharedProcs + sharedFuncs) * 0.2, 1),
                  });
                }
              }
            });
          });

          processedData.links = links;
        }

        setData(processedData);
        setIsLoading(false);
        console.log("Data loaded successfully:", processedData);
      } catch (err) {
        console.error("Error loading data:", err);
        setError(err.message);
        setIsLoading(false);
      }
    };

    loadData();
  }, []);

  // D3 visualization effect - this hook must always be called
  useEffect(() => {
    // Only proceed if we have data and required refs
    if (
      !svgRef.current ||
      !containerRef.current ||
      !data ||
      !data.nodes ||
      data.nodes.length === 0
    ) {
      return;
    }

    // Clear previous visualization
    d3.select(svgRef.current).selectAll("*").remove();

    const container = containerRef.current;
    const width = container.clientWidth;
    const height = container.clientHeight;

    // Create SVG
    const svg = d3
      .select(svgRef.current)
      .attr("width", width)
      .attr("height", height);

    // Create zoom behavior
    const zoom = d3
      .zoom()
      .scaleExtent([0.1, 4])
      .on("zoom", (event) => {
        g.attr("transform", event.transform);
      });

    svg.call(zoom);

    // Create main group
    const g = svg.append("g");

    // Filter data based on search and domain
    const filteredNodes = data.nodes.filter((node) => {
      const matchesSearch =
        searchTerm === "" ||
        node.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
        node.domain.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesDomain =
        selectedDomain === "All" || node.domain === selectedDomain;
      return matchesSearch && matchesDomain;
    });

    const filteredNodeIds = new Set(filteredNodes.map((n) => n.id));
    const filteredLinks = data.links.filter(
      (link) =>
        filteredNodeIds.has(link.source) && filteredNodeIds.has(link.target)
    );

    // Color scales
    const domainColors = {
      General: "#3B82F6",
      Receiving: "#10B981",
      Audit_Logging: "#F59E0B",
      Warehouse: "#8B5CF6",
      Inventory: "#EF4444",
    };

    const nodeTypeColors = {
      package: "#6366F1",
      table: "#059669",
      view: "#DC2626",
      function: "#7C3AED",
    };

    // Create force simulation
    const simulation = d3
      .forceSimulation(filteredNodes)
      .force(
        "link",
        d3
          .forceLink(filteredLinks)
          .id((d) => d.id)
          .distance((d) => 100 - (d.strength || 0.5) * 50)
          .strength((d) => d.strength || 0.5)
      )
      .force("charge", d3.forceManyBody().strength(-800).distanceMax(300))
      .force("center", d3.forceCenter(width / 2, height / 2))
      .force(
        "collision",
        d3.forceCollide().radius((d) => Math.sqrt(d.degree) * 3 + 10)
      );

    // Create arrow markers for directed links
    svg
      .append("defs")
      .selectAll("marker")
      .data(["end"])
      .join("marker")
      .attr("id", "arrowhead")
      .attr("viewBox", "0 -5 10 10")
      .attr("refX", 25)
      .attr("refY", 0)
      .attr("markerWidth", 6)
      .attr("markerHeight", 6)
      .attr("orient", "auto")
      .append("path")
      .attr("d", "M0,-5L10,0L0,5")
      .attr("fill", "#64748B");

    // Create links
    const link = g
      .append("g")
      .attr("class", "links")
      .selectAll("line")
      .data(filteredLinks)
      .join("line")
      .attr("stroke", "#64748B")
      .attr("stroke-opacity", 0.6)
      .attr("stroke-width", (d) => Math.sqrt(d.strength * 10) || 2)
      .attr("marker-end", "url(#arrowhead)");

    // Create link labels
    const linkLabels = g
      .append("g")
      .attr("class", "link-labels")
      .selectAll("text")
      .data(filteredLinks)
      .join("text")
      .attr("class", "link-label")
      .attr("text-anchor", "middle")
      .attr("font-size", "10px")
      .attr("fill", "#64748B")
      .attr("opacity", 0)
      .text((d) => d.relationship);

    // Create nodes
    const node = g
      .append("g")
      .attr("class", "nodes")
      .selectAll("g")
      .data(filteredNodes)
      .join("g")
      .attr("class", "node")
      .style("cursor", "pointer")
      .call(
        d3
          .drag()
          .on("start", dragStarted)
          .on("drag", dragged)
          .on("end", dragEnded)
      );

    // Node circles
    node
      .append("circle")
      .attr("r", (d) => Math.sqrt(d.degree) * 2.5 + 8)
      .attr(
        "fill",
        (d) => domainColors[d.domain] || nodeTypeColors[d.type] || "#6B7280"
      )
      .attr("stroke", "#fff")
      .attr("stroke-width", 2)
      .style("filter", "drop-shadow(2px 2px 4px rgba(0,0,0,0.3))")
      .on("mouseover", handleMouseOver)
      .on("mouseout", handleMouseOut)
      .on("click", handleNodeClick);

    // Node labels
    node
      .append("text")
      .attr("text-anchor", "middle")
      .attr("dy", (d) => Math.sqrt(d.degree) * 2.5 + 25)
      .attr("font-size", "12px")
      .attr("font-weight", "600")
      .attr("fill", "#1F2937")
      .style("pointer-events", "none")
      .text((d) => (d.id.length > 15 ? d.id.substring(0, 15) + "..." : d.id));

    // Node type badges
    node
      .append("text")
      .attr("text-anchor", "middle")
      .attr("dy", 4)
      .attr("font-size", "8px")
      .attr("font-weight", "bold")
      .attr("fill", "white")
      .style("pointer-events", "none")
      .text((d) => d.type.toUpperCase());

    // Update positions on simulation tick
    simulation.on("tick", () => {
      link
        .attr("x1", (d) => d.source.x)
        .attr("y1", (d) => d.source.y)
        .attr("x2", (d) => d.target.x)
        .attr("y2", (d) => d.target.y);

      linkLabels
        .attr("x", (d) => (d.source.x + d.target.x) / 2)
        .attr("y", (d) => (d.source.y + d.target.y) / 2);

      node.attr("transform", (d) => `translate(${d.x},${d.y})`);
    });

    // Event handlers
    function dragStarted(event, d) {
      if (!event.active) simulation.alphaTarget(0.3).restart();
      d.fx = d.x;
      d.fy = d.y;
    }

    function dragged(event, d) {
      d.fx = event.x;
      d.fy = event.y;
    }

    function dragEnded(event, d) {
      if (!event.active) simulation.alphaTarget(0);
      d.fx = null;
      d.fy = null;
    }

    function handleMouseOver(event, d) {
      // Highlight connected nodes and links
      const connectedNodeIds = new Set();
      filteredLinks.forEach((link) => {
        if (link.source.id === d.id) connectedNodeIds.add(link.target.id);
        if (link.target.id === d.id) connectedNodeIds.add(link.source.id);
      });

      node
        .selectAll("circle")
        .style("opacity", (n) =>
          n.id === d.id || connectedNodeIds.has(n.id) ? 1 : 0.3
        );

      link.style("opacity", (l) =>
        l.source.id === d.id || l.target.id === d.id ? 1 : 0.1
      );

      linkLabels.attr("opacity", (l) =>
        l.source.id === d.id || l.target.id === d.id ? 1 : 0
      );
    }

    function handleMouseOut() {
      node.selectAll("circle").style("opacity", 1);
      link.style("opacity", 0.6);
      linkLabels.attr("opacity", 0);
    }

    function handleNodeClick(event, d) {
      setSelectedNode(d);
      setShowInfo(true);
    }

    // Zoom functions
    window.zoomIn = () => svg.transition().call(zoom.scaleBy, 1.5);
    window.zoomOut = () => svg.transition().call(zoom.scaleBy, 1 / 1.5);
    window.resetZoom = () =>
      svg.transition().call(zoom.transform, d3.zoomIdentity);
  }, [data, searchTerm, selectedDomain]);

  // Calculate domains for dropdown
  const domains = ["All", ...new Set(data?.nodes?.map((n) => n.domain) || [])];

  // Loading state
  if (isLoading) {
    return (
      <div className="w-full h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading knowledge graph...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="w-full h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center">
        <div className="text-center bg-white p-8 rounded-lg shadow-lg">
          <h2 className="text-xl font-semibold text-red-600 mb-4">
            Error Loading Data
          </h2>
          <p className="text-gray-600 mb-4">{error}</p>
          <p className="text-sm text-gray-500">
            Check the console for more details.
          </p>
        </div>
      </div>
    );
  }

  // No data state
  if (!data || !data.nodes || data.nodes.length === 0) {
    return (
      <div className="w-full h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center">
        <div className="text-center bg-white p-8 rounded-lg shadow-lg">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">
            No Data Found
          </h2>
          <p className="text-gray-600">
            Please check your data format and try again.
          </p>
          <div className="mt-4 text-left text-sm text-gray-500">
            <p>Expected format:</p>
            <pre className="bg-gray-100 p-2 mt-2 rounded text-xs">
              {`{
                "nodes": [...],
                "links": [...] // optional
                }`}
            </pre>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 flex flex-col">
      {/* Enhanced Header */}
      <div className="bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-500 shadow-lg border-b border-indigo-300 flex-shrink-0">
        <div className="flex items-center justify-between px-8 py-5">
          {/* Left: Back Button */}
          <div className="flex items-center gap-5">
            <button
              type="button"
              onClick={() => { window.location.href = '/dashboard'; }}
              className="flex items-center space-x-2 text-white hover:text-pink-100 transition-colors duration-200 font-semibold text-base focus:outline-none focus:ring-2 focus:ring-pink-300 rounded cursor-pointer"
              style={{ cursor: 'pointer' }}
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              <span>Back to Tools</span>
            </button>
          </div>
          {/* Center: Title */}
          <div className="flex-1 flex justify-center">
            <h1 className="text-3xl font-bold text-white drop-shadow-md tracking-wide text-center">
              SWMS Knowledge Graph
            </h1>
          </div>
          {/* Right: User Info + Logout */}
          <div className="flex items-center gap-4">
            <div className="flex items-center space-x-3 bg-white text-black rounded-full px-4 py-2 shadow-sm border border-gray-200">
              <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center">
                <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
              </div>
              <p className="text-sm font-semibold">{currentUser}</p>
            </div>
            <button
              type="button"
              onClick={handleLogout}
              className="flex items-center space-x-3 bg-white text-black rounded-full px-4 py-2 shadow-sm border border-gray-200 cursor-pointer focus:outline-none focus:ring-2 focus:ring-pink-300"
              style={{ cursor: 'pointer' }}
            >
              <div className="w-6 h-6 bg-red-100 rounded-full flex items-center justify-center">
                <svg className="w-4 h-4 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                </svg>
              </div>
              <span className="text-sm font-semibold">Logout</span>
            </button>
          </div>
        </div>
      </div>

      {/* Controls */}
      <div className="flex flex-wrap gap-4 items-center p-4 bg-white shadow-sm border-b">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-black w-4 h-4" />
          <input
            type="text"
            placeholder="Search nodes..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-black"
          />
        </div>

        <div className="relative">
          <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 text-black w-4 h-4" />
          <select
            value={selectedDomain}
            onChange={(e) => setSelectedDomain(e.target.value)}
            className="pl-10 pr-8 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white text-black"
          >
            {domains.map((domain) => (
              <option key={domain} value={domain}>
                {domain}
              </option>
            ))}
          </select>
        </div>

        <div className="flex gap-2">
          <button
            onClick={() => window.zoomIn?.()}
            className="p-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
            title="Zoom In"
          >
            <ZoomIn className="w-4 h-4" />
          </button>
          <button
            onClick={() => window.zoomOut?.()}
            className="p-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
            title="Zoom Out"
          >
            <ZoomOut className="w-4 h-4" />
          </button>
          <button
            onClick={() => window.resetZoom?.()}
            className="p-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors"
            title="Reset View"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Main visualization */}
      <div className="flex-1 relative" ref={containerRef}>
        <svg ref={svgRef} className="w-full h-full" />

        {/* Legend */}
        <div className="absolute top-4 right-4 bg-white bg-opacity-95 p-4 rounded-lg shadow-lg">
          <h3 className="font-semibold mb-2 text-gray-800">Node Types</h3>
          <div className="space-y-2 text-sm">
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded-full bg-blue-500"></div>
              <span>General</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded-full bg-green-500"></div>
              <span>Receiving</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded-full bg-amber-500"></div>
              <span>Audit_Logging</span>
            </div>
          </div>

          <div className="mt-4 pt-4 border-t">
            <p className="text-xs text-gray-600">
              • Node size = degree (connections)
              <br />
              • Drag to move nodes
              <br />
              • Hover to highlight connections
              <br />• Click for details
            </p>
          </div>
        </div>
      </div>

      {/* Node details modal */}
      {showInfo && selectedNode && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4 max-h-96 overflow-y-auto">
            <div className="flex justify-between items-start mb-4">
              <h3 className="text-lg font-semibold text-gray-800">
                {selectedNode.id}
              </h3>
              <button
                onClick={() => setShowInfo(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                ×
              </button>
            </div>

            <div className="space-y-3 text-sm">
              <div>
                <span className="font-medium text-gray-800">Type:</span> {selectedNode.type}
              </div>
              <div>
                <span className="font-medium text-gray-800">Domain:</span>{" "}
                {selectedNode.domain}
              </div>
              <div>
                <span className="font-medium text-gray-800">Degree:</span>{" "}
                {selectedNode.degree}
              </div>
              <div>
                <span className="font-medium text-gray-800">File:</span> {selectedNode.file}
              </div>

              {selectedNode.procedures?.length > 0 && (
                <div>
                  <span className="font-medium text-gray-800">Procedures:</span>
                  <div className="mt-1 text-xs text-gray-600">
                    {selectedNode.procedures.slice(0, 5).join(", ")}
                    {selectedNode.procedures.length > 5 && "..."}
                  </div>
                </div>
              )}

              {selectedNode.functions?.length > 0 && (
                <div>
                  <span className="font-medium">Functions:</span>
                  <div className="mt-1 text-xs text-gray-600">
                    {selectedNode.functions.slice(0, 5).join(", ")}
                    {selectedNode.functions.length > 5 && "..."}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PLSQLKnowledgeGraph;
