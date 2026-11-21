# Software Requirements Specification and Stakeholder Elicitation (v0.8)

## 1. Stakeholders and Elicited Needs

- Everyday Malawian Mobile Money Users (Airtel Money, TNM Mpamba): Clear, immediate warnings on fraudulent SMS prompts without losing legitimate transaction alerts or requiring constant mobile data.
- Low-End and Mid-Range Android Device Owners: Low memory footprint, fast startup, and reliable operation without background battery drain or JVM metaspace exhaustion.
- Course Evaluators and Maintainers (CS 3201): Traceable requirements, reproducible test execution (63 local unit tests baseline), and complete audit trails in docs/ and git history.

## 2. Functional Requirements (v0.8)

- FR-01 Multipart SMS Assembly: Assemble split SMS PDUs in sequence order using sequenceIndex and subscriptionId while rejecting malformed UDH headers safely.
- FR-02 Offline Fraud Classification: Classify trimmed messages (up to 5,000 characters) using OfflineSmsClassifier and the bundled moneyguard_model.json asset, returning normalized probabilities and confidence.
- FR-03 Protection Readiness Gating: Evaluate SMS permission, notification permission, model readiness, and receiver configuration before enabling active protection.
- FR-04 Detection History and Filtering: Persist detection records in Room (DetectionEntity) and support filtering across ALL, FRAUDULENT, and NORMAL while excluding NOT_ANALYSED from analysed counts.
- FR-05 Fraud Alert Notifications: Emit notifications with truncated previews (at most 180 characters) and confidence context when fraudulent SMS messages are detected.

## 3. Non-Functional Requirements (v0.8)

- NFR-01 Offline Privacy: Zero network calls during SMS ingestion or classification.
- NFR-02 Testability and Regression Safety: Maintain at least 60 local unit tests and resolve parity test fixture visibility cleanly in v0.8+ implementation work.
- NFR-03 Diagnostic Safety: Never expose raw SMS bodies or PINs in loader error details.
