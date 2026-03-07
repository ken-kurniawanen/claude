import { StatusBar } from "expo-status-bar";
import { useState, useCallback } from "react";
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  SafeAreaView,
  Platform,
} from "react-native";

const BUTTONS = [
  ["AC", "+/-", "%", "÷"],
  ["7", "8", "9", "×"],
  ["4", "5", "6", "−"],
  ["1", "2", "3", "+"],
  ["0", ".", "="],
];

const OPERATORS = ["÷", "×", "−", "+"];
const OPERATOR_MAP = { "÷": "/", "×": "*", "−": "-", "+": "+" };

export default function App() {
  const [display, setDisplay] = useState("0");
  const [expression, setExpression] = useState("");
  const [operator, setOperator] = useState(null);
  const [prevValue, setPrevValue] = useState(null);
  const [waitingForOperand, setWaitingForOperand] = useState(false);
  const [hasResult, setHasResult] = useState(false);

  const formatNumber = (num) => {
    const str = String(num);
    if (str.length > 9) {
      const parsed = parseFloat(num);
      if (Math.abs(parsed) >= 1e9 || (Math.abs(parsed) < 1e-4 && parsed !== 0)) {
        return parsed.toExponential(3);
      }
      return parseFloat(parsed.toPrecision(9)).toString();
    }
    return str;
  };

  const handleDigit = useCallback(
    (digit) => {
      if (waitingForOperand) {
        setDisplay(digit === "." ? "0." : digit);
        setWaitingForOperand(false);
        setHasResult(false);
        return;
      }

      if (hasResult) {
        setDisplay(digit === "." ? "0." : digit);
        setExpression("");
        setPrevValue(null);
        setOperator(null);
        setHasResult(false);
        return;
      }

      if (digit === "." && display.includes(".")) return;

      const newDisplay =
        display === "0" && digit !== "."
          ? digit
          : display.length < 9
          ? display + digit
          : display;

      setDisplay(newDisplay);
    },
    [display, waitingForOperand, hasResult]
  );

  const handleOperator = useCallback(
    (op) => {
      const current = parseFloat(display);

      if (prevValue !== null && !waitingForOperand) {
        const result = calculate(prevValue, current, operator);
        const formatted = formatNumber(result);
        setDisplay(formatted);
        setPrevValue(result);
        setExpression(`${formatted} ${op}`);
      } else {
        setPrevValue(current);
        setExpression(`${formatNumber(current)} ${op}`);
      }

      setOperator(op);
      setWaitingForOperand(true);
      setHasResult(false);
    },
    [display, prevValue, operator, waitingForOperand]
  );

  const calculate = (a, b, op) => {
    switch (op) {
      case "÷":
        return b === 0 ? "Error" : a / b;
      case "×":
        return a * b;
      case "−":
        return a - b;
      case "+":
        return a + b;
      default:
        return b;
    }
  };

  const handleEquals = useCallback(() => {
    if (prevValue === null || waitingForOperand) return;

    const current = parseFloat(display);
    const result = calculate(prevValue, current, operator);

    if (result === "Error") {
      setDisplay("Error");
      setExpression("");
      setPrevValue(null);
      setOperator(null);
      setWaitingForOperand(false);
      setHasResult(true);
      return;
    }

    const formatted = formatNumber(result);
    setDisplay(formatted);
    setExpression("");
    setPrevValue(null);
    setOperator(null);
    setWaitingForOperand(false);
    setHasResult(true);
  }, [display, prevValue, operator, waitingForOperand]);

  const handleSpecial = useCallback(
    (btn) => {
      if (btn === "AC") {
        setDisplay("0");
        setExpression("");
        setOperator(null);
        setPrevValue(null);
        setWaitingForOperand(false);
        setHasResult(false);
        return;
      }

      if (btn === "+/-") {
        const num = parseFloat(display);
        setDisplay(formatNumber(-num));
        return;
      }

      if (btn === "%") {
        const num = parseFloat(display);
        setDisplay(formatNumber(num / 100));
        return;
      }
    },
    [display]
  );

  const handlePress = useCallback(
    (btn) => {
      if (["AC", "+/-", "%"].includes(btn)) {
        handleSpecial(btn);
      } else if (OPERATORS.includes(btn)) {
        handleOperator(btn);
      } else if (btn === "=") {
        handleEquals();
      } else {
        handleDigit(btn);
      }
    },
    [handleSpecial, handleOperator, handleEquals, handleDigit]
  );

  const getButtonStyle = (btn) => {
    if (OPERATORS.includes(btn)) {
      return operator === btn && waitingForOperand
        ? styles.operatorActiveBtn
        : styles.operatorBtn;
    }
    if (["AC", "+/-", "%"].includes(btn)) return styles.topBtn;
    if (btn === "0") return styles.zeroBtn;
    return styles.numberBtn;
  };

  const getTextStyle = (btn) => {
    if (OPERATORS.includes(btn)) {
      return operator === btn && waitingForOperand
        ? styles.operatorActiveBtnText
        : styles.operatorBtnText;
    }
    if (["AC", "+/-", "%"].includes(btn)) return styles.topBtnText;
    return styles.numberBtnText;
  };

  const displayFontSize = display.length > 7 ? 42 : display.length > 5 ? 56 : 72;

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="light" />

      <View style={styles.displayArea}>
        {expression ? (
          <Text style={styles.expressionText}>{expression}</Text>
        ) : null}
        <Text style={[styles.displayText, { fontSize: displayFontSize }]} numberOfLines={1} adjustsFontSizeToFit>
          {display}
        </Text>
      </View>

      <View style={styles.buttonArea}>
        {BUTTONS.map((row, rowIdx) => (
          <View key={rowIdx} style={styles.row}>
            {row.map((btn) => (
              <TouchableOpacity
                key={btn}
                style={[styles.button, getButtonStyle(btn)]}
                onPress={() => handlePress(btn)}
                activeOpacity={0.7}
              >
                <Text style={[styles.btnText, getTextStyle(btn)]}>{btn}</Text>
              </TouchableOpacity>
            ))}
          </View>
        ))}
      </View>
    </SafeAreaView>
  );
}

