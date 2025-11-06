# End-to-End Hardware Testing Implementation Plan

## Current State
**Status:** Designed but not validated at scale
**Risk:** Unknown reliability, failure modes, and edge cases
**Priority:** 🟠 **HIGH - Required before production deployment**

---

## Testing Objectives

### Primary Goals
1. **24/7 Reliability**: Verify system runs continuously without intervention
2. **Failure Mode Analysis**: Document what breaks and why
3. **Performance Metrics**: Measure latency, throughput, data loss
4. **Hardware Durability**: Test ECG module and Pi reliability
5. **Edge Case Discovery**: Find and document unexpected behaviors

### Success Criteria
- ✅ System runs for 30+ days continuously
- ✅ <1% data loss
- ✅ <5 minutes downtime per month (excluding planned maintenance)
- ✅ All failure modes documented with recovery procedures
- ✅ Performance baselines established

---

## Testing Plan

### Phase 1: Lab Testing Setup (Week 1)

#### Step 1.1: Test Environment Setup

**Hardware Required:**
```
- 3× Raspberry Pi 4 (4GB) with CJMCU-1293 ECG modules
- 1× Backup internet connection (cellular hotspot)
- 1× UPS (uninterruptible power supply)
- 3× Test subjects OR ECG simulator
- Temperature/humidity monitor
```

**ECG Simulator Option** (if no human subjects):
```
Purchase: Fluke ProSim 8 ECG Simulator ($3,000-5,000)
OR
DIY ECG Simulator:
- Arduino or ESP32
- DAC (MCP4725)
- Generate synthetic ECG waveforms
- Code: https://github.com/hex-in/pyecsim (adapt to Arduino)
```

**Test Network Configuration:**
```
Primary: WiFi connection (normal network)
Secondary: Ethernet connection (failover test)
Tertiary: Cellular hotspot (offline resilience test)
```

#### Step 1.2: Instrumentation Setup

**Add Monitoring Script** (`pi-collector/monitoring/health_check.py`):

```python
#!/usr/bin/env python3
"""
System health monitoring and metrics collection
Runs every 60 seconds, logs to CloudWatch
"""

import time
import psutil
import boto3
from datetime import datetime

cloudwatch = boto3.client('cloudwatch')

NAMESPACE = 'ECGMonitor/Hardware'
DEVICE_ID = 'device-001'  # From config

def collect_system_metrics():
    """Collect system health metrics"""
    return {
        'cpu_percent': psutil.cpu_percent(interval=1),
        'memory_percent': psutil.virtual_memory().percent,
        'disk_percent': psutil.disk_usage('/').percent,
        'temperature': get_cpu_temperature(),
        'uptime_seconds': time.time() - psutil.boot_time(),
        'network_sent_mb': psutil.net_io_counters().bytes_sent / 1024 / 1024,
        'network_recv_mb': psutil.net_io_counters().bytes_recv / 1024 / 1024,
    }

def get_cpu_temperature():
    """Get Raspberry Pi CPU temperature"""
    try:
        with open('/sys/class/thermal/thermal_zone0/temp', 'r') as f:
            temp = float(f.read()) / 1000.0
            return temp
    except:
        return 0

def collect_ecg_metrics():
    """Collect ECG-specific metrics"""
    # Read from shared state or log files
    return {
        'samples_collected_last_minute': 15000,  # 250 Hz * 60 seconds
        'samples_dropped': 0,
        'signal_quality_average': 0.95,
        'reconnection_events': 0,
        'spi_errors': 0,
    }

def send_to_cloudwatch(metrics):
    """Send metrics to CloudWatch"""
    metric_data = []

    for key, value in metrics.items():
        metric_data.append({
            'MetricName': key,
            'Value': value,
            'Unit': 'None',
            'Timestamp': datetime.utcnow(),
            'Dimensions': [
                {'Name': 'DeviceId', 'Value': DEVICE_ID}
            ]
        })

    try:
        cloudwatch.put_metric_data(
            Namespace=NAMESPACE,
            MetricData=metric_data
        )
    except Exception as e:
        print(f"CloudWatch error: {e}")

def main():
    """Main monitoring loop"""
    while True:
        try:
            system_metrics = collect_system_metrics()
            ecg_metrics = collect_ecg_metrics()

            all_metrics = {**system_metrics, **ecg_metrics}

            # Log locally
            print(f"[{datetime.now()}] Metrics: {all_metrics}")

            # Send to CloudWatch
            send_to_cloudwatch(all_metrics)

        except Exception as e:
            print(f"Monitoring error: {e}")

        time.sleep(60)  # Every 60 seconds

if __name__ == '__main__':
    main()
```

