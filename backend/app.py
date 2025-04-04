from flask import Flask
from flask_cors import CORS
from flask_pymongo import PyMongo
from flask_jwt_extended import JWTManager
from config import SECRET_KEY, JWT_SECRET_KEY, MONGO_URI
from routes import all_blueprints

app = Flask(__name__)
app.config["secret_key"] = SECRET_KEY
app.config["MONGO_URI"] = MONGO_URI
app.config["JWT_SECRET_KEY"] = JWT_SECRET_KEY

CORS(app)
mongo = PyMongo(app)
app.db = mongo.db  # 👈 expose db to current_app
jwt = JWTManager(app)

# Register all routes
for bp in all_blueprints:
    app.register_blueprint(bp)

if __name__ == "__main__":
    app.run(debug=True)
