extends Node

signal connected
signal disconnected
signal connection_failed(message: String)
signal message_received(message: Dictionary)

const WS_BASE_URL := "ws://localhost:3000/ws"

var socket := WebSocketPeer.new()
var _was_connected := false
var _is_connecting := false


func _ready() -> void:
	set_process(false)


func connect_to_server(token: String) -> void:
	if token.is_empty():
		connection_failed.emit("Nu există token pentru conexiunea WebSocket.")
		return

	var url := "%s?token=%s" % [WS_BASE_URL, token.uri_encode()]
	print("Connecting WebSocket to: ", url)

	var error := socket.connect_to_url(url)

	if error != OK:
		connection_failed.emit("Nu s-a putut inițializa conexiunea WebSocket.")
		return

	_is_connecting = true
	_was_connected = false
	set_process(true)


func _process(_delta: float) -> void:
	socket.poll()

	var state := socket.get_ready_state()

	if state == WebSocketPeer.STATE_OPEN:
		if not _was_connected:
			_was_connected = true
			_is_connecting = false
			print("WebSocket connected")
			connected.emit()

		while socket.get_available_packet_count() > 0:
			var packet := socket.get_packet()
			var text := packet.get_string_from_utf8()
			print("WebSocket received: ", text)

			var parsed = JSON.parse_string(text)

			if typeof(parsed) == TYPE_DICTIONARY:
				message_received.emit(parsed)
			else:
				print("Invalid WebSocket JSON: ", text)

	elif state == WebSocketPeer.STATE_CLOSED:
		if _was_connected or _is_connecting:
			print("WebSocket closed")
			disconnected.emit()

		_was_connected = false
		_is_connecting = false
		set_process(false)


func send_message(type: String, payload: Dictionary = {}) -> void:
	if socket.get_ready_state() != WebSocketPeer.STATE_OPEN:
		print("Cannot send WebSocket message. Socket is not open.")
		return

	var message := {
		"type": type,
		"payload": payload,
	}

	var text := JSON.stringify(message)
	print("WebSocket sending: ", text)
	socket.send_text(text)


func send_ping() -> void:
	send_message("PING", {
		"sentAt": Time.get_unix_time_from_system()
	})


func disconnect_from_server() -> void:
	if socket.get_ready_state() == WebSocketPeer.STATE_OPEN:
		socket.close()

	_was_connected = false
	_is_connecting = false
	set_process(false)
