package com.moneyguard.malawi.ui.screens

import androidx.compose.foundation.BorderStroke
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.PaddingValues
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.navigationBarsPadding
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.rounded.ArrowBack
import androidx.compose.material.icons.rounded.CheckCircle
import androidx.compose.material.icons.rounded.Info
import androidx.compose.material.icons.rounded.Warning
import androidx.compose.material3.Card
import androidx.compose.material3.CardDefaults
import androidx.compose.material3.CircularProgressIndicator
import androidx.compose.material3.ExperimentalMaterial3Api
import androidx.compose.material3.HorizontalDivider
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.LinearProgressIndicator
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Scaffold
import androidx.compose.material3.Surface
import androidx.compose.material3.Text
import androidx.compose.material3.TopAppBar
import androidx.compose.material3.TopAppBarDefaults
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import com.moneyguard.malawi.domain.model.DetectionClassification
import com.moneyguard.malawi.domain.model.DetectionRecord
import com.moneyguard.malawi.ui.components.ClassificationPill
import com.moneyguard.malawi.ui.components.InfoBanner
import com.moneyguard.malawi.ui.components.SectionHeader
import com.moneyguard.malawi.ui.components.StatusPill
import com.moneyguard.malawi.ui.theme.MoneyGuardIcons
import com.moneyguard.malawi.ui.viewmodel.DetectionDetailsUiState
import com.moneyguard.malawi.utils.formatConfidence
import com.moneyguard.malawi.utils.formatDetectionTimestamp

/**
 * Detail view for a single detection.
 *
 * Missing records are represented as a clearly-labelled empty preview instead
 * of invented sender names, message text, or confidence values.
 */
@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun DetectionDetailsScreen(
    state: DetectionDetailsUiState,
    isPreview: Boolean,
    onBack: () -> Unit
) {
    val record = state.detection
    val previewOnly = isPreview || record == null
    val analysisLabel = when {
        state.isLoading -> "Loading"
        previewOnly -> "Preview layout"
        else -> record?.classification?.label ?: "NO RESULT"
    }

    Scaffold(
        topBar = {
            TopAppBar(
                title = {
                    Column {
                        Text("Message analysis")
                        Text(
                            text = analysisLabel,
                            style = MaterialTheme.typography.labelSmall,
                            color = MaterialTheme.colorScheme.onSurfaceVariant
                        )
                    }
                },
                navigationIcon = {
                    IconButton(onClick = onBack) {
                        Icon(
                            imageVector = Icons.AutoMirrored.Rounded.ArrowBack,
                            contentDescription = "Back"
                        )
                    }
                },
                colors = TopAppBarDefaults.topAppBarColors(
                    containerColor = MaterialTheme.colorScheme.background
                )
            )
        },
        containerColor = MaterialTheme.colorScheme.background
    ) { padding ->
        if (state.isLoading) {
            Box(
                modifier = Modifier
                    .fillMaxSize()
                    .padding(padding),
                contentAlignment = Alignment.Center
            ) {
                CircularProgressIndicator()
            }
            return@Scaffold
        }

        LazyColumn(
            modifier = Modifier
                .fillMaxSize()
                .padding(padding)
                .navigationBarsPadding(),
            contentPadding = PaddingValues(
                start = 20.dp,
                top = 8.dp,
                end = 20.dp,
                bottom = 28.dp
            ),
            verticalArrangement = Arrangement.spacedBy(14.dp)
        ) {
            if (previewOnly) {
                item {
                    InfoBanner(
                        message = "No real detection is selected. Open an item from Detection History to view its sender, message, and model result.",
                        icon = Icons.Rounded.Info
                    )
                }
            }

            item {
                SummaryCard(record = record, previewOnly = previewOnly)
            }

            item {
                SectionHeader(title = "Original SMS")
            }

            item {
                MessageCard(record = record, previewOnly = previewOnly)
            }

            item {
                ConfidenceCard(record = record)
            }

            item {
                SectionHeader(title = "Safety advice")
            }

            item {
                SafetyAdviceCard()
            }

            item {
                Text(
                    text = "A classification is a statistical prediction, not proof that a message is safe or fraudulent. Always verify unexpected payment requests with your mobile money provider.",
                    style = MaterialTheme.typography.bodySmall,
                    color = MaterialTheme.colorScheme.onSurfaceVariant,
                    textAlign = TextAlign.Center,
                    modifier = Modifier.fillMaxWidth()
                )
            }
        }
    }
}

