import React, { useMemo } from 'react';

interface VersionEntry {
    version: string;
    lts: boolean;
    activeStart: string;   // YYYY-MM format
    activeEnd: string;     // YYYY-MM format
    ltsEnd?: string;       // YYYY-MM format (only for LTS versions)
    planned?: boolean;     // dashed outline for unreleased versions
}

const VERSIONS: VersionEntry[] = [
    {
        version: '2023.3',
        lts: true,
        activeStart: '2023-10',
        activeEnd: '2024-03',
        ltsEnd: '2025-12',
    },
    {
        version: '2024.4',
        lts: true,
        activeStart: '2024-10',
        activeEnd: '2025-02',
        ltsEnd: '2026-12',
    },
    {
        version: '2025.1',
        lts: false,
        activeStart: '2025-03',
        activeEnd: '2025-06',
    },
    {
        version: '2025.2',
        lts: false,
        activeStart: '2025-06',
        activeEnd: '2025-08',
    },
    {
        version: '2025.3',
        lts: false,
        activeStart: '2025-09',
        activeEnd: '2025-11',
    },
    {
        version: '2025.4',
        lts: true,
        activeStart: '2025-12',
        activeEnd: '2026-05',
        ltsEnd: '2028-12',
    },
    {
        version: '2026.1',
        lts: false,
        activeStart: '2026-04',
        activeEnd: '2026-06',
    },
    {
        version: '2026.2',
        lts: false,
        activeStart: '2026-07',
        activeEnd: '2026-09',
    },
    {
        version: '2026.3',
        lts: false,
        activeStart: '2026-10',
        activeEnd: '2026-12',
        planned: true,
    },
];

const TIMELINE_START = 2025;
const TIMELINE_END = 2029;
const YEAR_SPAN = TIMELINE_END - TIMELINE_START;

const COLORS = {
    active: '#27ae60',
    lts: '#6428b4',
    eol: '#bdc3c7',
    planned: '#95a5a6',
    todayLine: '#e74c3c',
    text: 'var(--ifm-font-color-base, #2c3e50)',
    gridLine: '#e0e0e0',
    gridLineDashed: '#eeeeee',
    rowBorder: '#e8e8e8',
    background: 'var(--ifm-background-surface-color, #f8fafc)',
};

function parseYearMonth(ym: string, endOfMonth = false): number {
    const [year, month] = ym.split('-').map(Number);
    if (endOfMonth) {
        return year + month / 12;
    }
    return year + (month - 1) / 12;
}

function getToday(): number {
    const now = new Date();
    return now.getFullYear() + now.getMonth() / 12;
}

