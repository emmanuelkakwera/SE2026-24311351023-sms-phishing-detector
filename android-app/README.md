# MoneyGuard Malawi — native Android SMS protection

This is the native Kotlin/Jetpack Compose application in `mobile/android-app`.
It is separate from the Expo prototype in `mobile/`: Expo Go cannot receive
ordinary carrier SMS broadcasts or run a background SMS receiver.

MoneyGuard works **alongside** Google Messages or Samsung Messages. It is not a
replacement SMS app. It does not read the inbox, use `SMS_DELIVER`, become the
default SMS app, or delete, block or modify messages. RCS, WhatsApp, Messenger
and other chat apps are not monitored.

## What is implemented

- Automatic classification of incoming ordinary `SMS_RECEIVED` messages while
  the app is open, in the background or after a restart (after first unlock).
- On-device, offline TF-IDF + Logistic Regression inference using a JSON export
  of the project's fitted `MoneyGuard_model.joblib` pipeline. No network and no
  Python runtime are needed on the phone.
- Multipart SMS reassembly in carrier order, plus a bounded, persistent
  fingerprint cache to ignore redelivered broadcasts.
- Fraud-only Android notifications using a dedicated `NotificationManager`
  channel. Normal messages are saved quietly.
- Room-backed detection history with FRAUD/NORMAL filters, detail view and a
  clear-history control. Dashboard statistics are derived only from stored
  records; unclassified messages are excluded from "analysed" counts.
- Home / Protection Dashboard, Detection History and Settings. No account,
  login, registration, email/password, Google sign-in, manual SMS checking,
  copy-and-paste checker, education modules or onboarding screens.
- A protection switch that only turns on when SMS permission, notification
  permission, the fitted model and the manifest receiver are all available.
- Boot recovery that recreates the notification channel and disables monitoring
  if SMS permission was revoked while the device was off.

## Model integration and verification

The original model is a scikit-learn `Pipeline` with a fitted `TfidfVectorizer`
and `LogisticRegression` trained on `MoneyGuard_combined.csv`. Android cannot
load a `.joblib` file, so `export_mobile_model.py` exports the fitted vocabulary,
IDF values, coefficients, intercept, class order and tokenisation settings to
`mobile/assets/model/moneyguard_model.json`. `OfflineSmsClassifier.kt`
reimplements the same L2-normalised TF-IDF transform and logistic decision
function, and refuses to load a model whose vectoriser settings differ from the
ones it can reproduce.

Verified on this machine:

- `python export_mobile_model.py --check-only --skip-cv`: 8,356 features,
  classes `[fraud, normal]` (positive class `normal`), 0 label mismatches and a
  maximum fraud-probability difference of `3.33e-16` against the Python pipeline.
- `python tests/generate_parity_fixtures.py`: writes
  `tests/mobile_parity_fixtures.json`, the ground truth used by the Android JVM
  unit tests. Nothing in the Android app trains or changes the model.

Model accuracy figures visible in the repository are properties of the existing
dataset and exporter; the Android UI never displays fabricated metrics or
confidence values.

## Permissions

| Permission | Why it is needed | Handling |
| --- | --- | --- |
| `RECEIVE_SMS` | Receive ordinary incoming carrier SMS broadcasts. | Runtime "dangerous" permission. Granted through the first-launch rationale or Settings. Play Store treats it as restricted: a published app must qualify for an SMS permission exception and complete Google's Permission Declaration Form. |
| `POST_NOTIFICATIONS` | Show fraud warnings on Android 13 (API 33)+. | Runtime permission on API 33+. On older versions, app notification settings still apply. |
| `RECEIVE_BOOT_COMPLETED` | Recreate the alert channel and re-check prerequisites after a restart. | Normal permission; boot broadcasts are exempt from Android 8+ implicit-broadcast limits. Protection resumes after first unlock. |

Only these three permissions are declared. No internet, contacts, storage or
account permissions are used.

## Build and test

Requirements: JDK 17+, Android SDK Platform 36 and build tools.

```powershell
# From mobile/android-app
.\gradlew.bat testDebugUnitTest assembleDebug
```

Debug APK: `app\build\outputs\apk\debug\app-debug.apk`

The unit tests include Python/Kotlin parity on English, Chichewa, mixed-language,
empty, oversized and unusually formatted messages, protection readiness when
permissions or the model are unavailable, and multipart/deduplication helpers.

No physical device or emulator was attached when these results were produced
(`adb devices` reported none), so **no real-device SMS delivery, locked-screen,
background, notification or reboot testing has been performed**. Android's
battery optimisation and Samsung's power-saving features may delay or suppress
manifest receiver delivery until the app is opened. Do not treat a successful
build or unit-test run as proof of carrier-SMS behaviour.

## Installing and testing on a Samsung A07

1. On the phone: **Settings → Biometrics and security → Install unknown apps**
   → choose the app you will open the APK from (Files/My Files or your browser)
   → enable **Allow from this source**.
2. Copy `app-debug.apk` to the phone and open it. Tap **Install**.
   Alternatively, with the phone connected and USB debugging enabled, run
   `adb install -r app\build\outputs\apk\debug\app-debug.apk` from this folder.
3. Open MoneyGuard. Read the short permission explanation and tap **Continue**.
4. Allow **SMS messages** and, on Android 13+, **Notifications**. If you deny
   either one, the dashboard explains what is missing and protection stays off.
5. On the Home tab, confirm the status shows **PROTECTION ACTIVE** and turn the
   **Automatic protection** switch on. A green ACTIVE badge is only shown when
   all required components are available; tapping the switch alone is not
   enough.
6. Send yourself a test SMS from another phone. The message should still arrive
   in Samsung Messages. Open MoneyGuard → **History** to see the stored record
   with its classification, time and confidence. A message classified FRAUD
   should also raise a notification; a NORMAL message should not.
7. Leave MoneyGuard, lock the screen, and send another SMS. Reopen MoneyGuard
   and check History. If no record appears, check Samsung's battery settings
   (**Settings → Battery and device care → Battery → App power management**)
   and exclude MoneyGuard from sleep/standby restrictions.
8. Reboot the phone, unlock it, and send another SMS to check restart recovery.
9. Settings → **Clear detection history** removes all locally stored records.
   This does not delete any SMS from your SMS app.

Install the APK only from a source you trust. This is a university project
build, not a Google Play release.
