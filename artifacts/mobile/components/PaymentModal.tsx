import { Feather } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import React, { useState } from "react";
import {
  Alert,
  Image,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useColors } from "@/hooks/useColors";

interface Props {
  visible: boolean;
  onClose: () => void;
  onConfirm: (upiId: string, screenshot: string) => Promise<void>;
  amount: number;
  tournamentTitle: string;
}

const UPI_ID = "fftournament@upi";
const UPI_NAME = "FF Tournament";

export function PaymentModal({ visible, onClose, onConfirm, amount, tournamentTitle }: Props) {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const [upiId, setUpiId] = useState("");
  const [screenshot, setScreenshot] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState<"info" | "upload">("info");

  function reset() {
    setUpiId("");
    setScreenshot(null);
    setLoading(false);
    setStep("info");
  }

  function handleClose() {
    reset();
    onClose();
  }

  async function pickScreenshot() {
    if (Platform.OS === "web") {
      Alert.alert("Info", "Please upload from your device. On web, use the file picker.");
    }
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== "granted") {
      Alert.alert("Permission Required", "Please allow access to your photo library.");
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      quality: 0.7,
      base64: false,
    });
    if (!result.canceled && result.assets[0]) {
      setScreenshot(result.assets[0].uri);
    }
  }

  async function handleConfirm() {
    if (!screenshot) {
      Alert.alert("Required", "Please upload your payment screenshot.");
      return;
    }
    if (!upiId.trim()) {
      Alert.alert("Required", "Please enter your UPI ID or transaction ID.");
      return;
    }
    setLoading(true);
    try {
      await onConfirm(upiId.trim(), screenshot);
      reset();
    } catch (e: any) {
      Alert.alert("Error", e.message || "Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={handleClose}>
      <View style={[styles.container, { backgroundColor: colors.background, paddingBottom: insets.bottom + 20 }]}>
        <View style={[styles.handle, { backgroundColor: colors.border }]} />

        <View style={styles.headerRow}>
          <Text style={[styles.title, { color: colors.foreground }]}>
            {step === "info" ? "Payment Details" : "Upload Screenshot"}
          </Text>
          <TouchableOpacity onPress={handleClose} style={[styles.closeBtn, { backgroundColor: colors.card }]}>
            <Feather name="x" size={18} color={colors.foreground} />
          </TouchableOpacity>
        </View>

        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
          {step === "info" ? (
            <>
              <View style={[styles.amountCard, { backgroundColor: colors.card, borderColor: colors.primary + "44" }]}>
                <Text style={[styles.amountLabel, { color: colors.mutedForeground }]}>Entry Fee</Text>
                <Text style={[styles.amount, { color: colors.primary }]}>₹{amount}</Text>
                <Text style={[styles.tournamentName, { color: colors.mutedForeground }]}>{tournamentTitle}</Text>
              </View>

              <View style={[styles.upiBox, { backgroundColor: colors.card, borderColor: colors.border }]}>
                <Text style={[styles.upiLabel, { color: colors.mutedForeground }]}>Pay to UPI</Text>
                <View style={styles.upiRow}>
                  <Text style={[styles.upiValue, { color: colors.foreground }]}>{UPI_ID}</Text>
                  <TouchableOpacity
                    onPress={() => {
                      Alert.alert("Copied!", `UPI ID: ${UPI_ID}`);
                    }}
                    style={[styles.copyBtn, { backgroundColor: colors.primary + "22" }]}
                  >
                    <Feather name="copy" size={14} color={colors.primary} />
                  </TouchableOpacity>
                </View>
                <Text style={[styles.upiName, { color: colors.mutedForeground }]}>Name: {UPI_NAME}</Text>
              </View>

              <View style={[styles.steps, { backgroundColor: colors.card, borderColor: colors.border }]}>
                <Text style={[styles.stepsTitle, { color: colors.foreground }]}>How to Pay</Text>
                {[
                  "Open any UPI app (GPay, PhonePe, Paytm)",
                  `Send ₹${amount} to ${UPI_ID}`,
                  "Take screenshot of payment confirmation",
                  "Come back and upload the screenshot",
                ].map((step, i) => (
                  <View key={i} style={styles.stepRow}>
                    <View style={[styles.stepNum, { backgroundColor: colors.primary }]}>
                      <Text style={[styles.stepNumText, { color: colors.foreground }]}>{i + 1}</Text>
                    </View>
                    <Text style={[styles.stepText, { color: colors.mutedForeground }]}>{step}</Text>
                  </View>
                ))}
              </View>

              <TouchableOpacity
                style={[styles.nextBtn, { backgroundColor: colors.primary }]}
                onPress={() => setStep("upload")}
                activeOpacity={0.8}
              >
                <Text style={[styles.nextBtnText, { color: colors.primaryForeground }]}>
                  I've Paid — Upload Screenshot
                </Text>
                <Feather name="arrow-right" size={18} color={colors.primaryForeground} />
              </TouchableOpacity>
            </>
          ) : (
            <>
              <TouchableOpacity
                style={[
                  styles.screenshotPicker,
                  { backgroundColor: colors.card, borderColor: screenshot ? colors.success : colors.border },
                ]}
                onPress={pickScreenshot}
                activeOpacity={0.8}
              >
                {screenshot ? (
                  <Image source={{ uri: screenshot }} style={styles.screenshotPreview} resizeMode="contain" />
                ) : (
                  <View style={styles.screenshotPlaceholder}>
                    <Feather name="upload" size={32} color={colors.mutedForeground} />
                    <Text style={[styles.screenshotHint, { color: colors.mutedForeground }]}>
                      Tap to upload payment screenshot
                    </Text>
                    <Text style={[styles.screenshotSub, { color: colors.mutedForeground }]}>
                      JPG, PNG accepted
                    </Text>
                  </View>
                )}
              </TouchableOpacity>

              {screenshot && (
                <TouchableOpacity
                  style={[styles.changeBtn, { borderColor: colors.border }]}
                  onPress={pickScreenshot}
                >
                  <Text style={[styles.changeBtnText, { color: colors.mutedForeground }]}>Change Screenshot</Text>
                </TouchableOpacity>
              )}

              <Text style={[styles.inputLabel, { color: colors.mutedForeground }]}>Your UPI / Transaction ID</Text>
              <TextInput
                style={[styles.input, { backgroundColor: colors.card, borderColor: colors.border, color: colors.foreground }]}
                placeholder="e.g. 9876543210 or TXN123456"
                placeholderTextColor={colors.mutedForeground}
                value={upiId}
                onChangeText={setUpiId}
                autoCapitalize="none"
              />

              <View style={styles.btnRow}>
                <TouchableOpacity
                  style={[styles.backBtn, { borderColor: colors.border }]}
                  onPress={() => setStep("info")}
                >
                  <Feather name="arrow-left" size={16} color={colors.foreground} />
                  <Text style={[styles.backBtnText, { color: colors.foreground }]}>Back</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[
                    styles.confirmBtn,
                    { backgroundColor: loading ? colors.mutedForeground : colors.success, flex: 1 },
                  ]}
                  onPress={handleConfirm}
                  disabled={loading}
                  activeOpacity={0.8}
                >
                  <Feather name="check-circle" size={16} color={colors.foreground} />
                  <Text style={[styles.confirmText, { color: colors.foreground }]}>
                    {loading ? "Submitting..." : "Confirm & Join"}
                  </Text>
                </TouchableOpacity>
              </View>
            </>
          )}
        </ScrollView>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, paddingTop: 12 },
  handle: { width: 40, height: 4, borderRadius: 2, alignSelf: "center", marginBottom: 16 },
  headerRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 20, marginBottom: 16 },
  title: { fontSize: 20, fontWeight: "700" },
  closeBtn: { width: 36, height: 36, borderRadius: 18, alignItems: "center", justifyContent: "center" },
  content: { paddingHorizontal: 20, gap: 14, paddingBottom: 20 },
  amountCard: { borderRadius: 14, borderWidth: 1, padding: 20, alignItems: "center" },
  amountLabel: { fontSize: 12, marginBottom: 4 },
  amount: { fontSize: 40, fontWeight: "800" },
  tournamentName: { fontSize: 13, marginTop: 4 },
  upiBox: { borderRadius: 12, borderWidth: 1, padding: 16 },
  upiLabel: { fontSize: 11, marginBottom: 6 },
  upiRow: { flexDirection: "row", alignItems: "center", gap: 10 },
  upiValue: { fontSize: 16, fontWeight: "700", flex: 1 },
  copyBtn: { padding: 8, borderRadius: 8 },
  upiName: { fontSize: 12, marginTop: 6 },
  steps: { borderRadius: 12, borderWidth: 1, padding: 16, gap: 12 },
  stepsTitle: { fontSize: 14, fontWeight: "700", marginBottom: 4 },
  stepRow: { flexDirection: "row", alignItems: "flex-start", gap: 10 },
  stepNum: { width: 22, height: 22, borderRadius: 11, alignItems: "center", justifyContent: "center" },
  stepNumText: { fontSize: 11, fontWeight: "700" },
  stepText: { fontSize: 13, flex: 1, lineHeight: 18 },
  nextBtn: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, padding: 16, borderRadius: 14 },
  nextBtnText: { fontSize: 16, fontWeight: "700" },
  screenshotPicker: { borderRadius: 14, borderWidth: 2, borderStyle: "dashed", overflow: "hidden", minHeight: 180, alignItems: "center", justifyContent: "center" },
  screenshotPlaceholder: { alignItems: "center", gap: 8, padding: 30 },
  screenshotPreview: { width: "100%", height: 220 },
  screenshotHint: { fontSize: 14, fontWeight: "600" },
  screenshotSub: { fontSize: 12 },
  changeBtn: { borderWidth: 1, borderRadius: 10, padding: 10, alignItems: "center" },
  changeBtnText: { fontSize: 13 },
  inputLabel: { fontSize: 12, marginBottom: 4 },
  input: { borderWidth: 1, borderRadius: 10, padding: 14, fontSize: 15 },
  btnRow: { flexDirection: "row", gap: 10, marginTop: 4 },
  backBtn: { flexDirection: "row", alignItems: "center", gap: 6, borderWidth: 1, borderRadius: 12, paddingHorizontal: 16, paddingVertical: 14 },
  backBtnText: { fontSize: 14, fontWeight: "600" },
  confirmBtn: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, borderRadius: 12, paddingVertical: 14 },
  confirmText: { fontSize: 15, fontWeight: "700" },
});
