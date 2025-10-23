import React, { useState, useEffect } from "react";
import {
  View,
  StyleSheet,
  SectionList,
  ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useIsFocused } from "@react-navigation/native";
import {
  Text,
  Menu,
  Button,
  Card,
  Avatar,
  useTheme,
  Portal
} from "react-native-paper";
import MonthlySummaryGraph from "../components/MonthlySummaryGraph";
import { format } from "date-fns";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { getExpenseSummary, getExpenseFeed } from "../api/expenseApi";

export default function ReceiptsScreen() {
  const theme = useTheme();

  // 🧩 Filters
  const filters = [
    { label: "Last 1 Day", value: "last_1_day" },
    { label: "Last 3 Days", value: "last_3_days" },
    { label: "Last 7 Days", value: "last_7_days" },
    { label: "Last 14 Days", value: "last_14_days" },
    { label: "Last Month", value: "last_month" },
    { label: "Last 3 Months", value: "last_3_months" },
  ];

  const isFocused = useIsFocused();
  const [visible, setVisible] = useState(false);
  const [selectedFilter, setSelectedFilter] = useState(filters[2]);
  const [summary, setSummary] = useState(0);
  const [sections, setSections] = useState([]);
  const [page, setPage] = useState(1);
  const [monthSummary, setMonthSummary] = useState({});
  const [loading, setLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeMonth, setActiveMonth] = useState(
    new Date().toLocaleString("en-US", { month: "short" }) // e.g., "Oct"
  );

  // ✅ Fetch summary (independent of list)
  const fetchSummary = async () => {
    try {
      const res = await getExpenseSummary(selectedFilter.value);
      if (res.status === "success") {
        setSummary(res.data.totalExpense);
      }
    } catch (err) {
      const message =
        err.response?.data?.message ||
        err.response?.data?.error?.details ||
        "Failed to fetch summary";
      Toast.show({ type: "error", text1: message });
    }
  };

  // ✅ Fetch expenses grouped by date
  const fetchExpenses = async (pageNo = 1, month = activeMonth) => {
    setLoading(true);
    try {
      const res = await getExpenseFeed(pageNo, 10, month); // <-- added month param
      if (res.status === "success") {
        const { expenses, currency } = res.data;

        // Group by date for section list
        const grouped = expenses.reduce((acc, e) => {
          const dateKey = e.day || format(new Date(e.dateTime), "dd MMM");
          const existing = acc.find((d) => d.title === dateKey);
          if (existing) existing.data.push(e);
          else acc.push({ title: dateKey, data: [e] });
          return acc;
        }, []);

        if (pageNo === 1) setSections(grouped);
        else setSections((prev) => [...prev, ...grouped]);

        setHasMore(expenses.length > 0);
      } else {
        Toast.show({
          type: "error",
          text1: res.message || "Failed to load expenses",
        });
      }
    } catch (err) {
      console.error("Expense fetch error:", err);
      Toast.show({ type: "error", text1: "Unable to fetch expenses" });
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  // When initial load or filter change
  useEffect(() => {
    fetchSummary(); // refresh total based on filter
    fetchExpenses(1, activeMonth); // refresh list for selected month
  }, [activeMonth, selectedFilter]);

  // 🔹 Refresh data when returning to this screen (after adding expense)
  useEffect(() => {
    if (isFocused) {
      fetchSummary();
      fetchExpenses(1, activeMonth);
    }
  }, [isFocused]);

  // When scrolling / loading next page
  const loadMore = () => {
    if (!loading && hasMore) {
      const nextPage = page + 1;
      setPage(nextPage);
      fetchExpenses(nextPage, activeMonth);
    }
  };

  // ✅ Icon mapping
  const getIcon = (type) => {
    switch (type) {
      case "Cafeteria":
        return "silverware-fork-knife";
      case "Uber/Rapido":
        return "car-outline";
      case "Flat":
        return "home-outline";
      case "Self":
        return "account-outline";
      case "Others":
        return "wallet-outline";
      default:
        return "wallet-outline";
    }
  };

  const renderExpense = ({ item }) => {
    const dateTime = format(new Date(item.dateTime), "dd MMM • hh:mm a");
    return (
      <Card style={styles.card} mode="contained">
        <View style={styles.row}>
          <Avatar.Icon
            size={42}
            icon={() => (
              <MaterialCommunityIcons
                name={getIcon(item.expenseType)}
                size={26}
                color={theme.colors.primary}
              />
            )}
            style={[styles.avatar, { backgroundColor: theme.colors.primary + "22" }]}
          />

          <View style={styles.details}>
            <Text style={styles.title}>{item.expenseType}</Text>
            <Text style={styles.desc}>{item.description}</Text>
            <Text style={styles.time}>{dateTime}</Text>
          </View>
          <Text style={styles.amount}>₹{item.amount.toLocaleString()}</Text>
        </View>
      </Card>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* HEADER SECTION */}
      <View style={styles.header}>
        <View>
          <Text style={styles.totalLabel}>Total Expense</Text>
          <Text style={styles.totalValue}>₹{summary.toLocaleString()}</Text>
        </View>

        {/* Filter Menu */}
        <Menu
          visible={visible}
          onDismiss={() => setVisible(false)}
          anchor={
            <Button
              mode="outlined"
              textColor={theme.colors.primary}
              style={styles.filterButton}
              onPress={() => setVisible(true)}
            >
              {selectedFilter.label}
            </Button>
          }
        >
          {filters.map((f) => (
            <Menu.Item
              key={f.value}
              onPress={() => {
                setVisible(false);
                setTimeout(() => {
                  setSelectedFilter(f);
                  setPage(1);
                  fetchSummary(); // ✅ re-fetch header total
                  fetchExpenses(1, activeMonth);
                }, 150); // small delay prevents stuck menu
              }}
              title={f.label}
            />
          ))}
        </Menu>
      </View>

      {/* GRAPH SECTION */}
      <MonthlySummaryGraph
        monthSummary={monthSummary}
        activeMonth={activeMonth}
        onMonthSelect={(newMonth) => {
          setActiveMonth(newMonth);
          setPage(1);
          fetchExpenses(1, newMonth); // 🔹 Re-fetch expenses for the selected month
        }}
      />

      {/* LIST SECTION */}
      <SectionList
        sections={sections}
        refreshing={refreshing}
        onRefresh={() => {
          setRefreshing(true);
          fetchExpenses(1, activeMonth);
        }}
        renderItem={renderExpense}
        renderSectionHeader={({ section: { title } }) => (
          <Text style={styles.sectionHeader}>{title}</Text>
        )}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ paddingHorizontal: 12, paddingBottom: 100 }}
        onEndReached={loadMore}
        onEndReachedThreshold={0.3}
        ListFooterComponent={
          loading ? <ActivityIndicator style={{ marginVertical: 20 }} /> : null
        }
        showsVerticalScrollIndicator={false}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f8f9f8",
  },
  header: {
    marginHorizontal: 16,
    marginTop: 16,
    marginBottom: 10,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  totalLabel: {
    fontSize: 14,
    color: "#555",
  },
  totalValue: {
    fontSize: 26,
    fontWeight: "700",
    color: "#000",
  },
  filterButton: {
    borderColor: "#ccc",
    borderRadius: 8,
    height: 36,
  },
  sectionHeader: {
    fontWeight: "600",
    color: "#555",
    marginTop: 12,
    marginBottom: 4,
    marginLeft: 4,
  },
  card: {
    borderRadius: 12,
    padding: 10,
    marginBottom: 8,
    backgroundColor: "#fff",
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
  },
  avatar: {
    marginRight: 12,
  },
  details: {
    flex: 1,
  },
  title: {
    fontWeight: "600",
    color: "#000",
  },
  desc: {
    color: "#666",
    fontSize: 13,
  },
  time: {
    color: "#999",
    fontSize: 12,
    marginTop: 2,
  },
  amount: {
    fontWeight: "700",
    color: "#000",
  },
});

