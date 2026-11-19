# MoneyGuard mobile (Expo / React Native)

MoneyGuard is an Android-first Expo app for Malawi mobile-money users. It checks
incoming carrier SMS automatically, scores messages offline with the bundled
TF-IDF + Logistic Regression model, shows a high-priority fraud alert when a
message looks dangerous, and keeps a local detection history. A manual paste
checker remains available for old, forwarded, or copied messages.

Everything runs on the device. Messages, detections, scans, accounts, and
settings are stored locally; no message text is uploaded.

> **Automatic SMS monitoring requires an Android development or production
> build.** It does not work in Expo Go, on iOS, or on the web. MoneyGuard is not
> a replacement SMS app and never blocks or deletes messages.

## Features

- **Automatic SMS protection (Android build)** — a native `SMS_RECEIVED`
  receiver analyses every incoming carrier SMS with the bundled model. NORMAL
  messages are saved silently; FRAUD messages also trigger a high-priority
  notification with the sender, message preview, confidence, and safety advice.
- **Offline manual detector** — paste or copy a message and analyse it without a
  network connection. Useful on iOS, web, Expo Go, and for re-checking old SMS.
- **Clear explanations** — results show fraud/normal probabilities, a
  confidence percentage, a risk band, and the strongest contributing words or
  phrases. The app does not invent scores: the values come from the bundled
  model.
- **Unified history** — automatic detections and manual scans appear in one
  history with All / Fraud / Normal filters, search, detail screens, per-record
  deletion, and clear-history actions.
- **Protection setup** — a dedicated screen shows whether the native module, SMS
  permission, notification permission, and monitoring switch are actually
  active. The UI never claims protection is running when a requirement is
  missing.
- **Awareness library** — scam guides, real-world examples, recovery steps,
  safety tips, and a short practice quiz.
- **Profiles and settings** — local sign-up/sign-in, guest mode, profile and
  password updates, account deletion, light/dark/system theme, notification and
  haptics toggles.
- **Support** — call, WhatsApp, and email links for help.

## Requirements

- Node.js 20 LTS or newer (Node 22 is recommended for Expo SDK 58)
- npm
- Android Studio + Android SDK for a local native build, **or** an Expo
  Application Services (EAS) account for a cloud build
- An Android device or emulator running Android 8.0+ for automatic monitoring
- Expo Go is fine for the manual detector only; it cannot load the native SMS
  module

## Getting started

```bash
cd mobile
npm install
npx expo start
```

Then:

- Press `a` for an Android emulator/device
- Press `i` for an iOS simulator (macOS)
- Press `w` for the web build
- Scan the QR code with Expo Go for the manual-detector preview

### Run with automatic SMS monitoring

The SMS receiver lives in the local Expo module `modules/moneyguard-sms` and is
autolinked into an Android development build:

```bash
# Requires Android Studio / ANDROID_HOME and a connected device or emulator
npx expo run:android
```

The first native build compiles the Kotlin module and bundles
`assets/model/moneyguard_model.json` into the APK. After installing, open
MoneyGuard, choose **Turn on automatic protection**, grant SMS and notification
access, and leave monitoring enabled.

### Build an installable APK with EAS

`eas.json` includes a `preview` profile that produces an installable APK:

```bash
npx eas-cli@latest login
npx eas-cli@latest build -p android --profile preview
```

The command prints a download URL when the build finishes. The `production`
profile produces an Android App Bundle (`.aab`) for store distribution.
`development` produces a development-client APK.

There is no checked-in `android/` directory. Expo generates it during the build
(Continuous Native Generation), so configure native behaviour in `app.json` and
the `modules/moneyguard-sms` module rather than editing generated files.

### Typecheck and lint

```bash
npx tsc --noEmit
npx expo lint
```

## Automatic SMS monitoring

### How it works

1. `app.json` declares `RECEIVE_SMS`, `POST_NOTIFICATIONS`, and `VIBRATE`.
2. The native module manifest registers an exported `SMS_RECEIVED` receiver
   protected by `android.permission.BROADCAST_SMS`.
