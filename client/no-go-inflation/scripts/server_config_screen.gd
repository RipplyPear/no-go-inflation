extends Control

const START_MENU_SCENE := "res://scenes/StartMenu.tscn"

@onready var current_server_label: Label = $CenterContainer/PanelContainer/MarginContainer/VBoxContainer/CurrentServerLabel
@onready var host_input: LineEdit = $CenterContainer/PanelContainer/MarginContainer/VBoxContainer/HostInput
@onready var status_label: Label = $CenterContainer/PanelContainer/MarginContainer/VBoxContainer/StatusLabel
@onready var test_and_save_button: Button = $CenterContainer/PanelContainer/MarginContainer/VBoxContainer/TestAndSaveButton
@onready var back_button: Button = $CenterContainer/PanelContainer/MarginContainer/VBoxContainer/BackButton
@onready var health_request: HTTPRequest = $HealthRequest

var _pending_host: String = ""


func _ready() -> void:
	test_and_save_button.pressed.connect(_on_test_and_save_pressed)
	back_button.pressed.connect(_on_back_pressed)
	host_input.text_submitted.connect(_on_host_submitted)
	health_request.request_completed.connect(_on_health_request_completed)

	# Evităm să așteptăm la nesfârșit după un IP greșit.
	health_request.timeout = 3.0

	_populate_form()
	host_input.grab_focus()


func _populate_form() -> void:
	var current_host := ClientConfig.get_server_host()

	if current_host == ClientConfig.DEFAULT_HOST:
		host_input.text = ""
	else:
		host_input.text = current_host

	_update_current_server_label()


func _update_current_server_label() -> void:
	current_server_label.text = tr("SERVER_CURRENT").format({
		"host": ClientConfig.get_server_host()
	})


func _on_host_submitted(_submitted_text: String) -> void:
	_on_test_and_save_pressed()


func _on_test_and_save_pressed() -> void:
	var candidate_host := ClientConfig.normalize_server_host(host_input.text)

	if not _is_supported_host(candidate_host):
		status_label.text = tr("SERVER_INVALID_ADDRESS")
		return

	_pending_host = candidate_host
	_set_testing_state(true)

	var health_url := "http://%s:%d/health" % [
		_pending_host,
		ClientConfig.SERVER_PORT,
	]

	status_label.text = tr("SERVER_TESTING").format({
		"url": health_url
	})

	var request_error := health_request.request(
		health_url,
		PackedStringArray(),
		HTTPClient.METHOD_GET
	)

	if request_error != OK:
		_set_testing_state(false)
		status_label.text = tr("SERVER_REQUEST_ERROR")


func _is_supported_host(host: String) -> bool:
	if host == ClientConfig.DEFAULT_HOST:
		return true

	# În această versiune acceptăm doar IPv4.
	# is_valid_ip_address() acceptă și IPv6.
	if host.contains(":"):
		return false

	if host == "0.0.0.0":
		return false

	return host.is_valid_ip_address()


func _on_health_request_completed(
	result: int,
	response_code: int,
	_headers: PackedStringArray,
	body: PackedByteArray
) -> void:
	_set_testing_state(false)

	if result != HTTPRequest.RESULT_SUCCESS:
		status_label.text = tr("SERVER_REQUEST_FAILED")
		return

	if response_code != 200:
		status_label.text = tr("SERVER_RESPONSE").format({
			"status": response_code
		})
		return

	var parsed_response = JSON.parse_string(
		body.get_string_from_utf8()
	)

	if (
		typeof(parsed_response) != TYPE_DICTIONARY
		or str(parsed_response.get("message", "")) != "OK"
	):
		status_label.text = tr("SERVER_NOT_NO_GO_INFLATION")
		return

	var save_error := ClientConfig.set_server_host(_pending_host)

	if save_error != OK:
		status_label.text = tr("SERVER_SAVE_ERROR")
		return

	if _pending_host == ClientConfig.DEFAULT_HOST:
		host_input.text = ""
	else:
		host_input.text = _pending_host

	_update_current_server_label()
	status_label.text = tr("SERVER_CONNECT_SUCCESS")


func _set_testing_state(is_testing: bool) -> void:
	test_and_save_button.disabled = is_testing
	back_button.disabled = is_testing
	host_input.editable = not is_testing


func _on_back_pressed() -> void:
	get_tree().change_scene_to_file(START_MENU_SCENE)
