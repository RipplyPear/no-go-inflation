extends Control

const START_MENU_SCENE := "res://scenes/StartMenu.tscn"

@onready var username_input: LineEdit = $CenterContainer/PanelContainer/MarginContainer/VBoxContainer/UsernameLineEdit
@onready var email_input: LineEdit = $CenterContainer/PanelContainer/MarginContainer/VBoxContainer/EmailLineEdit
@onready var password_input: LineEdit = $CenterContainer/PanelContainer/MarginContainer/VBoxContainer/PasswordLineEdit
@onready var register_button: Button = $CenterContainer/PanelContainer/MarginContainer/VBoxContainer/RegisterButton
@onready var back_button: Button = $CenterContainer/PanelContainer/MarginContainer/VBoxContainer/BackButton
@onready var status_label: Label = $CenterContainer/PanelContainer/MarginContainer/VBoxContainer/StatusLabel


func _ready() -> void:
	password_input.secret = true
	
	register_button.pressed.connect(_on_register_pressed)
	back_button.pressed.connect(_on_back_pressed)
	username_input.text_submitted.connect(_on_register_submitted)
	email_input.text_submitted.connect(_on_register_submitted)
	password_input.text_submitted.connect(_on_register_submitted)
	
	if not AuthClient.register_succeeded.is_connected(_on_register_succeeded):
		AuthClient.register_succeeded.connect(_on_register_succeeded)
	
	if not AuthClient.auth_failed.is_connected(_on_auth_failed):
		AuthClient.auth_failed.connect(_on_auth_failed)
	
	status_label.text = ""


func _exit_tree() -> void:
	if AuthClient.register_succeeded.is_connected(_on_register_succeeded):
		AuthClient.register_succeeded.disconnect(_on_register_succeeded)

	if AuthClient.auth_failed.is_connected(_on_auth_failed):
		AuthClient.auth_failed.disconnect(_on_auth_failed)


func _on_register_submitted(_text: String) -> void:
	if not register_button.disabled:
		_on_register_pressed()


func _on_register_pressed() -> void:
	var username := username_input.text.strip_edges()
	var email := email_input.text.strip_edges()
	var password := password_input.text

	if username.is_empty() or email.is_empty() or password.is_empty():
		_set_status(tr("AUTH_REGISTER_REQUIRED"))
		return

	register_button.disabled = true
	_set_status(tr("AUTH_REGISTERING"))

	AuthClient.register_user(username, email, password)


func _on_back_pressed() -> void:
	get_tree().change_scene_to_file(START_MENU_SCENE)


func _on_register_succeeded(_user: Dictionary) -> void:
	register_button.disabled = false
	_set_status(tr("AUTH_REGISTER_SUCCESS_BACK"))


func _on_auth_failed(message: String) -> void:
	register_button.disabled = false
	_set_status(message)


func _set_status(message: String) -> void:
	status_label.text = message
