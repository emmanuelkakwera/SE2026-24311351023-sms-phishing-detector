package com.moneyguard.malawi.ui.theme

import android.app.Activity
import androidx.compose.foundation.isSystemInDarkTheme
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Shapes
import androidx.compose.material3.darkColorScheme
import androidx.compose.material3.lightColorScheme
import androidx.compose.runtime.Composable
import androidx.compose.runtime.SideEffect
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.platform.LocalView
import androidx.compose.ui.unit.dp
import androidx.core.view.WindowCompat

private val LightColors = lightColorScheme(
    primary = MoneyNavy,
    onPrimary = Color.White,
    primaryContainer = MoneyBlueLight,
    onPrimaryContainer = MoneyNavyDark,
    secondary = MoneyAccent,
    onSecondary = Color.White,
    secondaryContainer = MoneyAccentLight,
    onSecondaryContainer = MoneyNavyDark,
    tertiary = MoneyTeal,
    onTertiary = Color.White,
    tertiaryContainer = MoneyTealLight,
    onTertiaryContainer = Color(0xFF003732),
    error = MoneyRed,
    onError = Color.White,
    errorContainer = MoneyRedLight,
    onErrorContainer = MoneyRed,
    background = MoneyBackground,
    onBackground = MoneyText,
    surface = MoneySurface,
    onSurface = MoneyText,
    surfaceVariant = MoneyBlueLight,
    onSurfaceVariant = MoneyMuted,
    outline = MoneyBorder,
    outlineVariant = MoneyBorder
)

private val DarkColors = darkColorScheme(
    primary = DarkBlue,
    onPrimary = Color(0xFF001B40),
    primaryContainer = Color(0xFF133569),
    onPrimaryContainer = Color(0xFFD6E5FF),
    secondary = DarkAccent,
    onSecondary = Color(0xFF002247),
    secondaryContainer = Color(0xFF163563),
    onSecondaryContainer = Color(0xFFD8E7FF),
    tertiary = Color(0xFF5AD1C1),
    onTertiary = Color(0xFF003732),
    tertiaryContainer = Color(0xFF0B4D48),
    onTertiaryContainer = Color(0xFFCFF3EE),
    error = Color(0xFFFFB4AB),
    onError = Color(0xFF690005),
    errorContainer = Color(0xFF93000A),
    onErrorContainer = Color(0xFFFFDAD6),
    background = DarkBackground,
    onBackground = DarkText,
    surface = DarkSurface,
    onSurface = DarkText,
    surfaceVariant = Color(0xFF182C52),
    onSurfaceVariant = DarkMuted,
    outline = DarkBorder,
    outlineVariant = DarkBorder
)

private val MoneyGuardShapes = Shapes(
    extraSmall = RoundedCornerShape(8.dp),
    small = RoundedCornerShape(12.dp),
    medium = RoundedCornerShape(16.dp),
    large = RoundedCornerShape(20.dp),
    extraLarge = RoundedCornerShape(28.dp)
)

@Composable
fun MoneyGuardTheme(
    darkTheme: Boolean = isSystemInDarkTheme(),
    content: @Composable () -> Unit
) {
    val colorScheme = if (darkTheme) DarkColors else LightColors

    val view = LocalView.current
    if (!view.isInEditMode) {
        SideEffect {
            val window = (view.context as Activity).window
            val controller = WindowCompat.getInsetsController(window, view)
            controller.isAppearanceLightStatusBars = !darkTheme
            controller.isAppearanceLightNavigationBars = !darkTheme
        }
    }

    MaterialTheme(
        colorScheme = colorScheme,
        typography = MoneyGuardTypography,
        shapes = MoneyGuardShapes,
        content = content
    )
}
