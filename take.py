def board_full(board: list) -> bool:
    """
    Check if board is full
    """
    for row in board:
        for cell in row:
            if cell == 0:
                return False
    return True

def valid_move(move: str, board: list, red_score: list, blue_score: list, turn: str) -> bool:
    """
    Check if move is valid
    """
    print(len(move))
    if len(move) != 3:
        return False
    move_type = move[0]
    x = move[1]
    y = move[2]

    # Make sure characters are allowed
    if not move_type in ['h', 'v', 'p']:
        return False
    if not (0 <= int(x) < len(board)):
        return False
    if not (0 <= int(y) < len(board[0])):
        return False
    
    # Make sure not placing when board is full
    if move_type == 'p' and board_full(board):
        return False
    
    # Make sure placing on empty piece
    x = int(x)
    y = int(y)
    if move_type == 'p' and board[x][y] != 0:
        return False
    
    # Make sure taking the correct turn
    if move_type in ['h', 'v']:
        if turn == "blue" and board[x][y] != 1:
            return False
        if turn == "red" and board[x][y] != 2:
            return False

        # Can't take if your scoreboard is full
        if turn == "blue" and blue_score[-1] != 0:
            return False
        if turn == "red" and red_score[-1] != 0:
            return False

    # All tests passed
    return True

def get_winner(red_score: list, blue_score: list) -> str:
    """
    Determines the winner based on your specific rules:
    1. If both scoreboards are full, highest score wins.
    2. If one player is full and the other surpasses their total, they win immediately.
    """
    red_total = sum(red_score)
    blue_total = sum(blue_score)
    
    red_full = red_score[-1] != 0
    blue_full = blue_score[-1] != 0

    # Both scoreboards are full
    if red_full and blue_full:
        if red_total > blue_total:
            return "red"
        elif blue_total > red_total:
            return "blue"
        else:
            return "draw"

    # Red is full, Blue surpasses Red
    if red_full and blue_total > red_total:
        return "blue"

    # Blue is full, Red surpasses Blue
    if blue_full and red_total > blue_total:
        return "red"

    # Otherwise, the game continues
    return ""

def play(turn: str, move: str, board: list, red_score: list, blue_score: list) -> dict:
    """
    Play move

    :return: {is_valid, board, red_score, blue_score, switch_turn, winner}
    :rtype: dict
    """
    if not valid_move(move, board, red_score, blue_score, turn):
        return {'valid': False}

    move_type = move[0]
    x = int(move[1])
    y = int(move[2])
    switch_turn = True
    
    # Determine the integer value for the current player's pieces
    player_piece = 1 if turn == "blue" else 2

    # Make placement
    if move_type == 'p':
        board[x][y] = player_piece

        # If board is full and opponent scoreboard full, don't switch turn
        if turn == "blue":
            if board_full(board) and red_score[-1] != 0:
                switch_turn = False
        if turn == "red":
            if board_full(board) and blue_score[-1] != 0:
                switch_turn = False

    # Take horizontal or vertical chain
    elif move_type in ['h', 'v']:
        chain_coords = [(x, y)]
        
        if move_type == 'h':
            # Traverse Left
            curr_y = y - 1
            while curr_y >= 0 and board[x][curr_y] == player_piece:
                chain_coords.append((x, curr_y))
                curr_y -= 1
                
            # Traverse Right
            curr_y = y + 1
            while curr_y < len(board[x]) and board[x][curr_y] == player_piece:
                chain_coords.append((x, curr_y))
                curr_y += 1
                
        elif move_type == 'v':
            # Traverse Up
            curr_x = x - 1
            while curr_x >= 0 and board[curr_x][y] == player_piece:
                chain_coords.append((curr_x, y))
                curr_x -= 1
                
            # Traverse Down
            curr_x = x + 1
            while curr_x < len(board) and board[curr_x][y] == player_piece:
                chain_coords.append((curr_x, y))
                curr_x += 1
                
        # Clear the captured pieces from the board
        for cx, cy in chain_coords:
            board[cx][cy] = 0
            
        # Update scores
        active_score = blue_score if turn == "blue" else red_score
        points = len(chain_coords)        
        active_score[active_score.index(0)] += points
    
    winner = get_winner(red_score, blue_score)

    return {'valid': True, 'board': board, 'red_score': red_score, 'blue_score': blue_score, 'switch_turn': switch_turn, 'winner': winner}