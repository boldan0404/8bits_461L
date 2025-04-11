from flask import Blueprint, request, jsonify, current_app
from flask_jwt_extended import jwt_required, get_jwt_identity

projects = Blueprint('projects', __name__)

# query for a list of all projects
@projects.route("/projects", methods=["GET"])
@jwt_required()
def get_projects():
    db = current_app.db
    projects = list(db.projects.find({}, {"_id": 0}))
    return jsonify(projects), 200

# query for a specific project
@projects.route("/projects/<name>", methods=["GET"])
@jwt_required()
def get_project(name):
    db = current_app.db
    project = db.projects.find_one({"name": name}, {"_id": 0})
    if not project:
        return jsonify({"error": "Project not found"}), 404
    return jsonify(project), 200

# query for join in a specific project
@projects.route("/projects/<name>/join", methods=["POST"])
@jwt_required()
def join_project(name):
    db = current_app.db
    username = get_jwt_identity()
    result = db.projects.update_one(
        {"name": name},
        {"$addToSet": {"authorized_users": username}}
    )
    if result.modified_count == 0:
        return jsonify({"message": "Already in project or project not found"}), 200
    return jsonify({"message": f"{username} joined {name}"}), 200

# query for leave a specific project
@projects.route("/projects/<name>/leave", methods=["POST"])
@jwt_required()
def leave_project(name):
    db = current_app.db
    username = get_jwt_identity()
    result = db.projects.update_one(
        {"name": name},
        {"$pull": {"authorized_users": username}}
    )
    return jsonify({"message": f"{username} left {name}"}), 200

# query for check in hardware in a specific project in specifc hwset set
@projects.route("/projects/<name>/hwsets/<setname>/checkin", methods=["POST"])
@jwt_required()
def checkin_hardware(name,setname):
    db = current_app.db

    data = request.get_json()
    if not data or not data.get('hardware_sets'):
        return jsonify({"error": "Missing hardware"}), 400
    
    qty = data.get('qty',0)
    username = get_jwt_identity()
    # sending data [project1, hwset1,checkin 3]
    # so i need to parse this and update the db

    # db.findone return a document project
    project = db.projects.find_one({"name": name})
    # check if the project exists
    if not project:
        return jsonify({"error": "Project not found"}), 404

   # check if the user is authorized to check in hardware
    if username not in project.get('authorized_users', []):
        return jsonify(
            {"error": "User not authorized",
             "message": f"User: {username} is not authorized to modify sets from project: {project}"}), 403

    # check if the hardware set exists
    hwset = project["hardware_sets"].get(setname)
    if not hwset:
        return jsonify({"error": "Hardware set not found"}), 404
    # check if exceed capacity
    if hwset["available"] + qty > hwset["capacity"]:
        return jsonify(
            {"error" : "Exceeds capacity",
             "message" : f"Attempted to check in too many from set: {setname}"}), 400
    # update the hardware set
    db.projects.update_one(
        {"name": name},
        {"$inc": {f"hardware_sets.{setname}.available": qty}}
    )

    return jsonify({
        "success" : "Transaction successfully completed",
        "message" : f"{username} checked in {qty} from set: {setname}"}), 200

@projects.route("/projects/<name>/hwsets/<set_name>/checkout", methods=["POST"])
@jwt_required()
def checkout_hw(name, set_name):
    db = current_app.db
    data = request.get_json()
    qty = data.get("qty", 0)
    username = get_jwt_identity()

    project = db.projects.find_one({"name": name})
    if not project:
        return jsonify({"error": "Project not found"}), 404

    if username not in project.get("authorized_users", []):
        return jsonify({"error": "Unauthorized",
                        "message" : f"User: {username} is not authorized to modify sets from project: {project}"}), 403

    hwset = project["hardware_sets"].get(set_name)
    if not hwset or hwset["available"] < qty:
        return jsonify({"error": "Not enough hardware available",
                        "message" : f"Attempted to checkout too many from set: {hwset}"}), 400

    db.projects.update_one(
        {"name": name},
        {"$inc": {f"hardware_sets.{set_name}.available": -qty}}
    )
    return jsonify({"message": f"{qty} units checked out from {set_name}"}), 200

#temporary backend
@projects.route("/projects", methods=["POST"])
@jwt_required()
def create_project():
    db = current_app.db
    data = request.get_json()

    # Basic error checking
    project_name = data.get('name')
    hardware_sets = data.get('hardware_sets', {})
    if not project_name:
        return jsonify({"error": "Project name is required"}), 400

    # Insert project into MongoDB
    new_project = {
        "name": project_name,
        "hardware_sets": hardware_sets,
        "authorized_users": []  # Optionally add the creator as authorized
    }
    db.projects.insert_one(new_project)
    return jsonify({"message": f"Project '{project_name}' created successfully"}), 201