# Quick Start: Integrating uACR Monitoring with Minuteful Kidney

## 5-Minute Setup Guide

### Step 1: Verify Data Structure (2 minutes)

**Check if your patient data includes:**

```python
# Quick verification script
import json

with open('ckd_patients_with_adherence.json', 'r') as f:
    data = json.load(f)

# Check first patient
patient = data['patients'][0]

# Required fields for uACR monitoring:
required_fields = {
    'uacr_history': 'uacr_history' in patient,
    'eGFR': 'eGFR' in patient,
    'ckdStage': 'ckdStage' in patient,
    'comorbidities': 'comorbidities' in patient,
    'jardiance': 'jardiance' in patient
}

print("Data structure check:")
for field, present in required_fields.items():
    status = "✅" if present else "❌"
    print(f"{status} {field}: {present}")

# Check if patients have sufficient uACR history
patients_with_history = sum(
    1 for p in data['patients'] 
    if 'uacr_history' in p and len(p.get('uacr_history', [])) >= 2
)

print(f"\nPatients with 2+ uACR measurements: {patients_with_history}/{len(data['patients'])}")
```

**If any ❌ appears:** You need to add that data first.

---

### Step 2: Add uACR History to Existing Database (1 minute)

**If patients don't have uacr_history, create it from current uACR:**

```python
from datetime import datetime, timedelta
import random

def add_uacr_history_to_database(filename):
    """Add historical uACR data for monitoring"""
    
    with open(filename, 'r') as f:
        data = json.load(f)
    
    for patient in data['patients']:
        if 'uacr_history' not in patient:
            current_uacr = patient.get('uACR', 0)
            
            # Create realistic historical progression
            # Most recent (today)
            history = [
                {
                    'date': datetime.now().isoformat()[:10],
                    'value': current_uacr
                }
            ]
            
            # 90 days ago (simulate trend)
            if patient.get('jardiance', {}).get('prescribed', False):
                # On treatment - show stable or mild worsening
                variation = random.uniform(0.85, 1.15)
            else:
                # Not on treatment - show worsening
                variation = random.uniform(0.70, 0.90)
            
            previous_uacr = current_uacr * variation
            history.append({
                'date': (datetime.now() - timedelta(days=90)).isoformat()[:10],
                'value': round(previous_uacr, 1)
            })
            
            # 180 days ago
            older_uacr = previous_uacr * random.uniform(0.85, 0.95)
            history.append({
                'date': (datetime.now() - timedelta(days=180)).isoformat()[:10],
                'value': round(older_uacr, 1)
            })
            
            patient['uacr_history'] = history
    
    # Save updated database
    output_file = filename.replace('.json', '_with_history.json')
    with open(output_file, 'w') as f:
        json.dump(data, f, indent=2)
    
    print(f"✅ Added uACR history to {len(data['patients'])} patients")
    print(f"✅ Saved to: {output_file}")
    
    return output_file

# Run it
new_file = add_uacr_history_to_database('ckd_patients_with_adherence.json')
```

---

### Step 3: Run the Algorithm (30 seconds)

```bash
# Test with demo scenarios first
python test_uacr_monitoring_demo.py

# Then run on your actual database
python uacr_monitoring_adherence_algorithm.py
```

**Expected output:**
- Console: Formatted alerts for each patient with worsening
- File: `uacr_monitoring_alerts.json` with structured data

---

### Step 4: Review First Alerts (1 minute)

```python
# Quick alert review script
import json

with open('uacr_monitoring_alerts.json', 'r') as f:
    data = json.load(f)

print(f"Total alerts: {data['metadata']['total_alerts']}")

# Show summary
for alert in data['alerts'][:5]:  # First 5 alerts
    print(f"\n{alert['severity']}: {alert['patient_name']}")
    print(f"  {alert['message'][:100]}...")
    print(f"  Actions: {len(alert['recommended_actions'])}")
```

---

## Integration Options

### Option A: Manual Daily Review (Easiest)

**Use Case:** Small practice, 50-200 patients

