# quickdesk_api.py
import os
import datetime
from flask          import Flask, request, jsonify, g
from flask_sqlalchemy import SQLAlchemy
from flask_marshmallow import Marshmallow
from werkzeug.security import generate_password_hash, check_password_hash
import jwt
from functools        import wraps

# ─── 1. Boilerplate setup ─────────────────────────────
app     = Flask(__name__)
SECRET  = os.environ.get("SECRET", "replace-with-strong-secret")
app.config["SQLALCHEMY_DATABASE_URI"]     = "sqlite:///quickdesk.db"
app.config["SQLALCHEMY_TRACK_MODIFICATIONS"] = False

db  = SQLAlchemy(app)
ma  = Marshmallow(app)

# ─── 2. Models ─────────────────────────────────────────
class User(db.Model):
    id           = db.Column(db.Integer, primary_key=True)
    email        = db.Column(db.String(128), unique=True, nullable=False)
    pw_hash      = db.Column(db.String(256), nullable=False)
    role         = db.Column(db.String(20), default="user")  # user / agent / admin

    def set_password(self, pw):         self.pw_hash = generate_password_hash(pw)
    def check_password(self, pw):       return check_password_hash(self.pw_hash, pw)

class Ticket(db.Model):
    __tablename__ = "tickets"
    id           = db.Column(db.Integer, primary_key=True)
    title        = db.Column(db.String(200), nullable=False)
    description  = db.Column(db.Text, nullable=True)
    category     = db.Column(db.String(100), nullable=False)
    status       = db.Column(db.String(20), default="Open")
    created_at   = db.Column(db.DateTime, default=datetime.datetime.utcnow)
    updated_at   = db.Column(db.DateTime, default=datetime.datetime.utcnow, onupdate=datetime.datetime.utcnow)
    created_by   = db.Column(db.Integer, db.ForeignKey("user.id"), nullable=False)
# ─── 3. Serializers ─────────────────────────────────────
class TicketSchema(ma.SQLAlchemyAutoSchema):
    class Meta:
        model = Ticket
        include_fk = True

ticket_schema = TicketSchema()
ticket_list_schema = TicketSchema(many=True)
# ─── 4. Auth functions ──────────────────────────────────
def encode_jwt(user):
    return jwt.encode(
        {"user_id": user.id, "role": user.role, "exp": datetime.datetime.utcnow() + datetime.timedelta(hours=8)},
        SECRET, algorithm="HS256"
    )

def authenticate(f):
    @wraps(f)
    def wrapper(*args, **kwargs):
        auth = request.headers.get("Authorization", "")
        if auth.startswith("Bearer "):
            token = auth.split(" ", 1)[1]
            try:
                data = jwt.decode(token, SECRET, algorithms=["HS256"])
                g.user = User.query.get(data["user_id"])
            except Exception as ex:
                return jsonify({"error": "Invalid token."}), 401
        else:
            return jsonify({"error": "Missing auth header."}), 401
        return f(*args, **kwargs)
    return wrapper
# ─── 5. Routes ──────────────────────────────────────────
@app.route("/register", methods=["POST"])
def register():
    data = request.get_json()
    if not data or not data.get("email") or not data.get("password"):
        return jsonify({"error": "Email and password required."}), 400
    if User.query.filter_by(email=data["email"]).first():
        return jsonify({"error": "Email already exists."}), 409
    user = User(email=data["email"], role=data.get("role", "user"))
    user.set_password(data["password"])
    db.session.add(user)
    db.session.commit()
    return jsonify({"token": encode_jwt(user)}), 201

@app.route("/login", methods=["POST"])
def login():
    data = request.get_json()
    u = User.query.filter_by(email=data.get("email")).first()
    if u and u.check_password(data.get("password", "")):
        return jsonify({"token": encode_jwt(u)})
    return jsonify({"error": "Invalid credentials"}), 401

@app.route("/tickets", methods=["GET"])
@authenticate
def list_tickets():
    tickets = Ticket.query.filter_by(created_by=g.user.id).order_by(Ticket.updated_at.desc()).all()
    return ticket_list_schema.jsonify(tickets)

@app.route("/tickets", methods=["POST"])
@authenticate
def create_ticket():
    data = request.get_json()
    if not data or not data.get("title") or not data.get("category"):
        return jsonify({"error": "Title and category are required."}), 400
    t = Ticket(
        title      = data["title"],
        description= data.get("description", ""),
        category   = data["category"],
        created_by = g.user.id
    )
    db.session.add(t)
    db.session.commit()
    # Send email notification here (not implemented)
    return ticket_schema.jsonify(t), 201

@app.route("/tickets/<int:id>/status", methods=["PUT"])
@authenticate
def update_status(id):
    data = request.get_json()
    new = data.get("status", "")
    if new not in ("Open", "In Progress", "Resolved", "Closed"):
        return jsonify({"error": "Invalid status"}), 400
    t = Ticket.query.get_or_404(id)
    if g.user.role not in ("agent", "admin") and g.user.id != t.created_by:
        return jsonify({"error": "Forbidden"}), 403
    t.status = new
    db.session.commit()
    return ticket_schema.jsonify(t)
# ─── 6. Initialization and run ──────────────────────────
if __name__ == "__main__":
    db.create_all()
    app.run(debug=True, port=5001)
