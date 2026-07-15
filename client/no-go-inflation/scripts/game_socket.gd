extends Node

signal connected
signal disconnected
signal connection_failed(message: String)
signal message_received(message: Dictionary)

var socket := WebSocketPeer.new()
var _was_connected := false
var _is_connecting := false
var _last_connection_error := ""
var _connection_failed_emitted := false
var _manual_disconnect_requested := false
var _authenticated := false


func _ready() -> void:
	set_process(false)


func connect_to_server(token: String) -> void:
	_last_connection_error = ""
	_connection_failed_emitted = false
	_manual_disconnect_requested = false
	_authenticated = false
	if token.is_empty():
		connection_failed.emit(tr("WS_MISSING_AUTH_TOKEN"))
		return
	_reset_socket()
	var error := socket.connect_to_url("%s?token=%s" % [ClientConfig.get_ws_base_url(), token.uri_encode()])
	if error != OK:
		connection_failed.emit(tr("WS_CONNECTION_FAILED"))
		return
	_is_connecting = true
	_was_connected = false
	set_process(true)


func _process(_delta: float) -> void:
	socket.poll()
	while socket.get_available_packet_count() > 0:
		_read_next_packet()
		if _connection_failed_emitted and not _was_connected:
			break
	match socket.get_ready_state():
		WebSocketPeer.STATE_OPEN:
			if not _connection_failed_emitted:
				_handle_open_socket()
		WebSocketPeer.STATE_CLOSED:
			_handle_closed_socket()


func send_message(message_type: String, payload: Dictionary = {}) -> bool:
	if socket.get_ready_state() != WebSocketPeer.STATE_OPEN:
		return false
	return socket.send_text(JSON.stringify({"type": message_type, "payload": payload})) == OK


func send_ping() -> bool:
	return send_message(WsMessageType.PING, {"sentAt": Time.get_unix_time_from_system()})


func disconnect_from_server() -> void:
	_manual_disconnect_requested = true
	_is_connecting = false
	var state := socket.get_ready_state()
	if state == WebSocketPeer.STATE_OPEN or state == WebSocketPeer.STATE_CONNECTING:
		socket.close(1000, "Client logout")
		socket.poll()
		set_process(true)
	elif state == WebSocketPeer.STATE_CLOSING:
		set_process(true)
	else:
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
	_authenticated = false


func _handle_open_socket() -> void:
	if not _was_connected:
		_was_connected = true
		_is_connecting = false
		_manual_disconnect_requested = false
		connected.emit()


func _read_next_packet() -> void:
	var parsed = JSON.parse_string(socket.get_packet().get_string_from_utf8())
	if typeof(parsed) != TYPE_DICTIONARY:
		return
	var message_type := str(parsed.get("type", "UNKNOWN"))
	if message_type == WsMessageType.AUTHENTICATED:
		_authenticated = true
	if message_type == WsMessageType.ERROR:
		_last_connection_error = _translate_error_payload(parsed.get("payload", {}))
		if not _authenticated and not _connection_failed_emitted:
			_connection_failed_emitted = true
			_is_connecting = false
			connection_failed.emit(_last_connection_error)
			if socket.get_ready_state() == WebSocketPeer.STATE_OPEN:
				socket.close(1000, "Connection rejected")
			return
	message_received.emit(parsed)


func _translate_error_payload(payload) -> String:
	if typeof(payload) != TYPE_DICTIONARY:
		return tr("WS_CONNECTION_FAILED")
	var code := str(payload.get("code", ""))
	var translated := tr(code)
	if code.is_empty() or translated == code:
		return tr("WS_CONNECTION_FAILED")
	var params = payload.get("params", {})
	return translated.format(_normalize_params(params) if typeof(params) == TYPE_DICTIONARY else {})


func _normalize_params(params: Dictionary) -> Dictionary:
	var normalized := {}
	for key in params:
		var value = params[key]
		normalized[key] = int(value) if typeof(value) == TYPE_FLOAT and is_equal_approx(value, round(value)) else value
	return normalized


func _handle_closed_socket() -> void:
	if _is_connecting and not _was_connected and not _connection_failed_emitted:
		_connection_failed_emitted = true
		connection_failed.emit(_last_connection_error if not _last_connection_error.is_empty() else tr("WS_CONNECTION_FAILED"))
	elif _was_connected:
		if not _authenticated and not _manual_disconnect_requested and not _connection_failed_emitted:
			_connection_failed_emitted = true
			connection_failed.emit(_last_connection_error if not _last_connection_error.is_empty() else tr("WS_CONNECTION_FAILED"))
		else:
			disconnected.emit()
	_was_connected = false
	_is_connecting = false
	_manual_disconnect_requested = false
	_authenticated = false
	set_process(false)
