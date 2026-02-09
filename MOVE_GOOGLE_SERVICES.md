# 📍 Move google-services.json to Correct Location

## Current Location
You said you placed it in the "tweet folder", but it needs to be in a **specific subfolder**.

## ✅ Correct Location (MUST BE HERE):

```
C:\Users\muhanad\Desktop\tweet\mytweet\android\app\google-services.json
```

---

## 🔧 How to Move It

### Option 1: PowerShell Command (Run this):

```powershell
# If it's in the tweet root folder, move it:
Move-Item "C:\Users\muhanad\Desktop\tweet\google-services.json" -Destination "C:\Users\muhanad\Desktop\tweet\mytweet\android\app\google-services.json"
```

### Option 2: Manually (File Explorer):

1. Open File Explorer
2. Go to: `C:\Users\muhanad\Desktop\tweet\`
3. Find `google-services.json` file
4. Cut the file (Ctrl+X)
5. Navigate to: `C:\Users\muhanad\Desktop\tweet\mytweet\android\app\`
6. Paste it here (Ctrl+V)

---

## 📂 Folder Structure Should Look Like This:

```
tweet/
└── mytweet/
    ├── android/
    │   ├── app/
    │   │   ├── src/
    │   │   ├── build.gradle  ✅ (I updated this)
    │   │   └── google-services.json  👈 MUST BE HERE!
    │   ├── build.gradle  ✅ (I updated this)
    │   └── ...
    ├── ios/
    ├── src/
    └── package.json
```

---

## ✅ Verify It's in the Right Place

Run this to check:

```powershell
Test-Path "C:\Users\muhanad\Desktop\tweet\mytweet\android\app\google-services.json"
```

Should return: **True**

---

## 🎯 After Moving the File:

1. **Install packages:**
```bash
cd C:\Users\muhanad\Desktop\tweet\mytweet
npm install @react-native-firebase/app @react-native-firebase/auth @react-native-google-signin/google-signin
```

2. **Clean build:**
```bash
cd android
gradlew clean
cd ..
```

3. **Run app:**
```bash
npm run android
```

---

Tell me once you've moved it to the correct location! 🚀