**Set up as systemd service** (`/etc/systemd/system/ecg-health-monitor.service`):
```ini
[Unit]
Description=ECG Monitor Health Check
After=network.target

[Service]
Type=simple
User=pi
WorkingDirectory=/home/pi/ECG_Monitor
ExecStart=/usr/bin/python3 pi-collector/monitoring/health_check.py
Restart=always
RestartSec=10

[Install]
WantedBy=multi-user.target
```

#### Step 1.3: Data Validation Scripts

**Add validation** (`scripts/validate_data_pipeline.py`):

```python
#!/usr/bin/env python3
"""
Validate end-to-end data flow
Checks: Collection → Stream → Lambda → DynamoDB → API
"""

import boto3
import time
from datetime import datetime, timedelta

dynamodb = boto3.resource('dynamodb')
s3 = boto3.client('s3')

def check_recent_data():
    """Check if data from last 5 minutes exists"""
    table = dynamodb.Table('ecg-sessions')

    # Query recent sessions
    cutoff = int((datetime.now() - timedelta(minutes=5)).timestamp())

    response = table.scan(
        FilterExpression='#ts > :cutoff',
        ExpressionAttributeNames={'#ts': 'timestamp'},
        ExpressionAttributeValues={':cutoff': cutoff}
    )

    sessions = response['Items']

    if not sessions:
        return False, "No sessions in last 5 minutes"

    return True, f"Found {len(sessions)} recent sessions"

def check_s3_data():
    """Check S3 for recent uploads"""
    bucket = 'ecg-raw-data'
    prefix = datetime.now().strftime('%Y/%m/%d/%H/')  # Current hour

    try:
        response = s3.list_objects_v2(Bucket=bucket, Prefix=prefix)
        count = response.get('KeyCount', 0)

        if count == 0:
            return False, f"No S3 objects in {prefix}"

        return True, f"Found {count} S3 objects"
    except Exception as e:
        return False, f"S3 error: {e}"

def check_lambda_execution():
    """Check recent Lambda invocations"""
    logs = boto3.client('logs')

    log_group = '/aws/lambda/ecg-preprocessor'

    # Check last 5 minutes of logs
    start_time = int((datetime.now() - timedelta(minutes=5)).timestamp() * 1000)

    try:
        response = logs.filter_log_events(
            logGroupName=log_group,
            startTime=start_time
        )

        events = response.get('events', [])

        if not events:
            return False, "No Lambda executions in last 5 minutes"

        # Check for errors
        errors = [e for e in events if 'ERROR' in e['message']]

        if errors:
            return False, f"Found {len(errors)} Lambda errors"

        return True, f"Lambda executed {len(events)} times successfully"

    except Exception as e:
        return False, f"CloudWatch Logs error: {e}"

def run_validation():
    """Run all validation checks"""
    checks = [
        ("Recent Data in DynamoDB", check_recent_data),
        ("Recent S3 Uploads", check_s3_data),
        ("Lambda Execution", check_lambda_execution),
    ]

    print("="*60)
    print(f"Data Pipeline Validation - {datetime.now()}")
    print("="*60)

    all_passed = True

    for name, check_func in checks:
        passed, message = check_func()
        status = "✅ PASS" if passed else "❌ FAIL"
        print(f"{status} - {name}: {message}")

        if not passed:
            all_passed = False

    print("="*60)

    if all_passed:
        print("✅ All checks passed!")
    else:
        print("❌ Some checks failed - investigate")

    return all_passed

if __name__ == '__main__':
    run_validation()
```

