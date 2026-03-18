import React, { useEffect, useRef } from 'react';
import * as d3 from 'd3';

export function DelayTrendChart({ data, width = 600, height = 300 }) {
  const svgRef = useRef();

  useEffect(() => {
    if (!data || data.length === 0) return;

    const margin = { top: 20, right: 30, bottom: 40, left: 50 };
    const chartWidth = width - margin.left - margin.right;
    const chartHeight = height - margin.top - margin.bottom;

    // Clear previous chart
    d3.select(svgRef.current).selectAll('*').remove();

    const svg = d3.select(svgRef.current)
      .attr('width', width)
      .attr('height', height)
      .append('g')
      .attr('transform', `translate(${margin.left},${margin.top})`);

    // Parse dates
    const parseDate = d3.timeParse('%Y-%m-%d');
    const chartData = data.map(d => ({
      ...d,
      date: parseDate(d.date)
    }));

    // Scales
    const xScale = d3.scaleTime()
      .domain(d3.extent(chartData, d => d.date))
      .range([0, chartWidth]);

    const yScale = d3.scaleLinear()
      .domain([0, d3.max(chartData, d => d.avg_delay) * 1.1])
      .range([chartHeight, 0]);

    // Line generator
    const line = d3.line()
      .x(d => xScale(d.date))
      .y(d => yScale(d.avg_delay))
      .curve(d3.curveMonotoneX);

    // Add axes
    svg.append('g')
      .attr('transform', `translate(0,${chartHeight})`)
      .call(d3.axisBottom(xScale).ticks(6))
      .attr('class', 'text-slate-400');

    svg.append('g')
      .call(d3.axisLeft(yScale).ticks(5))
      .attr('class', 'text-slate-400');

    // Add grid lines
    svg.append('g')
      .attr('class', 'grid')
      .attr('opacity', 0.1)
      .call(d3.axisLeft(yScale)
        .ticks(5)
        .tickSize(-chartWidth)
        .tickFormat(''));

    // Add area under line
    const area = d3.area()
      .x(d => xScale(d.date))
      .y0(chartHeight)
      .y1(d => yScale(d.avg_delay))
      .curve(d3.curveMonotoneX);

    svg.append('path')
      .datum(chartData)
      .attr('fill', 'url(#gradient)')
      .attr('d', area)
      .attr('opacity', 0.3);

    // Add gradient
    const gradient = svg.append('defs')
      .append('linearGradient')
      .attr('id', 'gradient')
      .attr('x1', '0%')
      .attr('y1', '0%')
      .attr('x2', '0%')
      .attr('y2', '100%');

    gradient.append('stop')
      .attr('offset', '0%')
      .attr('stop-color', '#ef4444')
      .attr('stop-opacity', 1);

    gradient.append('stop')
      .attr('offset', '100%')
      .attr('stop-color', '#ef4444')
      .attr('stop-opacity', 0);

    // Add line path
    const path = svg.append('path')
      .datum(chartData)
      .attr('fill', 'none')
      .attr('stroke', '#ef4444')
      .attr('stroke-width', 3)
      .attr('d', line);

    // Animate line drawing
    const totalLength = path.node().getTotalLength();
    path
      .attr('stroke-dasharray', `${totalLength} ${totalLength}`)
      .attr('stroke-dashoffset', totalLength)
      .transition()
      .duration(1500)
      .ease(d3.easeQuadInOut)
      .attr('stroke-dashoffset', 0);

    // Add dots
    svg.selectAll('.dot')
      .data(chartData)
      .enter()
      .append('circle')
      .attr('class', 'dot')
      .attr('cx', d => xScale(d.date))
      .attr('cy', d => yScale(d.avg_delay))
      .attr('r', 4)
      .attr('fill', '#ef4444')
      .attr('stroke', '#1e293b')
      .attr('stroke-width', 2)
      .style('cursor', 'pointer')
      .on('mouseover', function(event, d) {
        d3.select(this)
          .transition()
          .duration(200)
          .attr('r', 6);
        
        // Show tooltip
        const tooltip = svg.append('g')
          .attr('class', 'tooltip')
          .attr('transform', `translate(${xScale(d.date)},${yScale(d.avg_delay) - 30})`);
        
        tooltip.append('rect')
          .attr('x', -60)
          .attr('y', -25)
          .attr('width', 120)
          .attr('height', 40)
          .attr('fill', '#1e293b')
          .attr('rx', 4);
        
        tooltip.append('text')
          .attr('text-anchor', 'middle')
          .attr('y', -10)
          .attr('fill', '#f1f5f9')
          .style('font-size', '12px')
          .text(`${d.avg_delay.toFixed(1)} min`);
        
        tooltip.append('text')
          .attr('text-anchor', 'middle')
          .attr('y', 5)
          .attr('fill', '#94a3b8')
          .style('font-size', '10px')
          .text(d3.timeFormat('%b %d')(d.date));
      })
      .on('mouseout', function() {
        d3.select(this)
          .transition()
          .duration(200)
          .attr('r', 4);
        
        svg.selectAll('.tooltip').remove();
      });

    // Style axes
    svg.selectAll('.domain, .tick line')
      .attr('stroke', '#475569');

    svg.selectAll('.tick text')
      .attr('fill', '#94a3b8')
      .style('font-size', '12px');

  }, [data, width, height]);

  return (
    <div className="w-full bg-slate-900 rounded-lg p-4">
      <h3 className="text-lg font-semibold text-slate-100 mb-4">Average Flight Delays (Last 30 Days)</h3>
      <svg ref={svgRef}></svg>
    </div>
  );
}

