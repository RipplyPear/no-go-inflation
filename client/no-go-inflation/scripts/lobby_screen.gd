extends Control

var session_id := ""
var lobby_code := ""
var is_host := false

@onready var lobby_code_label: Label = $CenterContainer/PanelContainer/MarginContainer/VBoxContainer/LobbyCodeLabel
@onready var participants_label: Label = $CenterContainer/PanelContainer/MarginContainer/VBoxContainer/ParticipantsLabel
@onready var create_lobby_button: Button = $CenterContainer/PanelContainer/MarginContainer/VBoxContainer/CreateLobbyButton
@onready var join_code_input: LineEdit = $CenterContainer/PanelContainer/MarginContainer/VBoxContainer/JoinRow/JoinCodeInput
@onready var join_lobby_button: Button = $CenterContainer/PanelContainer/MarginContainer/VBoxContainer/JoinRow/JoinLobbyButton
@onready var start_session_button: Button = $CenterContainer/PanelContainer/MarginContainer/VBoxContainer/StartSessionButton
@onready var status_label: Label = $CenterContainer/PanelContainer/MarginContainer/VBoxContainer/StatusLabel


func _ready() -> void:
	_connect_ui_signals()
	_connect_socket_signals()
	_set_status("Conectat. Creează un lobby sau alătură-te cu un cod.")


func _exit_tree() -> void:
	if GameSocket.message_received.is_connected(_on_ws_message_received):
		GameSocket.message_received.disconnect(_on_ws_message_received)


func _connect_ui_signals() -> void:
	if not create_lobby_button.pressed.is_connected(_on_create_lobby_pressed):
		create_lobby_button.pressed.connect(_on_create_lobby_pressed)

	if not join_lobby_button.pressed.is_connected(_on_join_lobby_pressed):
		join_lobby_button.pressed.connect(_on_join_lobby_pressed)

	if not start_session_button.pressed.is_connected(_on_start_session_pressed):
		start_session_button.pressed.connect(_on_start_session_pressed)


func _connect_socket_signals() -> void:
	if not GameSocket.message_received.is_connected(_on_ws_message_received):
		GameSocket.message_received.connect(_on_ws_message_received)


func _on_create_lobby_pressed() -> void:
	_set_status("Se creează lobby-ul...")
	_set_lobby_buttons_disabled(true)

	if not GameSocket.send_message(WsMessageType.CREATE_LOBBY):
		_set_lobby_buttons_disabled(false)
		_set_status("Nu s-a putut trimite cererea de creare lobby.")


func _on_join_lobby_pressed() -> void:
	var code := join_code_input.text.strip_edges().to_upper()

	if code.is_empty():
		_set_status("Introdu codul lobby-ului.")
		return

	_set_status("Se încearcă alăturarea la lobby...")
	_set_lobby_buttons_disabled(true)

	var sent := GameSocket.send_message(WsMessageType.JOIN_LOBBY, {
		"lobbyCode": code
	})

	if not sent:
		_set_lobby_buttons_disabled(false)
		_set_status("Nu s-a putut trimite cererea de alăturare.")


func _on_start_session_pressed() -> void:
	if session_id.is_empty():
		_set_status("Nu există lobby activ.")
		return

	_set_status("Se pornește sesiunea...")
	start_session_button.disabled = true

	var sent := GameSocket.send_message(WsMessageType.START_SESSION, {
		"sessionId": session_id
	})

	if not sent:
		start_session_button.disabled = false
		_set_status("Nu s-a putut trimite cererea de pornire.")


func _on_ws_message_received(message: Dictionary) -> void:
	var message_type := str(message.get("type", ""))

	match message_type:
		WsMessageType.LOBBY_STATE:
			_handle_lobby_state(message)

		WsMessageType.SESSION_STATE:
			_handle_session_state(message)

		WsMessageType.ERROR:
			_handle_error(message)

		_:
			pass


func _handle_lobby_state(message: Dictionary) -> void:
	var payload = message.get("payload", {})

	if typeof(payload) != TYPE_DICTIONARY:
		_set_status("LOBBY_STATE invalid primit de la server.")
		_set_lobby_buttons_disabled(false)
		return

	session_id = str(payload.get("sessionId", ""))
	lobby_code = str(payload.get("lobbyCode", ""))

	var participant = payload.get("participant", {})
	if typeof(participant) != TYPE_DICTIONARY:
		participant = {}

	is_host = str(participant.get("role", "")) == "host"

	_update_lobby_ui(payload)

	create_lobby_button.disabled = true
	join_lobby_button.disabled = true
	join_code_input.editable = false

	start_session_button.disabled = not is_host

	if is_host:
		_set_status("Lobby creat. Trimite codul celuilalt jucător, apoi pornește sesiunea.")
	else:
		_set_status("Te-ai alăturat lobby-ului. Așteaptă ca host-ul să pornească sesiunea.")


func _handle_session_state(message: Dictionary) -> void:
	var payload = message.get("payload", {})

	if typeof(payload) != TYPE_DICTIONARY:
		_set_status("SESSION_STATE invalid primit de la server.")
		return

	GameState.load_session_state(payload)
	get_tree().change_scene_to_file("res://scenes/Main.tscn")


func _handle_error(message: Dictionary) -> void:
	var payload = message.get("payload", {})

	if typeof(payload) != TYPE_DICTIONARY:
		_set_status("Eroare necunoscută.")
	else:
		_set_status(str(payload.get("message", "Eroare necunoscută.")))

	_set_lobby_buttons_disabled(false)

	if not session_id.is_empty():
		create_lobby_button.disabled = true
		join_lobby_button.disabled = true
		join_code_input.editable = false
		start_session_button.disabled = not is_host


func _update_lobby_ui(payload: Dictionary) -> void:
	lobby_code_label.text = "Cod lobby: %s" % lobby_code

	var participants = payload.get("participants", [])

	if typeof(participants) != TYPE_ARRAY:
		participants_label.text = "Participanți: -"
		return

	var lines: Array[String] = []

	for item in participants:
		if typeof(item) != TYPE_DICTIONARY:
			continue

		var display_name := str(item.get("displayName", "Jucător"))
		var role := str(item.get("role", "player"))
		var role_label := "host" if role == "host" else "player"

		lines.append("- %s (%s)" % [display_name, role_label])

	if lines.is_empty():
		participants_label.text = "Participanți: -"
	else:
		participants_label.text = "Participanți:\n%s" % "\n".join(lines)


func _set_lobby_buttons_disabled(disabled: bool) -> void:
	create_lobby_button.disabled = disabled
	join_lobby_button.disabled = disabled
	join_code_input.editable = not disabled


func _set_status(message: String) -> void:
	status_label.text = message
	print(message)
