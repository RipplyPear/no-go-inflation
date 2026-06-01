extends Node

signal connected
signal disconnected
signal connection_failed(message: String)
signal message_received(message: Dictionary)

var socket: WebSocketPeer = WebSocketPeer.new()
var _was_connected := false
var _is_connecting := false
var _last_connection_error := ""
var _connection_failed_emitted := false
var _manual_disconnect_requested := false


func _ready() -> void:
	set_process(false)


func connect_to_server(token: String) -> void:
	_last_connection_error = ""
	_connection_failed_emitted = false
	_manual_disconnect_requested = false
	
	if token.is_empty():
		connection_failed.emit("Nu există token pentru conexiunea WebSocket.")
		return
	
	_reset_socket()
	
	var url := "%s?token=%s" % [ClientConfig.WS_BASE_URL, token.uri_encode()]
	print("Connecting WebSocket to server...")
	
	var error := socket.connect_to_url(url)
	
	if error != OK:
		_is_connecting = false
		connection_failed.emit("Nu s-a putut inițializa conexiunea WebSocket.")
		return
	
	_is_connecting = true
	_was_connected = false
	set_process(true)


func _process(_delta: float) -> void:
	socket.poll()
	
	while socket.get_available_packet_count() > 0:
		_read_next_packet()
		
		# Dacă serverul a respins conectarea în timpul handshake-ului logic,
		# nu mai lăsăm același frame să emită și signalul "connected".
		if _connection_failed_emitted and not _was_connected:
			break
	
	var state := socket.get_ready_state()
	
	match state:
		WebSocketPeer.STATE_OPEN:
			if not _connection_failed_emitted:
				_handle_open_socket()
		
		WebSocketPeer.STATE_CLOSING:
			# Foarte important: continuăm polling-ul până la STATE_CLOSED.
			pass
		
		WebSocketPeer.STATE_CLOSED:
			_handle_closed_socket()


func send_message(message_type: String, payload: Dictionary = {}) -> bool:
	if socket.get_ready_state() != WebSocketPeer.STATE_OPEN:
		print("Cannot send WebSocket message. Socket is not open.")
		return false
	
	var message := {
		"type": message_type,
		"payload": payload,
	}
	
	print("WebSocket sending: ", message_type)
	
	var error := socket.send_text(JSON.stringify(message))
	
	if error != OK:
		print("Failed to send WebSocket message: ", message_type)
		return false
	
	return true


func send_ping() -> bool:
	return send_message(WsMessageType.PING, {
		"sentAt": Time.get_unix_time_from_system()
	})


func disconnect_from_server() -> void:
	var state := socket.get_ready_state()
	
	_manual_disconnect_requested = true
	_is_connecting = false
	
	if state == WebSocketPeer.STATE_OPEN or state == WebSocketPeer.STATE_CONNECTING:
		socket.close(1000, "Client logout")
		set_process(true)
		return
	
	if state == WebSocketPeer.STATE_CLOSING:
		set_process(true)
		return
	
	_handle_closed_socket()


func _reset_socket() -> void:
	var state := socket.get_ready_state()
	
	if state == WebSocketPeer.STATE_OPEN or state == WebSocketPeer.STATE_CONNECTING:
		socket.close(1000, "Reset connection")
		socket.poll()
	
	socket = WebSocketPeer.new()
	_was_connected = false
	_is_connecting = false
	_manual_disconnect_requested = false


func _handle_open_socket() -> void:
	if _connection_failed_emitted:
		return
	
	if not _was_connected:
		_was_connected = true
		_is_connecting = false
		_manual_disconnect_requested = false
		print("WebSocket connected")
		connected.emit()


func _read_next_packet() -> void:
	var packet := socket.get_packet()
	var text := packet.get_string_from_utf8()
	var parsed = JSON.parse_string(text)
	
	if typeof(parsed) != TYPE_DICTIONARY:
		print("Invalid WebSocket JSON: ", text)
		return
	
	var message_type := str(parsed.get("type", "UNKNOWN"))
	print("WebSocket received: ", message_type)
	
	if message_type == WsMessageType.ERROR:
		var payload = parsed.get("payload", {})
		var server_message := "Eroare server."
		
		if typeof(payload) == TYPE_DICTIONARY:
			server_message = str(payload.get("message", server_message))
		
		_last_connection_error = server_message
		
		if _is_connecting and not _was_connected and not _connection_failed_emitted:
			_connection_failed_emitted = true
			_is_connecting = false
			
			connection_failed.emit(server_message)
			
			var state := socket.get_ready_state()
			if state == WebSocketPeer.STATE_OPEN or state == WebSocketPeer.STATE_CONNECTING:
				socket.close(1000, "Connection rejected")
				set_process(true)
			
			return
	
	message_received.emit(parsed)


func _handle_closed_socket() -> void:
	if _is_connecting and not _was_connected and not _connection_failed_emitted:
		var error_message := _last_connection_error
		
		if error_message.is_empty():
			var close_reason := socket.get_close_reason()
			
			if not close_reason.is_empty():
				error_message = close_reason
			else:
				error_message = "Nu s-a putut conecta la serverul WebSocket."
		
		print("WebSocket connection failed: %s" % error_message)
		
		_connection_failed_emitted = true
		connection_failed.emit(error_message)
	
	elif _was_connected:
		print("WebSocket closed")
		disconnected.emit()
	
	_was_connected = false
	_is_connecting = false
	_manual_disconnect_requested = false
	set_process(false)
	
