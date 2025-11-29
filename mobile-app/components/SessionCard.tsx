import React from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
} from "react-native";
import { Colors } from "@/constants/theme";

interface Session {
  id: string;
  mode_name: string;
  websites: string[];
  started_at: string;
}

interface SessionCardProps {
  session: Session;
  onStop: (sessionId: string) => Promise<void>;
  isLoading?: boolean;
  isScanning?: boolean;
  isDarkMode?: boolean;
}

export default function SessionCard({
  session,
  onStop,
  isLoading,
  isScanning,
  isDarkMode = false,
}: SessionCardProps) {
  const colors = isDarkMode ? Colors.dark : Colors.light;

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString();
  };

  return (
    <View
      style={[
        styles.card,
        {
          backgroundColor: colors.cardBg,
          borderColor: colors.border,
        },
      ]}
    >
      {/* Header */}
      <View style={styles.header}>
        <Text style={[styles.modeName, { color: colors.text }]}>
          {session.mode_name}
        </Text>
        <View style={[styles.badge, { borderColor: colors.text }]}>
          <Text style={[styles.badgeText, { color: colors.text }]}>ACTIVE</Text>
        </View>
      </View>

      {/* Info */}
      <View style={styles.info}>
        <Text style={[styles.infoLabel, { color: colors.textMuted }]}>
          Blocking {session.websites.length} website
          {session.websites.length !== 1 ? "s" : ""}
        </Text>
        <Text style={[styles.infoLabel, { color: colors.textMuted }]}>
          Started: {formatDate(session.started_at)}
        </Text>
      </View>

      {/* NFC Scanning Indicator */}
      {isScanning && (
        <View style={styles.scanningContainer}>
          <ActivityIndicator color={colors.text} size="small" />
          <Text style={[styles.scanningText, { color: colors.text }]}>
            Hold phone near your Anchor device...
          </Text>
        </View>
      )}

      {/* Stop Button */}
      <TouchableOpacity
        style={[
          styles.stopButton,
          {
            backgroundColor: colors.text,
          },
          (isLoading || isScanning) && styles.stopButtonDisabled,
        ]}
        onPress={() => onStop(session.id)}
        disabled={isLoading || isScanning}
      >
        {isLoading ? (
          <ActivityIndicator color={colors.background} />
        ) : (
          <Text style={[styles.stopButtonText, { color: colors.background }]}>
            {isScanning ? "Scanning for NFC..." : "Deactivate Session"}
          </Text>
        )}
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 12,
    borderWidth: 1,
    padding: 24,
    marginBottom: 16,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  modeName: {
    fontSize: 20,
    fontWeight: "700",
    flex: 1,
  },
  badge: {
    borderWidth: 1,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 4,
  },
  badgeText: {
    fontSize: 10,
    fontWeight: "600",
    letterSpacing: 1,
  },
  info: {
    marginBottom: 20,
  },
  infoLabel: {
    fontSize: 14,
    marginBottom: 6,
  },
  stopButton: {
    borderRadius: 8,
    padding: 16,
    alignItems: "center",
  },
  stopButtonDisabled: {
    opacity: 0.6,
  },
  stopButtonText: {
    fontSize: 16,
    fontWeight: "600",
  },
  scanningContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16,
    padding: 12,
    borderRadius: 8,
    backgroundColor: "rgba(128, 128, 128, 0.1)",
  },
  scanningText: {
    marginLeft: 10,
    fontSize: 14,
    fontWeight: "500",
  },
});
