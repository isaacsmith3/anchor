import React from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
} from "react-native";

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
  isDarkMode?: boolean;
}

export default function SessionCard({
  session,
  onStop,
  isLoading,
  isDarkMode = false,
}: SessionCardProps) {
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString();
  };

  return (
    <View style={[styles.card, isDarkMode && styles.cardDark]}>
      <View style={styles.header}>
        <Text style={[styles.modeName, isDarkMode && styles.modeNameDark]}>
          {session.mode_name}
        </Text>
        <View style={styles.badge}>
          <Text style={styles.badgeText}>ACTIVE</Text>
        </View>
      </View>

      <View style={styles.info}>
        <Text style={[styles.infoLabel, isDarkMode && styles.infoLabelDark]}>
          Blocking {session.websites.length} website
          {session.websites.length !== 1 ? "s" : ""}
        </Text>
        <Text style={[styles.infoLabel, isDarkMode && styles.infoLabelDark]}>
          Started: {formatDate(session.started_at)}
        </Text>
      </View>

      <TouchableOpacity
        style={[styles.stopButton, isLoading && styles.stopButtonDisabled]}
        onPress={() => onStop(session.id)}
        disabled={isLoading}
      >
        {isLoading ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.stopButtonText}>Stop Session</Text>
        )}
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 20,
    marginBottom: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  cardDark: {
    backgroundColor: "#1a1a1a",
    shadowOpacity: 0.3,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  modeName: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#000",
    flex: 1,
  },
  modeNameDark: {
    color: "#ffffff",
  },
  badge: {
    backgroundColor: "#10b981",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  badgeText: {
    color: "#fff",
    fontSize: 10,
    fontWeight: "600",
    letterSpacing: 0.5,
  },
  info: {
    marginBottom: 16,
  },
  infoLabel: {
    fontSize: 14,
    color: "#666",
    marginBottom: 4,
  },
  infoLabelDark: {
    color: "#9ca3af",
  },
  stopButton: {
    backgroundColor: "#ef4444",
    borderRadius: 8,
    padding: 14,
    alignItems: "center",
  },
  stopButtonDisabled: {
    opacity: 0.6,
  },
  stopButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
});
