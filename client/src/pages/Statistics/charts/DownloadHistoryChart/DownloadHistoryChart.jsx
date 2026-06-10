import { useEffect, useState, useMemo, useContext, memo } from "react";
import { t } from "i18next";
import ChartWrapper from "@/common/components/ChartWrapper";
import { ThemeContext } from "@/common/contexts/Theme";
import { PreferencesContext } from "@/common/contexts/Preferences";
import { convertSpeed, getSpeedUnit } from "@/common/utils/FormatUtil";
import { jsonRequest } from "@/common/utils/RequestUtil";
import "./styles.sass";

const CYAN = "hsl(187, 94%, 43%)";

const formatLabel = (iso, isSingleYear) => {
    const d = new Date(iso);
    if (isSingleYear) {
        return d.toLocaleDateString([], { month: "short", day: "numeric" });
    }
    return d.toLocaleDateString([], { month: "short", day: "numeric", year: "2-digit" });
};

export const DownloadHistoryChart = memo(({ onClick }) => {
    const [isDarkMode] = useContext(ThemeContext);
    const [preferences] = useContext(PreferencesContext);
    const speedUnit = getSpeedUnit(preferences);

    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(false);

    useEffect(() => {
        setLoading(true);
        setError(false);
        jsonRequest("/speedtests/history/download")
            .then(res => {
                setData(res);
                setLoading(false);
            })
            .catch(() => {
                setError(true);
                setLoading(false);
            });
    }, []);

    const converted = useMemo(() => {
        if (!data?.download?.length) return { labels: [], values: [], avg: 0 };
        return {
            labels: data.labels,
            values: data.download.map(v => convertSpeed(v, preferences)),
            avg: convertSpeed(data.average, preferences)
        };
    }, [data, preferences]);

    const isSingleYear = useMemo(() => {
        if (!converted.labels.length) return true;
        const years = new Set(converted.labels.map(l => new Date(l).getFullYear()));
        return years.size === 1;
    }, [converted.labels]);

    const themeColors = useMemo(() => ({
        gridColor: isDarkMode ? "rgba(42,52,65,0.6)" : "rgba(203,213,225,0.8)",
        tickColor: isDarkMode ? "hsl(215,20%,50%)" : "hsl(215,25%,40%)",
        tooltipBg: isDarkMode ? "hsl(215,28%,10%)" : "#ffffff",
        tooltipTitle: isDarkMode ? "hsl(210,40%,96%)" : "hsl(215,25%,20%)",
        tooltipBody: isDarkMode ? "hsl(215,20%,65%)" : "hsl(215,15%,40%)",
        tooltipBorder: isDarkMode ? "hsl(215,25%,22%)" : "hsl(215,20%,85%)"
    }), [isDarkMode]);

    const chartData = useMemo(() => ({
        labels: converted.labels,
        datasets: [
            {
                label: t("latest.down"),
                data: converted.values,
                borderColor: CYAN,
                backgroundColor: ctx => {
                    const gradient = ctx.chart.ctx.createLinearGradient(0, 0, 0, ctx.chart.height);
                    gradient.addColorStop(0, "hsla(187,94%,43%,0.25)");
                    gradient.addColorStop(1, "hsla(187,94%,43%,0.01)");
                    return gradient;
                },
                fill: true,
                pointRadius: 0,
                pointHoverRadius: 4,
                spanGaps: true,
                order: 1
            },
            {
                label: t("statistics.average"),
                data: converted.labels.map(() => converted.avg),
                borderColor: "hsl(330,80%,60%)",
                backgroundColor: "transparent",
                borderWidth: 2,
                borderDash: [6, 4],
                pointRadius: 0,
                pointHoverRadius: 0,
                fill: false,
                order: 2
            }
        ]
    }), [converted]);

    const chartOptions = useMemo(() => ({
        responsive: true,
        maintainAspectRatio: false,
        resizeDelay: 100,
        animation: { duration: 300, easing: "easeOutQuart" },
        animations: { colors: false, x: false },
        transitions: { active: { animation: { duration: 100 } } },
        plugins: {
            tooltip: {
                backgroundColor: themeColors.tooltipBg,
                titleColor: themeColors.tooltipTitle,
                bodyColor: themeColors.tooltipBody,
                borderColor: themeColors.tooltipBorder,
                borderWidth: 1,
                padding: 14,
                cornerRadius: 10,
                displayColors: true,
                boxPadding: 8,
                callbacks: {
                    title: items => {
                        if (!items.length) return "";
                        const d = new Date(converted.labels[items[0].dataIndex]);
                        return d.toLocaleDateString(undefined, {
                            weekday: "short", day: "numeric", month: "short", year: "numeric"
                        });
                    },
                    label: item =>
                        item.dataset.label === t("statistics.average")
                            ? `${t("statistics.average")}: ${item.formattedValue} ${speedUnit}`
                            : `${t("latest.down")}: ${item.formattedValue} ${speedUnit}`
                }
            },
            legend: {
                position: "bottom",
                labels: {
                    usePointStyle: true,
                    pointStyle: "circle",
                    padding: 20,
                    color: themeColors.tickColor,
                    font: { size: 12, weight: 500 }
                }
            }
        },
        scales: {
            x: {
                grid: { color: themeColors.gridColor, drawBorder: false },
                border: { display: false },
                ticks: {
                    color: themeColors.tickColor,
                    maxTicksLimit: 8,
                    maxRotation: 0,
                    callback: (_, index) => {
                        const total = converted.labels.length;
                        if (total === 0) return "";
                        return formatLabel(converted.labels[index], isSingleYear);
                    }
                }
            },
            y: {
                beginAtZero: true,
                grid: { color: themeColors.gridColor, drawBorder: false },
                border: { display: false },
                ticks: {
                    color: themeColors.tickColor,
                    callback: v => `${v} ${speedUnit}`
                }
            }
        },
        interaction: { intersect: false, mode: "index" },
        elements: {
            line: { tension: 0.35, borderWidth: 2.5 },
            point: { radius: 0, hoverRadius: 4, hoverBorderWidth: 2 }
        }
    }), [themeColors, converted.labels, converted.avg, speedUnit, isSingleYear]);

    return (
        <div className="download-history-chart chart-container full-width" onClick={onClick}>
            <div className="chart-header">
                <h3 className="chart-title">
                    {t("latest.down")} — {t("statistics.history_all")} ({speedUnit})
                </h3>
                {data?.downsampled && (
                    <span className="history-badge">
                        {data.total.toLocaleString()} {t("statistics.tests")}
                    </span>
                )}
            </div>

            <div className="chart-body history-body">
                {loading && (
                    <div className="history-state">
                        <div className="history-spinner" />
                    </div>
                )}
                {error && !loading && (
                    <div className="history-state">
                        <span className="history-error">{t("statistics.load_error")}</span>
                    </div>
                )}
                {!loading && !error && converted.labels.length === 0 && (
                    <div className="history-state">
                        <span className="history-empty">{t("test.not_available")}</span>
                    </div>
                )}
                {!loading && !error && converted.labels.length > 0 && (
                    <ChartWrapper type="line" data={chartData} options={chartOptions} />
                )}
            </div>
        </div>
    );
});
