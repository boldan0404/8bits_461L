from flask import Flask
from flask_cors import CORS
from flask_pymongo import PyMongo
from flask_jwt_extended import JWTManager
from config import SECRET_KEY, JWT_SECRET_KEY, MONGO_URI
from routes import all_blueprints
import os
from flask import send_from_directory

react_build_dir = os.path.join(os.path.dirname(__file__), 'build')
static_dir = os.path.join(react_build_dir, 'static')
app = Flask(__name__,static_folder=static_dir)

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

# Serve React frontend (only in production)
@app.route('/', defaults={'path': ''})
@app.route('/<path:path>')
def serve_frontend(path):

    if path != "" and os.path.exists(os.path.join(react_build_dir, path)):
        return  send_from_directory(react_build_dir, path)
    else:
        return send_from_directory(react_build_dir, 'index.html')



if __name__ == "__main__":
    app.run(host='0.0.0.0', debug=False, port=os.environ.get('PORT', 80))
