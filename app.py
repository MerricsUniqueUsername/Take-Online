from flask import Flask, jsonify, request, render_template
from sqlalchemy.orm.attributes import flag_modified
from flask_sqlalchemy import SQLAlchemy
import uuid
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.dialects.postgresql import JSONB
from flask_migrate import Migrate
from nanoid import generate
from take import play
from datetime import datetime, timezone
import os
from dotenv import load_dotenv

app = Flask(__name__)

load_dotenv()
uri = os.getenv("DATABASE_URL")

# Database
app.config['SQLALCHEMY_DATABASE_URI'] = uri
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False

db = SQLAlchemy(app)
migrate = Migrate(app, db)

class Game(db.Model):
    id = db.Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    winner = db.Column(db.String(20), nullable=True, default="")
    created_at = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc))
    data = db.Column(JSONB)

# API Endpoints
@app.route('/', methods=['GET'])
def index():
    return render_template('index.html')

@app.route('/game/<uuid:game_id>', methods=['GET'])
def game(game_id):
    return render_template('game.html')

@app.route('/replay/<uuid:game_id>')
def replay(game_id):
    return render_template('replay.html')

@app.route('/create', methods=['GET'])
def create_game():
    scoreboard_size = 2
    grid_size = 4

    new_game = Game(data={
        'red_score': [0] * scoreboard_size,
        'blue_score': [0] * scoreboard_size,
        'players_joined': 0,
        'turn': 'blue',
        'red_password': generate(size=12),
        'blue_password': generate(size=12),
        'board': [[0 for _ in range(grid_size)] for _ in range(grid_size)],
        'red_name': '',
        'blue_name': '',
        'move_history': []
    })

    db.session.add(new_game)
    db.session.commit()

    return jsonify({
        'id': new_game.id
    })

@app.route('/gamedata/<uuid:game_id>', methods=['GET'])
def get_game_data(game_id):
    game = Game.query.get_or_404(game_id)
    
    # Dont send passwords
    safe_data = game.data.copy()
    safe_data.pop('red_password', None)
    safe_data.pop('blue_password', None)
    
    return jsonify({
        'id': str(game.id),
        'data': safe_data,
        'winner': game.winner
    })

@app.route('/join/<uuid:game_id>', methods=['GET'])
def join_game(game_id):
    game = Game.query.with_for_update().get_or_404(game_id)
    new_game_data = game.data.copy()
    password = ""
    player = ""

    # Player 1: red
    if new_game_data['players_joined'] == 0:
        password = new_game_data['red_password']
        player = "red"
        new_game_data['players_joined'] = 1
        game.data = new_game_data
        db.session.commit()
    
    # Player 2: blue
    elif new_game_data['players_joined'] == 1:
        password = new_game_data['blue_password']
        player = "blue"
        new_game_data['players_joined'] = 2
        game.data = new_game_data
        db.session.commit()

    else:
        db.session.rollback()
        password = "no_access"
        player = "none"
    
    return jsonify({
        'password': password,
        'player': player
    })

@app.route('/move/<uuid:game_id>', methods=['POST'])
def make_move(game_id):
    game = Game.query.get_or_404(game_id)

    # If game has winner, no move
    if game.winner != "":
        return jsonify({"error": "Unauthorized"}), 401

    game_data = game.data.copy()
    turn = game_data['turn']

    data = request.get_json()
    password = data.get('password')
    move = data.get('move')
    username = data.get('username')

    # Make sure player is allowed to make move
    if turn == "red" and game_data['red_password'] != password:
        return jsonify({"error": "Unauthorized"}), 401
    elif turn == "blue" and game_data['blue_password'] != password:
        return jsonify({"error": "Unauthorized"}), 401
    
    # Set username
    if password == game_data['red_password']:
        if len(username) == 0 or len(username) > 10:
            game_data['red_name'] = "Red"
        else:
            game_data['red_name'] = username
    if password == game_data['blue_password']:
        if len(username) == 0 or len(username) > 10:
            game_data['blue_name'] = "Blue"
        else:
            game_data['blue_name'] = username
    
    # Make move
    res = play(turn, move, game_data['board'].copy(), game_data['red_score'].copy(), game_data['blue_score'].copy())
    if not res['valid']:
        return jsonify({"error": "Not allowed"}), 405
    
    # Save move to game_data
    game_data['board'] = res['board']
    game_data['red_score'] = res['red_score']
    game_data['blue_score'] = res['blue_score']
    game_data['winner'] = res['winner']
    winner = res['winner']
    switch_turn = res['switch_turn']

    # Add to move history
    game_data['move_history'].append({
        'board': res['board'],
        'red_score': res['red_score'],
        'blue_score': res['blue_score']
    })

    # Swap turn
    if switch_turn:
        game_data['turn'] = "red" if turn == "blue" else "blue"
    
    game.data = game_data
    game.winner = winner
    flag_modified(game, "data")
    flag_modified(game, "winner")
    db.session.commit()
    return jsonify({
        'game': game_data
    })

@app.route('/completed-games/<int:start>/<int:count>', methods=['GET'])
def get_completed_games(start, count):
    completed_games = Game.query.filter(
        Game.winner != "", 
    ).order_by(Game.created_at.asc()).offset(start).limit(count).all()

    results = []
    for game in completed_games:
        data = game.data or {}
        results.append({
            'id': str(game.id),
            'winner': game.winner,
            'red_name': data.get('red_name', 'Red'),
            'blue_name': data.get('blue_name', 'Blue'),
            'scores': {
                'red': sum(data.get('red_score', [0])),
                'blue': sum(data.get('blue_score', [0]))
            }
        })

    return jsonify(results)

if __name__ == '__main__':
    app.run(debug=True)