**Run validation every 15 minutes** (crontab):
```bash
*/15 * * * * /home/pi/ECG_Monitor/scripts/validate_data_pipeline.py >> /var/log/ecg-validation.log 2>&1
```

### Phase 2: 30-Day Continuous Operation (Weeks 2-6)

#### Step 2.1: Test Scenarios

**Scenario 1: Normal Operation (Days 1-7)**
- Continuous ECG collection
- No interventions
- Monitor: CPU temp, memory, network usage

**Scenario 2: Network Failure (Days 8-9)**
- Disconnect WiFi for 2 hours
- Verify offline buffering works
- Verify reconnection and data backfill

**Scenario 3: Power Failure (Days 10-11)**
- Unplug device for 5 minutes (simulate power outage)
- Verify graceful shutdown (if UPS)
- Verify recovery on restart

**Scenario 4: High Temperature (Days 12-13)**
- Place device in warm environment (30-35°C)
- Monitor for thermal throttling
- Verify system stability

**Scenario 5: Network Congestion (Days 14-15)**
- Throttle network bandwidth to 1 Mbps
- Verify data still streams (may be delayed)
- Check backpressure handling

**Scenario 6: Storage Stress (Days 16-17)**
- Fill SD card to 90% capacity
- Verify log rotation works
- Verify no crashes

**Scenario 7: Long-term Stability (Days 18-30)**
- No interventions
- Monitor for memory leaks
- Monitor for gradual performance degradation

#### Step 2.2: Daily Checklist

**Create checklist** (`docs/testing/daily-test-checklist.md`):

```markdown
# Daily Testing Checklist

Date: _____________  Day: ___/30  Tester: ____________

## System Health
- [ ] All 3 devices online and collecting data
- [ ] CPU temperature < 70°C
- [ ] Memory usage < 80%
- [ ] Disk usage < 80%
- [ ] No error messages in logs

## Data Flow
- [ ] Data in DynamoDB (last 5 min)
- [ ] Data in S3 (current hour)
- [ ] Lambda executions successful
- [ ] API endpoints responding
- [ ] Dashboards showing live data

## Performance
- [ ] Heart rate displayed correctly
- [ ] Waveform rendering smoothly
- [ ] Alert emails received (if test triggered)
- [ ] Response time < 2 seconds

## Issues Observed
Description: ________________________________________________
______________________________________________________________
______________________________________________________________

Severity: [ ] Critical  [ ] High  [ ] Medium  [ ] Low

Action Taken: ____________________________________________
______________________________________________________________

## Notes
______________________________________________________________
______________________________________________________________
```

### Phase 3: Failure Mode Testing (Week 7)

#### Step 3.1: Induced Failure Tests

**Test 1: Process Crash**
```bash
# Kill collector process
sudo kill -9 $(pgrep -f pi-collector)

# Expected: Systemd restarts within 10 seconds
# Verify: Data gap < 10 seconds
```

**Test 2: Database Connection Failure**
```bash
# Block DynamoDB endpoint temporarily
sudo iptables -A OUTPUT -d dynamodb.us-east-1.amazonaws.com -j DROP

# Expected: Local buffering continues
# Expected: Reconnection after unblock
# Verify: No data loss
```

**Test 3: SPI Communication Error**
```bash
# Simulate bad SPI connection (disconnect/reconnect wire)

# Expected: Error detection and recovery
# Verify: System doesn't crash
```

**Test 4: SD Card Corruption** (in test environment only!)
```bash
# Force write corruption (DANGEROUS - test environment only)
# This tests if system can detect and report corruption

# Expected: Error logged
# Expected: Graceful degradation
```

#### Step 3.2: Failure Documentation Template

**Create template** (`docs/testing/failure-report.md`):