@Composable
private fun SummaryCard(
    record: DetectionRecord?,
    previewOnly: Boolean
) {
    Card(
        modifier = Modifier.fillMaxWidth(),
        shape = MaterialTheme.shapes.large,
        colors = CardDefaults.cardColors(
            containerColor = MaterialTheme.colorScheme.surface
        ),
        border = BorderStroke(1.dp, MaterialTheme.colorScheme.outlineVariant),
        elevation = CardDefaults.cardElevation(defaultElevation = 0.dp)
    ) {
        Column(modifier = Modifier.padding(18.dp)) {
            Row(verticalAlignment = Alignment.CenterVertically) {
                Surface(
                    shape = CircleShape,
                    color = MaterialTheme.colorScheme.primaryContainer,
                    modifier = Modifier.size(46.dp)
                ) {
                    Box(contentAlignment = Alignment.Center) {
                        Icon(
                            imageVector = MoneyGuardIcons.Message,
                            contentDescription = null,
                            tint = MaterialTheme.colorScheme.primary,
                            modifier = Modifier.size(23.dp)
                        )
                    }
                }
                Spacer(Modifier.width(13.dp))
                Column(modifier = Modifier.weight(1f)) {
                    Text(
                        text = if (previewOnly) "No sender selected" else record?.sender.orEmpty(),
                        style = MaterialTheme.typography.titleMedium,
                        color = MaterialTheme.colorScheme.onSurface
                    )
                    Spacer(Modifier.height(3.dp))
                    Text(
                        text = if (previewOnly) {
                            "Sender information appears here"
                        } else {
                            formatDetectionTimestamp(record?.timestampMillis ?: 0L)
                        },
                        style = MaterialTheme.typography.bodySmall,
                        color = MaterialTheme.colorScheme.onSurfaceVariant
                    )
                }
                Spacer(Modifier.width(8.dp))
                if (previewOnly) {
                    StatusPill(
                        text = "PREVIEW",
                        containerColor = MaterialTheme.colorScheme.tertiaryContainer,
                        contentColor = MaterialTheme.colorScheme.onTertiaryContainer
                    )
                } else {
                    ClassificationPill(
                        classification = record?.classification
                            ?: DetectionClassification.NOT_ANALYSED
                    )
                }
            }

            Spacer(Modifier.height(16.dp))
            HorizontalDivider()
            Spacer(Modifier.height(14.dp))

            DetailRow(
                label = "Classification",
                value = if (previewOnly) {
                    "Not available"
                } else {
                    record?.classification?.label ?: "Not analysed"
                }
            )
            Spacer(Modifier.height(10.dp))
            DetailRow(
                label = "Date and time",
                value = if (previewOnly) {
                    "Not available"
                } else {
                    formatDetectionTimestamp(record?.timestampMillis ?: 0L)
                }
            )
            Spacer(Modifier.height(10.dp))
            DetailRow(
                label = "Source",
                value = if (previewOnly) "Preview layout" else "Incoming SMS"
            )
        }
    }
}

@Composable
private fun MessageCard(
    record: DetectionRecord?,
    previewOnly: Boolean
) {
    Card(
        modifier = Modifier.fillMaxWidth(),
        shape = MaterialTheme.shapes.large,
        colors = CardDefaults.cardColors(
            containerColor = MaterialTheme.colorScheme.surface
        ),
        border = BorderStroke(1.dp, MaterialTheme.colorScheme.outlineVariant),
        elevation = CardDefaults.cardElevation(defaultElevation = 0.dp)
    ) {
        Column(modifier = Modifier.padding(18.dp)) {
            Text(
                text = if (previewOnly) {
                    "No SMS content is shown in this preview."
                } else {
                    record?.message.orEmpty()
                },
                style = MaterialTheme.typography.bodyLarge,
                color = if (previewOnly) {
                    MaterialTheme.colorScheme.onSurfaceVariant
                } else {
                    MaterialTheme.colorScheme.onSurface
                }
            )
        }
    }
}