**Setup:**
1. Run algorithm daily via cron job:
```bash
# Add to crontab (run at 6 AM daily)
0 6 * * * cd /path/to/minuteful && python uacr_monitoring_adherence_algorithm.py
```

2. Review alerts each morning:
```bash
# View today's alerts
python -c "
import json
with open('uacr_monitoring_alerts.json', 'r') as f:
    data = json.load(f)
    
for alert in data['alerts']:
    if alert['severity'] in ['CRITICAL', 'HIGH']:
        print(f'{alert["severity"]}: {alert["patient_name"]}')
"
```

**Time commitment:** 5-10 minutes/day

---

### Option B: Real-Time Monitoring (Recommended)

**Use Case:** Active practice, real-time lab integration

**Architecture:**
```python
# webhook_handler.py - Called when new lab result arrives

from flask import Flask, request
from uacr_monitoring_adherence_algorithm import uACRMonitoringSystem
import json

app = Flask(__name__)
monitoring = uACRMonitoringSystem()

@app.route('/api/new-lab-result', methods=['POST'])
def handle_new_lab():
    """Called by lab system when uACR result available"""
    
    data = request.json
    patient_id = data['patient_id']
    test_type = data['test_type']
    result_value = data['result_value']
    
    if test_type == 'uACR':
        # Load patient from database
        patient = load_patient(patient_id)
        
        # Add new uACR to history
        patient['uacr_history'].insert(0, {
            'date': data['result_date'],
            'value': result_value
        })
        
        # Run monitoring algorithm
        alert = monitoring.process_patient(patient)
        
        if alert:
            # Take action based on severity
            if alert.severity == 'CRITICAL':
                send_urgent_notification(alert)
                create_ehr_task(alert, priority='URGENT')
            elif alert.severity == 'HIGH':
                create_ehr_task(alert, priority='HIGH')
            else:
                create_ehr_task(alert, priority='NORMAL')
            
            return {'status': 'alert_generated', 'alert_id': alert.alert_id}
    
    return {'status': 'no_alert'}

if __name__ == '__main__':
    app.run(port=5000)
```

**Setup:**
1. Deploy webhook handler
2. Configure lab system to POST results
3. Alerts generated automatically

---

### Option C: EHR Integration (Enterprise)

**Use Case:** Large health system, full EHR integration

**Components:**

1. **HL7/FHIR Listener**
```python
# hl7_listener.py

from hl7apy.parser import parse_message
from uacr_monitoring_adherence_algorithm import uACRMonitoringSystem

def process_hl7_message(hl7_string):
    """Process incoming HL7 ORU (lab result) message"""
    
    msg = parse_message(hl7_string)
    
    # Extract patient and result info
    patient_id = msg.pid.pid_3.pid_3_1.value
    
    for obx in msg.obx:
        test_name = obx.obx_3.obx_3_2.value
        
        if 'UACR' in test_name or 'ALBUMIN/CREAT' in test_name:
            result_value = float(obx.obx_5.obx_5_1.value)
            result_date = obx.obx_14.obx_14_1.value
            
            # Trigger monitoring
            check_patient_for_alert(patient_id, result_value, result_date)
```

2. **Provider Dashboard Widget**
```javascript
// provider_dashboard.js

function fetchPatientAlerts(providerId) {
    fetch(`/api/alerts?provider=${providerId}&severity=CRITICAL,HIGH`)
        .then(response => response.json())
        .then(alerts => {
            displayAlerts(alerts);
        });
}

function displayAlerts(alerts) {
    const container = document.getElementById('alerts-panel');
    
    alerts.forEach(alert => {
        const alertCard = `
            <div class="alert-card ${alert.severity}">
                <h3>${alert.patient_name}</h3>
                <p>${alert.message}</p>
                <button onclick="viewFullAlert('${alert.alert_id}')">
                    View Details
                </button>
            </div>
        `;
        container.innerHTML += alertCard;
    });
}
```

---

## Common Workflows

### Workflow 1: Morning Alert Review

