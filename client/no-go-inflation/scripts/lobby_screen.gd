extends Control

var session_id := ""
var lobby_code := ""
var is_host := false

@onready var lobby_code_label: Label = $CenterContainer/PanelContainer/MarginContainer/VBoxContainer/LobbyCodeLabel
@onready var participants_label: Label = $CenterContainer/PanelContainer/MarginContainer/VBoxContainer/ParticipantsLabel
@onready var create_lobby_button: Button = $CenterContainer/PanelContainer/MarginContainer/VBoxContainer/CreateLobbyButton
@onready var join_code_input: LineEdit = $CenterContainer/PanelContainer/MarginContainer/VBoxContainer/JoinCodeInput
@onready var join_lobby_button: Button = $CenterContainer/PanelContainer/MarginContainer/VBoxContainer/JoinLobbyButton
@onready var start_session_button: Button = $CenterContainer/PanelContainer/MarginContainer/VBoxContainer/StartSessionButton
@onready var status_label: Label = $CenterContainer/PanelContainer/MarginContainer/VBoxContainer/StatusLabel
@onready var copy_code_button: Button = $CenterContainer/PanelContainer/MarginContainer/VBoxContainer/CopyCodeButton
@onready var back_button: Button = $CenterContainer/PanelContainer/MarginContainer/VBoxContainer/BackButton
@onready var join_back_button: Button = $CenterContainer/PanelContainer/MarginContainer/VBoxContainer/JoinBackButton
@onready var paste_code_button: Button = $CenterContainer/PanelContainer/MarginContainer/VBoxContainer/PasteCodeButton

const PLAYER_MENU_SCENE := "res://scenes/PlayerMenuScreen.tscn"


func _ready() -> void:
	_connect_ui_signals()
	_connect_socket_signals()
	_apply_entry_mode()
	_set_status("Alătură-te cu un cod.")


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
	
	if not copy_code_button.pressed.is_connected(_on_copy_code_pressed):
		copy_code_button.pressed.connect(_on_copy_code_pressed)
	
	if not back_button.pressed.is_connected(_on_back_pressed):
		back_button.pressed.connect(_on_back_pressed)
	
	if not join_back_button.pressed.is_connected(_on_join_back_pressed):
		join_back_button.pressed.connect(_on_join_back_pressed)
	
	if not paste_code_button.pressed.is_connected(_on_paste_code_pressed):
		paste_code_button.pressed.connect(_on_paste_code_pressed)
	
	if not join_code_input.text_submitted.is_connected(_on_join_code_submitted):
		join_code_input.text_submitted.connect(_on_join_code_submitted)

func _connect_socket_signals() -> void:
	if not GameSocket.message_received.is_connected(_on_ws_message_received):
		GameSocket.message_received.connect(_on_ws_message_received)


func _apply_entry_mode() -> void:
	var mode := GameState.lobby_entry_mode
	
	create_lobby_button.visible = false
	start_session_button.disabled = true
	
	if mode == "host":
		lobby_code_label.visible = true
		copy_code_button.visible = true
		back_button.visible = true
		
		join_code_input.visible = false
		join_lobby_button.visible = false
		join_back_button.visible = false
		
		start_session_button.visible = true
		paste_code_button.visible = false
		
		_set_status("Se creează lobby-ul...")
		call_deferred("_auto_create_lobby")
		return
	
	if mode == "join":
		lobby_code_label.visible = false
		copy_code_button.visible = false
		back_button.visible = false
		
		join_code_input.visible = true
		join_lobby_button.visible = true
		join_back_button.visible = true
		
		paste_code_button.visible = true
		start_session_button.visible = false
		
		_set_status("Introdu codul primit de la host.")
		return


func _on_paste_code_pressed() -> void:
	var code := DisplayServer.clipboard_get().strip_edges().to_upper()
	
	if code.is_empty():
		_set_status("Clipboard-ul nu conține un cod de lobby.")
		return
	
	join_code_input.text = code
	_set_status("Cod lipit: %s" % code)


func _on_join_code_submitted(_text: String) -> void:
	if join_lobby_button.visible and not join_lobby_button.disabled:
		_on_join_lobby_pressed()


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
	
	paste_code_button.visible = false


