# Ethics and Malawi Data Protection Act Compliance Memo (v0.8)

- Student: Emmanuel Noel Kakwera (24311351023)
- Token: EK23-WKBD-MF26
- Target Release: v0.8 Planning

## 1. Scope and Sensitive Data Context

MoneyGuard Malawi inspects incoming SMS messages on Android devices to detect Airtel Money and TNM Mpamba social-engineering phishing attempts. Incoming SMS bodies frequently contain personally identifiable information (PII), account balances, transaction references, and occasionally user PINs or OTPs.

## 2. Malawi Data Protection Act (2024) Alignment

1. Data Minimization and Local-Only Inference: Classification executes strictly on-device via OfflineSmsClassifier using the bundled 478,956-byte moneyguard_model.json asset. Zero SMS payloads or sender numbers are transmitted to external servers.
2. Purpose Limitation and Explicit Consent: SMS interception (RECEIVE_SMS) and alert delivery (POST_NOTIFICATIONS) are gated behind explicit user opt-in and readiness checks (evaluateProtectionReadiness) rather than silent background activation.
3. Confidentiality and Safe Diagnostics: Error paths in OfflineModelLoader must never echo raw SMS text or PIN strings into exception messages or Logcat output (verified by char11_loaderFailureDetailsDoNotIncludeSmsContent).
4. Storage Security and User Retention Control (v0.8 Requirement): Detection records stored locally in Room (DetectionEntity) must support user-initiated deletion and clear retention boundaries so sensitive financial SMS history is not retained indefinitely without user control.

## 3. Algorithmic Fairness and Harm Mitigation

- Bilingual Code-Switching (English and Chichewa): Malawian fraud messages frequently mix Chichewa and English phrasing. False negatives expose users to financial theft, while excessive false positives on legitimate Airtel Money or TNM Mpamba receipts erode user trust.
- Decision Support Framing: Alerts warn users and display model confidence without automatically blocking or deleting carrier SMS messages, preserving user agency over legitimate financial receipts.
