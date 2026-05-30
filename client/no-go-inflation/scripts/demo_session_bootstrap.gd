class_name DemoSessionBootstrap
extends Node

signal status_changed(message: String)
signal session_ready
signal failed(message: String)

var is_active := false


func start() -> void:
	is_active = true
	status_changed.emit("WebSocket autentificat. Creez sesiune demo...")
	GameSocket.send_message(WsMessageType.CREATE_DEMO_SESSION)


func handle_ws_message(message: Dictionary) -> bool:
	if not is_active:
		return false

	var message_type := str(message.get("type", ""))

	match message_type:
		WsMessageType.SESSION_STATE:
			_handle_session_state(message)
			return true

		WsMessageType.ERROR:
			_handle_error(message)
			return true

		_:
			return false


func _handle_session_state(message: Dictionary) -> void:
	var payload = message.get("payload", {})

	if typeof(payload) != TYPE_DICTIONARY:
		failed.emit("SESSION_STATE invalid primit de la server.")
		return

	GameState.load_session_state(payload)

	is_active = false
	status_changed.emit("Sesiune demo creată: %s" % GameState.session_id)
	session_ready.emit()


func _handle_error(message: Dictionary) -> void:
	var payload = message.get("payload", {})

	if typeof(payload) != TYPE_DICTIONARY:
		failed.emit("Eroare necunoscută.")
		return

	failed.emit(str(payload.get("message", "Eroare necunoscută.")))