3. `SmsReceiver.kt` groups multipart messages by sender and subscription, then
   passes the full body to `OfflineSmsClassifier.kt`.
4. The classifier loads the same model asset used by the JavaScript classifier,
   builds TF-IDF unigram/bigram features, applies the Logistic Regression
   coefficients, and computes both class probabilities.
5. `SmsStore.kt` keeps the latest 200 detections (sender, body, status,
   confidence, probabilities, signals, timestamps, SIM subscription). NORMAL and
   FRAUD records are both stored; unreadable messages are stored as
   `NOT_ANALYSED`.
6. `NotificationHelper.kt` creates the `moneyguard-alerts` channel and posts a
   high-priority alert for FRAUD only. Tapping it opens
   `moneyguard:///detection/<id>`.
7. The JavaScript `ProtectionProvider` merges native detections with manual
   scans and refreshes when the app returns to the foreground.

The notification deep link is registered outside the signed-in route guard so
an alert can open even when no local profile is signed in.

### Permissions and honest status

| Condition | UI behaviour |
| --- | --- |
| Native module missing (Expo Go, iOS, web) | Shows “manual checks only”; automatic protection is never reported as active |
| SMS permission denied | Shows “protection off” and explains that messages are not being checked |
| Monitoring switch off | Shows “protection off”; existing history remains visible |
| SMS permission + monitoring on | Shows “protection on” and processes incoming carrier SMS |
| Notification permission denied | Detection still runs and records are saved, but warning alerts cannot appear |

### Android / Play Store considerations

- `RECEIVE_SMS` is a restricted permission. Google Play requires a declared
  core-function use case and review for apps that read SMS. MoneyGuard's stated
  core function is mobile-money fraud detection, but approval is not guaranteed.
  For a class/demo deployment, install the APK directly or use internal
  distribution.
- MoneyGuard does **not** request `READ_SMS`, does not become the default SMS
  app, does not read the existing inbox, and does not delete or block messages.
- Only carrier SMS delivered through `SMS_RECEIVED` is monitored. RCS chats,
  WhatsApp, Telegram, and other data-based messaging apps are **not** monitored.
- iOS cannot receive this broadcast. The iOS build supports the manual detector,
  history, and awareness content only.
- Some Android vendors aggressively stop background apps. If alerts stop, allow
  MoneyGuard to run in the background and disable battery optimisation for it.

## Project structure

```text
mobile/
  app.json                     Android permissions, package, plugins, scheme
  eas.json                     development / preview APK / production profiles
  assets/
    images/                    app icon, splash, adaptive and notification icons
    model/moneyguard_model.json   bundled TF-IDF + Logistic Regression model
  modules/
    moneyguard-sms/            local Expo module (Android SMS receiver + model)
      android/                 Kotlin receiver, classifier, storage, notifications
      src/                     TypeScript bridge types and native module handle
  src/
    app/                       Expo Router routes
      (auth)/                  welcome, sign-in, sign-up
      (tabs)/                  Home, Scan, History, Learn
      detection/[id].tsx       automatic detection detail (deep-link target)
      protection.tsx           permission and monitoring setup
      result/[id].tsx          manual scan result detail
      learn/[id].tsx           scam guide detail
      practice.tsx             awareness quiz
      notifications.tsx        safety alerts
      support.tsx              contact options
      settings.tsx             app and protection settings
      profile.tsx              profile management
      about.tsx                model and app information
    components/                shared UI primitives and MoneyGuard widgets
    constants/                 theme palette and design tokens
    data/                      awareness content and quiz data
    hooks/                     theme and colour-scheme hooks
    lib/                       classifier, native bridge, storage, formatting,
                               sharing, notifications
    providers/                 auth/scans/settings + automatic protection state
    types/                     shared TypeScript types
```

## Offline classifier