const BTN_SIZE = 80;
const BTN_GAP = 12;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#1a1a2e",
    justifyContent: "flex-end",
  },
  displayArea: {
    flex: 1,
    justifyContent: "flex-end",
    alignItems: "flex-end",
    paddingHorizontal: 24,
    paddingBottom: 20,
  },
  expressionText: {
    color: "#6c6c8a",
    fontSize: 22,
    marginBottom: 4,
    fontWeight: "300",
  },
  displayText: {
    color: "#ffffff",
    fontWeight: "200",
    letterSpacing: -2,
  },
  buttonArea: {
    paddingHorizontal: BTN_GAP,
    paddingBottom: Platform.OS === "ios" ? 0 : 20,
    gap: BTN_GAP,
  },
  row: {
    flexDirection: "row",
    gap: BTN_GAP,
  },
  button: {
    width: BTN_SIZE,
    height: BTN_SIZE,
    borderRadius: BTN_SIZE / 2,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 6,
  },
  numberBtn: {
    backgroundColor: "#2d2d44",
  },
  topBtn: {
    backgroundColor: "#3d3d5c",
  },
  operatorBtn: {
    backgroundColor: "#6c63ff",
  },
  operatorActiveBtn: {
    backgroundColor: "#ffffff",
  },
  zeroBtn: {
    width: BTN_SIZE * 2 + BTN_GAP,
    borderRadius: BTN_SIZE / 2,
    backgroundColor: "#2d2d44",
    paddingLeft: BTN_SIZE / 2 - 10,
    alignItems: "flex-start",
  },
  btnText: {
    fontSize: 28,
    fontWeight: "400",
  },
  numberBtnText: {
    color: "#ffffff",
  },
  topBtnText: {
    color: "#c8c8ff",
  },
  operatorBtnText: {
    color: "#ffffff",
  },
  operatorActiveBtnText: {
    color: "#6c63ff",
  },
});
