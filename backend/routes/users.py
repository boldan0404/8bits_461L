from flask import Blueprint, request, jsonify, current_app
from werkzeug.security import generate_password_hash, check_password_hash
from flask_jwt_extended import create_access_token

users = Blueprint('users', __name__)  # ✅ name it correctly

@users.route("/login", methods=["POST"])
def login():
    db = current_app.db
    data = request.get_json()

    if not data or not data.get('username') or not data.get('password'):
        return jsonify({"error": "Missing email or password"}), 400

    username = data['username']
    password = data['password']

    user = db.users.find_one({"username": username})
    if user and check_password_hash(user['password'], password):
        access_token = create_access_token(identity=username)
        return jsonify({"message": "Login successful", "token": access_token}), 200
    else:
        return jsonify({"error": "Invalid username or password"}), 401

@users.route("/register", methods=["POST"])
def register():
    db = current_app.db
    data = request.get_json()

    if not data or not data.get('username') or not data.get('password'):
        return jsonify({"error": "Missing email or password"}), 400

    username = data['username']
    password = generate_password_hash(data['password'], method='pbkdf2:sha256')

    if db.users.find_one({"username": username}):
        return jsonify({"error": "User already exists"}), 409

    db.users.insert_one({"username": username, "password": password})
    return jsonify({"message": "User registered successfully"}), 200
