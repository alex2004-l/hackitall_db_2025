# app.py
from flask import Flask, request, jsonify
from flask_cors import CORS
from functools import wraps

import firebase_admin
from firebase_admin import credentials, auth, firestore  # firestore optional

app = Flask(__name__)
CORS(app)

cred = credentials.Certificate("serviceAccountKey.json")
firebase_admin.initialize_app(cred)

db = firestore.client()

PROFILES_COLLECTION = "User"

def firebase_token_required(f):
    @wraps(f)
    def wrapper(*args, **kwargs):
        auth_header = request.headers.get("Authorization", "")
        if not auth_header:
            return jsonify({"error": "Missing Authorization header"}), 401

        parts = auth_header.split()
        if len(parts) != 2 or parts[0].lower() != "bearer":
            return jsonify({"error": "Invalid Authorization header format"}), 401

        id_token = parts[1]
        try:
            decoded_token = auth.verify_id_token(id_token)
            request.user = decoded_token
        except Exception as e:

            # do not leak internal errors in production — return a generic message
            return jsonify({"error": "Invalid or expired token", "detail": str(e)}), 401

        return f(*args, **kwargs)
    return wrapper

# Test endpoint — verifies auth
@app.route("/test-auth", methods=["GET"])
@firebase_token_required
def test_auth():
    user = request.user  # the decoded token
    return jsonify({
        "message": "Authentication successful",
        "uid": user.get("uid"),
        "email": user.get("email"),
        "name": user.get("name")
    })

@app.route("/profile", methods=["GET"])
@firebase_token_required
def get_profile():
    """Fetches the profile data, including the profilePictureUrl."""
    user_uid = request.user["uid"]
    print(user_uid)
    
    try:
        profile_ref = db.collection(PROFILES_COLLECTION).document(user_uid)
        profile_doc = profile_ref.get()

        # ... (error handling) ...
        
        profile_data = profile_doc.to_dict() if profile_doc.exists else {}
        return jsonify({
            "name": profile_data.get("name", "Arcade Player"),
            # Sends the stored URL back to the frontend
            "profilePictureUrl": profile_data.get("profilePictureUrl", "")
        }), 200

    except Exception as e:
        return jsonify({"error": "Failed to fetch profile"}), 500


@app.route("/profile", methods=["PUT"])
@firebase_token_required
def update_profile():
    """Updates the profile data, including the profilePictureUrl provided by the frontend."""
    user_uid = request.user["uid"]
    data = request.get_json()
    
    if not data:
        return jsonify({"error": "No data provided"}), 400

    update_data = {}
    
    # ... handle name update logic ...

    # Check for the URL and save it to the update data
    if "profilePictureUrl" in data and isinstance(data["profilePictureUrl"], str):
        update_data["profilePictureUrl"] = data["profilePictureUrl"]

    if not update_data:
        return jsonify({"error": "No valid fields to update"}), 400

    try:
        profile_ref = db.collection(PROFILES_COLLECTION).document(user_uid)
        profile_ref.set(update_data, merge=True) 
        return jsonify({"message": "Profile updated successfully"}), 200

    except Exception as e:
        return jsonify({"error": "Failed to update profile"}), 500


if __name__ == "__main__":
    app.run(debug=True, port=5000)