`src/lib/classifier.ts` (manual checks) and
`modules/moneyguard-sms/android/.../OfflineSmsClassifier.kt` (automatic checks)
implement the same pipeline as `export_mobile_model.py`, the Flask explanation
logic, and the reference Android app:

1. Lower-case and tokenise text with a Unicode-aware word pattern
   (`[\p{L}\p{N}_]{2,}`).
2. Build word unigrams and bigrams.
3. Match terms against the bundled vocabulary and weight them with the fitted
   IDF values.
4. L2-normalise the weighted vector.
5. Apply the fitted Logistic Regression coefficients and intercept.
6. Convert the decision value to a numerically stable sigmoid probability.
7. Pick the class with the higher probability (`normal` is the model's positive
   class, so fraud probability is `1 - normal probability`).

The model file reports:

| Property | Value |
| --- | --- |
| Vocabulary size | 8,356 features |
| Classes | `fraud`, `normal` (positive class: `normal`) |
| N-grams | 1–2 |
| Normalisation | L2 |
| Dataset | 1,070 messages (575 fraud, 495 normal) |
| Training accuracy | 97.20% |
| 5-fold CV accuracy | 92.99% (± 0.98%) |

The app validates input length (3–5,000 characters) before classification. The
explanations only list meaningful, non-overlapping terms; pure numbers and
common function words are skipped. Training accuracy is not a guarantee of
real-world accuracy, and every result screen says that a prediction is not
proof.

To check the exported model against the reference implementation:

```bash
python export_mobile_model.py --check-only
python -m pytest tests/test_mobile_model.py
```

## Local auth and privacy scope

Account handling is intentionally local:

- Profiles are stored in AsyncStorage.
- Passwords are salted and hashed with SHA-256 via `expo-crypto`.
- There is no remote account service, password reset, email verification, or
  multi-device sync.
- Guest mode creates a temporary local profile.
- Deleting an account removes that profile, its scans, and the native detection
  records from the device.

This is suitable for a classroom/demo app. For production deployment, replace
the local account layer with a real identity service and use a slow password
hashing function (for example Argon2 or scrypt) on a server.

Automatic detections are owned by the device rather than a profile, because the
receiver can run before anyone signs in. Manual scans remain per profile. The
History screen merges both sources and labels automatic records.

## Notifications

- Manual-scan notifications are scheduled through `expo-notifications` and use
  the `moneyguard-alerts` channel.
- Automatic fraud alerts are posted directly by the native module, so they work
  even when the JavaScript app is closed.
- Both kinds of alert request notification permission before use.
- Safety alerts are bundled with the app and update when the app is updated;
  there is no push server.

## Troubleshooting

- **Typed route errors** — Expo Router generates `.expo/types/router.d.ts` when
  the dev server starts. Run `npx expo start` once, or delete `.expo/` and
  restart, then run `npx tsc --noEmit`.
- **“Automatic protection isn’t available in this build”** — you are running
  Expo Go, iOS, web, or a build made before the native module was added. Use
  `npx expo run:android` or an EAS development/preview build.
- **No fraud alert, but history has a detection** — notification permission is
  probably denied. Open Protection settings and allow notifications.
- **No detections at all** — check that SMS permission and monitoring are both
  on, and that the test message is a real carrier SMS (not a chat app message).
- **Android build fails with “SDK location not found”** — install Android Studio,
  set `ANDROID_HOME`, and add `platform-tools` to `PATH`, or use EAS Build.
- **Notifications do not appear in Expo Go** — use a development build. Local
  notification behaviour is limited in Expo Go.
- **Dependency warnings** — run `npx expo install --fix` and `npx expo-doctor`.

## Related documentation

- Root project README: `../README.md`
- Reference native Android app: `../android/README.md`
- Expo documentation: <https://docs.expo.dev/>
- Expo Router documentation: <https://docs.expo.dev/router/introduction/>
- EAS Build documentation: <https://docs.expo.dev/build/introduction/>
"# mobile-money-sms-phishing-and-fraud-detection-app" 
