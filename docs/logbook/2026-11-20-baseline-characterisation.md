# Session Log - 2026-11-20

- Phase: Baseline Audit and Characterisation Testing (v0.7-asbuilt)
- Audited 46 existing tests (43 local unit tests, 3 instrumented tests) across 10 files.
- Confirmed assets/model/moneyguard_model.json size is 478,956 bytes and identified missing mobile_parity_fixtures.json in OfflineSmsClassifierParityTest.
- Added CharacterisationSuiteTest.kt with 20 tests, verified with gradlew.bat :app:test, and committed on feat/characterisation-tests (2fe3bcf).
