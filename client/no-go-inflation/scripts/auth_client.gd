extends Node

signal login_succeeded(user: Dictionary, token: String)
signal register_succeeded(user: Dictionary)
signal auth_failed(message: String)

var token := ""
var current_user: Dictionary = {}
var _http_request: HTTPRequest


func _ready() -> void:
	_http_request = HTTPRequest.new()
	add_child(_http_request)


func register_user(username: String, email: String, password: String) -> void:
	await _send_auth_request("/auth/register", {"username": username, "email": email, "password": password}, true)


func login_user(email: String, password: String) -> void:
	await _send_auth_request("/auth/login", {"email": email, "password": password}, false)


func is_logged_in() -> bool:
	return not token.is_empty()


func logout() -> void:
	token = ""
	current_user = {}


func _send_auth_request(path: String, payload: Dictionary, is_register: bool) -> void:
	if _start_http_request(path, payload) != OK:
		auth_failed.emit(tr("NETWORK_REQUEST_SEND_FAILED"))
		return
	var response := await _read_http_response()
	if int(response.get("result", HTTPRequest.RESULT_CANT_CONNECT)) != HTTPRequest.RESULT_SUCCESS:
		auth_failed.emit(tr("NETWORK_SERVER_UNREACHABLE"))
		return
	var parsed := _parse_response_body(response.body)
	if parsed.is_empty():
		auth_failed.emit(tr("NETWORK_INVALID_RESPONSE"))
		return
	if not _is_success_status(response.status_code):
		auth_failed.emit(_get_error_message(parsed))
		return
	if is_register:
		_handle_register_success(parsed)
	else:
		_handle_login_success(parsed)


func _start_http_request(path: String, payload: Dictionary) -> Error:
	return _http_request.request(ClientConfig.get_api_base_url() + path, ["Content-Type: application/json"], HTTPClient.METHOD_POST, JSON.stringify(payload))


func _read_http_response() -> Dictionary:
	var result = await _http_request.request_completed
	return {"result": int(result[0]), "status_code": int(result[1]), "body": result[3]}


func _parse_response_body(response_body: PackedByteArray) -> Dictionary:
	var parsed = JSON.parse_string(response_body.get_string_from_utf8())
	return parsed if typeof(parsed) == TYPE_DICTIONARY else {}


func _is_success_status(status_code: int) -> bool:
	return status_code >= 200 and status_code < 300


func _get_error_message(parsed_response: Dictionary) -> String:
	var code := str(parsed_response.get("code", "AUTH_UNKNOWN_ERROR"))
	var translated := tr(code)
	if translated == code:
		return tr("AUTH_UNKNOWN_ERROR")
	var params = parsed_response.get("params", {})
	return translated.format(_normalize_params(params) if typeof(params) == TYPE_DICTIONARY else {})


func _normalize_params(params: Dictionary) -> Dictionary:
	var display_params := {}
	for key in params:
		var value = params[key]
		display_params[key] = int(value) if typeof(value) == TYPE_FLOAT and is_equal_approx(value, round(value)) else value
	return display_params


func _handle_register_success(parsed_response: Dictionary) -> void:
	var user = parsed_response.get("user", {})
	register_succeeded.emit(user if typeof(user) == TYPE_DICTIONARY else {})


func _handle_login_success(parsed_response: Dictionary) -> void:
	token = str(parsed_response.get("token", ""))
	var user = parsed_response.get("user", {})
	current_user = user if typeof(user) == TYPE_DICTIONARY else {}
	if token.is_empty():
		auth_failed.emit(tr("AUTH_UNKNOWN_ERROR"))
		return
	login_succeeded.emit(current_user, token)
