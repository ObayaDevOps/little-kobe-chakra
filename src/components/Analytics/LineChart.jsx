// src/components/Analytics/LineChart.jsx
import React, { useMemo, useRef, useEffect } from 'react';
import * as d3 from 'd3';
import { Box, Text } from '@chakra-ui/react';

const LineChart = ({
    data = [],
    width = 600, // Default width
    height = 300, // Default height
    marginTop = 30,
    marginRight = 30,
    marginBottom = 50, // Increased for axis labels
    marginLeft = 60, // Increased for axis labels
    xAccessor = d => d.x, // Function to access x value
    yAccessor = d => d.y, // Function to access y value
    xScaleType = 'time', // 'time', 'linear', 'band'
    yScaleType = 'linear', // 'linear', 'log'
    xAxisLabel = "",
    yAxisLabel = "",
    lineColor = "steelblue",
    curveType = d3.curveMonotoneX, // Smoothed line
    yAxisFormat = ".2s", // D3 format specifier for Y axis (e.g., SI units)
    xAxisFormat = null, // D3 format specifier for X axis (null uses scale default, good for time)
}) => {

    // 1. Calculate bounds (inner dimensions)
    const boundedWidth = width - marginLeft - marginRight;
    const boundedHeight = height - marginTop - marginBottom;

    // 2. Create Scales (Memoized)
    const xScale = useMemo(() => {
        const domain = d3.extent(data, xAccessor);
        if (xScaleType === 'time') {
            return d3.scaleTime().domain(domain).range([0, boundedWidth]).nice();
        } else if (xScaleType === 'linear') {
            return d3.scaleLinear().domain(domain).range([0, boundedWidth]).nice();
        }
        // Add other scale types if needed (e.g., scaleBand)
        return d3.scaleLinear().domain(domain).range([0, boundedWidth]).nice(); // Default
    }, [data, xAccessor, xScaleType, boundedWidth]);

    const yScale = useMemo(() => {
        // Extend domain slightly beyond data min/max for padding, starting from 0
        const yMin = 0; // Start Y axis at 0
        const yMax = d3.max(data, yAccessor);
        const domain = [yMin, yMax + (yMax * 0.1)]; // Add 10% padding at the top
        if (yScaleType === 'linear') {
            return d3.scaleLinear().domain(domain).range([boundedHeight, 0]).nice();
        } else if (yScaleType === 'log') {
            // Ensure domain doesn't include 0 or negative for log scale
            const logMin = Math.max(1, d3.min(data, yAccessor)); // Log scale needs positive values
            const logMax = d3.max(data, yAccessor);
             const logDomain = [logMin, logMax + (logMax * 0.1)];
            return d3.scaleLog().domain(logDomain).range([boundedHeight, 0]).nice();
        }
        return d3.scaleLinear().domain(domain).range([boundedHeight, 0]).nice(); // Default
    }, [data, yAccessor, yScaleType, boundedHeight]);

    // 3. Line Generator (Memoized)
    const lineGenerator = useMemo(() => {
        return d3.line()
            .x(d => xScale(xAccessor(d)))
            .y(d => yScale(yAccessor(d)))
            .curve(curveType);
    }, [xScale, yScale, xAccessor, yAccessor, curveType]);

    const linePath = useMemo(() => {
        if (!data || data.length === 0) return "";
        return lineGenerator(data);
    }, [data, lineGenerator]);

    // 4. Axes Rendering (using refs and D3 axis generators)
    const xAxisRef = useRef(null);
    const yAxisRef = useRef(null);

    useEffect(() => {
        if (xAxisRef.current) {
            const xAxisGenerator = d3.axisBottom(xScale);
            if (xAxisFormat) {
                 // Example: d3.timeFormat("%b %d")
                xAxisGenerator.tickFormat(d3.timeFormat(xAxisFormat));
            } else if (xScaleType === 'time') {
                 // Default time format logic (can be improved)
                const tickCount = Math.max(2, Math.min(10, Math.floor(boundedWidth / 80))); // Dynamic ticks
                 xAxisGenerator.ticks(tickCount).tickFormat(d3.timeFormat("%b %d")); // Format as 'Jan 01'
            }
            d3.select(xAxisRef.current)
                .call(xAxisGenerator)
                .selectAll("text") // Optional: Rotate labels if needed
                    .style("text-anchor", "end")
                    .attr("dx", "-.8em")
                    .attr("dy", ".15em")
                    .attr("transform", "rotate(-45)");
        }
    }, [xScale, xAxisFormat, xScaleType, boundedWidth]);

    useEffect(() => {
        if (yAxisRef.current) {
            const yAxisGenerator = d3.axisLeft(yScale);
            if (yAxisFormat) {
                yAxisGenerator.tickFormat(d3.format(yAxisFormat));
            }
             // Dynamic ticks based on height
            const tickCount = Math.max(2, Math.min(10, Math.floor(boundedHeight / 40)));
            yAxisGenerator.ticks(tickCount);

            d3.select(yAxisRef.current).call(yAxisGenerator);
        }
    }, [yScale, yAxisFormat, boundedHeight]);

    if (!data || data.length === 0) {
        return <Text>No data available for chart.</Text>;
    }

    return (
        <Box position="relative" width={width} height={height}>
            <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`}>
                <g transform={`translate(${marginLeft}, ${marginTop})`}>
                    {/* X Axis */}
                    <g
                        ref={xAxisRef}
                        transform={`translate(0, ${boundedHeight})`}
                        className="x-axis"
                    />
                     {/* X Axis Label */}
                    {xAxisLabel && (
                        <text
                            textAnchor="middle"
                            transform={`translate(${boundedWidth / 2}, ${boundedHeight + marginBottom - 5})`} // Position below axis
                            style={{ fontSize: '12px', fill: 'currentColor' }}
                        >
                            {xAxisLabel}
                        </text>
                    )}

                    {/* Y Axis */}
                    <g ref={yAxisRef} className="y-axis" />
                    {/* Y Axis Label */}
                    {yAxisLabel && (
                        <text
                            textAnchor="middle"
                            transform={`translate(${-marginLeft + 15}, ${boundedHeight / 2}) rotate(-90)`} // Position left of axis, rotated
                            style={{ fontSize: '12px', fill: 'currentColor' }}
                        >
                            {yAxisLabel}
                        </text>
                    )}

                    {/* Data Line */}
                    <path
                        d={linePath}
                        fill="none"
                        stroke={lineColor}
                        strokeWidth={2}
                        className="data-line"
                    />

                    {/* Optional: Add points, tooltips, gridlines etc. here */}

                </g>
            </svg>
        </Box>
    );
};

export default LineChart;