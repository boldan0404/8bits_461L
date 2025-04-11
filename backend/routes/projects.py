from flask import Blueprint, request, jsonify, current_app
from flask_jwt_extended import jwt_required, get_jwt_identity
from bson import ObjectId

projects = Blueprint('projects', __name__)

# Helper to validate project and authorization
def get_project_and_validate(name, username):
    db = current_app.db
    project = db.projects.find_one({"name": name})
    if not project:
        return None, jsonify({"error": "Project not found"}), 404
    if username not in project.get("authorized_users", []):
        return None, jsonify({"error": "User not authorized"}), 403
    return project, None, None

# GET all projects
@projects.route("/projects", methods=["GET"])
@jwt_required()
def get_projects():
    db = current_app.db
    projects = list(db.projects.find({}, {"_id": 0}))
    return jsonify(projects), 200

# GET single project
@projects.route("/projects/<name>", methods=["GET"])
@jwt_required()
def get_project(name):
    db = current_app.db
    project = db.projects.find_one({"name": name}, {"_id": 0})
    if not project:
        return jsonify({"error": "Project not found"}), 404
    return jsonify(project), 200

# POST join project
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

# POST leave project
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

# POST create project
@projects.route("/projects", methods=["POST"])
@jwt_required()
def create_project():
    db = current_app.db
    data = request.get_json()

    project_name = data.get('name')
    hwsets_input = data.get('hwsets', [])
    username = get_jwt_identity()

    if not project_name or not isinstance(hwsets_input, list):
        return jsonify({"error": "Invalid project data"}), 400

    hwsets = []
    for hw in hwsets_input:
        try:
            hwsets.append({
                "hwset_id": ObjectId(hw["hwset_id"]),
                "quantity": int(hw.get("quantity", 0))
            })
        except Exception as e:
            return jsonify({"error": f"Invalid hwset reference: {str(e)}"}), 400

    new_project = {
        "name": project_name,
        "hwsets": hwsets,
        "authorized_users": [username],
        "description": data.get("description", "")
    }

    db.projects.insert_one(new_project)
    return jsonify({"message": f"Project '{project_name}' created"}), 201

# POST check in hardware
@projects.route("/projects/<name>/hwsets/<hwset_id>/checkin", methods=["POST"])
@jwt_required()
def checkin_hardware(name, hwset_id):
    db = current_app.db
    data = request.get_json()
    qty = int(data.get("qty", 0))
    username = get_jwt_identity()

    hwset_oid = ObjectId(hwset_id)
    project, err, code = get_project_and_validate(name, username)
    if err: return err, code

    hw_entry = next((h for h in project["hwsets"] if h["hwset_id"] == hwset_oid), None)
    if not hw_entry:
        return jsonify({"error": "HWSet not assigned to project"}), 404

    db.projects.update_one(
        {"name": name, "hwsets.hwset_id": hwset_oid},
        {"$inc": {"hwsets.$.quantity": qty}}
    )
    db.hwsets.update_one(
        {"_id": hwset_oid},
        {"$inc": {"available": qty}}
    )

    return jsonify({"message": f"{qty} units checked in to HWSet {hwset_id}"}), 200

# POST check out hardware
@projects.route("/projects/<name>/hwsets/<hwset_id>/checkout", methods=["POST"])
@jwt_required()
def checkout_hardware(name, hwset_id):
    db = current_app.db
    data = request.get_json()
    qty = int(data.get("qty", 0))
    username = get_jwt_identity()

    hwset_oid = ObjectId(hwset_id)
    project, err, code = get_project_and_validate(name, username)
    if err: return err, code

    hw_entry = next((h for h in project["hwsets"] if h["hwset_id"] == hwset_oid), None)
    if not hw_entry or hw_entry["quantity"] < qty:
        return jsonify({"error": "Not enough hardware assigned to project"}), 400

    hwset_global = db.hwsets.find_one({"_id": hwset_oid})
    if not hwset_global or hwset_global.get("available", 0) < qty:
        return jsonify({"error": "Not enough hardware available in global pool"}), 400

    db.projects.update_one(
        {"name": name, "hwsets.hwset_id": hwset_oid},
        {"$inc": {"hwsets.$.quantity": -qty}}
    )
    db.hwsets.update_one(
        {"_id": hwset_oid},
        {"$inc": {"available": -qty}}
    )

    return jsonify({"message": f"{qty} units checked out from HWSet {hwset_id}"}), 200
