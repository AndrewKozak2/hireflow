import { DonutChart } from "@mantine/charts";
import { useMemo } from "react";
import styles from "./SourceDonutChart.module.css";
import { getSourceColor, formatSourceName } from "./helper";

export const SourceDonutChart = ({ data = [], activeSource, onSelect }) => {
  const chartData = useMemo(() => {
    return data.map((item) => ({
      name: item.source,
      value: item.total,
      source: item.source,
      color: getSourceColor(formatSourceName(item.source)),
    }));
  }, [data]);

  const total = useMemo(() => {
    return chartData.reduce((sum, item) => sum + item.value, 0);
  }, [chartData]);

  return (
    <div className={styles.wrapperDonut}>
      <DonutChart
        data={chartData.map((item) => ({
          ...item,
          opacity: activeSource && item.source !== activeSource ? 0.3 : 1,
        }))}
        size={140}
        tooltipDataSource="segment"
        withLabels={false}
        pieProps={{
          onClick: (data) => {
            if (data?.payload?.source) {
              onSelect?.(data.payload.source);
            }
          },
          style: { cursor: "pointer" },
        }}
        tooltipProps={{
          content: ({ payload }) => {
            if (!payload?.length) return null;

            const item = payload[0]?.payload;
            const percent =
              total > 0 ? ((item.value / total) * 100).toFixed(1) : 0;

            return (
              <div className={styles.wrapperToolTip}>
                <div className={styles.wrapperForDotAndNameToolTip}>
                  <span
                    className={styles.dotInToolTip}
                    style={{ background: item.color }}
                  />
                  <b style={{ color: item.color }}>
                    {formatSourceName(item.source)}
                  </b>
                </div>

                <div>
                  {item.value} • {percent}%
                </div>
              </div>
            );
          },
        }}
      />

      <div className={styles.wrapperForLegend}>
        {chartData.map((item) => (
          <div
            key={item.source}
            onClick={() => onSelect?.(item.source)}
            className={styles.wrapperForOneItemInLegend}
          >
            <div
              className={styles.wrapperInItemLegendDotAndName}
              style={{ color: item.color }}
            >
              <span
                className={styles.dotInLegendItem}
                style={{ background: item.color }}
              />
              {formatSourceName(item.source)}
            </div>

            <span>{item.value}</span>
          </div>
        ))}
      </div>
    </div>
  );
};
