class_name DemoSessionBootstrap
extends Node

# Temporary development/demo flow.
# This bypasses the final lobby flow and creates a demo session immediately
# after the WebSocket connection is authenticated.

signal status_changed(message: String)
signal session_ready
signal failed(message: String)

var is_active := false


func start() -> void:
	is_active = true
	status_changed.emit("WebSocket autentificat. Creez sesiune demo...")
	
	var sent := GameSocket.send_message(WsMessageType.CREATE_DEMO_SESSION)
	
	if not sent:
		is_active = false
		failed.emit("Nu s-a putut trimite cererea de creare a sesiunii demo.")


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
