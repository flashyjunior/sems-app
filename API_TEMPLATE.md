// Example backend endpoint for dispense sync
// This is a template for your backend API (Node.js/Express, Python, etc.)

/**
 * POST /api/dispenses
 * 
 * Endpoint to receive dispense records from SEMS clients
 * 
 * Request:
 * {
 *   "id": "dispense-1702917600000-abc123",
 *   "timestamp": 1702917600000,
 *   "pharmacistId": "user-123",
 *   "patientName": "John Doe",
 *   "drugId": "drug-001",
 *   "dose": {
 *     "doseMg": 500,
 *     "frequency": "Every 8 hours",
 *     ...
 *   },
 *   "deviceId": "device-abc123",
 *   ...
 * }
 * 
 * Response:
 * {
 *   "success": true,
 *   "id": "dispense-1702917600000-abc123",
 *   "synced": true,
 *   "timestamp": 1702917600000
 * }
 */

// Express.js example:
/*
app.post('/api/dispenses', authenticate, async (req, res) => {
  try {
    const record = req.body;
    const userId = req.user.id;

    // Validate
    if (!record.id || !record.drugId || !record.timestamp) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // Check for duplicates
    const existing = await db.query(
      'SELECT id FROM dispenses WHERE id = $1',
      [record.id]
    );
    
    if (existing.rows.length > 0) {
      return res.json({ success: true, synced: true });
    }

    // Insert record
    const result = await db.query(
      'INSERT INTO dispenses (id, pharmacist_id, drug_id, dose_mg, patient_name, created_at) VALUES ($1, $2, $3, $4, $5, $6) RETURNING id',
      [record.id, userId, record.drugId, record.dose.doseMg, record.patientName, new Date(record.timestamp)]
    );

    // Log audit
    await logAudit(userId, 'dispense_synced', record.id);

    res.json({
      success: true,
      id: result.rows[0].id,
      synced: true,
      timestamp: Date.now()
    });
  } catch (error) {
    console.error('Dispense sync failed:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

app.get('/api/datasets/updates', async (req, res) => {
  try {
    // Return latest STG drug data
    // Clients check version and download if newer
    const drugs = await db.query('SELECT * FROM drugs WHERE active = true');
    const regimens = await db.query('SELECT * FROM dose_regimens WHERE active = true');
    
    res.json({
      version: '2025-01-15',
      drugs: drugs.rows,
      regimens: regimens.rows
    });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});
*/

// Flask example:
/*
from flask import Flask, request, jsonify
from flask_cors import CORS
import psycopg2

app = Flask(__name__)
CORS(app)

@app.route('/api/dispenses', methods=['POST'])
@require_auth
def sync_dispense():
    record = request.json
    user_id = request.user_id
    
    if not all([record.get('id'), record.get('drugId'), record.get('timestamp')]):
        return {'error': 'Missing fields'}, 400
    
    try:
        # Check for duplicate
        conn = psycopg2.connect(DATABASE_URL)
        cur = conn.cursor()
        cur.execute('SELECT id FROM dispenses WHERE id = %s', (record['id'],))
        
        if cur.fetchone():
            return {'success': True, 'synced': True}, 200
        
        # Insert
        cur.execute(
            'INSERT INTO dispenses (id, pharmacist_id, drug_id, dose_mg, patient_name) VALUES (%s, %s, %s, %s, %s)',
            (record['id'], user_id, record['drugId'], record['dose']['doseMg'], record.get('patientName'))
        )
        conn.commit()
        
        return {'success': True, 'synced': True}, 200
    except Exception as e:
        print(f'Error: {e}')
        return {'error': 'Server error'}, 500
*/
