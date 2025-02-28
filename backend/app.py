from flask import Flask, request, jsonify
from flask_cors import CORS


app = Flask(__name__)
CORS(app)

@app.route("/login",methods=["POST"])
def login():

    # get the data from the request
    data = request.get_json()
    print("Parsed JSON data:", data)  # Print the parsed data

    # validate the data
    if not data or not data.get('username') or not data.get('password'):
        return jsonify({"error": "Missing email or password"}), 400
    
    username = data['username']
    password = data['password']

    print(f"Username: {username}, Password: {password}")  # Print received values
    # check the data
    return jsonify({"message": "Login successful"}), 200

if __name__ == "__main__":
    app.run(debug=True)
