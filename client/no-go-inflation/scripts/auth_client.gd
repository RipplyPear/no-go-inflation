extends Node

signal login_succeeded(user: Dictionary, token: String)
signal register_succeeded(user: Dictionary)
signal auth_failed(message: String)

const BASE_URL := "http://localhost:3000"

var token: String = ""
var current_user: Dictionary = {}

var _http_request: HTTPRequest


func _ready() -> void:
	_http_request = HTTPRequest.new()
	add_child(_http_request)


func register_user(username: String, email: String, password: String) -> void:
	var payload := {
		"username": username,
		"email": email,
		"password": password
	}

	await _send_auth_request("/auth/register", payload, true)


func login_user(email: String, password: String) -> void:
	var payload := {
		"email": email,
		"password": password
	}

	await _send_auth_request("/auth/login", payload, false)


func _send_auth_request(path: String, payload: Dictionary, is_register: bool) -> void:
	var url := BASE_URL + path
	var headers := ["Content-Type: application/json"]
	var body := JSON.stringify(payload)

	var error := _http_request.request(
		url,
		headers,
		HTTPClient.METHOD_POST,
		body
	)

	if error != OK:
		auth_failed.emit("Nu s-a putut trimite request-ul către server.")
		return

	var result = await _http_request.request_completed

	var response_code: int = result[1]
	var response_body: PackedByteArray = result[3]

	var response_text := response_body.get_string_from_utf8()
	var parsed = JSON.parse_string(response_text)

	if typeof(parsed) != TYPE_DICTIONARY:
		auth_failed.emit("Răspuns invalid de la server.")
		return

	if response_code < 200 or response_code >= 300:
		var error_message := str(parsed.get("message", "Eroare de autentificare."))
		auth_failed.emit(error_message)
		return

	if is_register:
		var user: Dictionary = parsed.get("user", {})
		register_succeeded.emit(user)
	else:
		token = str(parsed.get("token", ""))
		current_user = parsed.get("user", {})

		if token.is_empty():
			auth_failed.emit("Login reușit, dar serverul nu a trimis token.")
			return

		login_succeeded.emit(current_user, token)


func is_logged_in() -> bool:
	return not token.is_empty()


func logout() -> void:
	token = ""
	current_user = {}
