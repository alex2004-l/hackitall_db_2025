import os
import base64
import requests
from flask import Flask, request, jsonify
from flask_cors import CORS
from functools import wraps
import firebase_admin
from firebase_admin import credentials, auth, firestore
from werkzeug.utils import secure_filename
from openai import OpenAI  # Import OpenAI
from dotenv import load_dotenv # <--- Import nou

# Încarcă variabilele din .env
load_dotenv()

app = Flask(__name__)
CORS(app)

# --- CONFIGURARE ---
UPLOAD_FOLDER = 'static/user_uploads'
app.config['UPLOAD_FOLDER'] = UPLOAD_FOLDER
ALLOWED_EXTENSIONS = {'png', 'jpg', 'jpeg', 'gif'}

# Inițializează clientul OpenAI (asigură-te că ai OPENAI_API_KEY în variabilele de mediu)
# Sau pune-l direct aici: OpenAI(api_key="sk-...")
client = OpenAI(api_key=os.environ.get("OPENAI_API_KEY")) 

if not os.path.exists(UPLOAD_FOLDER):
    os.makedirs(UPLOAD_FOLDER)

cred = credentials.Certificate("serviceAccountKey.json")
firebase_admin.initialize_app(cred)
db = firestore.client()
PROFILES_COLLECTION = "User"

def allowed_file(filename):
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS

# Funcție auxiliară pentru a codifica imaginea în base64 (pentru GPT-4o Vision)
def encode_image(image_path):
    with open(image_path, "rb") as image_file:
        return base64.b64encode(image_file.read()).decode('utf-8')

# Funcție care orchestrează transformarea AI
def generate_pixel_avatar_ai(image_path, user_uid):
    try:
        # 1. Analizează imaginea cu GPT-4o Vision
        base64_image = encode_image(image_path)
        
        vision_response = client.chat.completions.create(
            model="gpt-4o",
            messages=[
                {
                    "role": "user",
                    "content": [
                        {"type": "text", "text": "Describe the person in this image in detail focusing on physical features: gender, hair color and style, eye color, facial hair, glasses, and clothing color. Keep it concise. Start with 'A person with...'"},
                        {
                            "type": "image_url",
                            "image_url": {
                                "url": f"data:image/jpeg;base64,{base64_image}"
                            },
                        },
                    ],
                }
            ],
            max_tokens=100
        )
        
        description = vision_response.choices[0].message.content
        print(f"AI Description: {description}")

        # 2. Generează Pixel Art cu DALL-E 3
        dalle_prompt = f"A retro 8-bit arcade style pixel art avatar of {description}. White background, centered face, high contrast, vibrant colors, video game asset style."
        
        image_response = client.images.generate(
            model="dall-e-3",
            prompt=dalle_prompt,
            size="1024x1024",
            quality="standard",
            n=1,
        )

        image_url = image_response.data[0].url
        
        # 3. Descarcă imaginea generată
        generated_img_data = requests.get(image_url).content
        
        # Salvează imaginea nouă (pixelată)
        pixel_filename = f"{user_uid}_pixelated.png"
        pixel_path = os.path.join(app.config['UPLOAD_FOLDER'], pixel_filename)
        
        with open(pixel_path, 'wb') as handler:
            handler.write(generated_img_data)
            
        return pixel_path, f"/static/user_uploads/{pixel_filename}"

    except Exception as e:
        print(f"OpenAI Error: {e}")
        return None, None

# decorator Firebase token (neschimbat)
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
            return jsonify({"error": "Invalid or expired token", "detail": str(e)}), 401
        return f(*args, **kwargs)
    return wrapper

# ... (Rutele init și get rămân la fel) ...

@app.route("/profile/init", methods=["POST"])
@firebase_token_required
def init_profile():
    # ... (Codul tău existent pentru init_profile) ...
    pass 

@app.route("/profile", methods=["GET"])
@firebase_token_required
def get_profile():
    # ... (Codul tău existent pentru get_profile) ...
    pass

@app.route("/profile", methods=["PUT"])
@firebase_token_required
def update_profile():
    # ... (Codul tău existent pentru update_profile) ...
    pass

# --- ENDPOINT MODIFICAT PENTRU UPLOAD ---
@app.route("/profile/picture", methods=["POST"])
@firebase_token_required
def upload_profile_picture():
    user_uid = request.user["uid"]
    
    # Verifică dacă utilizatorul vrea efect AI (poți trimite un flag din frontend)
    use_ai = request.form.get('use_ai', 'false').lower() == 'true'

    if 'profilePicture' not in request.files:
        return jsonify({"error": "No file part"}), 400
    
    file = request.files['profilePicture']
    
    if file.filename == '':
        return jsonify({"error": "No file selected"}), 400
    
    if file and allowed_file(file.filename):
        try:
            # 1. Salvează imaginea originală temporar
            file_ext = secure_filename(file.filename).rsplit('.', 1)[1].lower()
            original_filename = f"{user_uid}_original.{file_ext}"
            original_path = os.path.join(app.config['UPLOAD_FOLDER'], original_filename)
            file.save(original_path)
            
            final_public_url = ""

            if use_ai:
                # 2A. Procesează cu OpenAI
                print("Processing with OpenAI...")
                local_pixel_path, public_pixel_url = generate_pixel_avatar_ai(original_path, user_uid)
                
                if public_pixel_url:
                    final_public_url = public_pixel_url
                else:
                    return jsonify({"error": "AI Processing failed"}), 500
            else:
                # 2B. Folosește imaginea originală
                final_public_url = f"/static/user_uploads/{original_filename}"

            # 3. Update Firestore
            profile_ref = db.collection(PROFILES_COLLECTION).document(user_uid)
            profile_ref.set({"profilePictureUrl": final_public_url}, merge=True)
            
            return jsonify({
                "message": "Upload successful",
                "profilePictureUrl": final_public_url,
                "ai_used": use_ai
            }), 200

        except Exception as e:
            print(f"Error: {e}")
            return jsonify({"error": "Failed to process file"}), 500
    else:
        return jsonify({"error": "File type not allowed"}), 400

if __name__ == "__main__":
    app.run(debug=True, port=5000)