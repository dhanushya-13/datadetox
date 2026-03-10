import React, { useEffect, useRef } from 'react';
import * as d3 from 'd3';
import { motion } from 'motion/react';

interface Node extends d3.SimulationNodeDatum {
  id: string;
  group: number;
  size: number;
  color: string;
}

interface Link extends d3.SimulationLinkDatum<Node> {
  value: number;
}

interface NeuralTopographyProps {
  data: {
    name: string;
    size: number;
    fill: string;
  }[];
}

export const NeuralTopography: React.FC<NeuralTopographyProps> = ({ data }) => {
  const svgRef = useRef<SVGSVGElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!svgRef.current || !containerRef.current) return;

    const width = containerRef.current.clientWidth;
    const height = containerRef.current.clientHeight;

    const svg = d3.select(svgRef.current)
      .attr('width', width)
      .attr('height', height)
      .attr('viewBox', [0, 0, width, height]);

    svg.selectAll('*').remove();

    // Create nodes from data
    const nodes: Node[] = data.map((d, i) => ({
      id: d.name,
      group: i,
      size: Math.sqrt(d.size) * 1.5,
      color: d.fill,
    }));

    // Create some random links for "neural" feel
    const links: Link[] = [];
    for (let i = 0; i < nodes.length; i++) {
      for (let j = i + 1; j < nodes.length; j++) {
        if (Math.random() > 0.4) {
          links.push({
            source: nodes[i].id,
            target: nodes[j].id,
            value: Math.random() * 2,
          });
        }
      }
    }

    // Add some "floating" peripheral nodes
    const peripheralCount = 12;
    for (let i = 0; i < peripheralCount; i++) {
      const pId = `p-${i}`;
      const parent = nodes[Math.floor(Math.random() * nodes.length)];
      nodes.push({
        id: pId,
        group: parent.group,
        size: Math.random() * 10 + 5,
        color: parent.color,
      });
      links.push({
        source: parent.id,
        target: pId,
        value: 0.5,
      });
    }

    const simulation = d3.forceSimulation<Node>(nodes)
      .force('link', d3.forceLink<Node, Link>(links).id(d => d.id).distance(60))
      .force('charge', d3.forceManyBody().strength(-150))
      .force('center', d3.forceCenter(width / 2, height / 2))
      .force('collision', d3.forceCollide().radius(d => (d as Node).size + 5));

    // Define glow filter
    const defs = svg.append('defs');
    const filter = defs.append('filter')
      .attr('id', 'glow');
    filter.append('feGaussianBlur')
      .attr('stdDeviation', '3.5')
      .attr('result', 'coloredBlur');
    const feMerge = filter.append('feMerge');
    feMerge.append('feMergeNode')
      .attr('in', 'coloredBlur');
    feMerge.append('feMergeNode')
      .attr('in', 'SourceGraphic');

    const link = svg.append('g')
      .attr('stroke', '#e4e4e7')
      .attr('stroke-opacity', 0.4)
      .selectAll('line')
      .data(links)
      .join('line')
      .attr('stroke-width', d => Math.sqrt(d.value));

    const node = svg.append('g')
      .selectAll('g')
      .data(nodes)
      .join('g')
      .call(d3.drag<SVGGElement, Node>()
        .on('start', dragstarted)
        .on('drag', dragged)
        .on('end', dragended) as any);

    node.append('circle')
      .attr('r', d => d.size)
      .attr('fill', d => d.color)
      .attr('filter', 'url(#glow)')
      .style('cursor', 'pointer');

    node.append('text')
      .text(d => d.id.startsWith('p-') ? '' : d.id)
      .attr('x', 0)
      .attr('y', d => d.size + 15)
      .attr('text-anchor', 'middle')
      .attr('font-size', '10px')
      .attr('font-weight', '700')
      .attr('fill', '#71717a')
      .attr('class', 'uppercase tracking-widest');

    simulation.on('tick', () => {
      link
        .attr('x1', d => (d.source as any).x)
        .attr('y1', d => (d.source as any).y)
        .attr('x2', d => (d.target as any).x)
        .attr('y2', d => (d.target as any).y);

      node
        .attr('transform', d => `translate(${d.x},${d.y})`);
    });

    function dragstarted(event: any) {
      if (!event.active) simulation.alphaTarget(0.3).restart();
      event.subject.fx = event.subject.x;
      event.subject.fy = event.subject.y;
    }

    function dragged(event: any) {
      event.subject.fx = event.x;
      event.subject.fy = event.y;
    }

    function dragended(event: any) {
      if (!event.active) simulation.alphaTarget(0);
      event.subject.fx = null;
      event.subject.fy = null;
    }

    return () => {
      simulation.stop();
    };
  }, [data]);

  return (
    <div ref={containerRef} className="w-full h-full relative">
      <svg ref={svgRef} className="w-full h-full" />
      <div className="absolute inset-0 pointer-events-none bg-radial-gradient from-transparent to-white/20" />
    </div>
  );
};
