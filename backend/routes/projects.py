from flask import Blueprint, request, jsonify, current_app
from flask_jwt_extended import jwt_required, get_jwt_identity
from bson import ObjectId
from pprint import pprint 

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
    raw_projects = list(db.projects.find({}))

    for project in raw_projects:
        enriched_hwsets = []
        for hw_id in project.get("hardware_sets", []):
            try:
                hwset_data = db.hwsets.find_one({"_id": ObjectId(hw_id)})
                if hwset_data:
                    enriched_hwsets.append({
                        "hwset_id": str(hwset_data["_id"]),
                        "name": hwset_data.get("name", ""),
                        "capacity": hwset_data.get("capacity", 0),
                        "available": hwset_data.get("available", 0),
                    })
            except Exception as e:
                print(f"Skipping invalid hwset ID: {hw_id} | Error: {e}")
                continue

        project["hwsets"] = enriched_hwsets
        project["_id"] = str(project["_id"])
    pprint(raw_projects)
    return jsonify(raw_projects), 200


# GET single project
@projects.route("/projects/<name>", methods=["GET"])
@jwt_required()
def get_project(name):
    db = current_app.db
    project = db.projects.find_one({"name": name}, {"_id": 0})
    if not project:
        return jsonify({"error": "Project not found"}), 404
    return jsonify(project), 200

# GET all hwsets
@projects.route("/projects/hwsets", methods=["GET"])
@jwt_required()
def get_hwsets():
    db = current_app.db
    hwsets = list(db.hwsets.find({}, {"name": 1, "capacity": 1, "available": 1}))
    # Convert ObjectId to string for frontend
    for hw in hwsets:
        hw["_id"] = str(hw["_id"])
    return jsonify(hwsets), 200


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
    pprint(data)
    project_name = data.get('name')
    hwsets_input = data.get('hardware_sets', [])
    username = get_jwt_identity()

    if not project_name or not isinstance(hwsets_input, list):
        return jsonify({"error": "Invalid project data"}), 400

    hwsets = []
    for hw_id in hwsets_input:
        try:
            hwsets.append( ObjectId(hw_id))
        except Exception as e:
            return jsonify({"error": f"Invalid hwset reference: {str(e)}"}), 400

    new_project = {
        "name": project_name,
        "hardware_sets": hwsets,
        "authorized_users": [username],
        "description": data.get("description", "")
    }

    db.projects.insert_one(new_project)
    return jsonify({"message": f"Project '{project_name}' created"}), 201

# # GET global hardware
# @projects.route("/projects/<hwset_id>", methods=["POST"])
# @jwt_required()
# def get_hardware(hwset_id):
#     db = current_app.db
#     object_id = ObjectId(hwset_id)
#     hwset = db['hwsets'].find_one({"_id": object_id})

#     if hwset is None:
#         return jsonify({"error": f"HWSet with the id: {hwset_id} was not found"}), 404
#     return jsonify(hwset), 200


# POST check in hardware
@projects.route("/projects/<name>/hwsets/<hwset_id>/checkin", methods=["POST"])
@jwt_required()
def checkin_hardware(name, hwset_id):
    db = current_app.db
    data = request.get_json()
    qty = int(data.get("qty", 0))
    username = get_jwt_identity()

    hwset_oid = ObjectId(hwset_id)

    # Get the project and validate the user
    project, err, code = get_project_and_validate(name, username)
    if err:
        return err, code

    # Check if this hardware set is assigned to the project
    if hwset_oid not in project.get("hardware_sets", []):
        return jsonify({"error": "HWSet not assigned to project"}), 404

    # Update global availability
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

    if hwset_oid not in project.get("hardware_sets", []):
        return jsonify({"error": "HWSet not assigned to project"}), 404

    hwset_global = db.hwsets.find_one({"_id": hwset_oid})
    if not hwset_global or hwset_global.get("available", 0) < qty:
        return jsonify({"error": "Not enough hardware available in global pool"}), 400

    db.hwsets.update_one(
        {"_id": hwset_oid},
        {"$inc": {"available": -qty}}
    )

    return jsonify({"message": f"{qty} units checked out from HWSet {hwset_id}"}), 200