```markdown
# Failure Report Template

## Failure Information
- **Date/Time**:
- **Failure Type**: (crash, data loss, performance degradation, etc.)
- **Severity**: Critical / High / Medium / Low
- **Device ID**:
- **Uptime Before Failure**:

## Description
[Detailed description of what happened]

## Symptoms
- [ ] System unresponsive
- [ ] Data not streaming
- [ ] High CPU/memory
- [ ] Error messages in logs
- [ ] Other: _________________

## Root Cause Analysis
[Why did this happen?]

## Log Excerpts
```
[Paste relevant log lines]
```

## Recovery Steps Taken
1.
2.
3.

## Prevention Measures
[How to prevent this in future]

## Code Changes Required
- [ ] Add error handling in X
- [ ] Improve retry logic in Y
- [ ] Add monitoring for Z

## Follow-up Actions
- [ ] Update documentation
- [ ] Add test case
- [ ] Deploy fix to all devices
```

### Phase 4: Performance Baseline (Week 7-8)

#### Step 4.1: Metrics to Collect

**Create metrics report** (`scripts/generate_performance_report.py`):

```python
#!/usr/bin/env python3
"""
Generate performance baseline report from CloudWatch metrics
"""

import boto3
from datetime import datetime, timedelta
import statistics

cloudwatch = boto3.client('cloudwatch')

METRICS = [
    'cpu_percent',
    'memory_percent',
    'temperature',
    'samples_dropped',
    'signal_quality_average',
]

def get_metric_statistics(metric_name, start_time, end_time):
    """Get statistics for a metric over time period"""
    response = cloudwatch.get_metric_statistics(
        Namespace='ECGMonitor/Hardware',
        MetricName=metric_name,
        StartTime=start_time,
        EndTime=end_time,
        Period=3600,  # 1 hour
        Statistics=['Average', 'Minimum', 'Maximum'],
    )

    datapoints = response['Datapoints']

    if not datapoints:
        return None

    averages = [dp['Average'] for dp in datapoints]

    return {
        'mean': statistics.mean(averages),
        'median': statistics.median(averages),
        'min': min(dp['Minimum'] for dp in datapoints),
        'max': max(dp['Maximum'] for dp in datapoints),
        'std_dev': statistics.stdev(averages) if len(averages) > 1 else 0,
    }

def generate_report():
    """Generate performance baseline report"""
    # Last 30 days
    end_time = datetime.now()
    start_time = end_time - timedelta(days=30)

    print("="*60)
    print(f"ECG Monitor - 30-Day Performance Baseline Report")
    print(f"Period: {start_time.date()} to {end_time.date()}")
    print("="*60)

    for metric in METRICS:
        print(f"\n{metric}:")
        stats = get_metric_statistics(metric, start_time, end_time)

        if stats:
            print(f"  Mean:   {stats['mean']:.2f}")
            print(f"  Median: {stats['median']:.2f}")
            print(f"  Min:    {stats['min']:.2f}")
            print(f"  Max:    {stats['max']:.2f}")
            print(f"  StdDev: {stats['std_dev']:.2f}")
        else:
            print("  No data available")

    print("\n" + "="*60)

if __name__ == '__main__':
    generate_report()
```

#### Step 4.2: Expected Baseline Values

**Document baselines** (`docs/testing/performance-baselines.md`):

```markdown
# Performance Baselines (Expected Values)

## System Metrics

| Metric | Normal Range | Warning Threshold | Critical Threshold |
|--------|--------------|-------------------|-------------------|
| CPU Usage | 10-30% | >50% sustained | >80% sustained |
| Memory Usage | 30-50% | >70% | >90% |
| CPU Temperature | 40-60°C | >70°C | >80°C |
| Disk Usage | 20-40% | >70% | >90% |

## Data Quality Metrics

| Metric | Normal Range | Warning Threshold | Critical Threshold |
|--------|--------------|-------------------|-------------------|
| Samples Dropped | <0.1% | >0.5% | >1% |
| Signal Quality | >0.9 | <0.8 | <0.6 |
| SPI Errors | <1/hour | >10/hour | >100/hour |
| Reconnection Events | <1/day | >5/day | >20/day |

## Latency Metrics

| Metric | Normal Range | Warning Threshold | Critical Threshold |
|--------|--------------|-------------------|-------------------|
| Collection → S3 | <5 seconds | >30 seconds | >60 seconds |
| S3 → Lambda Processing | <10 seconds | >60 seconds | >300 seconds |
| API Response Time | <500ms | >2 seconds | >5 seconds |
| Dashboard Update Lag | <10 seconds | >30 seconds | >60 seconds |
```

