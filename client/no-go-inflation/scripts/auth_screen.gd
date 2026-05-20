extends Control

@onready var username_input: LineEdit = $PanelContainer/MarginContainer/VBoxContainer/UsernameLineEdit
@onready var email_input: LineEdit = $PanelContainer/MarginContainer/VBoxContainer/EmailLineEdit
@onready var password_input: LineEdit = $PanelContainer/MarginContainer/VBoxContainer/PasswordLineEdit

@onready var register_button: Button = $PanelContainer/MarginContainer/VBoxContainer/RegisterButton
@onready var login_button: Button = $PanelContainer/MarginContainer/VBoxContainer/LoginButton
@onready var status_label: Label = $PanelContainer/MarginContainer/VBoxContainer/StatusLabel


func _ready() -> void:
	password_input.secret = true

	register_button.pressed.connect(_on_register_pressed)
	login_button.pressed.connect(_on_login_pressed)

	AuthClient.register_succeeded.connect(_on_register_succeeded)
	AuthClient.login_succeeded.connect(_on_login_succeeded)
	AuthClient.auth_failed.connect(_on_auth_failed)
	
	if not GameSocket.connected.is_connected(_on_ws_connected):
		GameSocket.connected.connect(_on_ws_connected)

	if not GameSocket.connection_failed.is_connected(_on_ws_connection_failed):
		GameSocket.connection_failed.connect(_on_ws_connection_failed)

	if not GameSocket.message_received.is_connected(_on_ws_message_received):
		GameSocket.message_received.connect(_on_ws_message_received)

	status_label.text = ""


func _on_register_pressed() -> void:
	var username := username_input.text.strip_edges()
	var email := email_input.text.strip_edges()
	var password := password_input.text

	if username.is_empty() or email.is_empty() or password.is_empty():
		status_label.text = "Completează username, email și parolă."
		return

	status_label.text = "Se creează contul..."
	register_button.disabled = true
	login_button.disabled = true

	AuthClient.register_user(username, email, password)


func _on_login_pressed() -> void:
	var email := email_input.text.strip_edges()
	var password := password_input.text

	if email.is_empty() or password.is_empty():
		status_label.text = "Completează email și parolă."
		return

	status_label.text = "Autentificare..."
	register_button.disabled = true
	login_button.disabled = true

	AuthClient.login_user(email, password)


func _on_register_succeeded(user: Dictionary) -> void:
	register_button.disabled = false
	login_button.disabled = false

	status_label.text = "Cont creat cu succes. Te poți autentifica."


func _on_login_succeeded(user: Dictionary, token: String) -> void:
	register_button.disabled = false
	login_button.disabled = false

	status_label.text = "Login reușit. Bun venit, %s!" % str(user.get("username", "jucător"))

	# Pentru test, după login intrăm direct în joc.
	# get_tree().change_scene_to_file("res://scenes/Main.tscn")
	GameSocket.connect_to_server(token)

func _on_auth_failed(message: String) -> void:
	register_button.disabled = false
	login_button.disabled = false

	status_label.text = message
	


func _on_ws_connected() -> void:
	status_label.text = "WebSocket conectat. Trimit PING..."
	GameSocket.send_ping()


func _on_ws_connection_failed(message: String) -> void:
	status_label.text = message


func _on_ws_message_received(message: Dictionary) -> void:
	var message_type := str(message.get("type", ""))

	if message_type == "AUTHENTICATED":
		print("WebSocket authenticated: ", message)
		status_label.text = "WebSocket autentificat."

	if message_type == "PONG":
		print("PONG primit: ", message)
		status_label.text = "PING/PONG OK. WebSocket funcționează."

		# După test, poți decomenta asta:
		# get_tree().change_scene_to_file("res://scenes/Main.tscn")
