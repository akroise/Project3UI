// src/screens/ReceiptsScreen.js
import React, { useState, useEffect, useCallback, useRef } from "react";
import {
  View,
  StyleSheet,
  SectionList,
  ActivityIndicator,
  Animated,
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
  Portal,
  Dialog,
  Paragraph,
  IconButton,
} from "react-native-paper";
import MonthlySummaryGraph from "../components/MonthlySummaryGraph";
import { format } from "date-fns";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import Toast from "react-native-toast-message";
import {
  getExpenseSummary,
  getExpenseFeed,
  deleteExpense,
  toggleTakeBack,
} from "../api/expenseApi"; // make sure deleteExpense & toggleTakeBack exist
import { useAuth } from "../context/AuthContext";

export default function ReceiptsScreen() {
  const theme = useTheme();
  const { auth, authloading, error, login, logout } = useAuth();

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

  // -------------------------
  // API calls
  // -------------------------
  // ✅ Fetch summary (independent of list)
  const fetchSummary = async () => {
    try {
      const res = await getExpenseSummary(selectedFilter.value);
      if (res.status === "success") {
        setSummary(res.data.totalExpense || 0);
      } else {
        // handle non-success shape
        Toast.show({ type: "error", text1: res.message || "Failed to fetch summary" });
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
      const res = await getExpenseFeed(pageNo, 10, month);
      if (res.status === "success") {
        const { expenses } = res.data;

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
    setPage(1);
  }, [activeMonth, selectedFilter]);

  // 🔹 Refresh data when returning to this screen (after adding expense)
  useEffect(() => {
    if (isFocused) {
      fetchSummary();
      fetchExpenses(1, activeMonth);
      setPage(1);
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

  // -------------------------
  // Item-level component with animation + menu actions
  // -------------------------
  function ExpenseItem({ item, onDeleted, onTakeBackToggled }) {
    const [menuVisibleLocal, setMenuVisibleLocal] = useState(false);
    const [confirmVisible, setConfirmVisible] = useState(false);
    const [loadingAction, setLoadingAction] = useState(false);
    const anim = useRef(new Animated.Value(1)).current; // local animated value

    const openMenu = () => setMenuVisibleLocal(true);
    const closeMenu = () => setMenuVisibleLocal(false);

    const confirmDelete = () => {
      setConfirmVisible(true);
      closeMenu();
    };
    const cancelDelete = () => setConfirmVisible(false);

    // delete with shrink animation -> backend -> remove from UI
    const handleDelete = async () => {
      setLoadingAction(true);
      // shrink first
      Animated.timing(anim, {
        toValue: 0,
        duration: 280,
        useNativeDriver: false,
      }).start(async () => {
        try {
          const userId = auth.user_id || auth.user_id || null;
          const res = await deleteExpense({ userId, expenseId: item.id });
          const ok = res?.status === "success" || res?.success === true;
          if (ok) {
            onDeleted(item);
            Toast.show({ type: "success", text1: "Expense deleted" });
          } else {
            // animate back in on failure
            Animated.timing(anim, {
              toValue: 1,
              duration: 180,
              useNativeDriver: false,
            }).start(); 
            Toast.show({ type: "error", text1: res?.message || "Delete failed" });
          }
        } catch (err) {
          console.error("Delete expense error:", err);
          Animated.timing(anim, {
            toValue: 1,
            duration: 180,
            useNativeDriver: false,
          }).start();
          Toast.show({ type: "error", text1: "Failed to delete expense" });
        } finally {
          setLoadingAction(false);
          setConfirmVisible(false);
          closeMenu();
        }
      });
    };

    const handleToggleTakeBack = async () => {
      setLoadingAction(true);
      try {
        const userId = auth.user_id || auth.user_id || null;
        const newVal = !item.is_take_back;
        const res = await toggleTakeBack({
          userId,
          expenseId: item.id,
          takeBack: newVal,
        });
        const ok = res?.status === "success" || res?.success === true;
        if (ok) {
          onTakeBackToggled(item, newVal);
          Toast.show({
            type: "success",
            text1: newVal ? "Take-back enabled" : "Take-back disabled",
          });
        } else {
          Toast.show({ type: "error", text1: res?.message || "Operation failed" });
        }
      } catch (err) {
        console.error("Toggle takeback error:", err);
        Toast.show({ type: "error", text1: "Unable to update take-back" });
      } finally {
        setLoadingAction(false);
        closeMenu();
      }
    };

    const animatedStyle = {
      opacity: anim,
      transform: [
        {
          scale: anim.interpolate({
            inputRange: [0, 1],
            outputRange: [0.92, 1],
          }),
        },
      ],
    };

    return (
      <Animated.View style={[animatedStyle]}>
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
              <Text style={styles.time}>
                {format(new Date(item.dateTime), "dd MMM • hh:mm a")}
              </Text>

              {item.is_take_back ? (
                <Text style={{ color: theme.colors.primary, marginTop: 6, fontSize: 13 }}>
                  Take back enabled
                </Text>
              ) : null}
            </View>

            <View style={{ alignItems: "flex-end", justifyContent: "center" }}>
              <Text style={styles.amount}>₹{item.amount?.toLocaleString()}</Text>

              <Menu
                visible={menuVisibleLocal}
                onDismiss={closeMenu}
                anchor={
                  // <IconButton
                  //   icon="dots-vertical"
                  //   onPress={openMenu}
                  //   size={20}
                  //   style={{ marginLeft: 6 }}
                  // />
                  <Button mode="text" onPress={openMenu} compact> ⋯ </Button>
                }
              >
                <Menu.Item
                  onPress={confirmDelete}
                  title="Delete"
                  leadingIcon={() => (
                    <MaterialCommunityIcons name="delete-outline" size={20} color="#b00020" />
                  )}
                />

                <Menu.Item
                  onPress={handleToggleTakeBack}
                  title={item.is_take_back ? "Undo Take Back" : "Take Back"}
                  leadingIcon={() => (
                    <MaterialCommunityIcons
                      name={item.is_take_back ? "backup-restore" : "hand-coin-outline"}
                      size={20}
                      color={theme.colors.primary}
                    />
                  )}
                />

                {item.is_take_back && (
                  <>
                    <Menu.Item
                      title={`Amount taken: ₹${item.amount?.toLocaleString()}`}
                      leadingIcon={() => (
                        <MaterialCommunityIcons name="cash-multiple" size={18} color="#777" />
                      )}
                    />

                    <Menu.Item
                      onPress={() => {
                        Toast.show({ type: "info", text1: "Feature: mark amount taken" });
                        closeMenu();
                      }}
                      title="Mark Amount Taken"
                      leadingIcon={() => (
                        <MaterialCommunityIcons
                          name="checkbox-marked-circle-outline"
                          size={18}
                          color="#2B8761"
                        />
                      )}
                    />
                  </>
                )}
              </Menu>
            </View>
          </View>

          {/* Confirm delete dialog (local to this item) */}
          <Portal>
            <Dialog visible={confirmVisible} onDismiss={cancelDelete}>
              <Dialog.Title>Confirm Delete</Dialog.Title>
              <Dialog.Content>
                <Paragraph>Are you sure you want to delete this expense?</Paragraph>
              </Dialog.Content>
              <Dialog.Actions>
                <Button onPress={cancelDelete}>Back</Button>
                <Button onPress={handleDelete} loading={loadingAction}>
                  Confirm
                </Button>
              </Dialog.Actions>
            </Dialog>
          </Portal>
        </Card>
      </Animated.View>
    );
  }

  // callbacks to update sections when items change
  const onExpenseDeleted = useCallback((deletedItem) => {
    setSections((prev) =>
      prev
        .map((section) => ({
          ...section,
          data: section.data.filter((d) => d.id !== deletedItem.id),
        }))
        .filter((s) => s.data.length > 0)
    );
  }, []);

  const onExpenseTakeBackToggled = useCallback((toggledItem, val) => {
    setSections((prev) =>
      prev.map((section) => ({
        ...section,
        data: section.data.map((d) => (d.id === toggledItem.id ? { ...d, is_take_back: val } : d)),
      }))
    );
  }, []);

  return (
    <SafeAreaView style={styles.container}>
      {/* HEADER SECTION */}
      <View style={styles.header}>
        <View>
          <Text style={styles.totalLabel}>Total Expense</Text>
          <Text style={styles.totalValue}>₹{(summary || 0).toLocaleString()}</Text>
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
                // small delay prevents stuck menu issues on some devices
                setTimeout(() => {
                  setSelectedFilter(f);
                  setPage(1);
                  fetchSummary(); // re-fetch header total
                  fetchExpenses(1, activeMonth);
                }, 150);
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
          fetchExpenses(1, newMonth); // Re-fetch expenses for the selected month
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
        renderItem={({ item }) => (
          <ExpenseItem
            item={item}
            onDeleted={onExpenseDeleted}
            onTakeBackToggled={onExpenseTakeBackToggled}
          />
        )}
        renderSectionHeader={({ section: { title } }) => (
          <Text style={styles.sectionHeader}>{title}</Text>
        )}
        keyExtractor={(item) => String(item.id)}
        contentContainerStyle={{ paddingHorizontal: 12, paddingBottom: 100 }}
        onEndReached={loadMore}
        onEndReachedThreshold={0.3}
        ListFooterComponent={loading ? <ActivityIndicator style={{ marginVertical: 20 }} /> : null}
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
