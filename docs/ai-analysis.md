# AI Analysis with Claude API - Technical Documentation

Comprehensive guide to the AI-powered ECG analysis system using Anthropic's Claude API.

---

## Table of Contents

1. [Overview](#overview)
2. [What We Analyze](#what-we-analyze)
3. [Analysis Frequency](#analysis-frequency)
4. [Claude API Configuration](#claude-api-configuration)
5. [Prompt Engineering](#prompt-engineering)
6. [Analysis Criteria](#analysis-criteria)
7. [Response Format](#response-format)
8. [Arrhythmia Detection](#arrhythmia-detection)
9. [Severity Levels](#severity-levels)
10. [Alert Triggering](#alert-triggering)
11. [Cost Optimization](#cost-optimization)
12. [Performance Metrics](#performance-metrics)
13. [Troubleshooting](#troubleshooting)

---

## Overview

The ECG Monitor system uses **Claude 3.5 Sonnet** (Anthropic's AI) to analyze ECG data and detect cardiac anomalies that consumer devices like Garmin don't catch.

### Why Claude?

- **Strong reasoning** - Excellent at medical data interpretation
- **Large context window** - 200K tokens for detailed ECG data
- **Structured output** - JSON mode for consistent responses
- **Safety** - Built-in medical disclaimers and conservative recommendations
- **Pattern recognition** - Can identify subtle arrhythmia patterns

### What Claude Does

1. **Analyzes ECG metrics** - HR, HRV, QRS intervals
2. **Detects arrhythmias** - AFib, PVCs, PACs, bradycardia, tachycardia
3. **Classifies patterns** - Rest vs exercise vs stress
4. **Identifies anomalies** - Unusual cardiac events
5. **Assesses severity** - Low, medium, high, critical
6. **Provides recommendations** - Actionable next steps

---

## What We Analyze

### Input Data (10-second ECG batch)

Each batch sent to Claude contains:

```python
{
  "batch_id": "uuid",
  "device_id": "ecg-device-001",
  "timestamp": 1699123456789,
  "duration_seconds": 10,

  # Derived Metrics (from preprocessor Lambda)
  "metrics": {
    "heart_rate_bpm": 72,              # Beats per minute
    "rr_intervals_ms": [833, 820, ...], # R-R intervals (12 values)
    "hrv_rmssd": 42.5,                 # Heart rate variability (RMSSD)
    "hrv_sdnn": 38.2,                  # Heart rate variability (SDNN)
    "qrs_count": 12,                   # Number of QRS complexes
    "avg_qrs_width_ms": 95,            # Average QRS duration
    "signal_quality_score": 0.92       # 0.0-1.0
  },

  # Flags (from preprocessor)
  "flags": {
    "missed_beats": false,
    "noisy_signal": false,
    "irregular_rhythm": false
  }
}
```

### What We DON'T Send to Claude

❌ **Raw waveform data** - Too large (2,500 samples × 3 channels)
❌ **Personal identifiers** - Privacy protection
❌ **Historical data** - Only current 10-second window
❌ **Previous analyses** - Each analysis is independent

### Why Metrics Only?

- **Cost effective** - Smaller payloads = lower API costs
- **Faster processing** - Quick response times
- **Sufficient accuracy** - Metrics contain key diagnostic info
- **Privacy focused** - No raw physiological signals transmitted

---

## Analysis Frequency

### Default Configuration

**Analyzed:** 10% of batches
**Frequency:** Approximately every 100 seconds (1 minute 40 seconds)

**Why not 100%?**
- **Cost:** $8-20/day vs $86/day for all batches
- **Value:** Most batches are normal, don't need AI analysis
- **Efficiency:** Preprocessor flags catch urgent issues

### When Analysis Happens

Claude analyzes a batch if **any** of these conditions are true:

1. **Random sampling** - 10% of all batches (configurable)
2. **Flag detected** - Preprocessor marked irregular rhythm
3. **Noisy signal** - Signal quality below threshold
4. **First batch** - Always analyze device's first batch
5. **Manual trigger** - User requests analysis via API

### Configuration

Edit in `lambda/preprocessor/handler.py`:

```python
# Analyze every 10th batch
should_analyze = (
    flags.get('irregular_rhythm', False) or
    flags.get('noisy_signal', False) or
    int(batch_id.split('-')[0], 16) % 10 == 0  # 10% random
)
```

To analyze more frequently:

```python
# Analyze 20% of batches
int(batch_id.split('-')[0], 16) % 5 == 0  # Every 5th

# Analyze 50% of batches
int(batch_id.split('-')[0], 16) % 2 == 0  # Every 2nd

# Analyze 100% of batches
should_analyze = True  # WARNING: Expensive!
```

---

## Claude API Configuration

### Model Selection

**Current:** `claude-3-5-sonnet-20241022`

**Why Sonnet?**
- Optimal balance of cost/performance
- Fast response times (<5 seconds)
- Excellent medical reasoning
- JSON mode support

**Alternatives:**
- `claude-3-5-haiku-20241022` - Cheaper but less accurate
- `claude-3-opus-latest` - More accurate but 3x cost

### API Parameters

```python
response = client.messages.create(
    model="claude-3-5-sonnet-20241022",
    max_tokens=4096,              # Sufficient for detailed analysis
    temperature=0.3,              # Low for consistent medical analysis
    messages=[{
        "role": "user",
        "content": prompt
    }]
)
```

**Parameter Choices:**

- **max_tokens: 4096** - Allows detailed responses without hitting limit
- **temperature: 0.3** - Low temp = consistent, deterministic responses
  - Medical analysis needs consistency, not creativity
  - Reduces random variations in diagnoses
- **No system prompt** - All context in user message
- **No streaming** - Wait for complete response

### Cost per Analysis

**Current pricing (as of 2024):**
- Input: $3 per million tokens (~$0.0001 per analysis)
- Output: $15 per million tokens (~$0.0005 per analysis)

**Total per analysis:** ~$0.0006 (less than 1 cent)

**Daily cost (10% sampling):**
- 8,640 batches/day × 10% = 864 analyses
- 864 × $0.0006 = **$0.52/day** = **$15.60/month**

**Daily cost (100% sampling):**
- 8,640 × $0.0006 = **$5.18/day** = **$155/month**

---

## Prompt Engineering

### Complete Prompt Template

Located in `lambda/ai-analyzer/handler.py`:

```python
def build_analysis_prompt(batch_data):
    metrics = batch_data['metrics']
    flags = batch_data.get('flags', {})
    timestamp = datetime.utcfromtimestamp(batch_data['timestamp']/1000)

    prompt = f"""You are an expert cardiologist analyzing ECG data from a personal health monitoring device.

Patient Context:
- Device: Personal ECG monitor (3-lead, continuous monitoring)
- Time: {timestamp.strftime('%Y-%m-%d %H:%M:%S')} UTC
- Activity: Unknown (could be rest, exercise, or daily activities)
- This is NOT for clinical diagnosis, but for personal health awareness

ECG Metrics (10-second window):
- Heart Rate: {metrics['heart_rate_bpm']} BPM
- Heart Rate Variability (RMSSD): {metrics['hrv_rmssd']} ms
- Heart Rate Variability (SDNN): {metrics['hrv_sdnn']} ms
- QRS Count: {metrics['qrs_count']}
- Average QRS Width: {metrics['avg_qrs_width_ms']} ms
- R-R Intervals (ms): {metrics['rr_intervals_ms']}
- Signal Quality: {metrics['signal_quality_score']}/1.0

Automated Flags:
- Noisy Signal: {'Yes' if flags.get('noisy_signal') else 'No'}
- Irregular Rhythm: {'Yes' if flags.get('irregular_rhythm') else 'No'}
- Missed Beats: {'Yes' if flags.get('missed_beats') else 'No'}

Please analyze this ECG data and provide:

1. **Arrhythmia Detection**: Identify any irregular rhythms (AFib, PVCs, PACs, bradycardia, tachycardia, etc.)
2. **Pattern Classification**: Is this rest, exercise, stress response, or something else?
3. **Anomalies**: Any concerning patterns or unusual findings?
4. **Severity**: Rate as low, medium, high, or critical
5. **Confidence**: Your confidence level (0.0 to 1.0)
6. **Summary**: Brief explanation in 1-2 sentences
7. **Recommendations**: Any suggested actions for the user

Respond ONLY with a valid JSON object in this exact format:
{{
  "arrhythmias_detected": ["list of arrhythmia names or empty array"],
  "pattern": "rest|exercise|stress|other",
  "anomalies": ["list of anomalies or empty array"],
  "severity": "low|medium|high|critical",
  "confidence": 0.85,
  "summary": "Brief explanation here",
  "recommendations": ["list of recommendations or empty array"]
}}"""

    return prompt
```

### Prompt Design Principles

**1. Role Definition**
```
"You are an expert cardiologist..."
```
- Establishes medical expertise context
- Guides Claude to use medical knowledge

**2. Device Context**
```
"Personal ECG monitor (3-lead, continuous monitoring)"
```
- Sets expectations for data quality
- Distinguishes from clinical 12-lead ECG

**3. Disclaimer**
```
"This is NOT for clinical diagnosis..."
```
- Keeps recommendations conservative
- Prevents overly alarming language

**4. Structured Data**
```
ECG Metrics (10-second window):
- Heart Rate: 72 BPM
- HRV (RMSSD): 42.5 ms
...
```
- Clear, labeled data format
- Easy for Claude to parse
- Consistent structure

**5. Explicit Instructions**
```
"Respond ONLY with a valid JSON object..."
```
- Forces structured output
- Makes parsing reliable
- Prevents markdown wrapping

**6. JSON Schema**
```json
{
  "arrhythmias_detected": [...],
  "pattern": "...",
  ...
}
```
- Exact format specification
- Field-by-field description
- Enum values for consistency

---

## Analysis Criteria

### Heart Rate Analysis

**Normal Range:** 60-100 BPM (at rest)

| Range | Classification | Severity |
|-------|---------------|----------|
| < 40 BPM | Severe bradycardia | High |
| 40-59 BPM | Bradycardia | Medium |
| 60-100 BPM | Normal | Low |
| 101-120 BPM | Mild tachycardia | Low |
| 121-150 BPM | Moderate tachycardia | Medium |
| > 150 BPM | Severe tachycardia | High |

**Context matters:**
- Exercise: 120-180 BPM is normal
- Sleep: 40-60 BPM is normal
- Stress: 90-120 BPM is normal

### Heart Rate Variability (HRV)

**RMSSD (Root Mean Square of Successive Differences)**

| Range | Classification | Severity |
|-------|---------------|----------|
| < 15 ms | Very low (concerning) | High |
| 15-25 ms | Low | Medium |
| 25-50 ms | Normal | Low |
| 50-100 ms | High (good) | Low |
| > 100 ms | Very high (check data) | Medium |

**SDNN (Standard Deviation of NN intervals)**

| Range | Classification | Severity |
|-------|---------------|----------|
| < 20 ms | Very low | High |
| 20-50 ms | Low | Medium |
| 50-100 ms | Normal | Low |
| > 100 ms | High | Low |

**High HRV = Good** (indicates healthy autonomic function)
**Low HRV = Concerning** (stress, fatigue, illness)

### R-R Interval Analysis

**Regular Rhythm:**
- Consecutive R-R intervals should vary by < 120ms
- Standard deviation < 50ms

**Irregular Rhythm (possible AFib):**
- R-R intervals vary by > 120ms
- No consistent pattern
- Missing P waves (can't detect from metrics alone)

**PVCs (Premature Ventricular Contractions):**
- One R-R interval much shorter than others
- Followed by compensatory pause (longer interval)
- Pattern: short, long, normal, normal...

### QRS Complex Analysis

**Normal QRS Width:** 80-120 ms

| Range | Classification | Severity |
|-------|---------------|----------|
| < 80 ms | Narrow (could be normal) | Low |
| 80-120 ms | Normal | Low |
| 120-150 ms | Wide (bundle branch block?) | Medium |
| > 150 ms | Very wide (concerning) | High |

### Signal Quality

| Score | Classification | Action |
|-------|---------------|--------|
| > 0.9 | Excellent | Proceed with analysis |
| 0.7-0.9 | Good | Proceed with analysis |
| 0.5-0.7 | Fair | Note in analysis, proceed |
| < 0.5 | Poor | Flag as unreliable |

---

## Response Format

### Expected JSON Response

```json
{
  "arrhythmias_detected": [
    "occasional_pvc"
  ],
  "pattern": "rest",
  "anomalies": [
    "premature_ventricular_contraction"
  ],
  "severity": "low",
  "confidence": 0.87,
  "summary": "Occasional premature ventricular contractions detected during rest period. R-R intervals show some variability consistent with isolated PVCs.",
  "recommendations": [
    "Monitor frequency of PVCs over the next 24 hours",
    "Note if PVCs increase during exercise or stress",
    "If frequency increases or symptoms develop, consult healthcare provider"
  ]
}
```

### Field Definitions

**arrhythmias_detected** (array of strings)
- List of detected arrhythmias
- Common values:
  - `"sinus_bradycardia"` - HR < 60 BPM
  - `"sinus_tachycardia"` - HR > 100 BPM
  - `"occasional_pvc"` - Rare PVCs
  - `"frequent_pvcs"` - Multiple PVCs
  - `"atrial_fibrillation"` - Irregular rhythm, no P waves
  - `"atrial_flutter"` - Regular but fast atrial rate
  - `"supraventricular_tachycardia"` - Fast regular rhythm
  - `"ventricular_tachycardia"` - Fast wide QRS
  - `"first_degree_av_block"` - Prolonged PR interval
- Empty array `[]` if normal

**pattern** (string, enum)
- `"rest"` - Low HR, high HRV
- `"exercise"` - High HR, low HRV
- `"stress"` - Elevated HR, low HRV
- `"sleep"` - Low HR, high HRV (if nighttime)
- `"other"` - Cannot classify

**anomalies** (array of strings)
- Specific unusual findings
- More detailed than arrhythmias
- Examples:
  - `"wide_qrs_complex"`
  - `"extreme_hrv_variation"`
  - `"inconsistent_rr_intervals"`
  - `"possible_artifact"`
- Empty array `[]` if none

**severity** (string, enum)
- `"low"` - Normal or benign finding
- `"medium"` - Worth monitoring, not urgent
- `"high"` - Concerning, recommend medical consult
- `"critical"` - Potentially dangerous, seek immediate care

**confidence** (float, 0.0-1.0)
- Claude's confidence in the analysis
- Consider:
  - Signal quality
  - Data completeness
  - Clarity of pattern
- Typical range: 0.7-0.95
- < 0.7 means uncertain

**summary** (string)
- 1-3 sentence explanation
- Plain English
- Non-alarming language
- Context for user

**recommendations** (array of strings)
- Actionable advice
- Conservative (better safe than sorry)
- Examples:
  - `"Continue monitoring"`
  - `"Note any symptoms"`
  - `"Consult healthcare provider if..."`
  - `"No immediate action needed"`

---

## Arrhythmia Detection

### Detection Logic

Claude identifies arrhythmias based on:

1. **Heart Rate**
   - Bradycardia: HR < 60 BPM
   - Tachycardia: HR > 100 BPM

2. **R-R Interval Patterns**
   - Regular: SD < 50ms
   - Irregular: SD > 120ms (possible AFib)
   - Bigeminy: Alternating short/long
   - Trigeminy: Pattern every 3 beats

3. **HRV Metrics**
   - Very low: Possible autonomic dysfunction
   - Very high: Possible irregular rhythm

4. **QRS Duration**
   - Wide QRS: Possible ventricular origin
   - Narrow QRS: Supraventricular origin

### Common Arrhythmias

#### Atrial Fibrillation (AFib)

**Indicators:**
- Irregular R-R intervals (SD > 120ms)
- No pattern to irregularity
- HR often 90-170 BPM
- High HRV (but irregular, not healthy variation)

**Example metrics:**
```python
{
  "heart_rate_bpm": 110,
  "rr_intervals_ms": [650, 890, 720, 550, 810, 630, 900, 700],
  "hrv_rmssd": 85,  # High due to irregularity
  "hrv_sdnn": 90
}
```

**Severity:** Medium to High
**Action:** Email alert, recommend medical consult

#### Premature Ventricular Contractions (PVCs)

**Indicators:**
- One or more very short R-R intervals
- Followed by compensatory pause (long interval)
- Otherwise regular rhythm
- May have wide QRS

**Example metrics:**
```python
{
  "heart_rate_bpm": 70,
  "rr_intervals_ms": [850, 850, 400, 1200, 850, 850],  # Short + long
  "hrv_rmssd": 120,  # High due to variation
  "avg_qrs_width_ms": 110  # Slightly wide
}
```

**Severity:** Low (occasional) to Medium (frequent)
**Action:** Monitor frequency

#### Sinus Bradycardia

**Indicators:**
- HR < 60 BPM
- Regular rhythm (low R-R interval SD)
- Normal QRS width

**Example metrics:**
```python
{
  "heart_rate_bpm": 48,
  "rr_intervals_ms": [1250, 1240, 1255, 1245],  # Consistent
  "hrv_rmssd": 30,
  "hrv_sdnn": 25
}
```

**Severity:** Low (athletes) to Medium (elderly)
**Action:** Depends on context and symptoms

#### Sinus Tachycardia

**Indicators:**
- HR > 100 BPM
- Regular rhythm
- Normal QRS width

**Example metrics:**
```python
{
  "heart_rate_bpm": 130,
  "rr_intervals_ms": [460, 465, 458, 462],  # Consistent
  "hrv_rmssd": 20,  # Low (expected during tachycardia)
  "hrv_sdnn": 18
}
```

**Severity:** Low (exercise) to Medium (at rest)
**Action:** Identify cause (exercise, stress, illness)

---

## Severity Levels

### Low Severity

**Criteria:**
- Normal sinus rhythm
- HR 60-100 BPM at rest
- Regular R-R intervals
- Normal HRV
- Good signal quality

**Examples:**
- Normal rhythm
- Post-exercise recovery
- Sinus arrhythmia (respiratory variation)

**Action:** None, continue monitoring

**Alert:** No email sent

---

### Medium Severity

**Criteria:**
- Mild arrhythmias
- HR 50-59 or 101-120 BPM at rest
- Occasional PVCs
- Borderline HRV
- Fair signal quality

**Examples:**
- Occasional PVCs (< 10% of beats)
- Sinus bradycardia in non-athlete
- Mild tachycardia at rest
- Low HRV (possible stress)

**Action:** Monitor, note patterns

**Alert:** Email sent if persistent

---

### High Severity

**Criteria:**
- Significant arrhythmias
- HR < 50 or > 120 BPM at rest
- Frequent PVCs (> 10% of beats)
- AFib pattern
- Very low HRV

**Examples:**
- Atrial fibrillation
- Frequent PVCs
- Severe bradycardia
- Persistent tachycardia

**Action:** Recommend medical consult

**Alert:** Email sent immediately

---

### Critical Severity

**Criteria:**
- Life-threatening patterns
- HR < 40 or > 150 BPM at rest
- Ventricular tachycardia
- Complete heart block
- Severe signal degradation during critical event

**Examples:**
- Sustained ventricular tachycardia
- Extreme bradycardia
- Unclear but very abnormal pattern

**Action:** Seek immediate medical care

**Alert:** Email sent immediately with urgent language

**Note:** Claude is configured to be conservative - rarely assigns "critical" unless very concerning pattern

---

## Alert Triggering

### When Alerts Are Created

Alerts are created in DynamoDB when:

```python
if analysis['severity'] in ['medium', 'high', 'critical']:
    create_alert(analysis_record)
```

### Alert Cooldown

**Purpose:** Prevent alert spam

**Logic:**
```python
ALERT_COOLDOWN_MINUTES = 15

# Don't send email if alert sent within last 15 minutes
# UNLESS severity is 'critical'
```

**Example:**
1. **10:00 AM** - Medium alert (PVCs detected) → Email sent
2. **10:10 AM** - Medium alert (PVCs still present) → No email (cooldown)
3. **10:20 AM** - Medium alert → Email sent (cooldown expired)
4. **10:25 AM** - Critical alert → Email sent (cooldown ignored)

### Alert Content

Email includes:
- Timestamp
- Severity level
- Heart rate
- Arrhythmias detected
- Claude's summary
- Recommendations
- Confidence level
- Link to detailed analysis

Example email:

```
Subject: [ECG Alert] MEDIUM - Arrhythmia Detected

Time: 2024-11-06 14:30:45 UTC
Severity: MEDIUM
Device: ecg-device-001
Heart Rate: 72 BPM

Analysis Summary:
Occasional premature ventricular contractions detected during rest period.
R-R intervals show variability consistent with isolated PVCs.

Arrhythmias Detected:
- occasional_pvc

Recommendations:
- Monitor frequency of PVCs over the next 24 hours
- Note if PVCs increase during exercise or stress
- If frequency increases, consult healthcare provider

Confidence: 87%

IMPORTANT: This is a personal health monitoring system, NOT a medical device.
Always consult healthcare professionals for medical decisions.
```

---

## Cost Optimization

### Current Strategy

**10% Sampling:**
- Cost: ~$15/month
- Coverage: Every ~100 seconds
- Flags catch urgent issues between analyses

### Alternative Strategies

#### 1. Smart Sampling (Recommended)

Analyze based on context:

```python
# Higher sampling during day, lower at night
hour = datetime.utcnow().hour
if 22 <= hour or hour <= 6:  # Night (10pm-6am)
    sample_rate = 0.05  # 5%
else:  # Day
    sample_rate = 0.15  # 15%

should_analyze = random.random() < sample_rate
```

**Cost:** ~$12/month
**Benefit:** More coverage when awake

#### 2. Adaptive Sampling

Increase sampling when issues detected:

```python
# Check recent alerts
recent_alerts = get_alerts_last_hour()

if len(recent_alerts) > 0:
    sample_rate = 0.50  # 50% if issues detected
elif flags.get('irregular_rhythm'):
    sample_rate = 1.0  # 100% if flagged
else:
    sample_rate = 0.10  # 10% baseline
```

**Cost:** Variable, ~$20-30/month
**Benefit:** More analysis when needed

#### 3. Manual Triggers

Allow user to request analysis:

```python
# API endpoint: POST /api/analyze/{batch_id}
# Immediately queue batch for Claude analysis
```

**Cost:** User controlled
**Benefit:** On-demand analysis

#### 4. Batch Analysis

Analyze multiple batches together:

```python
# Every hour, send last 6 batches (1 minute of data)
# Claude analyzes trends over longer period
```

**Cost:** ~$10/month (fewer API calls)
**Benefit:** Better trend detection
**Drawback:** Delayed alerts

---

## Performance Metrics

### Response Time

**Target:** < 30 seconds end-to-end

**Breakdown:**
1. Preprocessor Lambda: ~5 seconds
2. SQS queue time: ~1 second
3. AI Analyzer Lambda cold start: ~3 seconds
4. Claude API call: ~5-15 seconds
5. DynamoDB write: ~1 second

**Total typical:** 15-25 seconds

### Accuracy Metrics

**How to measure:**
1. Compare Claude's analysis to medical professional
2. Track false positives (alerts for normal data)
3. Track false negatives (missed arrhythmias)

**Current approach:**
- Conservative bias (prefer false positives)
- "When in doubt, alert"
- Better safe than sorry

**Future improvement:**
- Collect user feedback
- Build validation dataset
- Fine-tune confidence thresholds

### API Reliability

**Claude API uptime:** 99.9%+

**Error handling:**
```python
try:
    response = claude_api.analyze(data)
except Exception as e:
    # Log error
    # Return safe default analysis
    return {
        "severity": "medium",
        "summary": "Analysis unavailable, monitoring recommended",
        "confidence": 0.0
    }
```

---

## Troubleshooting

### Issue: Claude Returns Invalid JSON

**Symptoms:**
- Lambda logs show JSON parse error
- No analysis stored in DynamoDB

**Causes:**
- Claude wrapped JSON in markdown
- Claude added explanation text

**Fix:**
```python
# In lambda/ai-analyzer/handler.py
def parse_claude_response(response_text):
    # Strip markdown code blocks
    if '```json' in response_text:
        json_str = response_text.split('```json')[1].split('```')[0].strip()
    elif '```' in response_text:
        json_str = response_text.split('```')[1].split('```')[0].strip()
    else:
        json_str = response_text.strip()

    return json.loads(json_str)
```

**Already implemented!** ✓

---

### Issue: Too Many API Errors

**Symptoms:**
- CloudWatch logs show rate limit errors
- 429 status codes

**Causes:**
- Exceeded Claude API rate limits
- Burst of traffic

**Fix:**
1. Reduce sampling rate
2. Add retry with exponential backoff
3. Implement queue throttling

---

### Issue: Poor Analysis Quality

**Symptoms:**
- Claude marks normal data as abnormal
- Confidence scores consistently low

**Causes:**
- Poor signal quality
- Incorrect metrics calculation
- Prompt needs tuning

**Fix:**
1. Check preprocessor metrics accuracy
2. Review signal quality thresholds
3. Refine prompt with examples
4. Increase temperature slightly (0.3 → 0.5)

---

### Issue: High Costs

**Symptoms:**
- Claude API bill higher than expected

**Causes:**
- Sampling rate too high
- Long prompts
- Many retries

**Fix:**
1. Reduce sampling rate (10% → 5%)
2. Shorten prompt (remove verbose parts)
3. Check for retry loops
4. Implement daily cost alerts

---

## Summary

**AI Analysis Configuration:**
- ✅ Model: Claude 3.5 Sonnet
- ✅ Frequency: 10% of batches (~every 100 seconds)
- ✅ Input: ECG metrics (HR, HRV, R-R intervals, QRS)
- ✅ Output: Arrhythmias, severity, recommendations
- ✅ Cost: ~$15/month (10% sampling)
- ✅ Response time: 15-25 seconds
- ✅ Alert threshold: Medium severity or higher

**Key Features:**
- 🧠 Medical-grade analysis
- 🚨 Real-time arrhythmia detection
- 📧 Email alerts for significant findings
- 💰 Cost-optimized with smart sampling
- 🔒 Privacy-focused (no raw waveforms sent)
- ⚡ Fast processing (<30 seconds)

**Detected Conditions:**
- Atrial fibrillation
- Premature ventricular contractions
- Bradycardia / Tachycardia
- Heart rate variability issues
- Irregular rhythms
- QRS abnormalities

---

For implementation details, see:
- `lambda/ai-analyzer/handler.py` - Claude integration code
- `lambda/preprocessor/handler.py` - Metrics calculation
- `lambda/alert-worker/handler.py` - Alert logic
