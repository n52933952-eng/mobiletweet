# 📍 Place the NEW google-services.json File

## 🎯 Where to Put It:

**EXACT LOCATION:**
```
C:\Users\muhanad\Desktop\tweet\mytweet\android\app\google-services.json
```

---

## 📂 Step-by-Step Instructions:

### 1. Find Your Downloaded File
- Check your **Downloads** folder: `C:\Users\muhanad\Downloads\`
- Look for: `google-services.json` (newest one)

### 2. Copy the File
- Right-click on `google-services.json`
- Click **Copy** (or press Ctrl+C)

### 3. Navigate to App Folder
- Open File Explorer
- Go to: `C:\Users\muhanad\Desktop\tweet\mytweet\android\app\`

### 4. Replace the Old File
- If there's already a `google-services.json` here, **delete it**
- Paste the new one (Right-click → Paste, or Ctrl+V)

---

## ✅ Verify It's There

The file should be at:
```
C:\Users\muhanad\Desktop\tweet\mytweet\android\app\google-services.json
```

You can verify by running:
```powershell
Test-Path "C:\Users\muhanad\Desktop\tweet\mytweet\android\app\google-services.json"
```
Should return: `True`

---

## 🚀 After Placing the File:

Run these commands:

```bash
cd C:\Users\muhanad\Desktop\tweet\mytweet

# Install Firebase packages
npm install @react-native-firebase/app @react-native-firebase/auth @react-native-google-signin/google-signin

# Clean build
cd android
gradlew clean
cd ..

# Run app
npm run android
```

---

## 📋 Alternative: Use PowerShell to Copy

If you know where your downloaded file is, run:

```powershell
# Example if it's in Downloads:
Copy-Item "C:\Users\muhanad\Downloads\google-services.json" -Destination "C:\Users\muhanad\Desktop\tweet\mytweet\android\app\google-services.json" -Force
```

---

**Place the file and tell me when it's done!** Then we'll install the packages and test Google Sign-In! 🔥