export default function VersionTimeline(): JSX.Element {
    const today = useMemo(() => getToday(), []);

    const chartLeft = 80;
    const chartRight = 880;
    const chartWidth = chartRight - chartLeft;
    const rowHeight = 38;
    const topPadding = 30;
    const barHeight = 22;
    const legendHeight = 40;
    const chartTop = topPadding;
    const chartBottom = chartTop + VERSIONS.length * rowHeight;
    const totalHeight = chartBottom + 34 + legendHeight;

    function xPos(yearVal: number): number {
        return chartLeft + ((yearVal - TIMELINE_START) / YEAR_SPAN) * chartWidth;
    }

    const todayX = xPos(today);

    return (
        <svg
            viewBox={`0 0 900 ${totalHeight}`}
            style={{
                width: '100%',
                maxWidth: 900,
                fontFamily: 'var(--ifm-font-family-base, system-ui, -apple-system, sans-serif)',
                fontSize: 'var(--ifm-font-size-base, 14px)',
            }}
            role="img"
            aria-label="Pimcore Platform Version Support Timeline"
        >
            {/* Background */}
            <rect width="900" height={totalHeight} fill={COLORS.background} rx="6" />

            {/* Row guide borders */}
            {VERSIONS.map((_, i) => {
                const y = chartTop + i * rowHeight;
                return (
                    <line
                        key={`row-border-${i}`}
                        x1={0} y1={y}
                        x2={900} y2={y}
                        stroke={COLORS.rowBorder} strokeWidth="1"
                    />
                );
            })}
            {/* Bottom border of last row */}
            <line
                x1={0} y1={chartBottom}
                x2={900} y2={chartBottom}
                stroke={COLORS.rowBorder} strokeWidth="1"
            />

            {/* Year grid lines */}
            {Array.from({ length: YEAR_SPAN + 1 }, (_, i) => {
                const year = TIMELINE_START + i;
                const x = xPos(year);
                return (
                    <g key={`grid-${year}`}>
                        <line
                            x1={x} y1={chartTop}
                            x2={x} y2={chartBottom}
                            stroke={COLORS.gridLine} strokeWidth="1"
                        />
                        <text
                            x={x} y={chartBottom + 18}
                            textAnchor="middle" fontSize="11" fill={COLORS.text}
                        >
                            {year}
                        </text>
                    </g>
                );
            })}

            {/* Half-year dashed grid lines */}
            {Array.from({ length: YEAR_SPAN }, (_, i) => {
                const x = xPos(TIMELINE_START + i + 0.5);
                return (
                    <line
                        key={`half-${i}`}
                        x1={x} y1={chartTop}
                        x2={x} y2={chartBottom}
                        stroke={COLORS.gridLineDashed} strokeWidth="1" strokeDasharray="4 4"
                    />
                );
            })}

            {/* Version rows */}
            {VERSIONS.map((v, i) => {
                const y = chartTop + i * rowHeight;
                const barY = y + (rowHeight - barHeight) / 2;

                const clamp = (x: number) => Math.max(chartLeft, Math.min(chartRight, x));

                const activeStartX = clamp(xPos(parseYearMonth(v.activeStart)));
                const activeEndX = clamp(xPos(parseYearMonth(v.activeEnd, true)));
                const activeWidth = activeEndX - activeStartX;

                const activeEndVal = parseYearMonth(v.activeEnd, true);
                const isActiveExpired = activeEndVal < today;

                let ltsStartX = 0, ltsWidth = 0, isLtsExpired = false;
                if (v.lts && v.ltsEnd) {
                    ltsStartX = activeEndX;
                    const ltsEndX = clamp(xPos(parseYearMonth(v.ltsEnd, true)));
                    ltsWidth = ltsEndX - ltsStartX;
                    isLtsExpired = parseYearMonth(v.ltsEnd, true) < today;
                }

                return (
                    <g key={v.version}>
                        {/* Version label */}
                        <text
                            x={chartLeft - 12} y={y + rowHeight / 2 + 4}
                            textAnchor="end" fontSize="13" fontWeight="600" fill={COLORS.text}
                        >
                            {v.version}
                        </text>

                        {/* Active support bar */}
                        <rect
                            x={activeStartX} y={barY}
                            width={Math.max(activeWidth, 2)} height={barHeight}
                            fill={v.planned ? 'none' : (isActiveExpired ? COLORS.eol : COLORS.active)}
                            stroke={v.planned ? COLORS.planned : 'none'}
                            strokeWidth={v.planned ? 2 : 0}
                            strokeDasharray={v.planned ? '6 3' : 'none'}
                            rx="3"
                        />

                        {/* LTS bar */}
                        {v.lts && v.ltsEnd && ltsWidth > 0 && (
                            <rect
                                x={ltsStartX} y={barY}
                                width={ltsWidth} height={barHeight}
                                fill={isLtsExpired ? COLORS.eol : COLORS.lts}
                                rx="3"
                            />
                        )}

                        {/* Planned label */}
                        {v.planned && (
                            <text
                                x={activeStartX + activeWidth / 2} y={barY + barHeight / 2 + 4}
                                textAnchor="middle" fontSize="10" fill={COLORS.planned} fontStyle="italic"
                            >
                                planned
                            </text>
                        )}
                    </g>
                );
            })}

            {/* Today marker */}
            {todayX >= xPos(TIMELINE_START) && todayX <= xPos(TIMELINE_END) && (
                <g>
                    <line
                        x1={todayX} y1={chartTop}
                        x2={todayX} y2={chartBottom}
                        stroke={COLORS.todayLine} strokeWidth="2" strokeDasharray="6 3"
                    />
                    <text
                        x={todayX} y={chartTop - 6}
                        textAnchor="middle" fontSize="11" fontWeight="600" fill={COLORS.todayLine}
                    >
                        Today
                    </text>
                </g>
            )}

            {/* Legend */}
            {(() => {
                const legendY = chartBottom + 30;
                const items = [
                    { color: COLORS.active, label: 'Active Support' },
                    { color: COLORS.lts, label: 'LTS' },
                    { color: COLORS.eol, label: 'End of Life' },
                ];
                const spacing = 150;
                const startX = chartLeft + (chartWidth - items.length * spacing) / 2;
                return items.map((item, i) => (
                    <g key={item.label}>
                        <rect
                            x={startX + i * spacing} y={legendY}
                            width={14} height={14}
                            fill={item.color} rx="2"
                        />
                        <text
                            x={startX + i * spacing + 20} y={legendY + 11}
                            fontSize="12" fill={COLORS.text}
                        >
                            {item.label}
                        </text>
                    </g>
                ));
            })()}
        </svg>
    );
}
