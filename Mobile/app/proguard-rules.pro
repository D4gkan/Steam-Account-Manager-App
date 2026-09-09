# Keep Room entities/DAO annotations intact.
-keep class com.steamaccountmanager.app.data.database.** { *; }

# AndroidX Security / Keystore reflection-based classes.
-keep class androidx.security.crypto.** { *; }

# Never keep logging calls that might carry sensitive data in release; Timber/Log
# calls guarded by BuildConfig.DEBUG are stripped at the call-site instead of here.
-assumenosideeffects class android.util.Log {
    public static *** v(...);
    public static *** d(...);
}

# Suppress warnings for missing classes (external dependencies).
-dontwarn com.google.errorprone.annotations.CanIgnoreReturnValue
-dontwarn com.google.errorprone.annotations.CheckReturnValue
-dontwarn com.google.errorprone.annotations.Immutable
-dontwarn com.google.errorprone.annotations.RestrictedApi
