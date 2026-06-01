extends Control

const START_MENU_SCENE := "res://scenes/StartMenu.tscn"
const PLAYER_MENU_SCENE := "res://scenes/PlayerMenuScreen.tscn"

@onready var email_input: LineEdit = $CenterContainer/PanelContainer/MarginContainer/VBoxContainer/EmailLineEdit
@onready var password_input: LineEdit = $CenterContainer/PanelContainer/MarginContainer/VBoxContainer/PasswordLineEdit
@onready var login_button: Button = $CenterContainer/PanelContainer/MarginContainer/VBoxContainer/LoginButton
@onready var back_button: Button = $CenterContainer/PanelContainer/MarginContainer/VBoxContainer/BackButton
@onready var status_label: Label = $CenterContainer/PanelContainer/MarginContainer/VBoxContainer/StatusLabel


func _ready() -> void:
	password_input.secret = true
	
	login_button.pressed.connect(_on_login_pressed)
	back_button.pressed.connect(_on_back_pressed)
	
	_connect_auth_signals()
	_connect_socket_signals()
	
	status_label.text = ""


func _exit_tree() -> void:
	if AuthClient.login_succeeded.is_connected(_on_login_succeeded):
		AuthClient.login_succeeded.disconnect(_on_login_succeeded)
	
	if AuthClient.auth_failed.is_connected(_on_auth_failed):
		AuthClient.auth_failed.disconnect(_on_auth_failed)
	
	if GameSocket.connected.is_connected(_on_ws_connected):
		GameSocket.connected.disconnect(_on_ws_connected)
	
	if GameSocket.connection_failed.is_connected(_on_ws_connection_failed):
		GameSocket.connection_failed.disconnect(_on_ws_connection_failed)
	
	if GameSocket.message_received.is_connected(_on_ws_message_received):
		GameSocket.message_received.disconnect(_on_ws_message_received)


func _connect_auth_signals() -> void:
	if not AuthClient.login_succeeded.is_connected(_on_login_succeeded):
		AuthClient.login_succeeded.connect(_on_login_succeeded)
	
	if not AuthClient.auth_failed.is_connected(_on_auth_failed):
		AuthClient.auth_failed.connect(_on_auth_failed)


func _connect_socket_signals() -> void:
	if not GameSocket.connected.is_connected(_on_ws_connected):
		GameSocket.connected.connect(_on_ws_connected)
	
	if not GameSocket.connection_failed.is_connected(_on_ws_connection_failed):
		GameSocket.connection_failed.connect(_on_ws_connection_failed)
	
	if not GameSocket.message_received.is_connected(_on_ws_message_received):
		GameSocket.message_received.connect(_on_ws_message_received)


func _on_login_pressed() -> void:
	var email := email_input.text.strip_edges()
	var password := password_input.text
	
	if email.is_empty() or password.is_empty():
		_set_status("Completează email și parolă.")
		return
	
	_set_buttons_disabled(true)
	_set_status("Autentificare...")
	
	AuthClient.login_user(email, password)


func _on_back_pressed() -> void:
	get_tree().change_scene_to_file(START_MENU_SCENE)


func _on_login_succeeded(user: Dictionary, token: String) -> void:
	_set_status("Login reușit. Bun venit, %s!" % str(user.get("username", "jucător")))
	GameSocket.connect_to_server(token)


func _on_auth_failed(message: String) -> void:
	_set_buttons_disabled(false)
	_set_status(message)


func _on_ws_connected() -> void:
	_set_status("WebSocket conectat. Se validează sesiunea...")


func _on_ws_connection_failed(message: String) -> void:
	AuthClient.logout()
	_set_buttons_disabled(false)
	_set_status(message)


func _on_ws_message_received(message: Dictionary) -> void:
	var message_type := str(message.get("type", ""))
	
	if message_type == WsMessageType.AUTHENTICATED:
		get_tree().change_scene_to_file(PLAYER_MENU_SCENE)
		return
	
	if message_type == WsMessageType.ERROR:
		var payload = message.get("payload", {})
		
		if typeof(payload) == TYPE_DICTIONARY:
			_set_status(str(payload.get("message", "Eroare necunoscută.")))
		else:
			_set_status("Eroare necunoscută.")
		
		AuthClient.logout()
		_set_buttons_disabled(false)


func _set_buttons_disabled(disabled: bool) -> void:
	login_button.disabled = disabled
	back_button.disabled = disabled


func _set_status(message: String) -> void:
	status_label.text = message