func _on_copy_code_pressed() -> void:	
	if lobby_code.is_empty():
		_set_status("Nu există încă un cod de lobby de copiat.")
		return
	
	DisplayServer.clipboard_set(lobby_code)
	_set_status("Codul lobby-ului a fost copiat: %s" % lobby_code)


func _on_back_pressed() -> void:
	_leave_lobby_if_needed()
	GameState.lobby_entry_mode = ""
	get_tree().change_scene_to_file(PLAYER_MENU_SCENE)


func _on_join_back_pressed() -> void:
	_leave_lobby_if_needed()
	get_tree().change_scene_to_file(PLAYER_MENU_SCENE)


func _leave_lobby_if_needed() -> void:
	if session_id.is_empty():
		return
	
	GameSocket.send_message(WsMessageType.LEAVE_LOBBY, {
		"sessionId": session_id
	})
	
	session_id = ""
	lobby_code = ""
	is_host = false
	
	GameState.session_id = ""
	GameState.lobby_code = ""


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
		
		WsMessageType.SESSION_CANCELLED:
			_handle_session_cancelled(message)
		
		WsMessageType.ERROR:
			_handle_error(message)
		
		_:
			pass


func _handle_session_cancelled(message: Dictionary) -> void:
	var payload = message.get("payload", {})
	var reason := "Lobby-ul a fost închis."
	
	if typeof(payload) == TYPE_DICTIONARY:
		reason = str(payload.get("reason", reason))
	
	session_id = ""
	lobby_code = ""
	is_host = false
	
	GameState.session_id = ""
	GameState.lobby_code = ""
	
	create_lobby_button.visible = false
	join_code_input.visible = false
	join_lobby_button.visible = false
	join_back_button.visible = false
	copy_code_button.visible = false
	start_session_button.visible = false
	
	back_button.visible = true
	back_button.disabled = false
	back_button.text = "Înapoi la meniu"
	
	participants_label.text = "Participanți: -"
	_set_status(reason)


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
	
	create_lobby_button.visible = false
	join_code_input.visible = false
	join_lobby_button.visible = false
	join_back_button.visible = false
	
	copy_code_button.visible = is_host
	start_session_button.visible = is_host
	
	back_button.visible = true
	back_button.disabled = false
	back_button.text = "Înapoi"
	
	var connected_count := _count_connected_participants(payload)
	start_session_button.disabled = not is_host or connected_count < 2
	
	if is_host:
		if connected_count < 2:
			_set_status("Lobby creat. Așteaptă încă un jucător conectat.")
		else:
			_set_status("Lobby creat. Poți porni sesiunea.")
	else:
		_set_status("Te-ai alăturat lobby-ului. Așteaptă ca host-ul să pornească sesiunea.")


func _auto_create_lobby() -> void:
	if not GameSocket.send_message(WsMessageType.CREATE_LOBBY):
		_set_status("Nu s-a putut trimite cererea de creare lobby.")


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
		var role_label := "host" if role == "host" else "jucător"
		var is_connected := bool(item.get("isConnected", true))
		var connection_label := "conectat" if is_connected else "deconectat"
		
		lines.append("- %s (%s, %s)" % [
			display_name,
			role_label,
			connection_label
		])
	
	if lines.is_empty():
		participants_label.text = "Participanți: -"
	else:
		participants_label.text = "Participanți:\n%s" % "\n".join(lines)


func _count_connected_participants(payload: Dictionary) -> int:
	var participants = payload.get("participants", [])
	
	if typeof(participants) != TYPE_ARRAY:
		return 0
	
	var count := 0
	
	for item in participants:
		if typeof(item) != TYPE_DICTIONARY:
			continue
		
		if bool(item.get("isConnected", false)):
			count += 1
	
	return count


func _set_lobby_buttons_disabled(disabled: bool) -> void:
	create_lobby_button.disabled = disabled
	join_lobby_button.disabled = disabled
	join_code_input.editable = not disabled


func _set_status(message: String) -> void:
	status_label.text = message
	print(message)
