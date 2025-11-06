module.exports = {
  expo: {
    name: "ECG Monitor",
    slug: "ecg-monitor-mobile",
    version: "1.0.0",
    orientation: "portrait",
    icon: "./assets/icon.png",
    userInterfaceStyle: "dark",
    splash: {
      image: "./assets/splash.png",
      resizeMode: "contain",
      backgroundColor: "#0a0a0a"
    },
    ios: {
      supportsTablet: true,
      bundleIdentifier: "com.ecgmonitor.mobile",
      buildNumber: "1",
      infoPlist: {
        UIBackgroundModes: ["fetch", "remote-notification"],
        NSHealthShareUsageDescription: "This app displays your ECG monitoring data",
        NSHealthUpdateUsageDescription: "This app displays your ECG monitoring data"
      }
    },
    android: {
      adaptiveIcon: {
        foregroundImage: "./assets/adaptive-icon.png",
        backgroundColor: "#0a0a0a"
      },
      package: "com.ecgmonitor.mobile",
      versionCode: 1
    },
    web: {
      favicon: "./assets/favicon.png"
    },
    plugins: [
      "expo-router"
    ],
    scheme: "ecgmonitor",
    experiments: {
      typedRoutes: true
    },
    extra: {
      apiBaseUrl: process.env.API_BASE_URL || "",
      deviceId: process.env.DEVICE_ID || "ecg-device-001",
      refreshInterval: parseInt(process.env.REFRESH_INTERVAL || "5000", 10)
    }
  }
};