@Composable
private fun ConfidenceCard(record: DetectionRecord?) {
    val confidence = record?.confidence
    val classificationLabel = when (record?.classification) {
        DetectionClassification.FRAUDULENT -> "FRAUD"
        DetectionClassification.LEGITIMATE -> "NORMAL"
        else -> null
    }

    Card(
        modifier = Modifier.fillMaxWidth(),
        shape = MaterialTheme.shapes.large,
        colors = CardDefaults.cardColors(
            containerColor = MaterialTheme.colorScheme.surface
        ),
        border = BorderStroke(1.dp, MaterialTheme.colorScheme.outlineVariant),
        elevation = CardDefaults.cardElevation(defaultElevation = 0.dp)
    ) {
        Column(modifier = Modifier.padding(18.dp)) {
            Text(
                text = "Classification confidence",
                style = MaterialTheme.typography.titleSmall,
                color = MaterialTheme.colorScheme.onSurface
            )
            Spacer(Modifier.height(8.dp))
            Text(
                text = formatConfidence(confidence),
                style = MaterialTheme.typography.headlineMedium,
                color = MaterialTheme.colorScheme.onSurface
            )

            if (confidence != null) {
                Spacer(Modifier.height(12.dp))
                LinearProgressIndicator(
                    progress = { confidence.coerceIn(0f, 1f) },
                    modifier = Modifier.fillMaxWidth()
                )
            }

            Spacer(Modifier.height(10.dp))
            Text(
                text = when {
                    confidence == null ->
                        "No confidence score is available because this message could not be analysed."

                    classificationLabel != null ->
                        "$classificationLabel classification confidence: ${formatConfidence(confidence)}. " +
                            "This is model confidence in the $classificationLabel classification, " +
                            "not a guarantee that the classification is correct."

                    else ->
                        "This score comes from the on-device classification result. It is not a guarantee."
                },
                style = MaterialTheme.typography.bodySmall,
                color = MaterialTheme.colorScheme.onSurfaceVariant
            )
        }
    }
}

@Composable
private fun SafetyAdviceCard() {
    val advice = listOf(
        "Never share your PIN, OTP or password with anyone, even if the sender claims to be from your provider.",
        "Verify unexpected payment requests by calling your mobile money provider using its official number.",
        "Do not tap links in unexpected messages or install apps suggested by a sender you do not know.",
        "If money has already left your account, contact Airtel Money or TNM Mpamba support immediately."
    )

    Card(
        modifier = Modifier.fillMaxWidth(),
        shape = MaterialTheme.shapes.large,
        colors = CardDefaults.cardColors(
            containerColor = MaterialTheme.colorScheme.primaryContainer
        ),
        elevation = CardDefaults.cardElevation(defaultElevation = 0.dp)
    ) {
        Column(modifier = Modifier.padding(18.dp)) {
            Row(verticalAlignment = Alignment.CenterVertically) {
                Icon(
                    imageVector = Icons.Rounded.Warning,
                    contentDescription = null,
                    tint = MaterialTheme.colorScheme.primary,
                    modifier = Modifier.size(20.dp)
                )
                Spacer(Modifier.width(9.dp))
                Text(
                    text = "Protect yourself",
                    style = MaterialTheme.typography.titleSmall,
                    color = MaterialTheme.colorScheme.onPrimaryContainer
                )
            }
            Spacer(Modifier.height(12.dp))
            advice.forEachIndexed { index, item ->
                if (index > 0) {
                    Spacer(Modifier.height(10.dp))
                }
                Row(verticalAlignment = Alignment.Top) {
                    Icon(
                        imageVector = Icons.Rounded.CheckCircle,
                        contentDescription = null,
                        tint = MaterialTheme.colorScheme.primary,
                        modifier = Modifier
                            .padding(top = 1.dp)
                            .size(17.dp)
                    )
                    Spacer(Modifier.width(9.dp))
                    Text(
                        text = item,
                        style = MaterialTheme.typography.bodySmall,
                        color = MaterialTheme.colorScheme.onPrimaryContainer
                    )
                }
            }
        }
    }
}

@Composable
private fun DetailRow(label: String, value: String, valueColor: Color = MaterialTheme.colorScheme.onSurface) {
    Row(modifier = Modifier.fillMaxWidth()) {
        Text(
            text = label,
            style = MaterialTheme.typography.bodyMedium,
            color = MaterialTheme.colorScheme.onSurfaceVariant,
            modifier = Modifier.weight(1f)
        )
        Spacer(Modifier.width(12.dp))
        Text(
            text = value,
            style = MaterialTheme.typography.bodyMedium,
            color = valueColor,
            textAlign = TextAlign.End
        )
    }
}
