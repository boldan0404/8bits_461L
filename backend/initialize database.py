from flask import Flask, request, jsonify
from flask_cors import CORS
from flask_pymongo import PyMongo
from werkzeug.security import generate_password_hash, check_password_hash
from flask_jwt_extended import create_access_token, jwt_required, JWTManager

app = Flask(__name__)
app.config["secret_key"] = "ee80e69581676bd475d118d83c238748435e7cbe"
app.config["MONGO_URI"] = "mongodb+srv://bits8ece461l:SWELab#2025@8bits-461l.hlqqd.mongodb.net" \
"/8bit_db?retryWrites=true&w=majority&appName=8bits-461L"
app.config["JWT_SECRET_KEY"] = "super-secret-key" 

#setup mando db
CORS(app)
mongo = PyMongo(app)
db = mongo.db
    
initial_projects = [
    {
        "name": "Project 1",
        "authorized_users": ["alice", "bob"],
        "hardware_sets": {
            "HWSet1": {"capacity": 100, "available": 100},
            "HWSet2": {"capacity": 50, "available": 50}
        }
    },
    {
        "name": "Project 2",
        "authorized_users": ["carol", "dave"],
        "hardware_sets": {
            "HWSet1": {"capacity": 100, "available": 50},
            "HWSet2": {"capacity": 100, "available": 100}
        }
    },
    {
        "name": "Project 3",
        "authorized_users": [],
        "hardware_sets": {
            "HWSet1": {"capacity": 100, "available": 0},
            "HWSet2": {"capacity": 100, "available": 0}
        }
    }]
with app.app_context():
    result = db.projects.insert_many(initial_projects)
    print(f"Inserted project IDs: {result.inserted_ids}")
