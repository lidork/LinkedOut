import React, { useState, useCallback } from "react";
import {
  View, Text, ScrollView, TouchableOpacity,
  StyleSheet, ActivityIndicator, useWindowDimensions,
} from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import Svg, { Rect, Line, Text as SvgText, G } from "react-native-svg";
import { scaleBand, scaleLinear } from "d3-scale";
import { max } from "d3-array";
import { useTheme } from "../context/ThemeContext";
import { apiFetch } from "../api/client";
import ScreenHeader from "../components/ScreenHeader";
import BottomTabBar from "../components/BottomTabBar";
import { SPACING, HEADER_PADDING_BOTTOM } from "../constants/layout";

const CHART_H = 220;
const PAD = { top: 16, right: 16, bottom: 48, left: 44 };
const BAR_COLOR = "#2563eb";
const BAR_COLOR_2 = "#7c3aed";

// ── Bar chart (vertical) ────────────────────────────────────────────────────
function BarChart({ data, xKey, yKey, color, width }) {
  const innerW = width - PAD.left - PAD.right;
  const innerH = CHART_H - PAD.top - PAD.bottom;

  const xScale = scaleBand()
    .domain(data.map((d) => d[xKey]))
    .range([0, innerW])
    .padding(0.3);

  const yMax = max(data, (d) => d[yKey]) || 1;
  const yScale = scaleLinear().domain([0, yMax]).range([innerH, 0]).nice();

  const yTicks = yScale.ticks(5);

  return (
    <Svg width={width} height={CHART_H}>
      <G x={PAD.left} y={PAD.top}>
        {/* Y-axis grid lines + labels */}
        {yTicks.map((tick) => (
          <G key={tick}>
            <Line
              x1={0} y1={yScale(tick)}
              x2={innerW} y2={yScale(tick)}
              stroke="#e2e8f0" strokeWidth={1}
            />
            <SvgText
              x={-6} y={yScale(tick) + 4}
              fontSize={10} fill="#94a3b8" textAnchor="end"
            >
              {tick}
            </SvgText>
          </G>
        ))}

        {/* X baseline */}
        <Line x1={0} y1={innerH} x2={innerW} y2={innerH} stroke="#cbd5e1" strokeWidth={1} />

        {/* Bars + X labels */}
        {data.map((d) => {
          const bx = xScale(d[xKey]);
          const bw = xScale.bandwidth();
          const bh = innerH - yScale(d[yKey]);
          const label = String(d[xKey]);
          // Shorten month labels: "2025-03" → "Mar"
          const display = label.length === 7
            ? new Date(label + "-01").toLocaleString("default", { month: "short" })
            : label.length > 8 ? label.slice(0, 8) + "…" : label;

          return (
            <G key={label}>
              <Rect
                x={bx} y={yScale(d[yKey])}
                width={bw} height={bh}
                fill={color} rx={3}
              />
              <SvgText
                x={bx + bw / 2} y={innerH + 14}
                fontSize={9} fill="#64748b" textAnchor="middle"
              >
                {display}
              </SvgText>
            </G>
          );
        })}
      </G>
    </Svg>
  );
}

// ── Main screen ─────────────────────────────────────────────────────────────
export default function StatsScreen({ navigation }) {
  const { colors } = useTheme();
  const { width: screenWidth } = useWindowDimensions();
  const chartWidth = screenWidth - SPACING.md * 2;
  const styles = makeStyles(colors);

  const [postsData, setPostsData] = useState([]);
  const [groupsData, setGroupsData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    setLoading(true); setError("");
    try {
      const [posts, groups] = await Promise.all([
        apiFetch("/api/stats/posts-per-month"),
        apiFetch("/api/stats/members-per-group"),
      ]);
      setPostsData(posts);
      setGroupsData(groups);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  return (
    <View style={styles.screen}>
      <ScreenHeader title="Statistics" />

      <ScrollView contentContainerStyle={styles.content} style={{ flex: 1 }}>
        {error ? (
          <Text style={styles.error}>{error}</Text>
        ) : loading ? (
          <ActivityIndicator color={BAR_COLOR} style={{ marginTop: 60 }} />
        ) : (
          <>
            {/* Refresh */}
            <TouchableOpacity style={styles.refreshBtn} onPress={load}>
              <Text style={styles.refreshText}>Refresh</Text>
            </TouchableOpacity>

            {/* Chart 1 — Posts per month */}
            <View style={styles.card}>
              <Text style={styles.chartTitle}>Posts per Month</Text>
              <Text style={styles.chartSub}>Total posts published each month</Text>
              {postsData.length === 0 ? (
                <Text style={styles.empty}>No post data yet.</Text>
              ) : (
                <BarChart
                  data={postsData}
                  xKey="month"
                  yKey="count"
                  color={BAR_COLOR}
                  width={chartWidth}
                />
              )}
            </View>

            {/* Chart 2 — Members per group */}
            <View style={styles.card}>
              <Text style={styles.chartTitle}>Members per Group</Text>
              <Text style={styles.chartSub}>Number of members in each group</Text>
              {groupsData.length === 0 ? (
                <Text style={styles.empty}>No group data yet.</Text>
              ) : (
                <BarChart
                  data={groupsData}
                  xKey="name"
                  yKey="memberCount"
                  color={BAR_COLOR_2}
                  width={chartWidth}
                />
              )}
            </View>
          </>
        )}
      </ScrollView>
      <BottomTabBar active="Stats" navigation={navigation} />
    </View>
  );
}

function makeStyles(colors) {
  return StyleSheet.create({
    screen: { flex: 1, backgroundColor: colors.bg },
    content: { padding: SPACING.md, paddingBottom: 40 },
    error: { color: "#b91c1c", fontSize: 14, marginTop: 20, textAlign: "center" },
    refreshBtn: { alignSelf: "flex-end", marginBottom: SPACING.md },
    refreshText: { color: BAR_COLOR, fontWeight: "600", fontSize: 13 },
    card: {
      backgroundColor: colors.card, borderRadius: 12, padding: SPACING.md,
      marginBottom: SPACING.lg,
      shadowColor: "#000", shadowOpacity: 0.06, shadowRadius: 8,
      shadowOffset: { width: 0, height: 2 }, elevation: 2,
    },
    chartTitle: { fontSize: 16, fontWeight: "700", color: colors.text, marginBottom: 2 },
    chartSub: { fontSize: 12, color: colors.muted, marginBottom: HEADER_PADDING_BOTTOM },
    empty: { color: colors.muted, fontSize: 13, textAlign: "center", paddingVertical: 20 },
  });
}
