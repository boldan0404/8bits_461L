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
jwt = JWTManager(app)

@app.route("/test-mongo", methods=["GET"])
def test_mongo():
    try:
        user = db.users.find_one()
        if user:
            return jsonify({"message": "MongoDB connected successfully!", "user": str(user)}), 200
        else:
            return jsonify({"message": "MongoDB connected, but no users found!"}), 200
    except Exception as e:
        return jsonify({"error": "MongoDB connection failed!", "details": str(e)}), 500

@app.route("/login",methods=["POST"])
def login():

    # get the data from the request
    data = request.get_json()

    # validate the data
    if not data or not data.get('username') or not data.get('password'):
        return jsonify({"error": "Missing email or password"}), 400
    
    username = data['username']
    password = data['password']

    print(f"Username: {username}, Password: {password}")  # Print received values
    # check the data
    user = db.users.find_one({"username": username})
    print(user)

    if user:
        if check_password_hash(user['password'], password):
            access_token = create_access_token(identity=username)
            return jsonify({"message": "Login successful", "token": access_token}), 200
        else:
            return jsonify({"error": "Invalid username or password"}), 401

    else:
        return jsonify({"error": "User not found"}), 404

@app.route("/register",methods=["POST"])
def register():
    data = request.get_json()

    if not data or not data.get('username') or not data.get('password'):
        return jsonify({"error": "Missing email or password"}), 400
    
    # parse the data
    username = data['username']
    password = data['password']

    # check if the user already exists
    if db.users.find_one({"username":username}):
        return jsonify({"error": "User already exists"}), 401
    
    # Hash the password
    password = generate_password_hash(password, method='pbkdf2:sha256')

    # insert the user
    db.users.insert_one({"username":
    username, "password": password})
    return jsonify({"message": "User registered successfully"}), 200
 
if __name__ == "__main__":
    app.run(debug=True)
