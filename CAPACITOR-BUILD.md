# Building Android APK for Note Club

This guide explains how to build an Android APK for Note Club using Capacitor.

## Prerequisites

1. **Android Studio** - Download from https://developer.android.com/studio
2. **JDK 17 or higher** - Required for Android development
3. **Node.js and npm** - Already installed

## Important: Backend Configuration

Since this app uses API routes and server-side features, the Android app will connect to your **hosted backend**. You have two options:

### Option 1: Use Your Deployed App (Recommended for Production)

1. Deploy your app to a hosting service (Vercel, Railway, etc.)
2. Update `out/index.html` with your hosted URL:
   ```javascript
   const HOSTED_URL = 'https://your-app-url.vercel.app';
   ```

### Option 2: Local Development Testing

1. Run your Next.js dev server: `npm run dev`
2. Update `out/index.html` with local URL:
   - For Android Emulator: `http://10.0.2.2:3000`
   - For Physical Device: `http://YOUR_LOCAL_IP:3000` (e.g., `http://192.168.1.10:3000`)

To find your local IP:
```bash
# macOS/Linux
ifconfig | grep "inet " | grep -v 127.0.0.1

# Windows
ipconfig
```

## Build Steps

### 1. Configure Your Backend URL

Edit `out/index.html` and update the `HOSTED_URL`:
```bash
# Open in your editor
open out/index.html
```

### 2. Sync to Android

```bash
npm run cap:sync
```

### 3. Open Android Studio

```bash
npm run cap:open:android
```

This will open the project in Android Studio.

### 4. Build APK in Android Studio

1. Wait for Gradle sync to complete (first time may take several minutes)
2. **Build APK**:
   - Go to `Build` > `Build Bundle(s) / APK(s)` > `Build APK(s)`
   - Or click the hammer icon in the toolbar

3. **Locate the APK**:
   - After build completes, click "locate" in the notification
   - APK location: `android/app/build/outputs/apk/debug/app-debug.apk`

### 5. Install APK

**On Emulator:**
- Drag and drop the APK file onto the emulator

**On Physical Device:**
1. Enable Developer Options on your Android device
2. Enable USB Debugging
3. Connect device via USB
4. Run: `adb install android/app/build/outputs/apk/debug/app-debug.apk`

**Or share the APK file:**
- Copy `app-debug.apk` to Google Drive or cloud storage
- Download and install on your device

## Building Signed APK for Distribution

### 1. Generate a Signing Key

```bash
keytool -genkey -v -keystore noteclub-release-key.jks -keyalg RSA -keysize 2048 -validity 10000 -alias noteclub
```

Keep this file safe and remember the passwords!

### 2. Configure Signing in Android Studio

1. In Android Studio, go to `Build` > `Generate Signed Bundle / APK`
2. Select `APK`
3. Choose your keystore file (`noteclub-release-key.jks`)
4. Enter your passwords
5. Select `release` build type
6. Click Finish

The signed APK will be at: `android/app/release/app-release.apk`

## Updating the App

When you make changes to your web app:

```bash
# 1. Rebuild the Capacitor assets
npm run build:capacitor

# 2. Sync to Android
npx cap sync android

# 3. Rebuild APK in Android Studio
npm run cap:open:android
# Then Build > Build APK(s)
```

## Troubleshooting

### Gradle Sync Issues

If you encounter Gradle sync errors:
1. In Android Studio: `File` > `Invalidate Caches` > `Invalidate and Restart`
2. Or delete: `android/.gradle` and `android/build`

### Network Issues in App

**Local Development:**
- Ensure your dev server is running: `npm run dev`
- Check firewall settings allow connections from Android
- Use your computer's local IP, not `localhost`

**Production:**
- Ensure your hosted app is accessible
- Check CORS settings if API calls fail
- Verify HTTPS is configured (HTTP may be blocked)

### White Screen / App Not Loading

1. Check the URL in `out/index.html`
2. Open Android Studio Logcat to see console errors
3. Verify your backend is running and accessible

## App Configuration

### Change App Name

Edit [android/app/src/main/res/values/strings.xml](android/app/src/main/res/values/strings.xml):
```xml
<string name="app_name">Note Club</string>
```

### Change App Icon

Replace icons in:
- `android/app/src/main/res/mipmap-*` folders

Or use a tool like: https://icon.kitchen/

### Change Package ID

Edit [capacitor.config.ts](capacitor.config.ts):
```typescript
appId: 'com.noteclub.app', // Change this
```

Then run: `npx cap sync android`

## Android Auto (Future Enhancement)

For Android Auto integration (car mode), you'll need to:

1. Implement Media Browser Service in native Android code
2. Add Android Auto dependencies to `build.gradle`
3. Follow: https://developer.android.com/training/cars/media

This is a significant undertaking and requires native Android development.

## Resources

- [Capacitor Docs](https://capacitorjs.com/docs)
- [Android Developer Guide](https://developer.android.com/guide)
- [Android Studio Download](https://developer.android.com/studio)