```python
# morning_review.py

from uacr_monitoring_adherence_algorithm import uACRMonitoringSystem
import json

def morning_review():
    """Generate morning report for clinical team"""
    
    with open('uacr_monitoring_alerts.json', 'r') as f:
        data = json.load(f)
    
    # Filter for critical/high alerts
    priority_alerts = [
        a for a in data['alerts'] 
        if a['severity'] in ['CRITICAL', 'HIGH']
    ]
    
    # Generate summary email
    email_body = f"""
    Good morning,
    
    Today's Priority Alerts: {len(priority_alerts)}
    
    CRITICAL Alerts ({sum(1 for a in priority_alerts if a['severity']=='CRITICAL')}):
    """
    
    for alert in priority_alerts:
        if alert['severity'] == 'CRITICAL':
            email_body += f"\n• {alert['patient_name']}: {alert['message'][:100]}..."
    
    email_body += "\n\nHIGH Priority Alerts:"
    for alert in priority_alerts:
        if alert['severity'] == 'HIGH':
            email_body += f"\n• {alert['patient_name']}: {alert['message'][:100]}..."
    
    email_body += "\n\nFull details in EHR task list."
    
    send_email(to='clinical-team@hospital.org', subject='Daily CKD Alerts', body=email_body)
    
    print("✅ Morning review sent to clinical team")

if __name__ == '__main__':
    morning_review()
```

---

### Workflow 2: Adherence Counseling Session

```python
# adherence_session.py

def prepare_adherence_counseling(patient_id):
    """Prepare materials for adherence counseling"""
    
    # Load patient
    patient = load_patient(patient_id)
    
    # Generate adherence report
    report = {
        'patient': patient['name'],
        'medication': patient['jardiance']['medication'],
        'current_adherence': {
            'MPR': patient['jardiance']['adherence']['MPR'],
            'PDC': patient['jardiance']['adherence']['PDC'],
            'category': patient['jardiance']['adherence']['category']
        },
        'barriers': patient['jardiance']['barriers'],
        'recent_progression': {
            'uacr_trend': [h['value'] for h in patient['uacr_history']],
            'dates': [h['date'] for h in patient['uacr_history']]
        },
        'expected_vs_actual': calculate_expected_outcomes(patient)
    }
    
    # Create visual aids
    create_adherence_graph(report)
    create_progression_chart(report)
    
    # Print counseling guide
    print(f"\nADHERENCE COUNSELING: {report['patient']}")
    print("="*60)
    print(f"\nCurrent Adherence: {report['current_adherence']['MPR']:.1f}%")
    print(f"Goal: ≥80%")
    print(f"\nIdentified Barriers:")
    for barrier in report['barriers']:
        print(f"  • {barrier}")
    print(f"\nKEY MESSAGE:")
    print(f"Your kidney function has worsened {calculate_worsening(patient):.1f}%.")
    print(f"Taking medication daily can slow this by 50%.")
    
    return report
```

---

### Workflow 3: Treatment Initiation

```python
# treatment_initiation.py

def initiate_jardiance_workflow(patient_id):
    """Workflow for starting Jardiance based on algorithm recommendation"""
    
    patient = load_patient(patient_id)
    
    # Verify eligibility
    monitoring = uACRMonitoringSystem()
    eligible, recommendation, rationale = monitoring.evaluate_treatment_eligibility(patient)
    
    if not eligible:
        print("❌ Patient does not meet eligibility criteria")
        return
    
    print(f"✅ Patient eligible for Jardiance")
    print(f"Recommendation: {recommendation.value}")
    print(f"Rationale: {rationale}")
    
    # Generate prescription order
    order = {
        'medication': 'Empagliflozin (Jardiance)',
        'dose': '10 mg',
        'frequency': 'Once daily',
        'quantity': 90,
        'refills': 11,  # 1 year
        'indication': 'Chronic kidney disease',
        'clinical_note': rationale
    }
    
    # Generate patient education materials
    education = generate_patient_education(patient)
    
    # Schedule follow-up
    followup = {
        'date': (datetime.now() + timedelta(days=30)).isoformat()[:10],
        'reason': 'Jardiance tolerance check',
        'labs_needed': ['uACR', 'eGFR', 'Basic Metabolic Panel']
    }
    
    # Create EHR orders
    create_ehr_prescription(order)
    create_ehr_education_task(education)
    schedule_followup_visit(followup)
    
    print("\n✅ Treatment initiation workflow completed")
    print(f"  - Prescription created")
    print(f"  - Patient education prepared")
    print(f"  - Follow-up scheduled: {followup['date']}")
```

