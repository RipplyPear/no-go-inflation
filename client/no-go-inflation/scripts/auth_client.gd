extends Node

signal login_succeeded(user: Dictionary, token: String)
signal register_succeeded(user: Dictionary)
signal auth_failed(message: String)

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


func is_logged_in() -> bool:
	return not token.is_empty()


func logout() -> void:
	token = ""
	current_user = {}


func _send_auth_request(path: String, payload: Dictionary, is_register: bool) -> void:
	var error := _start_http_request(path, payload)
	
	if error != OK:
		auth_failed.emit("Nu s-a putut trimite request-ul către server.")
		return
	
	var response := await _read_http_response()
	
	if int(response.get("result", HTTPRequest.RESULT_CANT_CONNECT)) != HTTPRequest.RESULT_SUCCESS:
		auth_failed.emit("Nu s-a putut contacta serverul.")
		return
	
	var parsed_response := _parse_response_body(response.body)
	
	if parsed_response.is_empty():
		auth_failed.emit("Răspuns invalid de la server.")
		return
	
	if not _is_success_status(response.status_code):
		auth_failed.emit(_get_error_message(parsed_response))
		return
	
	if is_register:
		_handle_register_success(parsed_response)
	else:
		_handle_login_success(parsed_response)


func _start_http_request(path: String, payload: Dictionary) -> Error:
	var url := ClientConfig.get_api_base_url() + path
	var headers := ["Content-Type: application/json"]
	var body := JSON.stringify(payload)
	
	return _http_request.request(
		url,
		headers,
		HTTPClient.METHOD_POST,
		body
	)


func _read_http_response() -> Dictionary:
	var result = await _http_request.request_completed
	
	return {
		"result": int(result[0]),
		"status_code": int(result[1]),
		"headers": result[2],
		"body": result[3],
	}


func _parse_response_body(response_body: PackedByteArray) -> Dictionary:
	var response_text := response_body.get_string_from_utf8()
	var parsed = JSON.parse_string(response_text)
	
	if typeof(parsed) != TYPE_DICTIONARY:
		return {}
	
	return parsed


func _is_success_status(status_code: int) -> bool:
	return status_code >= 200 and status_code < 300


func _get_error_message(parsed_response: Dictionary) -> String:
	var errors = parsed_response.get("errors", [])
	
	if typeof(errors) == TYPE_ARRAY and not errors.is_empty():
		var first_error = errors[0]
		
		if typeof(first_error) == TYPE_DICTIONARY:
			var field_message := str(first_error.get("message", ""))
			
			if not field_message.is_empty():
				return _translate_auth_error(field_message)
	
	var message := str(parsed_response.get("message", "Eroare de autentificare."))
	return _translate_auth_error(message)


func _translate_auth_error(message: String) -> String:
	match message:
		"Validation failed":
			return "Datele introduse nu sunt valide."
		"Invalid email address":
			return "Adresa de email nu este validă."
		"Username or email already in use":
			return "Username-ul sau email-ul este deja folosit."
		"Invalid email or password":
			return "Email sau parolă incorectă."
		"Password must be at least 6 characters long":
			return "Parola trebuie să aibă cel puțin 6 caractere."
		"Password is required":
			return "Parola este obligatorie."
		_:
			return message


func _handle_register_success(parsed_response: Dictionary) -> void:
	var user = parsed_response.get("user", {})
	
	if typeof(user) != TYPE_DICTIONARY:
		user = {}
	
	register_succeeded.emit(user)


func _handle_login_success(parsed_response: Dictionary) -> void:
	token = str(parsed_response.get("token", ""))
	var user = parsed_response.get("user", {})
	
	if typeof(user) == TYPE_DICTIONARY:
		current_user = user
	else:
		current_user = {}
	
	if token.is_empty():
		auth_failed.emit("Login reușit, dar serverul nu a trimis token.")
		return
	
	login_succeeded.emit(current_user, token)
