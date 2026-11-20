# MoneyGuard Malawi - v0.7 As-Built Baseline Report

- Student: Emmanuel Noel Kakwera (24311351023)
- Token: EK23-WKBD-MF26
- Repository: https://github.com/emmanuelkakwera/mobile-money-sms-phishing-and-fraud-detection-app.git
- Baseline Tag: v0.7-asbuilt
- Audit Date: 2026-11-20

## 1. As-Built Repository and Model Metrics

- Offline Classifier Model (assets/model/moneyguard_model.json): 478,956 bytes (~467.7 KiB / 0.48 MB)
- Gradle JVM Profile (android-app/gradle.properties): -Xmx1280m -XX:MaxMetaspaceSize=384m, org.gradle.parallel=false, org.gradle.workers.max=1, kotlin.compiler.execution.strategy=in-process
- Git Baseline Commits:
  - 2026-11-19 22f762a - added mobile files (v0.7-asbuilt)
  - 2026-11-20 2fe3bcf - test(baseline): add 20 characterisation tests for v0.7 as-built behavior

## 2. Test Suite Audit and Characterisation Expansion

- Prior Local Unit Tests (9 files in android-app/app/src/test): 43 test methods
- Prior Instrumented Tests (android-app/app/src/androidTest): 3 test methods (OfflineSmsClassifierTest.kt)
- New Characterisation Tests (CharacterisationSuiteTest.kt): 20 test methods (char01 through char20)
- Updated Local Unit Test Total: 63 test methods (meets >= 60 unit test target and >= 20 characterisation test requirement)

## 3. Identified Baseline Defects and Findings

1. Missing Parity Fixture (OfflineSmsClassifierParityTest.kt): predictionsMatchTheOriginalPythonPipeline fails with FileNotFoundException at line 28 because ../../../tests/mobile_parity_fixtures.json does not exist in the repository (generate_parity_fixtures.py is also absent).
2. JVM Metaspace Headroom (android-app/gradle.properties): MaxMetaspaceSize=384m can trigger daemon expiration under heavy Kotlin compilation + test execution alongside existing background Gradle daemons.
3. Missing Top-Level docs/ Structure Prior to Audit: Documentation folders (docs/00-baseline, docs/logbook, docs/ai-disclosure.md) were not yet initialized at v0.7-asbuilt.
