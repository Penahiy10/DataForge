from flask import Flask, jsonify, send_from_directory, request
import json
import os
from datetime import datetime
import uuid
from flask_cors import CORS
import atexit

app = Flask(__name__, static_folder='public')
CORS(app)

# Data
with open('api-data-clean.json', 'r', encoding='utf-8') as f:
    API_DATA = json.load(f)

# In-memory favorites (persistent JSON)
FAVS_FILE = 'favorites.json'
def load_favs():
    if os.path.exists(FAVS_FILE):
        with open(FAVS_FILE, 'r') as f:
            return json.load(f)
    return {}

def save_favs(favs):
    with open(FAVS_FILE, 'w') as f:
        json.dump(favs, f)

favs_data = load_favs()
atexit.register(lambda: save_favs(favs_data))

@app.route('/')
def index():
    return send_from_directory('public', 'index.html')

@app.route('/<path:path>')
def static_files(path):
    return send_from_directory('public', path)

# API Routes
@app.route('/api/prompts')
def api_prompts():
    return jsonify(API_DATA['prompts'])

@app.route('/api/followups')
def api_followups():
    return jsonify(API_DATA['followups'])

@app.route('/api/tips')
def api_tips():
    return jsonify(API_DATA['tips'])

@app.route('/api/workflow')
def api_workflow():
    return jsonify(API_DATA['workflow'])

@app.route('/api/howto')
def api_howto():
    return jsonify(API_DATA['howto'])

@app.route('/api/categories')
def api_categories():
    return jsonify(API_DATA['categories'])

@app.route('/api/fupcats')
def api_fupcats():
    return jsonify(API_DATA['fupCats'])

@app.route('/api/app')
def api_app():
    return jsonify(API_DATA['app'])

@app.route('/api/colors')
def api_colors():
    return jsonify(API_DATA.get('colors', {}))

# Favorites API (session-based)
@app.route('/api/favs/<session_id>')
def api_favs(session_id):
    fav_list = favs_data.get(session_id, [])
    return jsonify(fav_list)

@app.route('/api/favs/<session_id>/<int:prompt_id>', methods=['POST'])
def add_fav(session_id, prompt_id):
    if session_id not in favs_data:
        favs_data[session_id] = []
    if prompt_id not in favs_data[session_id]:
        favs_data[session_id].append(prompt_id)
        save_favs(favs_data)
    return jsonify({'success': True})

@app.route('/api/favs/<session_id>/<int:prompt_id>', methods=['DELETE'])
def remove_fav(session_id, prompt_id):
    if session_id in favs_data and prompt_id in favs_data[session_id]:
        favs_data[session_id].remove(prompt_id)
        save_favs(favs_data)
    return jsonify({'success': True})

@app.route('/api/health')
def health():
    return jsonify({
        'status': 'OK',
        'version': API_DATA['app']['version'],
        'timestamp': datetime.utcnow().isoformat()
    })

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000, debug=True, threaded=True)