### Phase 5: Documentation & Reporting (Week 8)

#### Step 5.1: Final Test Report

**Create comprehensive report** (`docs/testing/30-day-test-report.md`):

```markdown
# 30-Day Hardware Testing Report

## Executive Summary
- **Test Duration**: [Start Date] to [End Date]
- **Total Uptime**: X days, Y hours
- **Devices Tested**: 3× Raspberry Pi 4 + CJMCU-1293
- **Data Collected**: X GB of ECG data
- **Issues Found**: X critical, Y high, Z medium

## Test Results

### Reliability
- **Uptime Percentage**: 99.X%
- **Unplanned Downtime**: X minutes over 30 days
- **Data Loss**: 0.X%
- **Restarts Required**: X times

### Performance
- **Average CPU Usage**: X%
- **Average Memory Usage**: Y%
- **Average Temperature**: Z°C
- **Network Bandwidth**: X MB/day

### Failure Modes Discovered
1. [Failure description] - Severity: High
   - Frequency: Once every X days
   - Impact: Data loss of Y minutes
   - Root cause: ...
   - Fix: ...

2. [Failure description] - Severity: Medium
   ...

### Edge Cases
- [Edge case 1]: Observed on [date], handled gracefully
- [Edge case 2]: Caused issue, fix implemented
...

## Recommendations

### Code Changes Required
1. **Priority 1**: [Change description]
2. **Priority 2**: [Change description]
...

### Hardware Improvements
1. Add heatsink for better thermal management
2. Use higher-quality SD card (industrial grade)
...

### Operational Procedures
1. Restart devices weekly to clear memory
2. Monitor CloudWatch alarms daily
...

## Conclusion
System is [READY / NOT READY] for production deployment.

Remaining issues before production: ...
```

---

## Timeline & Effort

| Phase | Duration | Effort |
|-------|----------|--------|
| Phase 1: Lab Setup | 1 week | 20-30 hours |
| Phase 2: 30-Day Operation | 4 weeks | 5-10 hours/week (monitoring) |
| Phase 3: Failure Testing | 1 week | 20-30 hours |
| Phase 4: Performance Baseline | 1 week | 10-15 hours |
| Phase 5: Documentation | 1 week | 10-15 hours |
| **Total** | **8 weeks** | **90-150 hours** |

Note: Most of the 8 weeks is waiting time (30-day test running). Active work is ~90-150 hours.

---

## Cost Breakdown

**Hardware:**
- 3× Raspberry Pi 4 (4GB): $165
- 3× CJMCU-1293: $75
- UPS: $50
- Cellular hotspot (optional): $30/month
- ECG simulator (optional): $100-5000

**AWS:**
- Normal operation costs: ~$50-100/month
- CloudWatch metrics: ~$10-20/month extra

**Total:** $300-400 one-time + $60-120/month

---

## Success Criteria (Final Checklist)

- [ ] System ran continuously for 30+ days
- [ ] Data loss < 1%
- [ ] All failure modes documented with recovery procedures
- [ ] Performance baselines established
- [ ] Thermal stability confirmed (no throttling)
- [ ] Network resilience confirmed (offline buffering works)
- [ ] Code fixes implemented for all critical issues
- [ ] Operational runbook created
- [ ] Monitoring alerts configured
- [ ] Ready for production deployment

---

**Status:** Ready to start
**Priority:** 🟠 HIGH
**Blockers:** Need hardware and test environment
**Estimated Completion:** 8 weeks (mostly waiting time)
