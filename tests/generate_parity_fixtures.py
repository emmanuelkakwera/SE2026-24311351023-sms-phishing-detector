import json
import math
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
MODEL_PATH = ROOT / "assets" / "model" / "moneyguard_model.json"
OUTPUT_PATH = ROOT / "tests" / "mobile_parity_fixtures.json"

CASES = [
    ("fraud_airtel_pin_reset", "URGENT: Your Airtel Money account will be blocked today. Reply with your 4-digit PIN to verify now."),
    ("fraud_mpamba_reversal", "TNM Mpamba: You received MK 45,000 by mistake from 0888123456. Send back immediately or your line is suspended."),
    ("fraud_chichewa_agent", "Airtel Money: Mwapambana MK 150,000 pa promotion! Tumizani PIN yanu kapena imbani 0999000111 kuti mulandire."),
    ("fraud_otp_harvest", "Security Alert: Enter your Airtel Money OTP code 4829 at http://airtel-mw-verify.example.com to unlock wallet."),
    ("fraud_mpamba_prize", "Congratulations! Your TNM Mpamba number won MK 200,000. Send MK 5,000 processing fee to agent 0881223344."),
    ("fraud_chichewa_block", "Chenjezo: Akaunti yanu ya Mpamba itsekedwa lero. Tumizani nambala ya chinsinsi PIN kuti mutsegule."),
    ("normal_airtel_cashin", "Trans ID: CI261120.1105.A12345. You have received MK 15,000.00 from 0999123456 CHIKONDI BANDA. Bal: MK 28,500.00."),
    ("normal_mpamba_transfer", "Ref: MP261120.0940.B98765. Confirmed. MK 8,500.00 sent to GRACE PHIRI 0888765432. Fee MK 150.00. Bal MK 12,350.00."),
    ("normal_airtel_airtime", "You have bought MK 1,000.00 Airtel airtime for 0998112233. Trans ID: AT261120.1412.C54321. New balance: MK 9,400.00."),
    ("normal_mpamba_utility", "Payment of MK 22,000.00 to ESCOM Prepaid successful. Token: 1234-5678-9012-3456-7890. Ref: UT261120.1605.D11223."),
    ("normal_bank_alert", "Dear Customer, your salary of MK 350,000.00 has been credited to your account ending 4421 on 20-Nov-2026."),
    ("normal_personal_sms", "Moni bro, ndafika ku Lilongwe bwino. Tikumana mawa pa 10 koloko ku Town."),
]

def sigmoid(x: float) -> float:
    if x >= 0.0:
        return 1.0 / (1.0 + math.exp(-x))
    e = math.exp(x)
    return e / (1.0 + e)

def classify(model: dict, message: str) -> tuple[str, float]:
    text = message.strip()
    if model["lowercase"]:
        text = text.lower()
    pattern = re.compile(model["tokenPattern"])
    tokens = pattern.findall(text)
    counts = {}
    for size in range(model["ngramMin"], model["ngramMax"] + 1):
        if len(tokens) < size:
            continue
        for start in range(len(tokens) - size + 1):
            term = " ".join(tokens[start : start + size])
            counts[term] = counts.get(term, 0) + 1
    vocab = model["vocabulary"]
    idf = model["idf"]
    coef = model["coefficients"]
    features = [(vocab[t], c * idf[vocab[t]]) for t, c in counts.items() if t in vocab]
    norm = math.sqrt(sum(v * v for _, v in features))
    decision = float(model["intercept"])
    if norm > 0.0:
        for idx, val in features:
            decision += coef[idx] * (val / norm)
    pos_prob = sigmoid(decision)
    fraud_prob = pos_prob if model["positiveClass"] == "fraud" else 1.0 - pos_prob
    label = "fraud" if fraud_prob >= (1.0 - fraud_prob) else "normal"
    return label, fraud_prob

def main() -> None:
    model = json.loads(MODEL_PATH.read_text(encoding="utf-8"))
    payload = {
        "sourceModel": "assets/model/moneyguard_model.json",
        "caseCount": len(CASES),
        "cases": [
            {
                "id": case_id,
                "message": msg,
                "expectedLabel": label,
                "expectedFraudProbability": fraud_prob,
            }
            for case_id, msg in CASES
            for label, fraud_prob in [classify(model, msg)]
        ],
    }
    OUTPUT_PATH.write_text(json.dumps(payload, indent=2) + "\n", encoding="utf-8")
    print(f"Wrote {len(CASES)} parity cases to {OUTPUT_PATH}")

if __name__ == "__main__":
    main()