export function RouteRevenueChart({ data, width = 600, height = 400 }) {
  const svgRef = useRef();

  useEffect(() => {
    if (!data || data.length === 0) return;

    const margin = { top: 20, right: 30, bottom: 80, left: 80 };
    const chartWidth = width - margin.left - margin.right;
    const chartHeight = height - margin.top - margin.bottom;

    // Clear previous chart
    d3.select(svgRef.current).selectAll('*').remove();

    const svg = d3.select(svgRef.current)
      .attr('width', width)
      .attr('height', height)
      .append('g')
      .attr('transform', `translate(${margin.left},${margin.top})`);

    // Take top 10 routes
    const topRoutes = data.slice(0, 10);

    // Scales
    const xScale = d3.scaleBand()
      .domain(topRoutes.map(d => d.route))
      .range([0, chartWidth])
      .padding(0.3);

    const yScale = d3.scaleLinear()
      .domain([0, d3.max(topRoutes, d => d.total_revenue) * 1.1])
      .range([chartHeight, 0]);

    // Color scale
    const colorScale = d3.scaleSequential()
      .domain([0, topRoutes.length - 1])
      .interpolator(d3.interpolateBlues);

    // Add axes
    svg.append('g')
      .attr('transform', `translate(0,${chartHeight})`)
      .call(d3.axisBottom(xScale))
      .selectAll('text')
      .attr('transform', 'rotate(-45)')
      .style('text-anchor', 'end')
      .attr('fill', '#94a3b8')
      .style('font-size', '11px');

    svg.append('g')
      .call(d3.axisLeft(yScale)
        .ticks(5)
        .tickFormat(d => `$${(d / 1000).toFixed(0)}K`))
      .selectAll('text')
      .attr('fill', '#94a3b8')
      .style('font-size', '12px');

    // Add bars
    svg.selectAll('.bar')
      .data(topRoutes)
      .enter()
      .append('rect')
      .attr('class', 'bar')
      .attr('x', d => xScale(d.route))
      .attr('width', xScale.bandwidth())
      .attr('y', chartHeight)
      .attr('height', 0)
      .attr('fill', (d, i) => colorScale(i))
      .attr('rx', 4)
      .style('cursor', 'pointer')
      .on('mouseover', function(event, d) {
        d3.select(this)
          .transition()
          .duration(200)
          .attr('opacity', 0.8);
        
        // Tooltip
        const tooltip = svg.append('g')
          .attr('class', 'tooltip')
          .attr('transform', `translate(${xScale(d.route) + xScale.bandwidth() / 2},${yScale(d.total_revenue) - 10})`);
        
        tooltip.append('rect')
          .attr('x', -70)
          .attr('y', -50)
          .attr('width', 140)
          .attr('height', 50)
          .attr('fill', '#1e293b')
          .attr('rx', 4);
        
        tooltip.append('text')
          .attr('text-anchor', 'middle')
          .attr('y', -30)
          .attr('fill', '#f1f5f9')
          .style('font-size', '12px')
          .style('font-weight', 'bold')
          .text(d.route);
        
        tooltip.append('text')
          .attr('text-anchor', 'middle')
          .attr('y', -15)
          .attr('fill', '#22c55e')
          .style('font-size', '14px')
          .style('font-weight', 'bold')
          .text(`$${(d.total_revenue / 1000).toFixed(1)}K`);
        
        tooltip.append('text')
          .attr('text-anchor', 'middle')
          .attr('y', 0)
          .attr('fill', '#94a3b8')
          .style('font-size', '10px')
          .text(`${d.total_flights} flights`);
      })
      .on('mouseout', function() {
        d3.select(this)
          .transition()
          .duration(200)
          .attr('opacity', 1);
        
        svg.selectAll('.tooltip').remove();
      })
      .transition()
      .duration(1000)
      .delay((d, i) => i * 100)
      .attr('y', d => yScale(d.total_revenue))
      .attr('height', d => chartHeight - yScale(d.total_revenue));

    // Style axes
    svg.selectAll('.domain, .tick line')
      .attr('stroke', '#475569');

  }, [data, width, height]);

  return (
    <div className="w-full bg-slate-900 rounded-lg p-4">
      <h3 className="text-lg font-semibold text-slate-100 mb-4">Top Routes by Revenue</h3>
      <svg ref={svgRef}></svg>
    </div>
  );
}

