extends Control

@onready var username_input: LineEdit = $PanelContainer/MarginContainer/VBoxContainer/UsernameLineEdit
@onready var email_input: LineEdit = $PanelContainer/MarginContainer/VBoxContainer/EmailLineEdit
@onready var password_input: LineEdit = $PanelContainer/MarginContainer/VBoxContainer/PasswordLineEdit

@onready var register_button: Button = $PanelContainer/MarginContainer/VBoxContainer/RegisterButton
@onready var login_button: Button = $PanelContainer/MarginContainer/VBoxContainer/LoginButton
@onready var status_label: Label = $PanelContainer/MarginContainer/VBoxContainer/StatusLabel

#var demo_bootstrap: DemoSessionBootstrap


func _ready() -> void:
	password_input.secret = true
	
	#_setup_demo_bootstrap()
	_connect_ui_signals()
	_connect_auth_signals()
	_connect_socket_signals()
	
	status_label.text = ""


#func _setup_demo_bootstrap() -> void:
	#demo_bootstrap = DemoSessionBootstrap.new()
	#add_child(demo_bootstrap)
	#
	#demo_bootstrap.status_changed.connect(_set_status)
	#demo_bootstrap.failed.connect(_on_demo_bootstrap_failed)
	#demo_bootstrap.session_ready.connect(_on_demo_session_ready)


func _connect_ui_signals() -> void:
	register_button.pressed.connect(_on_register_pressed)
	login_button.pressed.connect(_on_login_pressed)


func _connect_auth_signals() -> void:
	if not AuthClient.register_succeeded.is_connected(_on_register_succeeded):
		AuthClient.register_succeeded.connect(_on_register_succeeded)
	
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


func _on_register_pressed() -> void:
	var username := username_input.text.strip_edges()
	var email := email_input.text.strip_edges()
	var password := password_input.text
	
	if username.is_empty() or email.is_empty() or password.is_empty():
		_set_status("Completează username, email și parolă.")
		return
	
	_set_status("Se creează contul...")
	_set_auth_buttons_disabled(true)
	
	AuthClient.register_user(username, email, password)


func _on_login_pressed() -> void:
	var email := email_input.text.strip_edges()
	var password := password_input.text
	
	if email.is_empty() or password.is_empty():
		_set_status("Completează email și parolă.")
		return
	
	_set_status("Autentificare...")
	_set_auth_buttons_disabled(true)
	
	AuthClient.login_user(email, password)


func _on_register_succeeded(_user: Dictionary) -> void:
	_set_auth_buttons_disabled(false)
	_set_status("Cont creat cu succes. Te poți autentifica.")


func _on_login_succeeded(user: Dictionary, token: String) -> void:
	_set_auth_buttons_disabled(false)
	_set_status("Login reușit. Bun venit, %s!" % str(user.get("username", "jucător")))
	
	GameSocket.connect_to_server(token)


func _on_auth_failed(message: String) -> void:
	_set_auth_buttons_disabled(false)
	_set_status(message)


func _on_ws_connected() -> void:
	_set_status("WebSocket conectat. Aștept autentificarea...")


func _on_ws_connection_failed(message: String) -> void:
	_set_status(message)


func _on_ws_message_received(message: Dictionary) -> void:
	var message_type := str(message.get("type", ""))
	
	if message_type == WsMessageType.AUTHENTICATED:
		print("WebSocket authenticated: ", message)
		_set_status("WebSocket autentificat. Intru în meniul de lobby...")
		get_tree().change_scene_to_file("res://scenes/LobbyScreen.tscn")
		return
		
		# Temporary development/demo flow.
		# After WebSocket auth, create a demo session directly.
		# Later, this should navigate to the lobby/menu flow instead.
		#demo_bootstrap.start()
		#return
	
	#if demo_bootstrap.handle_ws_message(message):
		#return
	
	if message_type == WsMessageType.ERROR:
		_handle_socket_error(message)


func _handle_socket_error(message: Dictionary) -> void:
	var payload = message.get("payload", {})
	
	if typeof(payload) != TYPE_DICTIONARY:
		_set_status("Eroare necunoscută.")
		return
	
	_set_status(str(payload.get("message", "Eroare necunoscută.")))


#func _on_demo_bootstrap_failed(message: String) -> void:
	#_set_status(message)


#func _on_demo_session_ready() -> void:
	#get_tree().change_scene_to_file("res://scenes/Main.tscn")


func _set_auth_buttons_disabled(disabled: bool) -> void:
	register_button.disabled = disabled
	login_button.disabled = disabled


func _set_status(message: String) -> void:
	status_label.text = message