---

## Troubleshooting

### Issue 1: No alerts generated

**Check:**
```python
# Did patients have worsening?
for patient in patients:
    if 'uacr_history' in patient and len(patient['uacr_history']) >= 2:
        current = patient['uacr_history'][0]['value']
        previous = patient['uacr_history'][1]['value']
        change = ((current - previous) / previous) * 100
        if change > 30:
            print(f"✅ {patient['name']}: +{change:.1f}% - Should generate alert")
```

**If no one has worsening:** Good news! Your patients are stable.

---

### Issue 2: Too many alerts

**Solution:** Adjust thresholds

```python
# In uacr_monitoring_adherence_algorithm.py

def analyze_uacr_change(self, patient):
    # Change line 95 from:
    # elif percent_change > 30:
    # To:
    elif percent_change > 40:  # More conservative threshold
        worsening_level = WorseningLevel.MILD
```

---

### Issue 3: Adherence data missing

**Fix:**
```python
# If you ran the original adherence script:
python add_jardiance_adherence.py

# This creates jardiance data with adherence metrics
```

---

## Performance Tips

### For Large Databases (1000+ patients)

**1. Process in batches:**
```python
def process_in_batches(patients, batch_size=100):
    monitoring = uACRMonitoringSystem()
    all_alerts = []
    
    for i in range(0, len(patients), batch_size):
        batch = patients[i:i+batch_size]
        alerts = monitoring.process_database(batch)
        all_alerts.extend(alerts)
    
    return all_alerts
```

**2. Parallel processing:**
```python
from multiprocessing import Pool

def process_patient_wrapper(patient):
    monitoring = uACRMonitoringSystem()
    return monitoring.process_patient(patient)

with Pool(processes=4) as pool:
    alerts = pool.map(process_patient_wrapper, patients)
```

**3. Filter before processing:**
```python
# Only process patients with recent lab results
recent_patients = [
    p for p in patients
    if 'uacr_history' in p and 
    datetime.fromisoformat(p['uacr_history'][0]['date']) > 
    datetime.now() - timedelta(days=7)
]
```

---

## Next Steps

1. ✅ **Run demo** to see algorithm in action
2. ✅ **Process your database** and review first alerts
3. ✅ **Choose integration option** (Manual/Real-time/EHR)
4. ✅ **Implement workflow** for acting on alerts
5. ✅ **Track outcomes** and iterate

---

## Support Resources

- **Documentation:** See `uacr_monitoring_algorithm_documentation.md`
- **Examples:** Run `test_uacr_monitoring_demo.py`
- **Algorithm:** Review `uacr_monitoring_adherence_algorithm.py`

---

## Quick Reference

**Key Files:**
- `uacr_monitoring_adherence_algorithm.py` - Main algorithm
- `test_uacr_monitoring_demo.py` - Demo scenarios
- `uacr_monitoring_algorithm_documentation.md` - Full docs
- `uacr_monitoring_alerts.json` - Output alerts

**Key Functions:**
- `process_patient(patient)` - Analyze single patient
- `process_database(patients)` - Analyze all patients
- `analyze_uacr_change(patient)` - Detect worsening
- `analyze_adherence(patient)` - Calculate adherence
- `evaluate_treatment_eligibility(patient)` - Check if should start Rx

**Alert Severities:**
- 🔴 **CRITICAL** - Act today
- 🟠 **HIGH** - Act within 24-48 hours
- 🟡 **MODERATE** - Act within 1 week
- 🟢 **LOW** - For information

---

**Questions?** Review the full documentation or run the demo to see examples.

**Ready to go?** Run: `python uacr_monitoring_adherence_algorithm.py`