export function LoadFactorGauge({ value = 0, width = 300, height = 200 }) {
  const svgRef = useRef();

  useEffect(() => {
    const margin = { top: 20, right: 20, bottom: 20, left: 20 };
    const chartWidth = width - margin.left - margin.right;
    const chartHeight = height - margin.top - margin.bottom;

    // Clear previous chart
    d3.select(svgRef.current).selectAll('*').remove();

    const svg = d3.select(svgRef.current)
      .attr('width', width)
      .attr('height', height)
      .append('g')
      .attr('transform', `translate(${width / 2},${height / 2 + 20})`);

    const radius = Math.min(chartWidth, chartHeight) / 2;
    const thickness = 20;

    // Create arc generators
    const arc = d3.arc()
      .innerRadius(radius - thickness)
      .outerRadius(radius)
      .startAngle(-Math.PI / 2)
      .cornerRadius(10);

    // Background arc
    svg.append('path')
      .attr('d', arc({ endAngle: Math.PI / 2 }))
      .attr('fill', '#334155');

    // Determine color based on value
    const color = value >= 80 ? '#22c55e' : value >= 60 ? '#f59e0b' : '#ef4444';

    // Value arc
    const valueArc = svg.append('path')
      .attr('d', arc({ endAngle: -Math.PI / 2 }))
      .attr('fill', color);

    // Animate
    valueArc.transition()
      .duration(1500)
      .attrTween('d', function() {
        const interpolate = d3.interpolate(-Math.PI / 2, -Math.PI / 2 + (value / 100) * Math.PI);
        return function(t) {
          return arc({ endAngle: interpolate(t) });
        };
      });

    // Center text
    svg.append('text')
      .attr('text-anchor', 'middle')
      .attr('y', 0)
      .attr('fill', '#f1f5f9')
      .style('font-size', '32px')
      .style('font-weight', 'bold')
      .text('0')
      .transition()
      .duration(1500)
      .tween('text', function() {
        const interpolate = d3.interpolate(0, value);
        return function(t) {
          d3.select(this).text(`${Math.round(interpolate(t))}%`);
        };
      });

    svg.append('text')
      .attr('text-anchor', 'middle')
      .attr('y', 25)
      .attr('fill', '#94a3b8')
      .style('font-size', '12px')
      .text('Load Factor');

  }, [value, width, height]);

  return <svg ref={svgRef}></svg>;
}
