# Print Template Customization Guide

## Overview

The SEMS print system now supports fully customizable pharmacy label templates. Users can create, edit, and manage multiple print templates with dynamic placeholders that are replaced with actual prescription data at print time.

## Features

✅ **Multiple Templates** - Create and manage multiple print templates  
✅ **HTML & ESC/POS** - Support for web-based (HTML/PDF) and thermal printer (ESC/POS) templates  
✅ **Placeholder System** - Use dynamic placeholders like `{{drugName}}`, `{{dose}}`, etc.  
✅ **Conditional Sections** - Hide optional fields when empty: `{{#fieldName}}...{{/fieldName}}`  
✅ **Template Preview** - Built-in help and reference for all available placeholders  
✅ **Default Templates** - Set a default template that will be used for all prints  
✅ **Persistent Storage** - Templates are stored in IndexedDB for offline access  

## Accessing the Template Editor

1. Login to SEMS
2. Click the **⚙️ Settings** button in the header
3. Click **Print Templates** → **Manage Templates**

## Available Placeholders

### Drug Information
- `{{drugName}}` - The drug's generic name (e.g., "Amoxicillin")
- `{{strength}}` - Drug strength (e.g., "500 mg")
- `{{dose}}` - Calculated dose amount in mg
- `{{frequency}}` - How often to take (e.g., "Every 8 hours")
- `{{duration}}` - Treatment duration (e.g., "7 days")
- `{{route}}` - Route of administration (e.g., "oral", "IV", "IM")
- `{{instructions}}` - Special instructions for the patient

### Patient Information
- `{{patientName}}` - Patient's name
- `{{patientAge}}` - Patient's age in years
- `{{patientWeight}}` - Patient's weight in kg

### Pharmacist & Timestamp
- `{{pharmacistName}}` - Name of the pharmacist who dispensed
- `{{date}}` - Current date (formatted)
- `{{time}}` - Current time (formatted)

### Additional
- `{{warnings}}` - Drug warnings (semicolon-separated)
- `{{contraindications}}` - Contraindications (if any)

## Template Syntax

### Simple Placeholders
Replace any placeholder with its actual value:

```html
<h1>{{drugName}}</h1>
<p>Dose: {{dose}} mg</p>
```

### Conditional Sections
Wrap optional content to hide it when a field is empty:

```html
<!-- Only shows if patient has a name -->
{{#patientName}}
  <p>Patient: {{patientName}}</p>
{{/patientName}}

<!-- Only shows if patient age is provided -->
{{#patientAge}}
  <p>Age: {{patientAge}} years</p>
{{/patientAge}}
```

## Creating a Custom Template

### Step 1: Access Template Editor
Go to Settings → Print Templates

### Step 2: Create New Template
Click the **+ New Template** button

### Step 3: Enter Template Details
- **Template Name**: Give your template a descriptive name (required)
- **Description**: Optional description of what this template is for

### Step 4: Design HTML Template
Enter your custom HTML in the **HTML Template** field:

```html
<!DOCTYPE html>
<html>
<head>
  <title>Pharmacy Label</title>
  <style>
    body { font-family: Arial, sans-serif; margin: 10px; }
    .drug-name { font-size: 24px; font-weight: bold; }
    .field { margin: 5px 0; }
  </style>
</head>
<body>
  <div class="drug-name">{{drugName}}</div>
  <div class="field"><strong>Strength:</strong> {{strength}}</div>
  <div class="field"><strong>Dose:</strong> {{dose}} mg</div>
  <div class="field"><strong>Frequency:</strong> {{frequency}}</div>
  <div class="field"><strong>Duration:</strong> {{duration}}</div>
  {{#patientName}}
  <div class="field"><strong>Patient:</strong> {{patientName}}</div>
  {{/patientName}}
  <div class="field"><strong>Date:</strong> {{date}}</div>
</body>
</html>
```

### Step 5: (Optional) Add Thermal Printer Template
For thermal printer support, add an **ESC/POS Template**:

```
{{drugName}}
Strength: {{strength}}
Dose: {{dose}} mg
Frequency: {{frequency}}
{{#patientName}}Patient: {{patientName}}{{/patientName}}
Date: {{date}}
```

### Step 6: Save Template
Click **Save Template** to store it in the database

### Step 7: Set as Default (Optional)
Select your template and click **Set as Default** to use it for all prints

## Example Templates

### Minimal Label
```html
<!DOCTYPE html>
<html>
<head>
  <title>Label</title>
  <style>
    body { font-family: monospace; margin: 10px; }
  </style>
</head>
<body>
  <strong>{{drugName}} {{strength}}</strong><br>
  {{dose}} mg - {{frequency}}<br>
  {{duration}}<br><br>
  Date: {{date}}
</body>
</html>
```

