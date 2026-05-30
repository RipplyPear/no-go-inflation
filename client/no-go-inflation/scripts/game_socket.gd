extends Node

signal connected
signal disconnected
signal connection_failed(message: String)
signal message_received(message: Dictionary)

var socket: WebSocketPeer = WebSocketPeer.new()
var _was_connected := false
var _is_connecting := false


func _ready() -> void:
	set_process(false)


func connect_to_server(token: String) -> void:
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

	var state := socket.get_ready_state()

	match state:
		WebSocketPeer.STATE_OPEN:
			_handle_open_socket()

		WebSocketPeer.STATE_CLOSED:
			_handle_closed_socket()


func send_message(message_type: String, payload: Dictionary = {}) -> void:
	if socket.get_ready_state() != WebSocketPeer.STATE_OPEN:
		print("Cannot send WebSocket message. Socket is not open.")
		return

	var message := {
		"type": message_type,
		"payload": payload,
	}

	print("WebSocket sending: ", message_type)
	socket.send_text(JSON.stringify(message))


func send_ping() -> void:
	send_message(WsMessageType.PING, {
		"sentAt": Time.get_unix_time_from_system()
	})


func disconnect_from_server() -> void:
	if socket.get_ready_state() == WebSocketPeer.STATE_OPEN:
		socket.close()

	_was_connected = false
	_is_connecting = false
	set_process(false)


func _reset_socket() -> void:
	disconnect_from_server()
	socket = WebSocketPeer.new()


func _handle_open_socket() -> void:
	if not _was_connected:
		_was_connected = true
		_is_connecting = false
		print("WebSocket connected")
		connected.emit()

	while socket.get_available_packet_count() > 0:
		_read_next_packet()


func _read_next_packet() -> void:
	var packet := socket.get_packet()
	var text := packet.get_string_from_utf8()
	var parsed = JSON.parse_string(text)

	if typeof(parsed) != TYPE_DICTIONARY:
		print("Invalid WebSocket JSON: ", text)
		return

	var message_type := str(parsed.get("type", "UNKNOWN"))
	print("WebSocket received: ", message_type)
	message_received.emit(parsed)


func _handle_closed_socket() -> void:
	if _was_connected or _is_connecting:
		print("WebSocket closed")
		disconnected.emit()

	_was_connected = false
	_is_connecting = false
	set_process(false)
