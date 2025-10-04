# 🔧 Wallet Connection Troubleshooting Guide

## ✅ Recent Fixes Applied

I've improved the wallet connection with better error handling and debugging. The system now provides detailed console logs and specific error messages.

## 🔍 Common Issues & Solutions

### 1. MetaMask Not Detected
**Error:** "MetaMask not installed"
**Solutions:**
- Install MetaMask browser extension
- Refresh the page after installing
- Make sure MetaMask is enabled for the site

### 2. Connection Rejected
**Error:** "Connection rejected by user" (Error Code 4001)
**Solutions:**
- Click "Connect" in MetaMask popup
- Don't click "Cancel" or close the popup
- Try connecting again

### 3. Pending Connection Request
**Error:** "Connection request already pending in MetaMask" (Error Code -32002)
**Solutions:**
- Open MetaMask extension manually
- Complete or cancel any pending connection requests
- Try connecting again after clearing pending requests

### 4. Wrong Network
**Error:** Network-related issues
**Solutions:**
- The app is configured for **Polygon Mainnet (Chain ID 137)**
- Use the network switcher in the app
- Or manually switch to Polygon in MetaMask

### 5. No Accounts Found
**Error:** "No accounts found"
**Solutions:**
- Unlock your MetaMask wallet
- Make sure at least one account is available
- Try refreshing the page

## 🛠️ Debugging Steps

### Step 1: Check Browser Console
1. Open Developer Tools (F12)
2. Go to Console tab
3. Look for wallet connection logs:
   - "Attempting to connect wallet..."
   - "MetaMask detected, requesting accounts..."
   - "Connected to network: [chain-id]"
   - "Wallet connected successfully!"

### Step 2: Check MetaMask Status
1. Click MetaMask extension icon
2. Ensure wallet is unlocked
3. Check if site is connected
4. Verify you're on the correct network

### Step 3: Clear Connection State
1. Disconnect wallet in app (if partially connected)
2. In MetaMask: Settings > Connected Sites > Disconnect from site
3. Refresh page and try connecting again

## 🌐 Network Configuration

### Polygon Mainnet Settings
- **Chain ID:** 137
- **RPC URL:** https://polygon-rpc.com
- **Currency:** POL
- **Explorer:** https://polygonscan.com

### Auto-Add Network
The app will automatically prompt to add Polygon network if not configured.

## 🔧 Browser-Specific Issues

### Chrome/Brave
- Make sure MetaMask extension is enabled
- Check if site permissions are blocked
- Try incognito mode to test

### Firefox
- Ensure MetaMask extension has proper permissions
- Check if privacy settings are blocking connections

### Safari
- MetaMask support may be limited
- Try using Chrome or Firefox instead

## 📱 Mobile Wallet Connection

### MetaMask Mobile App
1. Open MetaMask app
2. Go to Browser tab
3. Navigate to the site URL
4. Connect wallet within the app

### WalletConnect (if available)
- Use WalletConnect QR code
- Connect through mobile wallet apps

## 🚨 If Nothing Works

### Reset Everything
1. **Clear Browser Data:**
   - Clear cache and cookies for the site
   - Refresh the page

2. **Reset MetaMask:**
   - Settings > Advanced > Reset Account
   - **WARNING:** This clears transaction history but not funds

3. **Try Different Browser:**
   - Test in Chrome, Firefox, or Brave
   - Use incognito/private mode

4. **Check MetaMask Version:**
   - Update to latest MetaMask version
   - Restart browser after update

## 📞 Get Help

### Console Logs
The improved error handling now shows detailed logs. Share console output when reporting issues:

```
Attempting to connect wallet...
MetaMask detected, requesting accounts...
Accounts found: 1
Connected to network: 137
Wallet connected successfully!
```

### Error Reporting
If wallet connection still fails:
1. Copy error message from the red error box
2. Copy console logs from Developer Tools
3. Report the specific browser and MetaMask version

The wallet connection has been significantly improved with better error handling and should work much more reliably now!