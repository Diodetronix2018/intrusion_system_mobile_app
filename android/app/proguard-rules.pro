# Add project specific ProGuard rules here.
# By default, the flags in this file are appended to flags specified
# in /usr/local/Cellar/android-sdk/24.3.3/tools/proguard/proguard-android.txt
# You can edit the include path and order by changing the proguardFiles
# directive in build.gradle.
#
# For more details, see
#   http://developer.android.com/guide/developing/tools/proguard.html

# Add any project specific keep options here:

# react-native-vision-camera: its C++ side (fbjni) looks up these classes and
# members by name, and the library ships no consumer rules — without this R8
# renames/strips them in release builds and the camera fails to start
# (the QR scanner lands on its "Retry" error), while debug builds work.
-keep class com.mrousavy.camera.** { *; }