### Detailed Hospital Label
```html
<!DOCTYPE html>
<html>
<head>
  <title>Hospital Pharmacy Label</title>
  <style>
    body { font-family: Arial; margin: 0; padding: 15px; width: 300px; }
    .label { border: 2px solid black; padding: 10px; }
    .warning { background: #ffcccc; padding: 5px; margin: 10px 0; }
  </style>
</head>
<body>
  <div class="label">
    <div style="font-size: 18px; font-weight: bold;">{{drugName}}</div>
    <div style="font-size: 12px; color: #666;">{{strength}}</div>
    
    <div style="margin-top: 10px;">
      <strong>Dosage:</strong> {{dose}} mg<br>
      <strong>Frequency:</strong> {{frequency}}<br>
      <strong>Duration:</strong> {{duration}}<br>
      <strong>Route:</strong> {{route}}
    </div>

    {{#patientName}}
    <div style="margin-top: 10px; border-top: 1px solid #ccc; padding-top: 10px;">
      <strong>Patient:</strong> {{patientName}}<br>
      {{#patientAge}}<strong>Age:</strong> {{patientAge}} years<br>{{/patientAge}}
      {{#patientWeight}}<strong>Weight:</strong> {{patientWeight}} kg<br>{{/patientWeight}}
    </div>
    {{/patientName}}

    {{#warnings}}
    <div class="warning">
      <strong>⚠️ Warnings:</strong><br>
      {{warnings}}
    </div>
    {{/warnings}}

    <div style="margin-top: 10px; font-size: 10px; border-top: 1px solid #ccc; padding-top: 10px;">
      <strong>Instructions:</strong> {{instructions}}<br>
      Dispensed: {{date}} {{time}}<br>
      {{#pharmacistName}}By: {{pharmacistName}}{{/pharmacistName}}
    </div>
  </div>
</body>
</html>
```

### Pediatric Label (with Weight-Based Dosing)
```html
<!DOCTYPE html>
<html>
<head>
  <title>Pediatric Dose Label</title>
  <style>
    body { font-family: Arial; padding: 10px; }
    .pediatric { background: #e3f2fd; border: 2px solid #2196F3; padding: 10px; }
    .warning { color: #D32F2F; font-weight: bold; }
  </style>
</head>
<body>
  <div class="pediatric">
    <div style="font-size: 20px; font-weight: bold; color: #2196F3;">{{drugName}}</div>
    
    <div style="margin-top: 10px;">
      {{#patientWeight}}
      <div><strong>Weight:</strong> {{patientWeight}} kg</div>
      {{/patientWeight}}
      {{#patientAge}}
      <div><strong>Age:</strong> {{patientAge}} years</div>
      {{/patientAge}}
    </div>

    <div class="warning" style="margin-top: 10px;">
      DOSE: {{dose}} mg
    </div>

    <div style="margin-top: 10px;">
      <strong>Frequency:</strong> {{frequency}}<br>
      <strong>Duration:</strong> {{duration}}<br>
      <strong>Route:</strong> {{route}}
    </div>

    <div style="margin-top: 10px; font-size: 12px;">
      Instructions: {{instructions}}<br>
      Dispensed: {{date}} at {{time}}
    </div>
  </div>
</body>
</html>
```

## Managing Templates

### Edit a Template
1. Select the template from the list
2. Click **Edit**
3. Make your changes
4. Click **Save Template**

### Delete a Template
1. Select the template
2. Click **Delete**
3. Confirm deletion

### Set as Default
1. Select the template
2. Click **Set as Default**
3. This template will be used for all new prints

## Tips & Best Practices

1. **Test Your Template**: Create test prints to see how your template looks
2. **Use Conditional Sections**: Hide optional fields to keep labels clean
3. **Keep It Simple**: Pharmacy staff need quick labels - avoid cluttering
4. **Thermal Printer Format**: ESC/POS templates should be plain text for better compatibility
5. **Backup Templates**: Document important templates in case you need to recreate them
6. **Mobile Responsive**: Consider how templates look on different printer widths

## Troubleshooting

### Template Not Printing
- Check that all required placeholders are included
- Verify the template HTML is valid
- Check browser console for errors (F12 → Console)

### Fields Showing Empty
- Use conditional sections: `{{#fieldName}}...{{/fieldName}}`
- Make sure the placeholder name exactly matches the available list

### Thermal Printer Issues
- Ensure ESC/POS template is plain text format
- Test the HTML template first in browser
- Check thermal printer connection and settings

## Technical Details

Templates are stored in the browser's IndexedDB database and persist across sessions. The template system uses a simple mustache-like syntax with `{{placeholder}}` for values and `{{#field}}...{{/field}}` for conditional sections.

When printing, the system:
1. Fetches the default template
2. Replaces all placeholders with actual prescription data
3. Renders the HTML in a print dialog or sends to thermal printer

For more information, see [IMPLEMENTATION_GUIDE.md](IMPLEMENTATION_GUIDE.md#print-templates).
